export interface LocationInfo {
  id: string;
  name: string;
  district: string;
  state: string;
  lat: number;
  lon: number;
  isFavorite?: boolean;
  stationCode?: string;
  elevationMeters?: number;
  stateCode?: string;
  districtCode?: string;
  localityType?: string;
  population?: number;
  country?: string;
  aliases?: string;
  source?: string;
}

export interface DbLocation {
  id: string;
  name: string;
  normalized_name: string;
  state: string;
  state_code?: string | null;
  district: string;
  district_code?: string | null;
  locality_type: string;
  latitude: number;
  longitude: number;
  country: string;
  population?: number | null;
  elevation?: number | null;
  aliases?: string | null;
  is_active: boolean;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface LocationSearchParams {
  query?: string;
  state?: string;
  district?: string;
  localityType?: string;
  limit?: number;
  offset?: number;
}
