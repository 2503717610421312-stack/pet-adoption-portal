const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ---------------------------------------------------------------
// Supabase / PostgreSQL Connection
// Set SUPABASE_DB_URL in your .env (local) and Vercel env vars.
// Format (Transaction Pooler from Supabase dashboard):
//   postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
// ---------------------------------------------------------------

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false } // Required for Supabase
    });
  }
  return pool;
}

async function initDatabase() {
  try {
    const db = getPool();

    // Run schema to create tables if they don't exist
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await db.query(schemaSql);
    }

    // Seed initial data if users table is empty
    const { rows } = await db.query('SELECT COUNT(*) AS count FROM users');
    if (parseInt(rows[0].count, 10) === 0) {
      console.log('Seeding initial database records...');
      const seedPath = path.join(__dirname, '../database/seed.sql');
      if (fs.existsSync(seedPath)) {
        const seedSql = fs.readFileSync(seedPath, 'utf8');
        await db.query(seedSql);
        console.log('✅ Database seeded successfully.');
      }
    }

    console.log('✅ Connected to Supabase (PostgreSQL) successfully.');
    return db;
  } catch (error) {
    console.error('Database initialization error:', error.message);
    throw error;
  }
}

// ---------------------------------------------------------------
// Helper query function — drop-in compatible with previous API.
// Converts MySQL-style positional params ($1, $2...) and returns
// rows array directly so controllers don't need to change shape.
// ---------------------------------------------------------------
async function query(sql, params) {
  const db = getPool();
  const { rows } = await db.query(sql, params);
  return rows;
}

module.exports = {
  getPool,
  initDatabase,
  query
};
