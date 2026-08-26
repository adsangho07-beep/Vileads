import crypto from 'node:crypto';

const MONEROO_API_URL = 'https://api.moneroo.io';
const FETCH_TIMEOUT_MS = 15_000;

export function getMonerooSecretKey(): string {
  const key = process.env.MONEROO_SECRET_KEY;
  if (!key) {
    throw new Error('MONEROO_SECRET_KEY is not configured in environment variables.');
  }
  return key;
}

export function getMonerooWebhookSecret(): string {
  const secret = process.env.MONEROO_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('MONEROO_WEBHOOK_SECRET is not configured in environment variables.');
  }
  return secret;
}

export interface InitiatePaymentParams {
  amount: number;
  currency: 'XOF' | 'XAF' | 'USD' | 'EUR' | string;
  description: string;
  returnUrl: string;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  metadata?: Record<string, string | number | boolean | undefined>;
}

export type InitiatePaymentResult =
  | {
      ok: true;
      providerTransactionId: string;
      checkoutUrl: string;
    }
  | { ok: false; error: string };

function splitName(full: string | undefined, fallbackEmail: string): { first: string; last: string } {
  const v = (full ?? '').trim();
  if (!v) {
    const local = fallbackEmail.split('@')[0] || 'Client';
    return { first: local, last: '-' };
  }
  const parts = v.split(/\s+/);
  return { first: parts[0]!, last: parts.slice(1).join(' ') || '-' };
}

async function monerooFetch(path: string, init: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(`${MONEROO_API_URL}${path}`, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function initiateMonerooPayment(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
  const secretKey = getMonerooSecretKey();
  const { first, last } = splitName(params.customerName, params.customerEmail);

  const body: Record<string, unknown> = {
    amount: params.amount,
    currency: params.currency,
    description: params.description.slice(0, 200),
    return_url: params.returnUrl,
    customer: {
      email: params.customerEmail,
      first_name: first,
      last_name: last,
      ...(params.customerPhone ? { phone: params.customerPhone } : {}),
    },
    metadata: Object.fromEntries(
      Object.entries(params.metadata ?? {})
        .filter(([, v]) => v !== undefined && v !== null && String(v).length > 0)
        .map(([k, v]) => [k, String(v)])
    ),
  };

  let res: Response;
  try {
    res = await monerooFetch('/v1/payments/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return { ok: false, error: `Erreur réseau Moneroo : ${(err as Error).message}` };
  }

  let parsed: { data?: { id?: string; checkout_url?: string }; message?: string };
  try {
    parsed = (await res.json()) as typeof parsed;
  } catch {
    return { ok: false, error: `Moneroo a répondu ${res.status} (réponse non-JSON)` };
  }

  if (!res.ok || !parsed.data?.id || !parsed.data?.checkout_url) {
    return { ok: false, error: parsed.message || `Moneroo a répondu ${res.status}` };
  }

  return {
    ok: true,
    providerTransactionId: parsed.data.id,
    checkoutUrl: parsed.data.checkout_url,
  };
}

export interface VerifyPaymentResult {
  status: string;
  amount?: number;
  currency?: string;
}

export async function verifyMonerooPayment(paymentId: string): Promise<VerifyPaymentResult | null> {
  const secretKey = getMonerooSecretKey();
  let res: Response;
  try {
    res = await monerooFetch(`/v1/payments/${encodeURIComponent(paymentId)}/verify`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        Accept: 'application/json',
      },
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;

  const json = (await res.json().catch(() => null)) as {
    data?: { status?: string; amount?: number | string; currency?: { code?: string } | string };
  } | null;
  if (!json?.data?.status) return null;

  const currency = typeof json.data.currency === 'string' ? json.data.currency : json.data.currency?.code;

  return {
    status: String(json.data.status).toLowerCase(),
    amount: typeof json.data.amount === 'string' ? parseInt(json.data.amount, 10) : json.data.amount,
    currency,
  };
}

export function verifyMonerooSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;
  const secret = getMonerooWebhookSecret();
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(signatureHeader.trim());
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function computeMonerooEventId(rawBody: string): string {
  return `synthetic-${crypto.createHash('sha256').update(rawBody).digest('hex').slice(0, 32)}`;
}

export interface NormalizedMonerooEvent {
  providerTransactionId: string;
  status: 'completed' | 'failed';
  failureReason?: string;
  reportedAmount?: number;
  reportedCurrency?: string;
  paymentId?: string; // our own credit_purchases.id, round-tripped via metadata
}

export function parseMonerooEvent(body: unknown): NormalizedMonerooEvent | null {
  const b = body as { event?: string; data?: Record<string, unknown> } | null;
  if (!b?.event || !b.data) return null;

  const data = b.data;
  const id = data.id as string | undefined;
  if (!id) return null;

  const reportedAmount =
    typeof data.amount === 'number' ? data.amount : typeof data.amount === 'string' ? parseInt(data.amount, 10) : undefined;
  const reportedCurrency =
    typeof data.currency === 'string' ? data.currency : (data.currency as { code?: string } | undefined)?.code;
  const metadata = data.metadata as Record<string, unknown> | undefined;
  const paymentId = typeof metadata?.paymentId === 'string' ? metadata.paymentId : undefined;

  if (b.event === 'payment.success') {
    return { providerTransactionId: id, status: 'completed', reportedAmount, reportedCurrency, paymentId };
  }
  if (b.event === 'payment.failed' || b.event === 'payment.cancelled') {
    return {
      providerTransactionId: id,
      status: 'failed',
      failureReason: typeof data.status === 'string' ? data.status : b.event,
      reportedAmount,
      reportedCurrency,
      paymentId,
    };
  }
  // payment.initiated → informational only, ignore
  return null;
}
