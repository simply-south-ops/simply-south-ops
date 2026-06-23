import pool from '../db.js'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await pool.query('SELECT * FROM clients ORDER BY created_at DESC')
      res.status(200).json(result.rows)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  else if (req.method === 'POST') {
    const { name, phone, email, notes } = req.body
    try {
      const result = await pool.query(
        'INSERT INTO clients (name, phone, email, notes) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, phone, email, notes]
      )
      res.status(201).json(result.rows[0])
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  else if (req.method === 'PUT') {
    const { id, name, phone, email, notes } = req.body
    try {
      const result = await pool.query(
        'UPDATE clients SET name=$1, phone=$2, email=$3, notes=$4 WHERE id=$5 RETURNING *',
        [name, phone, email, notes, id]
      )
      res.status(200).json(result.rows[0])
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  else if (req.method === 'DELETE') {
    const { id } = req.body
    try {
      await pool.query('DELETE FROM clients WHERE id=$1', [id])
      res.status(200).json({ message: 'Client deleted' })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }
}