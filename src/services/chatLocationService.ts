import { LocationInfo } from '../types/location';
import { locationService } from './locationService';
import { DEFAULT_LOCATIONS } from '../config/constants';

export interface ChatLocationContext {
  conversationLocation?: LocationInfo | null;
  selectedLocation?: LocationInfo | null;
  currentLocation?: LocationInfo | null;
}

export interface ResolvedChatLocation {
  status: 'RESOLVED' | 'NOT_FOUND' | 'DEFAULT';
  location?: LocationInfo;
  source: 'explicit_query' | 'conversation_context' | 'selected_location' | 'current_location';
  extractedTerm?: string;
  notFoundTerm?: string;
}

// Common Indic script city name transliterations for reliable database lookups
const INDIC_CITY_ALIASES: Record<string, string> = {
  // Hindi / Devanagari
  'भुवनेश्वर': 'Bhubaneswar',
  'कोलकाता': 'Kolkata',
  'दिल्ली': 'Delhi',
  'नई दिल्ली': 'New Delhi',
  'मुंबई': 'Mumbai',
  'चेन्नई': 'Chennai',
  'कटक': 'Cuttack',
  'बेंगलुरु': 'Bengaluru',
  'बैंगलोर': 'Bengaluru',
  'हैदराबाद': 'Hyderabad',
  'अहमदाबाद': 'Ahmedabad',
  'पुणे': 'Pune',
  'जयपुर': 'Jaipur',
  'लखनऊ': 'Lucknow',
  'वाराणसी': 'Varanasi',
  'पटना': 'Patna',
  'पुरी': 'Puri',
  'संबलपुर': 'Sambalpur',
  'राउरकेला': 'Rourkela',
  'बालासोर': 'Balasore',
  'गुवाहाटी': 'Guwahati',
  'दार्जिलिंग': 'Darjeeling',
  'सिलीगुड़ी': 'Siliguri',
  'दीघा': 'Digha',

  // Bengali
  'কলকাতা': 'Kolkata',
  'ভুবনেশ্বর': 'Bhubaneswar',
  'দিল্লি': 'Delhi',
  'মুম্বই': 'Mumbai',
  'চেন্নাই': 'Chennai',
  'কটক': 'Cuttack',
  'দার্জিলিং': 'Darjeeling',
  'শিলিগুড়ি': 'Siliguri',
  'দীঘা': 'Digha',

  // Odia
  'ଭୁବନେଶ୍ୱର': 'Bhubaneswar',
  'କଟକ': 'Cuttack',
  'ପୁରୀ': 'Puri',
  'ସମ୍ବଲପୁର': 'Sambalpur',
  'ରାଉରକେଲା': 'Rourkela',
  'ବାଲେଶ୍ୱର': 'Balasore',
  'ବ୍ରହ୍ମପୁର': 'Brahmapur',
  'କୋଲକାତା': 'Kolkata',
  'ଦିଲ୍ଲୀ': 'Delhi',
  'ମୁମ୍ବାଇ': 'Mumbai',
  'ଚେନ୍ନାଇ': 'Chennai',
};

// Words that are question phrases or auxiliary verbs before weather concepts
const NON_CITY_PREFIXES = /^(will\s+it|is\s+it|does\s+it|can\s+it|could\s+it|should\s+it|might\s+it|did\s+it|would\s+it|it|there|any|heavy|chance\s+of|expect|incoming)$/i;

// Temporal words and trailing polite tokens
const TEMPORAL_SUFFIX = '(?:\\s+(?:now|today|tomorrow|tonight|right now|currently|this week|this weekend|yesterday|please|at this moment|this evening|this morning|hourly|weekly))';

/**
 * Extracts a candidate location name or local intent from a natural language query.
 */
