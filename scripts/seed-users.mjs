#!/usr/bin/env node
// ==============================================================================
// WEATHERGPT (SIH 2026 #26068) - SECURE DATABASE SEED SCRIPT
// Ministry of Earth Sciences / India Meteorological Department
// ==============================================================================
// Usage:
//   DEMO_ADMIN_PASSWORD="YourAdminPass!" DEMO_USER_PASSWORD="YourUserPass!" npm run db:seed
//
// CRITICAL SECURITY RULES:
//   1. Passwords are NEVER hardcoded in this script or any source code file.
//   2. Credentials are read solely from process.env (or .env / .env.local).
//   3. Passwords are immediately salted & hashed with bcrypt before storing.
//   4. Plain-text passwords are NEVER printed to stdout, stderr, or log files.
// ==============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Helper to load environment variables from .env / .env.local if not already in process.env
function loadEnvFiles() {
  const envFiles = ['.env.local', '.env'];
  for (const envFile of envFiles) {
    const filePath = path.join(projectRoot, envFile);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line || line.startsWith('#')) continue;
          const eqIdx = line.indexOf('=');
          if (eqIdx > 0) {
            const key = line.slice(0, eqIdx).trim();
            let val = line.slice(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      } catch (err) {
        // Continue silently if file read fails
      }
    }
  }
}

loadEnvFiles();

async function seedDatabase() {
  console.log('================================================================');
  console.log('  WeatherGPT Secure Evaluator / Demo Account Seeder');
  console.log('  SIH 2026 - Problem Statement #26068 (MoES / IMD)');
  console.log('================================================================\n');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn('[Notice] DATABASE_URL is not set in environment or .env/.env.local.');
    console.warn('To seed users into a live PostgreSQL instance, set DATABASE_URL.');
    console.warn('Example: DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"\n');
    
    // Check if passwords were provided anyway
    if (process.env.DEMO_ADMIN_PASSWORD || process.env.DEMO_USER_PASSWORD) {
      console.log('[Info] Environment passwords detected:');
      if (process.env.DEMO_ADMIN_PASSWORD) {
        console.log('  - DEMO_ADMIN_PASSWORD is set for:', process.env.DEMO_ADMIN_EMAIL || 'admin@weathergpt.gov.in');
      }
      if (process.env.DEMO_USER_PASSWORD) {
        console.log('  - DEMO_USER_PASSWORD is set for:', process.env.DEMO_USER_EMAIL || 'user@weathergpt.gov.in');
      }
      console.log('When running in development without PostgreSQL, in-memory auth will automatically hash and use these environment values.');
    } else {
      console.warn('[Notice] Neither DEMO_ADMIN_PASSWORD nor DEMO_USER_PASSWORD is set in the environment.');
      console.warn('Pass DEMO_ADMIN_PASSWORD="<password>" to seed demo accounts securely.');
    }
    return;
  }

  const isCloudSsl = !databaseUrl.includes('localhost') && !databaseUrl.includes('127.0.0.1');
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    ssl: isCloudSsl ? { rejectUnauthorized: false } : undefined,
  });

  try {
    const client = await pool.connect();
    console.log('[Database] Connected to PostgreSQL successfully.');

    // 1. Ensure table and schema exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        location_name VARCHAR(255),
        location_updated_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS location_name VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP WITH TIME ZONE;
    `);

    // 2. Seed Admin Account if DEMO_ADMIN_PASSWORD is set
    const adminPassword = process.env.DEMO_ADMIN_PASSWORD;
    const adminEmail = (process.env.DEMO_ADMIN_EMAIL || 'admin@weathergpt.gov.in').toLowerCase().trim();

    if (adminPassword) {
      if (adminPassword.length < 8) {
        console.warn('[Warning] DEMO_ADMIN_PASSWORD is shorter than 8 characters. Minimum 8 characters recommended.');
      }
      const adminHash = await bcrypt.hash(adminPassword, 10);
      await client.query(
        `INSERT INTO users (id, name, email, password_hash, role, location_name, latitude, longitude, created_at, last_login)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         ON CONFLICT (email) 
         DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin', last_login = NOW()`,
        ['usr_admin_default', 'IMD Lead Scientist (Admin)', adminEmail, adminHash, 'admin', 'New Delhi, Delhi NCR', 28.6139, 77.2090]
      );
      console.log(`[Success] Seeded admin account: ${adminEmail} (Role: admin)`);
    } else {
      console.log(`[Skipped] DEMO_ADMIN_PASSWORD not set. Admin account was not modified.`);
    }

    // 3. Seed Demo User Account if DEMO_USER_PASSWORD is set
    const userPassword = process.env.DEMO_USER_PASSWORD;
    const userEmail = (process.env.DEMO_USER_EMAIL || 'user@weathergpt.gov.in').toLowerCase().trim();

    if (userPassword) {
      if (userPassword.length < 8) {
        console.warn('[Warning] DEMO_USER_PASSWORD is shorter than 8 characters. Minimum 8 characters recommended.');
      }
      const userHash = await bcrypt.hash(userPassword, 10);
      await client.query(
        `INSERT INTO users (id, name, email, password_hash, role, location_name, latitude, longitude, created_at, last_login)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         ON CONFLICT (email) 
         DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'user', last_login = NOW()`,
        ['usr_demo_default', 'Citizen Researcher', userEmail, userHash, 'user', 'Kolkata, West Bengal', 22.5726, 88.3639]
      );
      console.log(`[Success] Seeded demo user account: ${userEmail} (Role: user)`);
    } else {
      console.log(`[Skipped] DEMO_USER_PASSWORD not set. Demo user account was not modified.`);
    }

    client.release();
    console.log('\n[Complete] Database seeding finished cleanly with 0 plain-text passwords exposed.');
  } catch (err) {
    console.error('[Error] Failed to seed database:', err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedDatabase();
