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
  } else if (resource === 'rental-expenses') {
    return handleRentalExpenses(req, res)
  } else if (resource === 'rental-profit') {
    return handleRentalProfit(req, res)
  } else if (resource === 'listings') {
    return handleListings(req, res)
  } else if (resource === 'generate-listing') {
    return handleGenerateListing(req, res)
  } else {
    return res.status(400).json({ error: 'Missing or invalid resource' })
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
    try {
      const { renter_id, inventory_id, quantity, pickup_date, return_date, price_per_item, rental_amount, deposit_amount, deposit_returned, additional_charges, discounts, payment_status, payment_method, notes, status } = req.body
      const result = await pool.query(
        `INSERT INTO rentals 
        (renter_id, inventory_id, quantity, pickup_date, return_date, price_per_item, rental_amount, deposit_amount, deposit_returned, additional_charges, discounts, payment_status, payment_method, notes, status) 
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
        [renter_id, inventory_id, quantity, pickup_date, return_date, price_per_item || null, rental_amount || null, deposit_amount || null, deposit_returned || false, additional_charges || 0, discounts || 0, payment_status || 'pending', payment_method, notes, status || 'booked']
      )
      res.status(201).json(result.rows[0])
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  else if (req.method === 'PUT') {
    try {
      const { id, renter_id, inventory_id, quantity, pickup_date, return_date, price_per_item, rental_amount, deposit_amount, deposit_returned, additional_charges, discounts, payment_status, payment_method, notes, status } = req.body
      const result = await pool.query(
        `UPDATE rentals SET 
        renter_id=$1, inventory_id=$2, quantity=$3, pickup_date=$4, return_date=$5, 
        price_per_item=$6, rental_amount=$7, deposit_amount=$8, deposit_returned=$9, additional_charges=$10,
        discounts=$11, payment_status=$12, payment_method=$13, notes=$14, status=$15
        WHERE id=$16 RETURNING *`,
        [renter_id, inventory_id, quantity, pickup_date, return_date, price_per_item || null, rental_amount || null, deposit_amount || null, deposit_returned || false, additional_charges || 0, discounts || 0, payment_status || 'pending', payment_method, notes, status || 'booked', id]
      )
      res.status(200).json(result.rows[0])
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  else if (req.method === 'DELETE') {
    try {
      const { id } = req.body
      if (!id) {
        return res.status(400).json({ error: 'Missing rental id' })
      }
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

// Rental expenses use the same `expenses` table as event expenses, but
// filtered strictly by rental_id (never event_id) so the two streams
// never mix, matching the DB-level CHECK constraint.
async function handleRentalExpenses(req, res) {
  if (req.method === 'GET') {
    const { rental_id } = req.query
    try {
      const query = rental_id
        ? `SELECT e.*, u.name as paid_by_name 
           FROM expenses e 
           LEFT JOIN users u ON e.paid_by = u.id 
           WHERE e.rental_id = $1 
           ORDER BY e.date DESC`
        : `SELECT e.*, u.name as paid_by_name, r.pickup_date, i.name as item_name
           FROM expenses e
           LEFT JOIN users u ON e.paid_by = u.id
           LEFT JOIN rentals r ON e.rental_id = r.id
           LEFT JOIN inventory i ON r.inventory_id = i.id
           WHERE e.rental_id IS NOT NULL
           ORDER BY e.date DESC`
      const result = rental_id
        ? await pool.query(query, [rental_id])
        : await pool.query(query)
      res.status(200).json(result.rows)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  else if (req.method === 'POST') {
    const { rental_id, paid_by, category, amount, date, description, is_reimbursable } = req.body
    try {
      const result = await pool.query(
        `INSERT INTO expenses 
        (rental_id, paid_by, category, amount, date, description, is_reimbursable) 
        VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [rental_id, paid_by, category, amount, date, description, is_reimbursable || false]
      )
      res.status(201).json(result.rows[0])
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  else if (req.method === 'PUT') {
    const { id, paid_by, category, amount, date, description, is_reimbursable } = req.body
    try {
      const result = await pool.query(
        `UPDATE expenses SET 
        paid_by=$1, category=$2, amount=$3, date=$4, description=$5, is_reimbursable=$6
        WHERE id=$7 AND rental_id IS NOT NULL RETURNING *`,
        [paid_by, category, amount, date, description, is_reimbursable || false, id]
      )
      res.status(200).json(result.rows[0])
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  else if (req.method === 'DELETE') {
    const { id } = req.body
    try {
      await pool.query('DELETE FROM expenses WHERE id=$1 AND rental_id IS NOT NULL', [id])
      res.status(200).json({ message: 'Rental expense deleted' })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }
}

// Aggregates rental income (rental_amount + additional_charges - discounts)
// and rental expenses (from the expenses table, filtered by rental_id) into
// a single rental-side profit figure — kept entirely separate from event
// profit split, per business requirement.
// Auto-generates a templated draft listing...

async function handleListings(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await pool.query(`
        SELECT l.*, i.name as item_name, i.photo_url, i.quantity as item_quantity, i.condition
        FROM listings l
        LEFT JOIN inventory i ON l.inventory_id = i.id
        ORDER BY l.created_at DESC
      `)
      res.status(200).json(result.rows)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  else if (req.method === 'PUT') {
    const { id, title, description, suggested_price, suggested_deposit, dimensions, whats_included, rental_terms, pickup_return_info, photo_guidance, keywords, status } = req.body
    try {
      const result = await pool.query(
        `UPDATE listings SET 
        title=$1, description=$2, suggested_price=$3, suggested_deposit=$4, dimensions=$5,
        whats_included=$6, rental_terms=$7, pickup_return_info=$8, photo_guidance=$9, keywords=$10, status=$11
        WHERE id=$12 RETURNING *`,
        [title, description, suggested_price || null, suggested_deposit || null, dimensions, whats_included, rental_terms, pickup_return_info, photo_guidance, keywords, status, id]
      )
      res.status(200).json(result.rows[0])
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  else if (req.method === 'DELETE') {
    const { id } = req.body
    try {
      await pool.query('DELETE FROM listings WHERE id=$1', [id])
      res.status(200).json({ message: 'Listing deleted' })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }
}

// Auto-generates a templated draft listing from an inventory item's data —
// user reviews/edits everything afterward, nothing is posted automatically.
async function handleRentalProfit(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const rentalsResult = await pool.query(`
      SELECT id, rental_amount, additional_charges, discounts, status
      FROM rentals
      WHERE status IN ('returned', 'closed')
    `)
    const rentals = rentalsResult.rows

    const totalRentalIncome = rentals.reduce((sum, r) =>
      sum + parseFloat(r.rental_amount || 0) + parseFloat(r.additional_charges || 0) - parseFloat(r.discounts || 0),
      0
    )

    const expensesResult = await pool.query(`
      SELECT amount FROM expenses WHERE rental_id IS NOT NULL
    `)
    const totalRentalExpenses = expensesResult.rows.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)

    const rentalNetProfit = totalRentalIncome - totalRentalExpenses

    // currently out / active
    const activeResult = await pool.query(`
      SELECT r.id, r.quantity, r.return_date, i.name as item_name, rt.name as renter_name
      FROM rentals r
      LEFT JOIN inventory i ON r.inventory_id = i.id
      LEFT JOIN renters rt ON r.renter_id = rt.id
      WHERE r.status = 'out_on_rent'
      ORDER BY r.return_date ASC
    `)

    // upcoming (booked, not yet picked up)
    const upcomingResult = await pool.query(`
      SELECT r.id, r.quantity, r.pickup_date, i.name as item_name, rt.name as renter_name
      FROM rentals r
      LEFT JOIN inventory i ON r.inventory_id = i.id
      LEFT JOIN renters rt ON r.renter_id = rt.id
      WHERE r.status = 'booked' AND r.pickup_date >= CURRENT_DATE
      ORDER BY r.pickup_date ASC
      LIMIT 5
    `)

    // overdue (out on rent, past return date)
    const overdueResult = await pool.query(`
      SELECT r.id, r.quantity, r.return_date, i.name as item_name, rt.name as renter_name, rt.phone as renter_phone
      FROM rentals r
      LEFT JOIN inventory i ON r.inventory_id = i.id
      LEFT JOIN renters rt ON r.renter_id = rt.id
      WHERE r.status = 'out_on_rent' AND r.return_date < CURRENT_DATE
      ORDER BY r.return_date ASC
    `)

    // most frequently rented items (all-time, by number of rental records)
    const mostRentedResult = await pool.query(`
      SELECT i.name, COUNT(r.id) as rental_count, SUM(r.quantity) as total_units_rented
      FROM rentals r
      LEFT JOIN inventory i ON r.inventory_id = i.id
      GROUP BY i.name
      ORDER BY rental_count DESC
      LIMIT 5
    `)

    res.status(200).json({
      total_rental_income: totalRentalIncome,
      total_rental_expenses: totalRentalExpenses,
      rental_net_profit: rentalNetProfit,
      completed_rentals_count: rentals.length,
      currently_rented: activeResult.rows,
      upcoming_rentals: upcomingResult.rows,
      overdue_rentals: overdueResult.rows,
      most_rented_items: mostRentedResult.rows
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}