export function extractLocationCandidate(rawQuery: string): { type: 'LOCAL_INTENT' } | { type: 'CANDIDATE'; term: string } | null {
  if (!rawQuery || typeof rawQuery !== 'string') return null;
  const q = rawQuery.trim();

  // 1. Check for local / "here" intent
  const localIntent = /\b(here|my area|my location|current location|this place|local weather|around me|near me|where i am)\b/i;
  if (localIntent.test(q)) {
    return { type: 'LOCAL_INTENT' };
  }

  // Pattern A: What about / How about / And <City>
  const followUpMatch = q.match(
    new RegExp(`(?:what about|how about|and|tell me about)\\s+([a-zA-Z\\u0900-\\u0D7F\\s.'-]+?)(?:${TEMPORAL_SUFFIX})?[?.,!]*$`, 'i')
  );
  if (followUpMatch && followUpMatch[1]) {
    const candidate = cleanCandidate(followUpMatch[1]);
    if (candidate && !NON_CITY_PREFIXES.test(candidate)) {
      return { type: 'CANDIDATE', term: candidate };
    }
  }

  // Pattern B: weather/temperature/rain/forecast/conditions [in|of|at|for|near|around] <City>
  const weatherPrepMatch = q.match(
    new RegExp(`(?:weather|temperature|forecast|climate|rain|rainfall|precipitation|humidity|wind|risk|advisory|conditions?)\\s+(?:in|of|at|for|near|around)\\s+([a-zA-Z\\u0900-\\u0D7F\\s.'-]+?)(?:${TEMPORAL_SUFFIX})?[?.,!]*$`, 'i')
  );
  if (weatherPrepMatch && weatherPrepMatch[1]) {
    const candidate = cleanCandidate(weatherPrepMatch[1]);
    if (candidate && !NON_CITY_PREFIXES.test(candidate)) {
      return { type: 'CANDIDATE', term: candidate };
    }
  }

  // Pattern C: Generic preposition [in|of|at|for|around|near|to] <City>
  const genericPrepMatch = q.match(
    new RegExp(`(?:in|of|at|for|around|near|to)\\s+([a-zA-Z\\u0900-\\u0D7F\\s.'-]+?)(?:${TEMPORAL_SUFFIX})?[?.,!]*$`, 'i')
  );
  if (genericPrepMatch && genericPrepMatch[1]) {
    const candidate = cleanCandidate(genericPrepMatch[1]);
    if (candidate && !NON_CITY_PREFIXES.test(candidate)) {
      return { type: 'CANDIDATE', term: candidate };
    }
  }

  // Pattern D: <City> weather/temperature/forecast/rain/conditions
  const citySubjectMatch = q.match(
    new RegExp(`^([a-zA-Z\\u0900-\\u0D7F\\s.'-]+?)\\s+(?:weather|temperature|forecast|climate|rain|rainfall|conditions?|telemetry)(?:${TEMPORAL_SUFFIX})?[?.,!]*$`, 'i')
  );
  if (citySubjectMatch && citySubjectMatch[1]) {
    const candidate = cleanCandidate(citySubjectMatch[1]);
    if (candidate && !NON_CITY_PREFIXES.test(candidate)) {
      return { type: 'CANDIDATE', term: candidate };
    }
  }

  // Pattern E: Indian Language postposition patterns
  // Hindi: <City> का/के/की/में/पर मौसम
  const hindiMatch = q.match(/([a-zA-Z\u0900-\u097F\s.'-]+?)(?:\s+(?:का|के|की|में|पर)|\s*)\s+(?:मौसम|तापमान|बारिश)/i);
  if (hindiMatch && hindiMatch[1]) {
    const candidate = cleanCandidate(hindiMatch[1]);
    if (candidate && !NON_CITY_PREFIXES.test(candidate)) {
      return { type: 'CANDIDATE', term: candidate };
    }
  }

  // Bengali: <City> এর/র আবহাওয়া
  const bengaliMatch = q.match(/([a-zA-Z\u0980-\u09FF\s.'-]+?)(?:(?:এর|র|তে|এ)|\s+(?:এর|র|তে|এ)|\s*)\s+(?:আবহাওয়া|তাপমাত্রা|বৃষ্টি)/i);
  if (bengaliMatch && bengaliMatch[1]) {
    const candidate = cleanCandidate(bengaliMatch[1]);
    if (candidate && !NON_CITY_PREFIXES.test(candidate)) {
      return { type: 'CANDIDATE', term: candidate };
    }
  }

  // Odia: <City> ର/ରେ ପାଣିପାଗ
  const odiaMatch = q.match(/([a-zA-Z\u0B00-\u0B7F\s.'-]+?)(?:(?:ର|ରେ)|\s+(?:ର|ରେ)|\s*)\s+(?:ପାଣିପାଗ|ତାପମାତ୍ରା|ବର୍ଷା)/i);
  if (odiaMatch && odiaMatch[1]) {
    const candidate = cleanCandidate(odiaMatch[1]);
    if (candidate && !NON_CITY_PREFIXES.test(candidate)) {
      return { type: 'CANDIDATE', term: candidate };
    }
  }

  // Pattern F: If query is very brief (1 to 3 words) and not asking a general question
  const stripped = q.replace(/[?.,!]/g, '').trim();
  const words = stripped.split(/\s+/);
  if (words.length <= 3) {
    const nonLocationWords = new Set([
      'what', 'is', 'the', 'how', 'tell', 'me', 'show', 'weather', 'forecast',
      'temperature', 'rain', 'rainfall', 'climate', 'today', 'tomorrow', 'tonight', 'now', 'will',
      'it', 'can', 'you', 'help', 'hi', 'hello', 'namaste', 'hey', 'good', 'morning', 'evening',
      'expect', 'any', 'heavy', 'flood', 'risk', 'about', 'around', 'with', 'from', 'after', 'before',
      'then', 'also', 'and', 'or', 'for', 'in', 'at', 'of', 'to', 'here', 'there', 'this', 'that'
    ]);
    const filtered = words.filter((w) => !nonLocationWords.has(w.toLowerCase()));
    if (filtered.length > 0 && filtered.length <= 3) {
      const candidate = cleanCandidate(filtered.join(' '));
      if (candidate && candidate.length >= 3 && !NON_CITY_PREFIXES.test(candidate)) {
        return { type: 'CANDIDATE', term: candidate };
      }
    }
  }

  return null;
}

function cleanCandidate(term: string): string | null {
  let cleaned = term.trim()
    .replace(/^(the|a|an)\s+/i, '')
    .replace(/[?.,!]$/, '')
    .trim();

  // Strip trailing temporal/polite tokens
  cleaned = cleaned.replace(/\s+(now|today|tomorrow|tonight|right now|currently|this week|this weekend|yesterday|please|at this moment|this evening|this morning|hourly|weekly)$/i, '').trim();

  // Stop words to reject
  const stopWords = new Set([
    'weather', 'forecast', 'temperature', 'rain', 'rainfall', 'climate', 'area', 'city', 'place',
    'location', 'station', 'telemetry', 'details', 'update', 'status', 'advisory',
    'now', 'today', 'tomorrow', 'tonight', 'yesterday', 'this week', 'this weekend',
    'my area', 'my location', 'here', 'there',
    'will it', 'is it', 'it', 'about', 'around', 'with', 'from', 'during', 'after', 'before',
    'then', 'also', 'what', 'how', 'when', 'why', 'who', 'which', 'tell', 'show',
    'hourly', 'daily', 'weekly', 'conditions', 'condition'
  ]);

  if (stopWords.has(cleaned.toLowerCase()) || cleaned.length < 2) {
    return null;
  }

  return cleaned;
}

/**
 * Resolves the location for a chat message adhering strictly to the priority chain:
 * 1. explicit_query (Highest priority — NEVER overridden by context or default)
 * 2. conversation_context (Previous turn's resolved location)
 * 3. selected_location (Dashboard active location)
 * 4. current_location (GPS location)
 */
export async function resolveChatLocation(
  query: string,
  context: ChatLocationContext = {}
): Promise<ResolvedChatLocation> {
  const extraction = extractLocationCandidate(query);

  // A. Local intent explicitly requested ("here", "my area", "current location")
  if (extraction && extraction.type === 'LOCAL_INTENT') {
    const loc = context.currentLocation || context.selectedLocation || DEFAULT_LOCATIONS[0];
    const res: ResolvedChatLocation = {
      status: 'RESOLVED',
      location: loc,
      source: context.currentLocation ? 'current_location' : 'selected_location',
      extractedTerm: 'here',
    };
    logDebug(query, res);
    return res;
  }

  // B. Explicit location candidate found in the user query
  if (extraction && extraction.type === 'CANDIDATE') {
    let candidate = extraction.term.trim();

    // Check Indic city alias dictionary
    const transliterated = INDIC_CITY_ALIASES[candidate];
    if (transliterated) {
      candidate = transliterated;
    }

    try {
      const searchResults = await locationService.searchLocations(candidate, { limit: 5 });

      if (searchResults && searchResults.length > 0) {
        // Pick best matching location (exact name, prefix match, or highest population)
        const lowerCandidate = candidate.toLowerCase();
        const exactMatch = searchResults.find(
          (loc) => loc.name.toLowerCase() === lowerCandidate
        );
        const bestMatch = exactMatch || searchResults[0];

        const res: ResolvedChatLocation = {
          status: 'RESOLVED',
          location: bestMatch,
          source: 'explicit_query',
          extractedTerm: candidate,
        };
        logDebug(query, res);
        return res;
      }
    } catch (err) {
      console.error('[LocationResolution] Search error for candidate:', candidate, err);
    }

    // Critical Requirement: DO NOT silently fall back to Kolkata when user explicitly named an unresolvable place
    const notFoundRes: ResolvedChatLocation = {
      status: 'NOT_FOUND',
      notFoundTerm: candidate,
      source: 'explicit_query',
      extractedTerm: candidate,
    };
    logDebug(query, notFoundRes);
    return notFoundRes;
  }

  // C. No explicit location in query: Fall back to conversation context (e.g. "Will it rain tomorrow?")
  if (context.conversationLocation) {
    const res: ResolvedChatLocation = {
      status: 'RESOLVED',
      location: context.conversationLocation,
      source: 'conversation_context',
    };
    logDebug(query, res);
    return res;
  }

  // D. Fall back to selected location (active dashboard location)
  if (context.selectedLocation) {
    const res: ResolvedChatLocation = {
      status: 'RESOLVED',
      location: context.selectedLocation,
      source: 'selected_location',
    };
    logDebug(query, res);
    return res;
  }

  // E. Fall back to current GPS location
  if (context.currentLocation) {
    const res: ResolvedChatLocation = {
      status: 'RESOLVED',
      location: context.currentLocation,
      source: 'current_location',
    };
    logDebug(query, res);
    return res;
  }

  // F. System default location (Kolkata baseline)
  const defaultLoc = DEFAULT_LOCATIONS[0];
  const res: ResolvedChatLocation = {
    status: 'DEFAULT',
    location: defaultLoc,
    source: 'selected_location',
  };
  logDebug(query, res);
  return res;
}

function logDebug(query: string, res: ResolvedChatLocation) {
  // Safe diagnostic information required by Phase 14
  console.log(
    `[WeatherGPT Location Debug]\n` +
    `  User query: "${query}"\n` +
    `  Detected location: "${res.extractedTerm || res.notFoundTerm || 'None'}"\n` +
    `  Resolution source: ${res.source}\n` +
    `  Status: ${res.status}\n` +
    `  Resolved coordinates: ${res.location ? `(${res.location.lat}, ${res.location.lon})` : 'N/A'}\n` +
    `  Resolved location name: ${res.location?.name || 'N/A'}`
  );
}
