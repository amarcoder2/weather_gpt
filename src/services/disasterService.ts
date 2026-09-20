import { WeatherAlert, AlertCategory, SeverityLevel } from '../types/alert';
import { DisasterEvent, DisasterType } from '../types/disaster';
import { MOCK_ALERTS } from '../data/mockAlerts';
import { MOCK_DISASTER_EVENTS } from '../data/mockDisasters';
import { apiClient } from './apiClient';

export interface AlertFilterOptions {
  category?: AlertCategory | 'All';
  severity?: SeverityLevel | 'All';
  search?: string;
}

export interface DisasterFilterOptions {
  state?: string;
  type?: DisasterType | 'All';
  year?: number | 'All';
  search?: string;
}

export interface IDisasterService {
  getActiveAlerts(filters?: AlertFilterOptions): Promise<WeatherAlert[]>;
  getAlertById(id: string): Promise<WeatherAlert | undefined>;
  getHistoricalEvents(filters?: DisasterFilterOptions): Promise<DisasterEvent[]>;
  getDisasterById(id: string): Promise<DisasterEvent | undefined>;
}

class DisasterService implements IDisasterService {
  async getActiveAlerts(filters?: AlertFilterOptions): Promise<WeatherAlert[]> {
    try {
      const res = await apiClient.get<Record<string, unknown>[]>('/alerts');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const sevMap: Record<string, SeverityLevel> = {
          INFO: 'Information',
          WATCH: 'Watch',
          WARNING: 'Warning',
          SEVERE: 'Critical',
        };
        const catMap: Record<string, AlertCategory> = {
          CYCLONE: 'Cyclone',
          FLOOD: 'Flood',
          HEAVY_RAIN: 'Heavy Rainfall',
          HEATWAVE: 'Heatwave',
          THUNDERSTORM: 'Thunderstorm',
          LIGHTNING: 'Lightning',
        };

        let list: WeatherAlert[] = res.data.map((item) => {
          const fallback = MOCK_ALERTS[0];
          const rawSev = ((item.severity as string) || '').toUpperCase();
          const rawHaz = ((item.hazardType as string) || '').toUpperCase();

          return {
            id: (item.id as string) || fallback.id,
            title: (item.title as string) || (item.headline as string) || fallback.title,
            category: catMap[rawHaz] || ('Cyclone' as AlertCategory),
            severity: sevMap[rawSev] || ('Watch' as SeverityLevel),
            location: (item.location as string) || fallback.location,
            state: (item.state as string) || fallback.state,
            affectedDistricts: (item.affectedRegions as string[]) || (item.affectedDistricts as string[]) || fallback.affectedDistricts,
            issuedTime: (item.issuedAt as string) || fallback.issuedTime,
            validUntil: (item.expiresAt as string) || fallback.validUntil,
            headline: (item.headline as string) || (item.title as string) || fallback.headline,
            description: (item.description as string) || fallback.description,
            recommendedActions: (item.instructions as string[]) || fallback.recommendedActions,
            source: (item.source as string) || fallback.source,
            bulletinNumber: (item.bulletinNumber as string) || fallback.bulletinNumber,
            impactLevel: (item.impactLevel as 'Low' | 'Moderate' | 'High' | 'Catastrophic') || fallback.impactLevel,
            coordinates:
              item.latitude && item.longitude
                ? [Number(item.latitude), Number(item.longitude)]
                : fallback.coordinates,
          };
        });

        if (filters) {
          if (filters.category && filters.category !== 'All') {
            list = list.filter((a) => a.category === filters.category);
          }
          if (filters.severity && filters.severity !== 'All') {
            list = list.filter((a) => a.severity.toLowerCase() === filters.severity?.toLowerCase());
          }
          if (filters.search) {
            const q = filters.search.toLowerCase();
            list = list.filter(
              (a) =>
                a.headline.toLowerCase().includes(q) ||
                a.location.toLowerCase().includes(q) ||
                a.description.toLowerCase().includes(q)
            );
          }
        }
        return list;
      }
    } catch {
      // Fallback
    }

