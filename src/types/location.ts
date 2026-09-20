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
}
