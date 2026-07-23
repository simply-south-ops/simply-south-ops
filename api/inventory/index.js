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
    const { name, category, quantity, price_per_unit, cost, condition, photo_url, notes } = req.body
    try {
      const result = await pool.query(
        `INSERT INTO inventory 
        (name, category, quantity, price_per_unit, cost, condition, photo_url, notes) 
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [name, category, quantity || 1, price_per_unit || null, cost || null, condition, photo_url, notes]
      )
      res.status(201).json(result.rows[0])
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  else if (req.method === 'PUT') {
    const { id, name, category, quantity, price_per_unit, cost, condition, photo_url, notes } = req.body
    try {
      const result = await pool.query(
        `UPDATE inventory SET 
        name=$1, category=$2, quantity=$3, price_per_unit=$4, cost=$5, 
        condition=$6, photo_url=$7, notes=$8
        WHERE id=$9 RETURNING *`,
        [name, category, quantity || 1, price_per_unit || null, cost || null, condition, photo_url, notes, id]
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