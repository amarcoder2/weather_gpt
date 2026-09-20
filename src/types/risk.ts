export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Severe' | 'Extreme';

export interface HazardRisk {
  hazard: string;
  category: 'flood' | 'cyclone' | 'heat' | 'rainfall' | 'wind' | 'thunderstorm';
  score: number; // 0 to 100
  level: RiskLevel;
  trend: 'increasing' | 'stable' | 'decreasing';
  summary: string;
}

export interface RiskFactor {
  name: string;
  value: string;
  contribution: 'High' | 'Medium' | 'Low';
  description: string;
}

export interface RiskAssessment {
  locationId: string;
  locationName: string;
  overallScore: number; // 0 to 100
  overallLevel: RiskLevel;
  assessmentDate: string;
  hazards: HazardRisk[];
  factors: RiskFactor[];
  explanation: string;
  recommendations: string[];
  isDemoData: boolean;
}
