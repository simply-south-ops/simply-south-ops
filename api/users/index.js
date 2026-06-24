import pool from '../db.js'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await pool.query('SELECT * FROM users ORDER BY name ASC')
      res.status(200).json(result.rows)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }
}