import pool from '../../lib/db.js'

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
    const { name, category, quantity, price_per_unit, cost, condition, photo_url, notes, source, rentable, usage_type } = req.body
    try {
      const result = await pool.query(
        `INSERT INTO inventory 
        (name, category, quantity, price_per_unit, cost, condition, photo_url, notes, source, rentable, usage_type) 
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [name, category, quantity || 1, price_per_unit || null, cost || null, condition, photo_url, notes, source || 'bought', rentable || false, usage_type || 'reusable']
      )
      res.status(201).json(result.rows[0])
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  else if (req.method === 'PUT') {
    const { id, name, category, quantity, price_per_unit, cost, condition, photo_url, notes, source, rentable, usage_type, damaged_quantity, lost_quantity } = req.body
    try {
      const result = await pool.query(
        `UPDATE inventory SET 
        name=$1, category=$2, quantity=$3, price_per_unit=$4, cost=$5, 
        condition=$6, photo_url=$7, notes=$8, source=$9, rentable=$10, usage_type=$11,
        damaged_quantity=$12, lost_quantity=$13
        WHERE id=$14 RETURNING *`,
        [name, category, quantity || 1, price_per_unit || null, cost || null, condition, photo_url, notes, source || 'bought', rentable || false, usage_type || 'reusable', damaged_quantity || 0, lost_quantity || 0, id]
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