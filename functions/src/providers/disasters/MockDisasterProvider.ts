// ==============================================================================
// HISTORICAL DISASTER PROVIDER (Section 15 & 22)
// ==============================================================================

import { IDisasterProvider, DisasterFilterOptions } from './IDisasterProvider';
import { DisasterRecord } from '../../types';

export const HISTORICAL_DISASTERS: DisasterRecord[] = [
  {
    id: 'cyclone-amphan-2020',
    name: 'Super Cyclonic Storm Amphan',
    hazardType: 'CYCLONE',
    state: 'West Bengal',
    district: 'South 24 Parganas, North 24 Parganas, Kolkata, East Medinipur',
    location: 'Sundarbans & Gangetic Delta',
    latitude: 21.65,
    longitude: 88.35,
    startDate: '2020-05-16',
    endDate: '2020-05-21',
    year: 2020,
    severity: 'EXTREME',
    deaths: 128,
    affectedPopulation: '18 Million',
    economicLossEstimated: '₹1.05 Lakh Crore ($13.5B USD)',
    maxWindKmph: 260,
    maxRainfallMm: 240,
    description: 'First super cyclonic storm in the Bay of Bengal since 1999. Catastrophic surge up to 5 meters in the Sundarbans.',
    keyTakeaway: 'Mangrove bio-shields significantly mitigated inland wave damage.',
    source: 'IMD RSMC Tropical Cyclone Report & NDMA Post-Disaster Audit',
    confidence: 'CONFIRMED',
    createdAt: '2020-06-01T00:00:00Z',
    updatedAt: '2020-06-01T00:00:00Z',
  },
  {
    id: 'kerala-floods-2018',
    name: '2018 Kerala Monsoon Inundation',
    hazardType: 'FLOOD',
    state: 'Kerala',
    district: 'Ernakulam, Thrissur, Alappuzha, Wayanad, Idukki',
    location: 'Periyar & Pamba River Basins',
    latitude: 9.93,
    longitude: 76.26,
    startDate: '2018-08-08',
    endDate: '2018-08-28',
    year: 2018,
    severity: 'EXTREME',
    deaths: 483,
    affectedPopulation: '5.4 Million',
    economicLossEstimated: '₹40,000 Crore ($5.4B USD)',
    maxRainfallMm: 814,
    description: 'Worst flooding in Kerala in nearly a century caused by exceptionally heavy Southwest Monsoon downpours and reservoir releases.',
    keyTakeaway: 'Integrated dam management protocols and real-time basin telemetry are vital.',
    source: 'Central Water Commission (CWC) & Kerala State Disaster Management Authority',
    confidence: 'CONFIRMED',
    createdAt: '2018-09-15T00:00:00Z',
    updatedAt: '2018-09-15T00:00:00Z',
  },
  {
    id: 'cyclone-biparjoy-2023',
    name: 'Extremely Severe Cyclonic Storm Biparjoy',
    hazardType: 'CYCLONE',
    state: 'Gujarat',
    district: 'Kutch, Devbhumi Dwarka, Jamnagar, Morbi',
    location: 'Jakhau Port & Saurashtra Coast',
    latitude: 23.23,
    longitude: 68.62,
    startDate: '2023-06-06',
    endDate: '2023-06-19',
    year: 2023,
    severity: 'VERY_SEVERE',
    deaths: 2,
    affectedPopulation: '1.2 Million',
    economicLossEstimated: '₹1,200 Crore',
    maxWindKmph: 150,
    maxRainfallMm: 310,
    description: 'Longest-lived cyclone in the Arabian Sea (over 13 days). Remarkable zero-casualty targeted evacuation by NDMA/GSDMA of over 100,000 people.',
    keyTakeaway: 'Proactive multi-agency early warning and mass pre-landfall evacuation prevent loss of life.',
    source: 'IMD National Cyclone Warning Centre & NDMA',
    confidence: 'CONFIRMED',
    createdAt: '2023-07-01T00:00:00Z',
    updatedAt: '2023-07-01T00:00:00Z',
  },
  {
    id: 'india-heatwave-2024',
    name: '2024 Pan-India Heatwave Crisis',
    hazardType: 'HEATWAVE',
    state: 'Delhi',
    district: 'Delhi NCT, Rajasthan, Uttar Pradesh, Bihar, Odisha',
    location: 'North & Central Plain Belt',
    latitude: 28.61,
    longitude: 77.23,
    startDate: '2024-05-15',
    endDate: '2024-06-20',
    year: 2024,
    severity: 'VERY_SEVERE',
    deaths: 143,
    affectedPopulation: '65 Million',
    description: 'Prolonged heatwave episode with Safdarjung recording 49.9°C and consecutive high nighttime minimum temperatures.',
    keyTakeaway: 'Heat Action Plans (HAP) with nighttime cooling shelters and wet-bulb thresholds are indispensable.',
    source: 'IMD National Weather Bulletin & Ministry of Health',
    confidence: 'CONFIRMED',
    createdAt: '2024-07-01T00:00:00Z',
    updatedAt: '2024-07-01T00:00:00Z',
  },
  {
    id: 'wayanad-landslides-2024',
    name: '2024 Wayanad Cloudburst Landslides',
    hazardType: 'LANDSLIDE',
    state: 'Kerala',
    district: 'Wayanad',
    location: 'Meppadi, Chooralmala, Mundakkai',
    latitude: 11.55,
    longitude: 76.13,
    startDate: '2024-07-30',
    endDate: '2024-08-02',
    year: 2024,
    severity: 'EXTREME',
    deaths: 420,
    affectedPopulation: '15,000',
    maxRainfallMm: 572,
    description: 'Catastrophic debris flow and slope failure triggered by extreme precipitation exceeding 570 mm in 48 hours in Western Ghats terrain.',
    keyTakeaway: 'Micro-zonation slope instability radars and localized rainfall thresholds are required for mountainous settlements.',
    source: 'Geological Survey of India (GSI) & KSDMA',
    confidence: 'CONFIRMED',
    createdAt: '2024-08-10T00:00:00Z',
    updatedAt: '2024-08-10T00:00:00Z',
  },
];

export class MockDisasterProvider implements IDisasterProvider {
  readonly providerName = 'NDMA-Historical-Archive-Adapter';

  async getDisasters(filter?: DisasterFilterOptions): Promise<{ records: DisasterRecord[]; total: number }> {
    let result = [...HISTORICAL_DISASTERS];

    if (filter?.state) {
      result = result.filter((d) => d.state.toLowerCase() === filter.state?.toLowerCase());
    }
    if (filter?.hazardType) {
      result = result.filter((d) => d.hazardType.toLowerCase() === filter.hazardType?.toLowerCase());
    }
    if (filter?.year) {
      result = result.filter((d) => d.year === filter.year);
    }
    if (filter?.severity) {
      result = result.filter((d) => d.severity.toLowerCase() === filter.severity?.toLowerCase());
    }

    const total = result.length;
    const offset = filter?.offset || 0;
    const limit = filter?.limit || 50;

    const paged = result.slice(offset, offset + limit);
    return { records: paged, total };
  }

  async getDisasterById(id: string): Promise<DisasterRecord | null> {
    const item = HISTORICAL_DISASTERS.find((d) => d.id === id);
    return item || null;
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }
}

export const disasterProvider = new MockDisasterProvider();
