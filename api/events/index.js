import pool from '../../lib/db.js'
import { recalculateProfitSplit } from '../../lib/profit-calc.js'

const toNullIfEmpty = (val) => (val === '' || val === undefined ? null : val)

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await pool.query(`
        SELECT e.*, c.name as client_name, c.phone as client_phone, c.email as client_email
        FROM events e
        LEFT JOIN clients c ON e.client_id = c.id
        ORDER BY e.event_date DESC
      `)
      res.status(200).json(result.rows)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  else if (req.method === 'POST') {
    const { name, client_id, event_date, venue, event_type, status, quote_amount, deposit_paid, balance_due, is_paid, payment_method, notes, is_internal, source_enquiry_id } = req.body
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const result = await client.query(
        `INSERT INTO events 
        (name, client_id, event_date, venue, event_type, status, quote_amount, deposit_paid, balance_due, is_paid, payment_method, notes, is_internal) 
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
        [
          name,
          toNullIfEmpty(client_id),
          toNullIfEmpty(event_date),
          venue,
          event_type,
          status,
          toNullIfEmpty(quote_amount),
          toNullIfEmpty(deposit_paid),
          toNullIfEmpty(balance_due),
          is_paid,
          payment_method,
          notes,
          is_internal || false
        ]
      )

      if (source_enquiry_id) {
        await client.query(
          `UPDATE enquiries SET status='converted' WHERE id=$1`,
          [source_enquiry_id]
        )
      }

      await client.query('COMMIT')

      await recalculateProfitSplit(pool, result.rows[0].id)
      res.status(201).json(result.rows[0])
    } catch (err) {
      await client.query('ROLLBACK')
      res.status(500).json({ error: err.message })
    } finally {
      client.release()
    }
  }

  else if (req.method === 'PUT') {
    const { id, name, client_id, event_date, venue, event_type, status, quote_amount, deposit_paid, balance_due, is_paid, payment_method, notes, is_internal } = req.body
    try {
      const result = await pool.query(
        `UPDATE events SET 
        name=$1, client_id=$2, event_date=$3, venue=$4, event_type=$5, status=$6, 
        quote_amount=$7, deposit_paid=$8, balance_due=$9, is_paid=$10, payment_method=$11, notes=$12, is_internal=$13
        WHERE id=$14 RETURNING *`,
        [
          name,
          toNullIfEmpty(client_id),
          toNullIfEmpty(event_date),
          venue,
          event_type,
          status,
          toNullIfEmpty(quote_amount),
          toNullIfEmpty(deposit_paid),
          toNullIfEmpty(balance_due),
          is_paid,
          payment_method,
          notes,
          is_internal || false,
          id
        ]
      )
      await recalculateProfitSplit(pool, id)
      res.status(200).json(result.rows[0])
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }

  else if (req.method === 'DELETE') {
    const { id } = req.body
    try {
      await pool.query('DELETE FROM events WHERE id=$1', [id])
      res.status(200).json({ message: 'Event deleted' })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }
}