import pool from '../db.js'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await pool.query(`
        SELECT * FROM enquiries ORDER BY created_at DESC
      `)
      res.status(200).json(result.rows)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  else if (req.method === 'POST') {
    const { client_name, phone, email, event_date, event_type, status, notes } = req.body
    try {
      const result = await pool.query(
        `INSERT INTO enquiries 
        (client_name, phone, email, event_date, event_type, status, notes) 
        VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [client_name, phone, email, event_date, event_type, status, notes]
      )
      res.status(201).json(result.rows[0])
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  else if (req.method === 'PUT') {
    const { id, client_name, phone, email, event_date, event_type, status, notes } = req.body
    try {
      const result = await pool.query(
        `UPDATE enquiries SET 
        client_name=$1, phone=$2, email=$3, event_date=$4, 
        event_type=$5, status=$6, notes=$7
        WHERE id=$8 RETURNING *`,
        [client_name, phone, email, event_date, event_type, status, notes, id]
      )
      res.status(200).json(result.rows[0])
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  else if (req.method === 'DELETE') {
    const { id } = req.body
    try {
      await pool.query('DELETE FROM enquiries WHERE id=$1', [id])
      res.status(200).json({ message: 'Enquiry deleted' })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }
}