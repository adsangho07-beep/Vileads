export type SearchStatus = 'pending' | 'running' | 'succeeded' | 'failed';
export type MessageChannel = 'whatsapp' | 'email' | 'sms';
export type MessageTone = 'professional' | 'direct' | 'friendly' | 'persuasive';

export interface DbSearch {
  id: string;
  user_id: string;
  sector: string;
  city: string;
  country: string | null;
  max_results: number;
  status: SearchStatus;
  apify_run_id: string | null;
  apify_dataset_id: string | null;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export interface DbLead {
  id: string;
  search_id: string;
  user_id: string;
  place_id: string | null;
  name: string | null;
  category: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviews_count: number | null;
  latitude: number | null;
  longitude: number | null;
  raw: Record<string, unknown> | null;
  created_at: string;
}

export interface DbMessage {
  id: string;
  lead_id: string;
  user_id: string;
  language: 'fr' | 'en';
  channel?: MessageChannel;
  tone?: MessageTone;
  content: string;
  model: string | null;
  created_at: string;
}

export interface LeadWithMessages extends DbLead {
  messages?: DbMessage[];
}

export interface SearchWithStats extends DbSearch {
  leads_count?: number;
}

export type CreditTransactionType = 'signup_bonus' | 'purchase' | 'consumption' | 'refund';
export type CreditPurchaseStatus = 'pending' | 'completed' | 'failed' | 'expired';

export interface DbUserCredits {
  user_id: string;
  balance: number;
  updated_at: string;
}

export interface DbCreditTransaction {
  id: string;
  user_id: string;
  type: CreditTransactionType;
  amount: number;
  balance_after: number;
  reference_type: string | null;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

export interface DbCreditPurchase {
  id: string;
  user_id: string;
  package_id: string;
  credits: number;
  amount_total: number;
  currency: string;
  status: CreditPurchaseStatus;
  provider: string;
  provider_transaction_id: string | null;
  checkout_url: string | null;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}
