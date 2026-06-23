import pool from '../db.js'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { event_id } = req.query
    try {
      const query = event_id
        ? `SELECT l.*, u.name as user_name, e.name as event_name
           FROM labour_logs l
           LEFT JOIN users u ON l.user_id = u.id
           LEFT JOIN events e ON l.event_id = e.id
           WHERE l.event_id = $1
           ORDER BY l.date DESC`
        : `SELECT l.*, u.name as user_name, e.name as event_name
           FROM labour_logs l
           LEFT JOIN users u ON l.user_id = u.id
           LEFT JOIN events e ON l.event_id = e.id
           ORDER BY l.date DESC`
      const result = event_id
        ? await pool.query(query, [event_id])
        : await pool.query(query)
      res.status(200).json(result.rows)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  else if (req.method === 'POST') {
    const { event_id, user_id, hours, rate_per_hour, date, notes } = req.body
    const total_pay = parseFloat(hours) * parseFloat(rate_per_hour)
    try {
      const result = await pool.query(
        `INSERT INTO labour_logs 
        (event_id, user_id, hours, rate_per_hour, total_pay, date, notes) 
        VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [event_id, user_id, hours, rate_per_hour, total_pay, date, notes]
      )
      res.status(201).json(result.rows[0])
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  else if (req.method === 'PUT') {
    const { id, event_id, user_id, hours, rate_per_hour, date, notes } = req.body
    const total_pay = parseFloat(hours) * parseFloat(rate_per_hour)
    try {
      const result = await pool.query(
        `UPDATE labour_logs SET 
        event_id=$1, user_id=$2, hours=$3, rate_per_hour=$4, 
        total_pay=$5, date=$6, notes=$7
        WHERE id=$8 RETURNING *`,
        [event_id, user_id, hours, rate_per_hour, total_pay, date, notes, id]
      )
      res.status(200).json(result.rows[0])
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  else if (req.method === 'DELETE') {
    const { id } = req.body
    try {
      await pool.query('DELETE FROM labour_logs WHERE id=$1', [id])
      res.status(200).json({ message: 'Labour log deleted' })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }
}