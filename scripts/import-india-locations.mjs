#!/usr/bin/env node
// ==============================================================================
// WEATHERGPT (SIH 2026 #26068) - NATIONWIDE INDIAN LOCATION IMPORTER
// Ministry of Earth Sciences / India Meteorological Department
// ==============================================================================
// Source Dataset: GeoNames India Gazetteer (IN.zip, admin1CodesASCII, admin2Codes)
// License: Creative Commons Attribution 4.0 International (CC BY 4.0)
// Attribution: Contains information from GeoNames (https://www.geonames.org/)
// ==============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import readline from 'node:readline';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const cacheDir = path.join(__dirname, '.cache');

// Standard 2-letter State/UT abbreviations for India
const STATE_CODE_MAP = {
  'Andaman and Nicobar': 'AN',
  'Andaman and Nicobar Islands': 'AN',
  'Andhra Pradesh': 'AP',
  'Arunachal Pradesh': 'AR',
  'Assam': 'AS',
  'Bihar': 'BR',
  'Chandigarh': 'CH',
  'Chhattisgarh': 'CG',
  'Dadra and Nagar Haveli and Daman and Diu': 'DD',
  'Delhi': 'DL',
  'Goa': 'GA',
  'Gujarat': 'GJ',
  'Haryana': 'HR',
  'Himachal Pradesh': 'HP',
  'Jammu and Kashmir': 'JK',
  'Jharkhand': 'JH',
  'Karnataka': 'KA',
  'Kerala': 'KL',
  'Ladakh': 'LA',
  'Lakshadweep': 'LD',
  'Madhya Pradesh': 'MP',
  'Maharashtra': 'MH',
  'Manipur': 'MN',
  'Meghalaya': 'ML',
  'Mizoram': 'MZ',
  'Nagaland': 'NL',
  'Odisha': 'OD',
  'Puducherry': 'PY',
  'Punjab': 'PB',
  'Rajasthan': 'RJ',
  'Sikkim': 'SK',
  'Tamil Nadu': 'TN',
  'Telangana': 'TG',
  'Tripura': 'TR',
  'Uttar Pradesh': 'UP',
  'Uttarakhand': 'UK',
  'West Bengal': 'WB',
};

// Core default locations to guarantee exact preservation
const DEFAULT_LOCATIONS = [
  {
    id: 'loc_kolkata',
    name: 'Kolkata',
    state: 'West Bengal',
    stateCode: 'WB',
    district: 'Kolkata',
    localityType: 'State Capital',
    latitude: 22.5726,
    longitude: 88.3639,
    population: 4496694,
    elevation: 9,
    aliases: 'Calcutta',
  },
  {
    id: 'loc_bhubaneswar',
    name: 'Bhubaneswar',
    state: 'Odisha',
    stateCode: 'OD',
    district: 'Khordha',
    localityType: 'State Capital',
    latitude: 20.2961,
    longitude: 85.8245,
    population: 837737,
    elevation: 45,
    aliases: 'Bhubaneshwar',
  },
  {
    id: 'loc_delhi',
    name: 'New Delhi',
    state: 'Delhi',
    stateCode: 'DL',
    district: 'New Delhi',
    localityType: 'National Capital',
    latitude: 28.6139,
    longitude: 77.2090,
    population: 16787941,
    elevation: 216,
    aliases: 'Delhi, NCT Delhi',
  },
  {
    id: 'loc_mumbai',
    name: 'Mumbai',
    state: 'Maharashtra',
    stateCode: 'MH',
    district: 'Mumbai',
    localityType: 'State Capital',
    latitude: 19.0760,
    longitude: 72.8777,
    population: 12442373,
    elevation: 14,
    aliases: 'Bombay',
  },
  {
    id: 'loc_chennai',
    name: 'Chennai',
    state: 'Tamil Nadu',
    stateCode: 'TN',
    district: 'Chennai',
    localityType: 'State Capital',
    latitude: 13.0827,
    longitude: 80.2707,
    population: 7088000,
    elevation: 6,
    aliases: 'Madras',
  },
  {
    id: 'loc_guwahati',
    name: 'Guwahati',
    state: 'Assam',
    stateCode: 'AS',
    district: 'Kamrup Metropolitan',
    localityType: 'State Capital',
    latitude: 26.1445,
    longitude: 91.7362,
    population: 957352,
    elevation: 55,
    aliases: 'Gauhati',
  },
];

