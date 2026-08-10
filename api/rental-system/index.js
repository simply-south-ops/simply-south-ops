import pool from '../../lib/db.js'

// Combined endpoint for renters, rentals, and availability checks — kept
// in one file to stay well under Vercel's Hobby-plan serverless function
// limit, leaving room for future additions (e.g. marketplace listings).
// Distinguish by ?resource=renters | rentals | availability

export default async function handler(req, res) {
  const resource = req.query.resource || (req.body && req.body.resource)

  if (resource === 'renters') {
    return handleRenters(req, res)
  } else if (resource === 'rentals') {
    return handleRentals(req, res)
  } else if (resource === 'availability') {
    return handleAvailability(req, res)
  } else {
    return res.status(400).json({ error: 'Missing or invalid resource — expected "renters", "rentals", or "availability"' })
  }
}

async function handleRenters(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await pool.query('SELECT * FROM renters ORDER BY created_at DESC')
      res.status(200).json(result.rows)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  else if (req.method === 'POST') {
    const { name, phone, email, notes } = req.body
    try {
      const result = await pool.query(
        'INSERT INTO renters (name, phone, email, notes) VALUES ($1, $2, $3, $4) RETURNING *',
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
        'UPDATE renters SET name=$1, phone=$2, email=$3, notes=$4 WHERE id=$5 RETURNING *',
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
      await pool.query('DELETE FROM renters WHERE id=$1', [id])
      res.status(200).json({ message: 'Renter deleted' })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }
}

async function handleRentals(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await pool.query(`
        SELECT r.*, 
          rt.name as renter_name, rt.phone as renter_phone, rt.email as renter_email,
          i.name as item_name, i.quantity as item_total_quantity
        FROM rentals r
        LEFT JOIN renters rt ON r.renter_id = rt.id
        LEFT JOIN inventory i ON r.inventory_id = i.id
        ORDER BY r.pickup_date DESC
      `)
      res.status(200).json(result.rows)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  else if (req.method === 'POST') {
    const { renter_id, inventory_id, quantity, pickup_date, return_date, rental_amount, deposit_amount, deposit_returned, additional_charges, discounts, payment_status, payment_method, notes, status } = req.body
    try {
      const result = await pool.query(
        `INSERT INTO rentals 
        (renter_id, inventory_id, quantity, pickup_date, return_date, rental_amount, deposit_amount, deposit_returned, additional_charges, discounts, payment_status, payment_method, notes, status) 
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
        [renter_id, inventory_id, quantity, pickup_date, return_date, rental_amount || null, deposit_amount || null, deposit_returned || false, additional_charges || 0, discounts || 0, payment_status || 'pending', payment_method, notes, status || 'booked']
      )
      res.status(201).json(result.rows[0])
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  else if (req.method === 'PUT') {
    const { id, renter_id, inventory_id, quantity, pickup_date, return_date, rental_amount, deposit_amount, deposit_returned, additional_charges, discounts, payment_status, payment_method, notes, status } = req.body
    try {
      const result = await pool.query(
        `UPDATE rentals SET 
        renter_id=$1, inventory_id=$2, quantity=$3, pickup_date=$4, return_date=$5, 
        rental_amount=$6, deposit_amount=$7, deposit_returned=$8, additional_charges=$9, discounts=$10,
        payment_status=$11, payment_method=$12, notes=$13, status=$14
        WHERE id=$15 RETURNING *`,
        [renter_id, inventory_id, quantity, pickup_date, return_date, rental_amount || null, deposit_amount || null, deposit_returned || false, additional_charges || 0, discounts || 0, payment_status || 'pending', payment_method, notes, status || 'booked', id]
      )
      res.status(200).json(result.rows[0])
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  else if (req.method === 'DELETE') {
    const { id } = req.body
    try {
      await pool.query('DELETE FROM rentals WHERE id=$1', [id])
      res.status(200).json({ message: 'Rental deleted' })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }
}

async function handleAvailability(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { inventory_id, pickup_date, return_date, exclude_rental_id } = req.body

  if (!inventory_id || !pickup_date || !return_date) {
    return res.status(400).json({ error: 'inventory_id, pickup_date, and return_date are required' })
  }

  try {
    const itemResult = await pool.query('SELECT quantity, name FROM inventory WHERE id=$1', [inventory_id])
    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' })
    }
    const totalQuantity = itemResult.rows[0].quantity
    const itemName = itemResult.rows[0].name

    const conflictQuery = `
      SELECT id, quantity, pickup_date, return_date
      FROM rentals
      WHERE inventory_id = $1
        AND status IN ('booked', 'out_on_rent')
        AND pickup_date < $3
        AND return_date > $2
        ${exclude_rental_id ? 'AND id != $4' : ''}
    `
    const params = exclude_rental_id
      ? [inventory_id, pickup_date, return_date, exclude_rental_id]
      : [inventory_id, pickup_date, return_date]

    const conflictResult = await pool.query(conflictQuery, params)
    const conflicting = conflictResult.rows

    const committedQuantity = conflicting.reduce((sum, r) => sum + r.quantity, 0)
    const trueMaxAvailable = Math.max(0, totalQuantity - committedQuantity)

    res.status(200).json({
      item_name: itemName,
      total_quantity: totalQuantity,
      committed_quantity: committedQuantity,
      true_max_available: trueMaxAvailable
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}