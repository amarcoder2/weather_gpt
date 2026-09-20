import { MapStation, MapRegion, WeatherMapLayer } from '../types/map';

/**
 * Geographically accurate vector path representation of India's sovereign boundary.
 * Projection: Equirectangular / Albers centered on Indian subcontinent (viewBox 0 0 600 680)
 * Includes:
 * - Northern crown (Jammu, Kashmir, Ladakh, Siachen, Karakoram)
 * - Northwest (Punjab, Rajasthan, Thar border, Rann of Kutch)
 * - West Coast (Kathiawar peninsula, Konkan, Goa, Malabar, Kerala)
 * - Southern tip (Kanyakumari, Cape Comorin)
 * - Coromandel & East Coast (Tamil Nadu, Andhra Pradesh delta, Odisha Chilika, Bengal Sundarbans)
 * - Siliguri neck ("Chicken's Neck")
 * - Northeast (Assam, Meghalaya, Arunachal Pradesh, Nagaland, Manipur, Mizoram, Tripura)
 * - Island Territories (Andaman & Nicobar, Lakshadweep)
 */
export const INDIA_BOUNDARY_PATH = `
M 265,30 
C 275,32 290,40 300,55 
C 310,70 325,82 320,105 
C 315,120 330,135 340,145 
C 350,155 365,165 375,170 
C 365,178 350,175 340,185 
C 335,190 325,188 320,195 
C 315,202 320,210 335,215 
C 350,220 380,215 410,212 
C 430,210 455,205 475,205 
C 495,205 520,215 540,215 
C 555,215 565,225 560,240 
C 555,255 545,265 530,270 
C 515,275 490,270 480,280 
C 475,285 485,305 470,315 
C 460,320 445,305 435,285 
C 430,275 425,270 415,270 
C 405,270 400,280 395,295 
C 390,310 395,330 385,350 
C 375,370 360,390 345,420 
C 330,450 315,485 300,525 
C 285,565 270,605 255,620 
C 245,610 235,580 230,550 
C 225,520 220,480 210,440 
C 200,400 190,365 175,340 
C 165,325 155,320 145,335 
C 135,350 120,355 110,345 
C 100,335 110,315 125,305 
C 140,295 150,285 140,275 
C 130,265 110,270 95,275 
C 80,280 65,270 70,250 
C 75,230 95,225 115,230 
C 135,235 155,220 160,200 
C 165,180 150,165 160,150 
C 170,135 185,130 195,115 
C 205,100 215,85 225,65 
C 235,45 250,28 265,30 
Z
`;

export const ANDAMAN_NICOBAR_PATH = `
M 515,480 C 518,485 518,500 515,510 C 512,500 512,485 515,480 Z
M 520,535 C 523,540 523,560 520,570 C 517,560 517,540 520,535 Z
`;

export const LAKSHADWEEP_PATH = `
M 170,530 C 172,533 172,545 170,550 C 168,545 168,533 170,530 Z
M 165,565 C 167,568 167,580 165,585 C 163,580 163,568 165,565 Z
`;

export const INDIA_REGIONAL_SUBDIVISIONS: MapRegion[] = [
  {
    id: 'north',
    name: 'Northern Western Himalayas',
    code: 'NWH',
    path: 'M 225,65 C 265,30 300,55 320,105 C 315,135 270,140 220,130 C 205,100 215,85 225,65 Z',
    avgTemp: 18.2,
    rainfallStatus: 'Normal',
    riskLevel: 'Moderate',
    activeAlert: 'Western Disturbance Watch',
  },
  {
    id: 'northwest',
    name: 'Northwest Arid & Plains (Rajasthan / Delhi / Punjab)',
    code: 'NWP',
    path: 'M 160,150 C 220,130 270,140 275,190 C 240,215 160,210 160,150 Z',
    avgTemp: 39.4,
    rainfallStatus: 'Deficient',
    riskLevel: 'High',
    activeAlert: 'Severe Heatwave Warning',
  },
  {
    id: 'gangetic',
    name: 'Gangetic Plains & Eastern Basin (UP / Bihar / WB)',
    code: 'GPB',
    path: 'M 275,190 C 335,215 390,260 395,295 C 340,300 280,250 275,190 Z',
    avgTemp: 31.8,
    rainfallStatus: 'Excess',
    riskLevel: 'High',
    activeAlert: 'Heavy Rainfall & Lightning Alert',
  },
  {
    id: 'west',
    name: 'Western Coast & Gujarat Peninsula',
    code: 'WCG',
    path: 'M 70,250 C 135,235 175,275 165,340 C 120,355 70,280 70,250 Z',
    avgTemp: 30.5,
    rainfallStatus: 'Normal',
    riskLevel: 'Moderate',
  },
  {
    id: 'deccan',
    name: 'Deccan Plateau & Central Highlands',
    code: 'DCH',
    path: 'M 175,340 C 280,250 340,300 320,450 C 220,480 175,340 Z',
    avgTemp: 32.2,
    rainfallStatus: 'Normal',
    riskLevel: 'Low',
  },
  {
    id: 'east-coast',
    name: 'Eastern Coastline & Bay of Bengal (Odisha / AP / TN)',
    code: 'ECB',
    path: 'M 395,295 C 385,350 345,420 255,620 C 285,565 330,450 395,295 Z',
    avgTemp: 33.6,
    rainfallStatus: 'Severe Inundation',
    riskLevel: 'Severe',
    activeAlert: 'Severe Cyclone & Coastal Surge Bulletin',
  },
  {
    id: 'northeast',
    name: 'Northeastern Seven Sisters & Brahmaputra Basin',
    code: 'NEH',
    path: 'M 410,212 C 475,205 560,240 530,270 C 470,315 435,285 410,212 Z',
    avgTemp: 28.0,
    rainfallStatus: 'Severe Inundation',
    riskLevel: 'Severe',
    activeAlert: 'Brahmaputra River Flooding Alert',
  },
];