function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const envFile of envFiles) {
    const filePath = path.join(projectRoot, envFile);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      for (const rawLine of content.split('\n')) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const eqIdx = line.indexOf('=');
        if (eqIdx > 0) {
          const key = line.slice(0, eqIdx).trim();
          let val = line.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

function normalizeSearchName(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

async function downloadFile(url, destPath) {
  if (fs.existsSync(destPath)) {
    console.log(`[Cache Hit] Using cached file: ${path.basename(destPath)}`);
    return;
  }
  console.log(`[Download] Fetching ${url} ...`);
  execSync(`curl.exe -L -s "${url}" -o "${destPath}"`, { stdio: 'inherit' });
}

async function initLocationsTable(client) {
  console.log('[DB Schema] Validating and provisioning locations table schema...');

  // 1. Check if legacy locations table exists without the modern schema
  const colCheck = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'normalized_name'
  `);

  if (colCheck.rows.length === 0) {
    console.log('[DB Schema] Dropping legacy unindexed locations table...');
    await client.query('DROP TABLE IF EXISTS locations CASCADE;');
  }

  // 2. Create nationwide locations table
  await client.query(`
    CREATE TABLE IF NOT EXISTS locations (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      normalized_name VARCHAR(255) NOT NULL,
      state VARCHAR(150) NOT NULL,
      state_code VARCHAR(10),
      district VARCHAR(150) NOT NULL,
      district_code VARCHAR(20),
      locality_type VARCHAR(50) NOT NULL DEFAULT 'City',
      latitude DOUBLE PRECISION NOT NULL,
      longitude DOUBLE PRECISION NOT NULL,
      country VARCHAR(10) DEFAULT 'IN',
      population BIGINT,
      elevation INTEGER,
      aliases TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      source VARCHAR(100) DEFAULT 'GeoNames-IN-CC-BY-4.0',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_locations_name_state_district UNIQUE (normalized_name, state, district)
    );

    CREATE INDEX IF NOT EXISTS idx_locations_normalized_name ON locations (normalized_name);
    CREATE INDEX IF NOT EXISTS idx_locations_state ON locations (state);
    CREATE INDEX IF NOT EXISTS idx_locations_district ON locations (district);
    CREATE INDEX IF NOT EXISTS idx_locations_locality_type ON locations (locality_type);
    CREATE INDEX IF NOT EXISTS idx_locations_coords ON locations (latitude, longitude);
  `);

  console.log('[DB Schema] locations schema and performance indexes verified.');
}

async function parseAdmin1Codes(filePath) {
  const admin1Map = new Map(); // '28' -> 'West Bengal'
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (!line.startsWith('IN.')) continue;
    const parts = line.split('\t');
    if (parts.length >= 2) {
      const code = parts[0].replace('IN.', '').trim();
      const stateName = parts[1].trim();
      admin1Map.set(code, stateName);
    }
  }
  return admin1Map;
}

async function parseAdmin2Codes(filePath) {
  const admin2Map = new Map(); // '28.01' -> 'Kolkata'
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (!line.startsWith('IN.')) continue;
    const parts = line.split('\t');
    if (parts.length >= 2) {
      const codeKey = parts[0].replace('IN.', '').trim();
      let districtName = (parts[2] || parts[1]).trim();
      districtName = districtName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/^District\s+/i, '')
        .replace(/\s+District$/i, '');
      admin2Map.set(codeKey, districtName);
    }
  }
  return admin2Map;
}

async function main() {
  loadEnv();
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('ERROR: DATABASE_URL is not defined in .env or .env.local.');
    process.exit(1);
  }

  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  const admin1Path = path.join(cacheDir, 'admin1CodesASCII.txt');
  const admin2Path = path.join(cacheDir, 'admin2Codes.txt');
  const inZipPath = path.join(cacheDir, 'IN.zip');
  const inTxtPath = path.join(cacheDir, 'IN.txt');

  console.log('================================================================');
  console.log('WEATHERGPT NATIONWIDE LOCATION IMPORTER — DATA INGESTION PIPELINE');
  console.log('================================================================');

  // Step 1: Download required datasets
  await downloadFile('http://download.geonames.org/export/dump/admin1CodesASCII.txt', admin1Path);
  await downloadFile('http://download.geonames.org/export/dump/admin2Codes.txt', admin2Path);
  await downloadFile('http://download.geonames.org/export/dump/IN.zip', inZipPath);

  // Step 2: Unzip IN.txt if needed
  if (!fs.existsSync(inTxtPath)) {
    console.log('[Extract] Extracting IN.txt from IN.zip ...');
    execSync(`tar.exe -xf "${inZipPath}" IN.txt`, { cwd: cacheDir });
  }

  // Step 3: Load Administrative Mappings
  console.log('[Mapping] Loading administrative state and district hierarchies...');
  const admin1Map = await parseAdmin1Codes(admin1Path);
  const admin2Map = await parseAdmin2Codes(admin2Path);
  console.log(`[Mapping] Loaded ${admin1Map.size} States/UTs and ${admin2Map.size} Districts.`);

  // Step 4: Connect to PostgreSQL
  const pool = new pg.Pool({ connectionString: dbUrl, ssl: false });
  const client = await pool.connect();

  try {
    await initLocationsTable(client);

    // Step 5: Process IN.txt stream
    console.log('[Processing] Streaming and validating nationwide gazetteer entries...');

    const inStream = fs.createReadStream(inTxtPath);
    const rl = readline.createInterface({ input: inStream, crlfDelay: Infinity });

    let totalSourceRecords = 0;
    let validRecords = 0;
    let invalidRecords = 0;
    let duplicatesRemoved = 0;

    const locationMap = new Map(); // key: `${normalizedName}|${state}|${district}` -> best record

    // Feature code hierarchy rank
    const hierarchyRank = {
      PPLC: 100, // National Capital
      PPLA: 90,  // State Capital
      PPLA2: 80, // District Headquarters
      PPLA3: 70, // Subdistrict
      PPLA4: 60, // Tehsil / Block
      PPL: 50,   // Populated Place
      ADM2: 40,  // District Area
    };

    const localityTypeLabel = {
      PPLC: 'National Capital',
      PPLA: 'State Capital',
      PPLA2: 'District Headquarters',
      PPLA3: 'Subdistrict Headquarters',
      PPLA4: 'Tehsil Headquarters',
      PPL: 'City / Town',
      ADM2: 'District',
    };

    for await (const line of rl) {
      totalSourceRecords++;
      const cols = line.split('\t');
      if (cols.length < 19) {
        invalidRecords++;
        continue;
      }

      const geonameId = cols[0];
      const rawName = cols[1]?.trim();
      const rawAscii = cols[2]?.trim();
      const altNames = cols[3]?.trim();
      const latStr = cols[4];
      const lonStr = cols[5];
      const featClass = cols[6];
      const featCode = cols[7];
      const country = cols[8];
      const adm1 = cols[10]?.trim();
      const adm2 = cols[11]?.trim();
      const popStr = cols[14];
      const elevStr = cols[15] || cols[16];

      // Country check
      if (country !== 'IN') {
        invalidRecords++;
        continue;
      }

      // Feature code check: Only populated places or administrative divisions
      const isPopulatedPlace = featClass === 'P';
      const isDistrictAdm = featCode === 'ADM2';
      if (!isPopulatedPlace && !isDistrictAdm) {
        continue; // Skip physical features like rivers, hills, etc.
      }

      // Coordinates validation (India bounding box)
      const lat = parseFloat(latStr);
      const lon = parseFloat(lonStr);
      if (
        isNaN(lat) ||
        isNaN(lon) ||
        lat < 6.0 ||
        lat > 38.5 ||
        lon < 68.0 ||
        lon > 98.0
      ) {
        invalidRecords++;
        continue;
      }

      const name = rawAscii || rawName;
      if (!name) {
        invalidRecords++;
        continue;
      }

      // State resolution
      const state = admin1Map.get(adm1) || 'India';
      const stateCode = STATE_CODE_MAP[state] || adm1 || 'IN';

      // District resolution
      const adm2Key = `${adm1}.${adm2}`;
      const district = admin2Map.get(adm2Key) || name;

      const population = parseInt(popStr, 10) || 0;
      const elevation = parseInt(elevStr, 10) || null;

      const localityType = localityTypeLabel[featCode] || (population > 50000 ? 'City' : 'Town');
      const rank = hierarchyRank[featCode] || 30;

      // Filter: We prioritize capitals, district HQs, subdistricts, cities, and towns with population >= 1000
      // or verified administrative status, to ensure top-quality nationwide catalog.
      const isSignificant =
        rank >= 60 ||
        population >= 1000 ||
        featCode === 'PPLA' ||
        featCode === 'PPLA2' ||
        featCode === 'PPLC' ||
        featCode === 'ADM2';

      if (!isSignificant) {
        continue;
      }

      const normalized = normalizeSearchName(name);
      const dedupKey = `${normalized}|${state.toLowerCase()}|${district.toLowerCase()}`;

      const candidate = {
        id: `loc_${geonameId}`,
        name: name,
        normalizedName: normalized,
        state: state,
        stateCode: stateCode,
        district: district,
        districtCode: adm2 || null,
        localityType: localityType,
        latitude: Math.round(lat * 10000) / 10000,
        longitude: Math.round(lon * 10000) / 10000,
        country: 'IN',
        population: population || null,
        elevation: elevation,
        aliases: altNames ? altNames.slice(0, 500) : null,
        rank: rank,
      };

      if (locationMap.has(dedupKey)) {
        duplicatesRemoved++;
        const existing = locationMap.get(dedupKey);
        // Replace if candidate has higher administrative rank or higher population
        if (candidate.rank > existing.rank || (candidate.population || 0) > (existing.population || 0)) {
          locationMap.set(dedupKey, candidate);
        }
      } else {
        locationMap.set(dedupKey, candidate);
        validRecords++;
      }
    }

    // Step 6: Inject and ensure core default reference cities
    for (const core of DEFAULT_LOCATIONS) {
      const normalized = normalizeSearchName(core.name);
      const dedupKey = `${normalized}|${core.state.toLowerCase()}|${core.district.toLowerCase()}`;
      locationMap.set(dedupKey, {
        id: core.id,
        name: core.name,
        normalizedName: normalized,
        state: core.state,
        stateCode: core.stateCode,
        district: core.district,
        districtCode: null,
        localityType: core.localityType,
        latitude: core.latitude,
        longitude: core.longitude,
        country: 'IN',
        population: core.population,
        elevation: core.elevation,
        aliases: core.aliases,
        rank: 200,
      });
    }

    console.log(`[Normalized] Catalog prepared with ${locationMap.size} unique verified locations across India.`);

    // Step 7: Batch Insert into PostgreSQL with Parameterized SQL
    console.log('[Database] Executing idempotent batch insert into PostgreSQL...');

    const locations = Array.from(locationMap.values());
    const batchSize = 250;
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (let i = 0; i < locations.length; i += batchSize) {
      const chunk = locations.slice(i, i + batchSize);
      await client.query('BEGIN');

      for (const loc of chunk) {
        const query = `
          INSERT INTO locations (
            id, name, normalized_name, state, state_code, district, district_code,
            locality_type, latitude, longitude, country, population, elevation, aliases,
            is_active, source, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true, 'GeoNames-IN-CC-BY-4.0', NOW())
          ON CONFLICT (normalized_name, state, district)
          DO UPDATE SET
            name = EXCLUDED.name,
            locality_type = EXCLUDED.locality_type,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            population = COALESCE(EXCLUDED.population, locations.population),
            elevation = COALESCE(EXCLUDED.elevation, locations.elevation),
            aliases = COALESCE(EXCLUDED.aliases, locations.aliases),
            updated_at = NOW()
        `;

        const values = [
          loc.id,
          loc.name,
          loc.normalizedName,
          loc.state,
          loc.stateCode,
          loc.district,
          loc.districtCode,
          loc.localityType,
          loc.latitude,
          loc.longitude,
          loc.country,
          loc.population,
          loc.elevation,
          loc.aliases,
        ];

        const res = await client.query(query, values);
        if (res.rowCount > 0) {
          inserted++;
        } else {
          skipped++;
        }
      }

      await client.query('COMMIT');
      process.stdout.write(`\r[Database] Persisted ${Math.min(i + batchSize, locations.length)} / ${locations.length} locations...`);
    }

    console.log('\n[Database] All locations successfully committed.');

    // Step 8: Calculate Quality & Coverage Statistics
    const statRes = await client.query(`
      SELECT
        COUNT(*) as total,
        COUNT(DISTINCT state) as states,
        COUNT(DISTINCT district) as districts,
        COUNT(CASE WHEN locality_type LIKE '%Capital%' OR locality_type LIKE '%City%' THEN 1 END) as cities,
        COUNT(CASE WHEN locality_type LIKE '%Town%' OR locality_type LIKE '%Headquarters%' THEN 1 END) as towns
      FROM locations
    `);

    const stats = statRes.rows[0];

    console.log('================================================================');
    console.log('IMPORT COMPLETE — SUMMARY AUDIT REPORT:');
    console.log('================================================================');
    console.log(`Total source records:   ${totalSourceRecords}`);
    console.log(`Valid records parsed:   ${validRecords}`);
    console.log(`Invalid records:        ${invalidRecords}`);
    console.log(`Duplicates removed:     ${duplicatesRemoved}`);
    console.log(`Locations in Database:  ${stats.total}`);
    console.log(`States & UTs covered:   ${stats.states}`);
    console.log(`Districts covered:      ${stats.districts}`);
    console.log(`Cities covered:         ${stats.cities}`);
    console.log(`Towns & HQs covered:    ${stats.towns}`);
    console.log(`Inserted / Synced:      ${inserted}`);
    console.log(`Skipped:                ${skipped}`);
    console.log('================================================================');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Import failed with error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
