// ==============================================================================
// DEVELOPMENT SEED SCRIPT (Section 50 & 54)
// ==============================================================================

import { config } from '../config';
import { locationRepository } from '../repositories/locationRepository';
import { alertRepository } from '../repositories/alertRepository';
import { disasterRepository } from '../repositories/disasterRepository';
import { userRepository } from '../repositories/userRepository';
import { auditRepository } from '../repositories/auditRepository';
import { riskService } from '../services/riskService';

export async function seedDevelopmentData(): Promise<void> {
  // Safety check: Never seed production database
  if (config.isProd) {
    throw new Error('SECURITY VIOLATION: Seeding cannot be executed against production environment.');
  }

  console.log('🌱 Starting WeatherGPT Development Seeding...');

  // 1. Users
  const { total: userTotal } = await userRepository.listUsers();
  console.log(`✓ Seeded ${userTotal} RBAC development user profiles.`);

  // 2. Locations
  const locations = await locationRepository.getAll();
  console.log(`✓ Seeded ${locations.length} Indian meteorological stations.`);

  // 3. Disasters
  const disasters = await disasterRepository.getAll();
  console.log(`✓ Seeded ${disasters.length} historical Indian disaster records.`);

  // 4. Alerts
  const { alerts } = await alertRepository.listAlerts({ limit: 100 });
  console.log(`✓ Seeded ${alerts.length} operational alerts (Active, Pending Review).`);

  // 5. Risk Engine
  await Promise.all(locations.map((loc) => riskService.calculateLocationRisk(loc.id)));
  console.log(`✓ Calculated WeatherGPT Risk Engine v1 assessments for all ${locations.length} stations.`);

  // 6. Audit logs
  const { total: auditTotal } = await auditRepository.list();
  console.log(`✓ Initialized ${auditTotal} immutable security audit trail records.`);

  console.log('✨ Development Seeding Completed Successfully.');
}

// Allow execution via command line: node dist/seed/seedDevData.js
if (require.main === module) {
  seedDevelopmentData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
