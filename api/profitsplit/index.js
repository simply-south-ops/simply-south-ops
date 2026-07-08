import pool from '../db.js'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { event_id } = req.query
    try {
      const query = event_id
        ? `SELECT ps.*, e.name as event_name, e.is_internal 
           FROM profit_splits ps
           LEFT JOIN events e ON ps.event_id = e.id
           WHERE ps.event_id = $1`
        : `SELECT ps.*, e.name as event_name, e.is_internal 
           FROM profit_splits ps
           LEFT JOIN events e ON ps.event_id = e.id
           ORDER BY ps.created_at DESC`
      const result = event_id
        ? await pool.query(query, [event_id])
        : await pool.query(query)
      res.status(200).json(result.rows)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  else if (req.method === 'POST') {
    const { event_id } = req.body
    try {
      // fetch event revenue
      const eventResult = await pool.query(
        'SELECT quote_amount FROM events WHERE id=$1', [event_id]
      )
      const total_revenue = parseFloat(eventResult.rows[0].quote_amount) || 0

      // fetch all expenses for event
      const expensesResult = await pool.query(
        'SELECT * FROM expenses WHERE event_id=$1', [event_id]
      )
      const expenses = expensesResult.rows
      const total_expenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)

      // fetch labour costs for event
      const labourResult = await pool.query(
        'SELECT * FROM labour_logs WHERE event_id=$1', [event_id]
      )
      const labourLogs = labourResult.rows
      const salary_deducted = labourLogs.reduce((sum, l) => sum + parseFloat(l.total_pay), 0)

      // calculate net profit
      const net_profit = total_revenue - total_expenses - salary_deducted

      // calculate reimbursements per partner
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

      // upsert profit split
      const existing = await pool.query(
        'SELECT id FROM profit_splits WHERE event_id=$1', [event_id]
      )

      let result
      if (existing.rows.length > 0) {
        result = await pool.query(
          `UPDATE profit_splits SET 
          total_revenue=$1, total_expenses=$2, salary_deducted=$3, 
          net_profit=$4, partner_payouts=$5
          WHERE event_id=$6 RETURNING *`,
          [total_revenue, total_expenses, salary_deducted, net_profit, JSON.stringify(partner_payouts), event_id]
        )
      } else {
        result = await pool.query(
          `INSERT INTO profit_splits 
          (event_id, total_revenue, total_expenses, salary_deducted, net_profit, partner_payouts) 
          VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
          [event_id, total_revenue, total_expenses, salary_deducted, net_profit, JSON.stringify(partner_payouts)]
        )
      }
      res.status(200).json(result.rows[0])
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }
}