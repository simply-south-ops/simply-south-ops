import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.VITE_NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

const createTables = async () => {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        role VARCHAR(50) DEFAULT 'partner',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        client_id INTEGER REFERENCES clients(id),
        event_date DATE,
        venue VARCHAR(255),
        event_type VARCHAR(100),
        status VARCHAR(50) DEFAULT 'enquiry',
        quote_amount DECIMAL(10,2) DEFAULT 0,
        deposit_paid DECIMAL(10,2) DEFAULT 0,
        balance_due DECIMAL(10,2) DEFAULT 0,
        is_paid BOOLEAN DEFAULT false,
        payment_method VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        event_id INTEGER REFERENCES events(id),
        paid_by INTEGER REFERENCES users(id),
        category VARCHAR(100),
        amount DECIMAL(10,2) NOT NULL,
        date DATE,
        description TEXT,
        receipt_url TEXT,
        is_reimbursable BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        event_id INTEGER REFERENCES events(id),
        invoice_number VARCHAR(100) UNIQUE,
        issued_date DATE,
        line_items JSONB,
        total_amount DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS profit_splits (
        id SERIAL PRIMARY KEY,
        event_id INTEGER REFERENCES events(id),
        total_revenue DECIMAL(10,2),
        total_expenses DECIMAL(10,2),
        salary_deducted DECIMAL(10,2) DEFAULT 0,
        net_profit DECIMAL(10,2),
        partner_payouts JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS labour_logs (
        id SERIAL PRIMARY KEY,
        event_id INTEGER REFERENCES events(id),
        user_id INTEGER REFERENCES users(id),
        hours DECIMAL(5,2),
        rate_per_hour DECIMAL(10,2),
        total_pay DECIMAL(10,2),
        date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS inventory (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        purchase_date DATE,
        cost DECIMAL(10,2),
        condition VARCHAR(50) DEFAULT 'good',
        photo_url TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS inventory_event_usage (
        id SERIAL PRIMARY KEY,
        inventory_id INTEGER REFERENCES inventory(id),
        event_id INTEGER REFERENCES events(id)
      );

      CREATE TABLE IF NOT EXISTS enquiries (
        id SERIAL PRIMARY KEY,
        client_name VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(255),
        event_date DATE,
        event_type VARCHAR(100),
        status VARCHAR(50) DEFAULT 'new',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS event_files (
        id SERIAL PRIMARY KEY,
        event_id INTEGER REFERENCES events(id),
        file_url TEXT,
        file_type VARCHAR(100),
        uploaded_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `)
    console.log('✅ All tables created successfully')
  } catch (err) {
    console.error('❌ Error creating tables:', err)
  } finally {
    client.release()
    pool.end()
  }
}

createTables()