import { DisasterEvent } from '../types/disaster';

export const MOCK_DISASTER_EVENTS: DisasterEvent[] = [
  {
    id: 'dis-2023-biparjoy',
    name: 'Extremely Severe Cyclonic Storm Biparjoy',
    year: 2023,
    date: '06 - 19 June 2023',
    type: 'Cyclone',
    state: 'Gujarat',
    districts: ['Kutch', 'Devbhumi Dwarka', 'Jamnagar', 'Porbandar', 'Morbi', 'Patan'],
    casualties: 5,
    displacedPersons: '100,000+ evacuated',
    economicImpact: '₹1,200+ Crore',
    maxWindKmph: 165,
    maxRainfallMm: 310,
    description:
      'Longest-duration cyclone in the North Indian Ocean on record. Formed in east-central Arabian Sea and made landfall near Jakhau Port, Gujarat, delivering catastrophic gale-force winds and storm surges.',
    keyTakeaway:
      'Zero casualty target largely achieved via preemptive evacuation of over 100,000 citizens from 0-10 km coastal belt by NDMA and Gujarat state machinery.',
  },
  {
    id: 'dis-2020-amphan',
    name: 'Super Cyclonic Storm Amphan',
    year: 2020,
    date: '16 - 21 May 2020',
    type: 'Cyclone',
    state: 'West Bengal',
    districts: ['South 24 Parganas', 'North 24 Parganas', 'Kolkata', 'East Medinipur', 'Howrah', 'Hooghly'],
    casualties: 98,
    displacedPersons: '3,000,000+ evacuated/affected',
    economicImpact: '₹1.03 Lakh Crore ($13.8B)',
    maxWindKmph: 260,
    maxRainfallMm: 245,
    description:
      'First Super Cyclonic Storm in the Bay of Bengal since 1999. Slammed into the Sundarbans and tore directly through Kolkata metropolitan region with 130 kmph wind sustained for 6 hours, downing 5,000+ trees and electrical sub-stations.',
    keyTakeaway:
      'Demonstrated critical need for underground urban power cabling and rapid automated cyclone track warning dissemination to local panchayats.',
  },
  {
    id: 'dis-2019-fani',
    name: 'Extremely Severe Cyclonic Storm Fani',
    year: 2019,
    date: '26 April - 04 May 2019',
    type: 'Cyclone',
    state: 'Odisha',
    districts: ['Puri', 'Khurda', 'Cuttack', 'Jagatsinghpur', 'Kendrapara'],
    casualties: 64,
    displacedPersons: '1,200,000 evacuated in 24 hrs',
    economicImpact: '₹24,176 Crore',
    maxWindKmph: 215,
    maxRainfallMm: 280,
    description:
      'Rare pre-monsoon Category 5-equivalent system that struck Puri coast. Landmark evacuation drill relocated 1.2 million citizens into 879 multi-purpose cyclone shelters within 24 hours, receiving global praise from the UN Office for Disaster Risk Reduction (UNDRR).',
    keyTakeaway:
      'Gold standard in mass early-warning and evacuation logistics, proving that reliable meteorological modeling directly saves tens of thousands of lives.',
  },
  {
    id: 'dis-2018-kerala',
    name: 'Great Kerala Monsoon Floods',
    year: 2018,
    date: '08 - 25 August 2018',
    type: 'Flood',
    state: 'Kerala',
    districts: ['Ernakulam', 'Thrissur', 'Alappuzha', 'Pathanamthitta', 'Idukki', 'Wayanad'],
    casualties: 483,
    displacedPersons: '1,450,000 in relief camps',
    economicImpact: '₹31,000 Crore',
    maxRainfallMm: 814,
    description:
      'Worst flood in Kerala in nearly a century. Unusually high monsoon rainfall filled 35 out of 54 major dams to maximum capacity simultaneously, necessitating emergency gate releases that submerged extensive downstream communities.',
    keyTakeaway:
      'Highlighted the urgent necessity of real-time multi-dam operational rule curve AI models and localized flood plain zoning.',
  },
  {
    id: 'dis-2021-chamoli',
    name: 'Uttarakhand Chamoli Glacial Flash Flood',
    year: 2021,
    date: '07 February 2021',
    type: 'Flood',
    state: 'Uttarakhand',
    districts: ['Chamoli'],
    casualties: 204,
    displacedPersons: 'Villages isolated; NTPC tunnel trapped',
    economicImpact: '₹1,500 Crore',
    description:
      'Massive rock and ice avalanche from Ronti peak into the Rishiganga and Dhauliganga rivers triggered a devastating debris flow destroying the Rishiganga hydro project and damaging the Tapovan Vishnugad dam.',
    keyTakeaway:
      'Underscored the need for high-altitude cryosphere radar monitoring and automated early siren systems for Himalayan river catchments.',
  },
  {
    id: 'dis-2021-maharashtra',
    name: 'Maharashtra Coastal Deluge & Landslides',
    year: 2021,
    date: '21 - 25 July 2021',
    type: 'Flood',
    state: 'Maharashtra',
    districts: ['Raigad', 'Ratnagiri', 'Sindhudurg', 'Satara', 'Kolhapur', 'Sangli'],
    casualties: 251,
    displacedPersons: '375,000 evacuated',
    economicImpact: '₹4,000+ Crore',
    maxRainfallMm: 594,
    description:
      'Mahabaleshwar recorded 594 mm in 24 hours. Torrential orographic rainfall across the Western Ghats triggered major landslides in Taliye village (Raigad) and catastrophic flooding of the Krishna and Vashishti rivers.',
    keyTakeaway:
      'Highlighted micro-level slope stability assessment and the integration of automated rain gauges in high-risk ghat sections.',
  },
  {
    id: 'dis-1999-odisha',
    name: 'Odisha Super Cyclone (05B)',
    year: 1999,
    date: '25 October - 04 November 1999',
    type: 'Cyclone',
    state: 'Odisha',
    districts: ['Jagatsinghpur', 'Puri', 'Kendrapara', 'Cuttack', 'Bhadrak', 'Balasore'],
    casualties: 9887,
    displacedPersons: '15,000,000 affected',
    economicImpact: '₹20,000 Crore (1999 value)',
    maxWindKmph: 260,
    maxRainfallMm: 955,
    description:
      'The deadliest tropical cyclone in the North Indian Ocean in modern history. A storm surge of 6 meters penetrated up to 35 km inland in Ersama block, submerging tens of thousands of villages.',
    keyTakeaway:
      'Catalyzed the birth of the National Disaster Management Act, the establishment of the Odisha State Disaster Management Authority (OSDMA), and the modernization of IMD Doppler radar networks.',
  },
];
