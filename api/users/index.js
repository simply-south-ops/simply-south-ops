import pool from '../../lib/db.js'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await pool.query('SELECT * FROM users ORDER BY name ASC')
      res.status(200).json(result.rows)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  else if (req.method === 'POST') {
    const { password } = req.body
    if (password === process.env.APP_PASSWORD) {
      res.status(200).json({ success: true })
    } else {
      res.status(401).json({ success: false, error: 'Incorrect password' })
    }
  }
}
