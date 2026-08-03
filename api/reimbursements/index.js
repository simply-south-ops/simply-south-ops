import pool from '../db.js'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await pool.query(`
        SELECT r.*, 
          e.description as expense_description, e.amount as expense_amount, e.category as expense_category,
          ev.name as event_name,
          u.name as partner_name
        FROM reimbursements r
        LEFT JOIN expenses e ON r.expense_id = e.id
        LEFT JOIN events ev ON e.event_id = ev.id
        LEFT JOIN users u ON r.partner_id = u.id
        ORDER BY r.created_at DESC
      `)
      res.status(200).json(result.rows)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  else if (req.method === 'POST') {
    const { expense_id, partner_id, amount_owed, is_paid, payment_mode, paid_date, notes } = req.body
    try {
      const result = await pool.query(
        `INSERT INTO reimbursements 
        (expense_id, partner_id, amount_owed, is_paid, payment_mode, paid_date, notes) 
        VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [expense_id, partner_id, amount_owed, is_paid || false, payment_mode, paid_date || null, notes]
      )
      res.status(201).json(result.rows[0])
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  else if (req.method === 'PUT') {
    const { id, expense_id, partner_id, amount_owed, is_paid, payment_mode, paid_date, notes } = req.body
    try {
      const result = await pool.query(
        `UPDATE reimbursements SET 
        expense_id=$1, partner_id=$2, amount_owed=$3, is_paid=$4, 
        payment_mode=$5, paid_date=$6, notes=$7
        WHERE id=$8 RETURNING *`,
        [expense_id, partner_id, amount_owed, is_paid || false, payment_mode, paid_date || null, notes, id]
      )
      res.status(200).json(result.rows[0])
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  else if (req.method === 'DELETE') {
    const { id } = req.body
    try {
      await pool.query('DELETE FROM reimbursements WHERE id=$1', [id])
      res.status(200).json({ message: 'Reimbursement deleted' })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }
}