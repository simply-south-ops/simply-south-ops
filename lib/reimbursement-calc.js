// Recalculates the "open" (unpaid) reimbursement total for every partner
// on a given event, based on that event's reimbursable expenses.
//
// Key behavior: once a reimbursement row is marked paid, it is FROZEN —
// this function never modifies a paid row. If new reimbursable expenses
// are added to the event after a payout, a fresh open row is created for
// the remaining (new) amount, so paid history stays accurate and a new
// pending total starts clean.
//
// Runs regardless of event status (enquiry, confirmed, completed, etc.) —
// reimbursement tracking should reflect real spend as soon as it happens,
// not wait for the event to reach a particular stage.

export async function recalculateReimbursements(pool, eventId) {
  if (!eventId) return

  const expensesResult = await pool.query(
    `SELECT paid_by, SUM(amount) as total
     FROM expenses
     WHERE event_id = $1 AND is_reimbursable = true AND paid_by IS NOT NULL
     GROUP BY paid_by`,
    [eventId]
  )

  for (const row of expensesResult.rows) {
    const partnerId = row.paid_by
    const totalReimbursableSpend = parseFloat(row.total)

    const paidResult = await pool.query(
      `SELECT COALESCE(SUM(amount_owed), 0) as paid_total
       FROM reimbursements
       WHERE event_id = $1 AND partner_id = $2 AND is_paid = true`,
      [eventId, partnerId]
    )
    const alreadyPaid = parseFloat(paidResult.rows[0].paid_total)

    const remainingOwed = totalReimbursableSpend - alreadyPaid

    const openResult = await pool.query(
      `SELECT id FROM reimbursements
       WHERE event_id = $1 AND partner_id = $2 AND is_paid = false`,
      [eventId, partnerId]
    )

    if (remainingOwed <= 0) {
      if (openResult.rows.length > 0) {
        await pool.query('DELETE FROM reimbursements WHERE id=$1', [openResult.rows[0].id])
      }
      continue
    }

    if (openResult.rows.length > 0) {
      await pool.query(
        'UPDATE reimbursements SET amount_owed=$1 WHERE id=$2',
        [remainingOwed, openResult.rows[0].id]
      )
    } else {
      await pool.query(
        `INSERT INTO reimbursements (event_id, partner_id, amount_owed, is_paid)
         VALUES ($1,$2,$3,false)`,
        [eventId, partnerId, remainingOwed]
      )
    }
  }
}