    let list = [...MOCK_ALERTS];
    if (filters) {
      if (filters.category && filters.category !== 'All') {
        list = list.filter((a) => a.category === filters.category);
      }
      if (filters.severity && filters.severity !== 'All') {
        list = list.filter((a) => a.severity === filters.severity);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(
          (a) =>
            a.headline?.toLowerCase().includes(q) ||
            a.location?.toLowerCase().includes(q) ||
            a.description?.toLowerCase().includes(q)
        );
      }
    }
    return list;
  }

  async getAlertById(id: string): Promise<WeatherAlert | undefined> {
    const alerts = await this.getActiveAlerts();
    return alerts.find((a) => a.id === id);
  }

  async getHistoricalEvents(filters?: DisasterFilterOptions): Promise<DisasterEvent[]> {
    try {
      const res = await apiClient.get<Record<string, unknown>[]>('/disasters');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const typeMap: Record<string, DisasterType> = {
          CYCLONE: 'Cyclone',
          FLOOD: 'Flood',
          HEATWAVE: 'Heatwave',
          LANDSLIDE: 'Landslide',
          DROUGHT: 'Drought',
          THUNDERSTORM: 'Thunderstorm',
        };

        let list: DisasterEvent[] = res.data.map((item) => {
          const fallback = MOCK_DISASTER_EVENTS[0];
          const rawType = ((item.hazardType as string) || '').toUpperCase();
          return {
            id: (item.id as string) || fallback.id,
            name: (item.name as string) || (item.title as string) || fallback.name,
            year: Number(item.year || fallback.year),
            date: (item.date as string) || (item.startDate as string) || fallback.date,
            type: typeMap[rawType] || fallback.type,
            state: (item.state as string) || fallback.state,
            districts: Array.isArray(item.districts)
              ? (item.districts as string[])
              : item.district
              ? [String(item.district)]
              : fallback.districts,
            casualties: Number(
              item.deaths !== undefined
                ? item.deaths
                : item.casualties !== undefined
                ? item.casualties
                : fallback.casualties
            ),
            displacedPersons: String(item.affectedPopulation || item.displacedPersons || fallback.displacedPersons),
            economicImpact:
              (item.economicLossEstimated as string) ||
              (item.economicImpact as string) ||
              fallback.economicImpact,
            maxWindKmph:
              item.maxWindKmph !== undefined
                ? Number(item.maxWindKmph)
                : fallback.maxWindKmph,
            maxRainfallMm:
              item.maxRainfallMm !== undefined
                ? Number(item.maxRainfallMm)
                : fallback.maxRainfallMm,
            description: (item.description as string) || fallback.description,
            keyTakeaway: (item.keyTakeaway as string) || fallback.keyTakeaway,
          };
        });

        if (filters) {
          if (filters.state && filters.state !== 'All') {
            list = list.filter((d) => d.state === filters.state);
          }
          if (filters.type && filters.type !== 'All') {
            list = list.filter((d) => d.type.toLowerCase() === filters.type?.toLowerCase());
          }
          if (filters.year && filters.year !== 'All') {
            list = list.filter((d) => d.year === filters.year);
          }
          if (filters.search) {
            const q = filters.search.toLowerCase();
            list = list.filter(
              (d) =>
                d.name.toLowerCase().includes(q) ||
                d.description.toLowerCase().includes(q) ||
                d.state.toLowerCase().includes(q)
            );
          }
        }
        return list;
      }
    } catch {
      // Fallback
    }

    let list = [...MOCK_DISASTER_EVENTS];
    if (filters) {
      if (filters.state && filters.state !== 'All') {
        list = list.filter((d) => d.state === filters.state);
      }
      if (filters.type && filters.type !== 'All') {
        list = list.filter((d) => d.type === filters.type);
      }
      if (filters.year && filters.year !== 'All') {
        list = list.filter((d) => d.year === filters.year);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            d.description.toLowerCase().includes(q) ||
            d.state.toLowerCase().includes(q)
        );
      }
    }
    return list;
  }

  async getDisasterById(id: string): Promise<DisasterEvent | undefined> {
    const list = await this.getHistoricalEvents();
    return list.find((d) => d.id === id);
  }
}

export const disasterService = new DisasterService();
