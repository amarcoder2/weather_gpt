// ==============================================================================
// DISASTER DATA PROVIDER ABSTRACTION (Section 22)
// ==============================================================================

import { DisasterRecord } from '../../types';

export interface DisasterFilterOptions {
  state?: string;
  hazardType?: string;
  year?: number;
  severity?: string;
  limit?: number;
  offset?: number;
}

export interface IDisasterProvider {
  readonly providerName: string;
  getDisasters(filter?: DisasterFilterOptions): Promise<{ records: DisasterRecord[]; total: number }>;
  getDisasterById(id: string): Promise<DisasterRecord | null>;
  isHealthy(): Promise<boolean>;
}
