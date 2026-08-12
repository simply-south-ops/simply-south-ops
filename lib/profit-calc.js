// Shared profit-split calculation logic.
// Call this after any expense or event change to keep profit_splits in sync.
// Only recalculates for events whose status is 'completed' or 'confirmed' —
// in-progress/enquiry-stage events are skipped so partial data doesn't
// produce misleading numbers.

export async function recalculateProfitSplit(pool, eventId) {
  if (!eventId) return null

  const eventResult = await pool.query(
    'SELECT quote_amount, status FROM events WHERE id=$1',
    [eventId]
  )
  if (eventResult.rows.length === 0) return null

  const event = eventResult.rows[0]
  if (event.status !== 'completed' && event.status !== 'confirmed') {
    return null // skip — event not far enough along to trust the numbers
  }

  const total_revenue = parseFloat(event.quote_amount) || 0
const expensesResult = await pool.query(
    'SELECT * FROM expenses WHERE event_id=$1', [eventId]
  )
  const expenses = expensesResult.rows
  const total_expenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)

  // salary_deducted is now a display-only subset of total_expenses
  // (labour is tracked as an expense category, not a separate table) —
  // it is NOT subtracted again in net_profit, since that would double-count
  const salary_deducted = expenses
    .filter(e => e.category === 'labour')
    .reduce((sum, e) => sum + parseFloat(e.amount), 0)

  const net_profit = total_revenue - total_expenses

  const usersResult = await pool.query('SELECT * FROM users')
  const users = usersResult.rows

  const partner_payouts = {}
  for (const user of users) {
    const reimbursement = expenses
      .filter(e => e.paid_by === user.id && e.is_reimbursable)
      .reduce((sum, e) => sum + parseFloat(e.amount), 0)
    const profit_share = net_profit / 3
    partner_payouts[user.name] = {
      reimbursement: parseFloat(reimbursement.toFixed(2)),
      profit_share: parseFloat(profit_share.toFixed(2)),
      total: parseFloat((reimbursement + profit_share).toFixed(2))
    }
  }

  const existing = await pool.query(
    'SELECT id FROM profit_splits WHERE event_id=$1', [eventId]
  )

  let result
  if (existing.rows.length > 0) {
    result = await pool.query(
      `UPDATE profit_splits SET 
      total_revenue=$1, total_expenses=$2, salary_deducted=$3, 
      net_profit=$4, partner_payouts=$5
      WHERE event_id=$6 RETURNING *`,
      [total_revenue, total_expenses, salary_deducted, net_profit, JSON.stringify(partner_payouts), eventId]
    )
  } else {
    result = await pool.query(
      `INSERT INTO profit_splits 
      (event_id, total_revenue, total_expenses, salary_deducted, net_profit, partner_payouts) 
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [eventId, total_revenue, total_expenses, salary_deducted, net_profit, JSON.stringify(partner_payouts)]
    )
  }
  return result.rows[0]
}