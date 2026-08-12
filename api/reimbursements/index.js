import pool from '../../lib/db.js'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await pool.query(`
        SELECT r.*, 
          u.name as partner_name,
          ev.name as event_name, ev.status as event_status
        FROM reimbursements r
        LEFT JOIN users u ON r.partner_id = u.id
        LEFT JOIN events ev ON r.event_id = ev.id
        ORDER BY r.is_paid ASC, r.created_at DESC
      `)
      res.status(200).json(result.rows)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  // marking paid is the only manual action left — everything else is
  // auto-calculated from expenses via recalculateReimbursements
  else if (req.method === 'PUT') {
    const { id, is_paid, payment_mode, paid_date, notes } = req.body
    try {
      const result = await pool.query(
        `UPDATE reimbursements SET 
        is_paid=$1, payment_mode=$2, paid_date=$3, notes=$4
        WHERE id=$5 RETURNING *`,
        [is_paid, payment_mode, paid_date || null, notes, id]
      )
      res.status(200).json(result.rows[0])
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }
}