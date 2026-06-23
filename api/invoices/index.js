import pool from '../db.js'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { event_id } = req.query
    try {
      const query = event_id
        ? `SELECT i.*, e.name as event_name, c.name as client_name, c.phone as client_phone, c.email as client_email
           FROM invoices i
           LEFT JOIN events e ON i.event_id = e.id
           LEFT JOIN clients c ON e.client_id = c.id
           WHERE i.event_id = $1
           ORDER BY i.issued_date DESC`
        : `SELECT i.*, e.name as event_name, c.name as client_name, c.phone as client_phone, c.email as client_email
           FROM invoices i
           LEFT JOIN events e ON i.event_id = e.id
           LEFT JOIN clients c ON e.client_id = c.id
           ORDER BY i.issued_date DESC`
      const result = event_id
        ? await pool.query(query, [event_id])
        : await pool.query(query)
      res.status(200).json(result.rows)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  else if (req.method === 'POST') {
    const { event_id, invoice_number, issued_date, line_items, total_amount, status } = req.body
    try {
      const result = await pool.query(
        `INSERT INTO invoices 
        (event_id, invoice_number, issued_date, line_items, total_amount, status) 
        VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [event_id, invoice_number, issued_date, JSON.stringify(line_items), total_amount, status]
      )
      res.status(201).json(result.rows[0])
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  else if (req.method === 'PUT') {
    const { id, event_id, invoice_number, issued_date, line_items, total_amount, status } = req.body
    try {
      const result = await pool.query(
        `UPDATE invoices SET 
        event_id=$1, invoice_number=$2, issued_date=$3, 
        line_items=$4, total_amount=$5, status=$6
        WHERE id=$7 RETURNING *`,
        [event_id, invoice_number, issued_date, JSON.stringify(line_items), total_amount, status, id]
      )
      res.status(200).json(result.rows[0])
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  else if (req.method === 'DELETE') {
    const { id } = req.body
    try {
      await pool.query('DELETE FROM invoices WHERE id=$1', [id])
      res.status(200).json({ message: 'Invoice deleted' })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }
}