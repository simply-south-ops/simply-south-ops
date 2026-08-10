import pg from 'pg'

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.VITE_NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

export default pool