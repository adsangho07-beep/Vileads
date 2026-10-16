import { DbSearch, DbLead, DbMessage } from '@/types/db';

export const DEMO_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'adamasangho07@gmail.com',
  user_metadata: {
    full_name: 'Adama Sangho',
    name: 'Adama Sangho',
  },
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2025-01-01T00:00:00.000Z',
};

export const DEMO_PASSWORD = '@91180046As';
export const DEMO_COOKIE_NAME = 'vileads_demo_session';

export function isDemoCredentials(email?: string, password?: string): boolean {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  return cleanEmail === DEMO_USER.email.toLowerCase() && (!password || password === DEMO_PASSWORD);
}

// In-memory demo state across requests
export const DEMO_SEARCHES: DbSearch[] = [
  {
    id: 'search-demo-1',
    user_id: DEMO_USER.id,
    sector: 'Agences Immobilières',
    city: 'Dakar',
    country: 'Sénégal',
    max_results: 25,
    status: 'succeeded',
    apify_run_id: 'run-demo-1',
    apify_dataset_id: 'ds-demo-1',
    error_message: null,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    started_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    finished_at: new Date(Date.now() - 3600000 * 3.8).toISOString(),
  },
  {
    id: 'search-demo-2',
    user_id: DEMO_USER.id,
    sector: 'Cabinets Médicaux & Cliniques',
    city: 'Abidjan',
    country: 'Côte d\'Ivoire',
    max_results: 20,
    status: 'succeeded',
    apify_run_id: 'run-demo-2',
    apify_dataset_id: 'ds-demo-2',
    error_message: null,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    started_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    finished_at: new Date(Date.now() - 3600000 * 23.8).toISOString(),
  },
  {
    id: 'search-demo-3',
    user_id: DEMO_USER.id,
    sector: 'Restaurants & Traiteurs',
    city: 'Bamako',
    country: 'Mali',
    max_results: 15,
    status: 'succeeded',
    apify_run_id: 'run-demo-3',
    apify_dataset_id: 'ds-demo-3',
    error_message: null,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    started_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    finished_at: new Date(Date.now() - 3600000 * 47.8).toISOString(),
  },
];

export const DEMO_LEADS: DbLead[] = [
  {
    id: 'lead-demo-1',
    search_id: 'search-demo-1',
    user_id: DEMO_USER.id,
    place_id: 'ChIJdemo1',
    name: 'Sénégal Immo Prestige',
    category: 'Agence immobilière',
    address: 'Almadies, Dakar, Sénégal',
    phone: '+221 77 123 45 67',
    website: 'https://senegalimmoprestige.sn',
    rating: 4.8,
    reviews_count: 42,
    latitude: 14.745,
    longitude: -17.518,
    raw: {},
    created_at: new Date(Date.now() - 3600000 * 3.8).toISOString(),
  },
  {
    id: 'lead-demo-2',
    search_id: 'search-demo-1',
    user_id: DEMO_USER.id,
    place_id: 'ChIJdemo2',
    name: 'Dakar Horizon Immobilier',
    category: 'Agence immobilière',
    address: 'Plateau, Rue Carnot, Dakar',
    phone: '+221 78 987 65 43',
    website: 'https://dakarhorizon.com',
    rating: 4.6,
    reviews_count: 28,
    latitude: 14.672,
    longitude: -17.432,
    raw: {},
    created_at: new Date(Date.now() - 3600000 * 3.8).toISOString(),
  },
  {
    id: 'lead-demo-3',
    search_id: 'search-demo-2',
    user_id: DEMO_USER.id,
    place_id: 'ChIJdemo3',
    name: 'Polyclinique Sainte Anne',
    category: 'Clinique privée',
    address: 'Cocody Riviera 3, Abidjan',
    phone: '+225 07 01 02 03 04',
    website: 'https://polyclinique-ste-anne.ci',
    rating: 4.9,
    reviews_count: 85,
    latitude: 5.359,
    longitude: -3.989,
    raw: {},
    created_at: new Date(Date.now() - 3600000 * 23.8).toISOString(),
  },
  {
    id: 'lead-demo-4',
    search_id: 'search-demo-3',
    user_id: DEMO_USER.id,
    place_id: 'ChIJdemo4',
    name: 'Le Balafon Gourmand',
    category: 'Restaurant gastronomique',
    address: 'Badalabougou, Bamako, Mali',
    phone: '+223 76 54 32 10',
    website: null,
    rating: 4.5,
    reviews_count: 56,
    latitude: 12.639,
    longitude: -7.998,
    raw: {},
    created_at: new Date(Date.now() - 3600000 * 47.8).toISOString(),
  },
];

export const DEMO_MESSAGES: DbMessage[] = [
  {
    id: 'msg-demo-1',
    lead_id: 'lead-demo-1',
    user_id: DEMO_USER.id,
    language: 'fr',
    channel: 'whatsapp',
    tone: 'professional',
    content: "Bonjour l'équipe Sénégal Immo Prestige ! Nous avons remarqué vos excellentes références immobilières sur Dakar. Nous accompagnons les agences leaders pour automatiser la qualification de leurs acquéreurs.",
    model: 'gpt-4o-mini',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

// Global in-memory storage (persists during dev server lifecycle)
declare global {
  // eslint-disable-next-line no-var
  var __demoStore: {
    searches: DbSearch[];
    leads: DbLead[];
    messages: DbMessage[];
  } | undefined;
}

if (!global.__demoStore) {
  global.__demoStore = {
    searches: [...DEMO_SEARCHES],
    leads: [...DEMO_LEADS],
    messages: [...DEMO_MESSAGES],
  };
}

export const demoStore = global.__demoStore;

export function addDemoSearch(search: DbSearch) {
  demoStore.searches.unshift(search);
}

export function updateDemoSearch(id: string, updates: Partial<DbSearch>) {
  const s = demoStore.searches.find((item) => item.id === id);
  if (s) {
    Object.assign(s, updates);
  }
}

export function getDemoSearch(id: string): DbSearch | undefined {
  return demoStore.searches.find((item) => item.id === id);
}

export function addDemoLeads(newLeads: DbLead[]) {
  for (const lead of newLeads) {
    const existingIdx = demoStore.leads.findIndex((l) => l.search_id === lead.search_id && l.place_id && l.place_id === lead.place_id);
    if (existingIdx >= 0) {
      demoStore.leads[existingIdx] = lead;
    } else {
      demoStore.leads.unshift(lead);
    }
  }
}

export function getDemoLeadsForSearch(searchId: string): DbLead[] {
  return demoStore.leads.filter((l) => l.search_id === searchId);
}

export function getDemoLead(id: string): DbLead | undefined {
  return demoStore.leads.find((l) => l.id === id);
}

export function addDemoMessage(msg: DbMessage) {
  demoStore.messages.unshift(msg);
}

export function getDemoMessagesForLead(leadId: string): DbMessage[] {
  return demoStore.messages.filter((m) => m.lead_id === leadId);
}
