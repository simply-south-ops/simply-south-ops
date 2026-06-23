import pool from '../db.js'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { event_id } = req.query
    try {
      const query = event_id
        ? `SELECT e.*, u.name as paid_by_name 
           FROM expenses e 
           LEFT JOIN users u ON e.paid_by = u.id 
           WHERE e.event_id = $1 
           ORDER BY e.date DESC`
        : `SELECT e.*, u.name as paid_by_name, ev.name as event_name
           FROM expenses e 
           LEFT JOIN users u ON e.paid_by = u.id
           LEFT JOIN events ev ON e.event_id = ev.id
           ORDER BY e.date DESC`
      const result = event_id
        ? await pool.query(query, [event_id])
        : await pool.query(query)
      res.status(200).json(result.rows)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  else if (req.method === 'POST') {
    const { event_id, paid_by, category, amount, date, description, receipt_url, is_reimbursable } = req.body
    try {
      const result = await pool.query(
        `INSERT INTO expenses 
        (event_id, paid_by, category, amount, date, description, receipt_url, is_reimbursable) 
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [event_id, paid_by, category, amount, date, description, receipt_url, is_reimbursable]
      )
      res.status(201).json(result.rows[0])
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  else if (req.method === 'PUT') {
    const { id, event_id, paid_by, category, amount, date, description, receipt_url, is_reimbursable } = req.body
    try {
      const result = await pool.query(
        `UPDATE expenses SET 
        event_id=$1, paid_by=$2, category=$3, amount=$4, date=$5, 
        description=$6, receipt_url=$7, is_reimbursable=$8
        WHERE id=$9 RETURNING *`,
        [event_id, paid_by, category, amount, date, description, receipt_url, is_reimbursable, id]
      )
      res.status(200).json(result.rows[0])
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  else if (req.method === 'DELETE') {
    const { id } = req.body
    try {
      await pool.query('DELETE FROM expenses WHERE id=$1', [id])
      res.status(200).json({ message: 'Expense deleted' })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }
}