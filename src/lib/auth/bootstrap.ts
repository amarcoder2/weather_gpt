import bcrypt from 'bcryptjs';
import { getPool } from '../db/postgres';

let isBootstrapRunning = false;
let hasBootstrapped = false;

/**
 * Server-Side Super Admin Account Bootstrap
 *
 * Requirements:
 * - Reads ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD (or ADMIN_EMAIL/ADMIN_PASSWORD)
 * - Hashes password using bcrypt with salt rounds >= 12
 * - Never logs or exposes the password
 * - Safe to run repeatedly (idempotent)
 * - Creates account with role 'super_admin' and status 'ACTIVE'
 * - Does not overwrite existing accounts unless explicitly configured with ADMIN_BOOTSTRAP_RESET_PASSWORD=true
 */
export async function bootstrapSuperAdminAccount(): Promise<void> {
  if (hasBootstrapped || isBootstrapRunning) return;
  isBootstrapRunning = true;

  try {
    const bootstrapEmail = (
      process.env.ADMIN_BOOTSTRAP_EMAIL ||
      process.env.ADMIN_EMAIL ||
      ''
    ).toLowerCase().trim();

    const bootstrapPassword =
      process.env.ADMIN_BOOTSTRAP_PASSWORD ||
      process.env.ADMIN_PASSWORD ||
      '';

    if (!bootstrapEmail || !bootstrapPassword) {
      isBootstrapRunning = false;
      return;
    }

    if (bootstrapPassword.length < 8) {
      console.warn(
        '[Security Warning] ADMIN_BOOTSTRAP_PASSWORD is under 8 characters. Strong password recommended.'
      );
    }

    const pool = getPool();
    if (!pool) {
      isBootstrapRunning = false;
      return;
    }

    // Check if user already exists
    const existing = await pool.query(
      'SELECT id, email, role, status, password_hash FROM users WHERE LOWER(email) = $1 LIMIT 1',
      [bootstrapEmail]
    );

    const displayName =
      process.env.ADMIN_BOOTSTRAP_NAME ||
      process.env.ADMIN_NAME ||
      'WeatherGPT Owner (Super Admin)';

    if (existing.rows.length === 0) {
      // 1. Create brand new SUPER_ADMIN account
      const passwordHash = await bcrypt.hash(bootstrapPassword, 12);
      const userId = `usr_owner_${Date.now()}`;
      await pool.query(
        `INSERT INTO users (id, name, email, password_hash, role, status, created_at, last_login)
         VALUES ($1, $2, $3, $4, 'super_admin', 'ACTIVE', NOW(), NOW())`,
        [userId, displayName, bootstrapEmail, passwordHash]
      );

      // Record audit entry
      try {
        await pool.query(
          `INSERT INTO audit_logs (id, timestamp, actor_id, actor_email, actor_role, action, resource_type, resource_id, result, details)
           VALUES ($1, NOW(), $2, $3, 'system', 'ADMIN_BOOTSTRAP', 'USER', $4, 'SUCCESS', $5)`,
          [
            `aud_boot_${Date.now()}`,
            'system_bootstrap',
            bootstrapEmail,
            userId,
            JSON.stringify({ role: 'super_admin', reason: 'Initial environment bootstrap' }),
          ]
        );
      } catch {
        // Audit table might not be initialized yet
      }

      console.log(
        `[Security Bootstrap] Successfully provisioned SUPER_ADMIN account for: ${bootstrapEmail} (role: super_admin, status: ACTIVE)`
      );
    } else {
      const user = existing.rows[0];
      const shouldReset = process.env.ADMIN_BOOTSTRAP_RESET_PASSWORD === 'true';
      const needsRoleElevation = user.role !== 'super_admin';

      if (needsRoleElevation || shouldReset) {
        let updateQuery = 'UPDATE users SET role = $1, status = $2';
        const params: any[] = ['super_admin', 'ACTIVE'];

        if (shouldReset) {
          const passwordHash = await bcrypt.hash(bootstrapPassword, 12);
          params.push(passwordHash);
          updateQuery += `, password_hash = $${params.length}`;
        }

        params.push(user.id);
        updateQuery += ` WHERE id = $${params.length}`;

        await pool.query(updateQuery, params);
        console.log(
          `[Security Bootstrap] Updated existing account ${bootstrapEmail} to role: super_admin, status: ACTIVE${shouldReset ? ' (password reset applied)' : ''}`
        );
      }
    }

    hasBootstrapped = true;
  } catch (err) {
    console.error(
      '[Security Bootstrap] Notice: Bootstrap check could not complete:',
      err instanceof Error ? err.message : 'Unknown'
    );
  } finally {
    isBootstrapRunning = false;
  }
}
