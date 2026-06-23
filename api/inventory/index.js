import pool from '../db.js'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await pool.query(`
        SELECT * FROM inventory ORDER BY created_at DESC
      `)
      res.status(200).json(result.rows)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  else if (req.method === 'POST') {
    const { name, category, purchase_date, cost, condition, photo_url, notes } = req.body
    try {
      const result = await pool.query(
        `INSERT INTO inventory 
        (name, category, purchase_date, cost, condition, photo_url, notes) 
        VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [name, category, purchase_date, cost, condition, photo_url, notes]
      )
      res.status(201).json(result.rows[0])
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  else if (req.method === 'PUT') {
    const { id, name, category, purchase_date, cost, condition, photo_url, notes } = req.body
    try {
      const result = await pool.query(
        `UPDATE inventory SET 
        name=$1, category=$2, purchase_date=$3, cost=$4, 
        condition=$5, photo_url=$6, notes=$7
        WHERE id=$8 RETURNING *`,
        [name, category, purchase_date, cost, condition, photo_url, notes, id]
      )
      res.status(200).json(result.rows[0])
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  else if (req.method === 'DELETE') {
    const { id } = req.body
    try {
      await pool.query('DELETE FROM inventory WHERE id=$1', [id])
      res.status(200).json({ message: 'Item deleted' })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }
}