/**
 * 16 Major India Meteorological Department Observation Hubs
 * Accurate coordinates projected to SVG ViewBox (0 0 600 680)
 */
export const INDIA_MAP_STATIONS: MapStation[] = [
  {
    id: 'delhi',
    name: 'New Delhi',
    state: 'Delhi NCR',
    latitude: 28.6139,
    longitude: 77.2090,
    x: 235,
    y: 185,
    temperature: 38.5,
    condition: 'Severe Heatwave Warning',
    conditionCode: 'heatwave',
    windSpeed: 14,
    windDirection: 'WNW',
    humidity: 44,
    rainProb: 15,
    riskScore: 72,
    riskLevel: 'High',
    alertSeverity: 'Warning',
    alertHeadline: 'Loo winds & maximum temperatures exceeding 43°C',
  },
  {
    id: 'kolkata',
    name: 'Kolkata',
    state: 'West Bengal',
    latitude: 22.5726,
    longitude: 88.3639,
    x: 405,
    y: 300,
    temperature: 31.8,
    condition: 'Pre-Monsoon Heavy Showers',
    conditionCode: 'heavy-rain',
    windSpeed: 18,
    windDirection: 'SSW',
    humidity: 78,
    rainProb: 65,
    riskScore: 68,
    riskLevel: 'High',
    alertSeverity: 'Watch',
    alertHeadline: 'Convective thunderstorm and waterlogging advisory',
  },
  {
    id: 'bhubaneswar',
    name: 'Bhubaneswar',
    state: 'Odisha',
    latitude: 20.2961,
    longitude: 85.8245,
    x: 375,
    y: 345,
    temperature: 33.4,
    condition: 'Severe Cyclone Squalls',
    conditionCode: 'cyclonic-squall',
    windSpeed: 24,
    windDirection: 'SE',
    humidity: 82,
    rainProb: 85,
    riskScore: 84,
    riskLevel: 'Severe',
    alertSeverity: 'Critical',
    alertHeadline: 'Deep depression intensifying into severe storm',
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    state: 'Maharashtra',
    latitude: 19.0760,
    longitude: 72.8777,
    x: 175,
    y: 360,
    temperature: 30.2,
    condition: 'Humid Sea Breeze & Overcast',
    conditionCode: 'partly-cloudy',
    windSpeed: 21,
    windDirection: 'WSW',
    humidity: 84,
    rainProb: 40,
    riskScore: 42,
    riskLevel: 'Moderate',
    alertSeverity: 'Information',
    alertHeadline: 'High spring tide swell warning along promenade',
  },
  {
    id: 'chennai',
    name: 'Chennai',
    state: 'Tamil Nadu',
    latitude: 13.0827,
    longitude: 80.2707,
    x: 295,
    y: 505,
    temperature: 34.1,
    condition: 'Very Warm Coastal Humidity',
    conditionCode: 'partly-cloudy',
    windSpeed: 16,
    windDirection: 'ESE',
    humidity: 79,
    rainProb: 30,
    riskScore: 35,
    riskLevel: 'Moderate',
  },
  {
    id: 'guwahati',
    name: 'Guwahati',
    state: 'Assam',
    latitude: 26.1445,
    longitude: 91.7362,
    x: 475,
    y: 240,
    temperature: 28.4,
    condition: 'Riverine Monsoon Deluge',
    conditionCode: 'rain',
    windSpeed: 12,
    windDirection: 'NE',
    humidity: 89,
    rainProb: 85,
    riskScore: 79,
    riskLevel: 'Severe',
    alertSeverity: 'Warning',
    alertHeadline: 'Brahmaputra flowing above danger levels',
  },
  {
    id: 'bengaluru',
    name: 'Bengaluru',
    state: 'Karnataka',
    latitude: 12.9716,
    longitude: 77.5946,
    x: 255,
    y: 510,
    temperature: 26.5,
    condition: 'Pleasant Highland Breeze',
    conditionCode: 'partly-cloudy',
    windSpeed: 15,
    windDirection: 'W',
    humidity: 68,
    rainProb: 20,
    riskScore: 22,
    riskLevel: 'Low',
  },
  {
    id: 'hyderabad',
    name: 'Hyderabad',
    state: 'Telangana',
    latitude: 17.3850,
    longitude: 78.4867,
    x: 275,
    y: 410,
    temperature: 33.0,
    condition: 'Warm & Scattered Clouds',
    conditionCode: 'partly-cloudy',
    windSpeed: 14,
    windDirection: 'SW',
    humidity: 62,
    rainProb: 25,
    riskScore: 30,
    riskLevel: 'Low',
  },
  {
    id: 'ahmedabad',
    name: 'Ahmedabad',
    state: 'Gujarat',
    latitude: 23.0225,
    longitude: 72.5714,
    x: 165,
    y: 285,
    temperature: 37.0,
    condition: 'Dry Hot Continental Winds',
    conditionCode: 'heatwave',
    windSpeed: 16,
    windDirection: 'W',
    humidity: 50,
    rainProb: 10,
    riskScore: 58,
    riskLevel: 'Moderate',
    alertSeverity: 'Watch',
  },
  {
    id: 'srinagar',
    name: 'Srinagar',
    state: 'Jammu & Kashmir',
    latitude: 34.0837,
    longitude: 74.7973,
    x: 215,
    y: 85,
    temperature: 17.5,
    condition: 'Clear Mountain Air',
    conditionCode: 'clear',
    windSpeed: 8,
    windDirection: 'NW',
    humidity: 52,
    rainProb: 10,
    riskScore: 18,
    riskLevel: 'Low',
  },
  {
    id: 'jaipur',
    name: 'Jaipur',
    state: 'Rajasthan',
    latitude: 26.9124,
    longitude: 75.7873,
    x: 210,
    y: 220,
    temperature: 39.0,
    condition: 'Arid Heatwave Exposure',
    conditionCode: 'heatwave',
    windSpeed: 12,
    windDirection: 'WNW',
    humidity: 38,
    rainProb: 5,
    riskScore: 65,
    riskLevel: 'High',
  },
  {
    id: 'thiruvananthapuram',
    name: 'Thiruvananthapuram',
    state: 'Kerala',
    latitude: 8.5241,
    longitude: 76.9366,
    x: 245,
    y: 625,
    temperature: 29.5,
    condition: 'Tropical Coastal Showers',
    conditionCode: 'rain',
    windSpeed: 18,
    windDirection: 'W',
    humidity: 86,
    rainProb: 70,
    riskScore: 48,
    riskLevel: 'Moderate',
  },
  {
    id: 'bhopal',
    name: 'Bhopal',
    state: 'Madhya Pradesh',
    latitude: 23.2599,
    longitude: 77.4126,
    x: 245,
    y: 300,
    temperature: 34.2,
    condition: 'Partly Cloudy Interior',
    conditionCode: 'partly-cloudy',
    windSpeed: 10,
    windDirection: 'WNW',
    humidity: 58,
    rainProb: 20,
    riskScore: 28,
    riskLevel: 'Low',
  },
  {
    id: 'patna',
    name: 'Patna',
    state: 'Bihar',
    latitude: 25.5941,
    longitude: 85.1376,
    x: 355,
    y: 250,
    temperature: 32.5,
    condition: 'Overcast & Humid Gangetic',
    conditionCode: 'cloudy',
    windSpeed: 14,
    windDirection: 'E',
    humidity: 75,
    rainProb: 50,
    riskScore: 45,
    riskLevel: 'Moderate',
  },
  {
    id: 'lucknow',
    name: 'Lucknow',
    state: 'Uttar Pradesh',
    latitude: 26.8467,
    longitude: 80.9462,
    x: 290,
    y: 225,
    temperature: 35.0,
    condition: 'Hazy & Convective Formation',
    conditionCode: 'partly-cloudy',
    windSpeed: 11,
    windDirection: 'ESE',
    humidity: 64,
    rainProb: 35,
    riskScore: 38,
    riskLevel: 'Moderate',
  },
  {
    id: 'port-blair',
    name: 'Port Blair',
    state: 'Andaman & Nicobar',
    latitude: 11.6234,
    longitude: 92.7265,
    x: 520,
    y: 525,
    temperature: 28.5,
    condition: 'Oceanic Squall & Rough Seas',
    conditionCode: 'rain',
    windSpeed: 28,
    windDirection: 'SW',
    humidity: 90,
    rainProb: 80,
    riskScore: 60,
    riskLevel: 'Moderate',
  },
];
