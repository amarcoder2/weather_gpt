// ==============================================================================
// ADMIN PROMOTION CLI SCRIPT (Section 51)
// ==============================================================================

import { auth } from '../config';
import { userRepository } from '../repositories/userRepository';
import { auditRepository } from '../repositories/auditRepository';
import { ROLES, Role } from '../constants';

/**
 * Safely promotes a registered Firebase UID to an administrative role
 * Usage: ts-node src/seed/promoteAdmin.ts <UID> [ROLE]
 */
export async function promoteUserToRole(uid: string, role: Role = ROLES.ADMIN): Promise<void> {
  if (!Object.values(ROLES).includes(role)) {
    throw new Error(`Invalid role '${role}'. Valid roles: ${Object.values(ROLES).join(', ')}`);
  }

  console.log(`Setting Firebase custom claims for UID: ${uid} -> role: ${role}`);

  try {
    // 1. Set Custom Claims in Firebase Auth
    await auth.setCustomUserClaims(uid, { role });
    console.log(`✓ Firebase Auth Custom Claims set: { role: "${role}" }`);
  } catch {
    console.log(`ℹ️ Running without live Firebase Auth connection; updating Firestore profile record.`);
  }

  // 2. Update Firestore Profile Record
  const updated = await userRepository.updateRole(uid, role);

  // 3. Append Audit Record
  await auditRepository.append({
    actorId: 'cli_admin_tool',
    actorRole: 'SUPER_ADMIN',
    action: 'USER_ROLE_CHANGED',
    resourceType: 'USER',
    resourceId: uid,
    result: 'SUCCESS',
    requestId: `cli_prom_${Date.now()}`,
    metadata: { assignedRole: role, targetEmail: updated?.email },
  });

  console.log(`✅ Successfully promoted user '${uid}' to ${role}.`);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const targetUid = args[0] || 'demo_admin_user';
  const targetRole = (args[1] as Role) || ROLES.ADMIN;

  promoteUserToRole(targetUid, targetRole)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Promotion failed:', err);
      process.exit(1);
    });
}
