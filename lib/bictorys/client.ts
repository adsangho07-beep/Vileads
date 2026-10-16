import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import crypto from 'node:crypto';

const execFileP = promisify(execFile);

const BICTORYS_API_URL_LIVE = 'https://api.bictorys.com';
const BICTORYS_API_URL_SANDBOX = 'https://api.test.bictorys.com';
const FETCH_TIMEOUT_MS = 15_000;
const MAX_RETRIES_ON_WAF_403 = 3;

export function getBictorysApiKey(): string {
  const key = process.env.BICTORYS_API_KEY;
  if (!key) {
    throw new Error('BICTORYS_API_KEY is not configured in environment variables.');
  }
  return key.trim();
}

export function getBictorysWebhookSecret(): string | undefined {
  return process.env.BICTORYS_WEBHOOK_SECRET?.trim();
}

function bictorysApiUrl(apiKey: string): string {
  return apiKey.startsWith('test_') ? BICTORYS_API_URL_SANDBOX : BICTORYS_API_URL_LIVE;
}

export interface InitiateBictorysPaymentParams {
  amount: number;
  currency?: 'XOF' | 'XAF' | string;
  description?: string;
  reference: string; // our credit_purchases.id UUID
  returnUrl: string;
  cancelUrl: string;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  paymentCategory?: 'mobile_money' | 'card';
  merchantCountry?: string; // default 'SN'
  customerCity?: string;
  locale?: string;
}

export type InitiateBictorysPaymentResult =
  | {
      ok: true;
      providerTransactionId: string;
      checkoutUrl: string;
      status: 'pending';
    }
  | { ok: false; error: string };

type BictorysResponse = {
  ok: boolean;
  status: number;
  text: string;
  json: <T = unknown>() => Promise<T>;
};

function parseRawHttpResponse(raw: string): { status: number; body: string } {
  const sep = raw.indexOf('\r\n\r\n');
  const head = sep >= 0 ? raw.slice(0, sep) : raw;
  const body = sep >= 0 ? raw.slice(sep + 4) : '';
  const statusLine = head.split(/\r?\n/)[0] ?? '';
  const m = statusLine.match(/^HTTP\/[\d.]+\s+(\d+)/);
  return { status: m ? parseInt(m[1]!, 10) : 0, body };
}

/**
 * Executes a request using curl subprocess to bypass AWS WAF / JA3 TLS fingerprint blocking.
 * Minimal arguments only — do not add extra headers or flags.
 */
async function bictorysFetch(
  url: string,
  init: { method: string; headers: Record<string, string>; body?: string }
): Promise<BictorysResponse> {
  const args: string[] = ['-i', '-X', init.method];
  for (const [k, v] of Object.entries(init.headers)) {
    args.push('-H', `${k}: ${v}`);
  }
  if (init.body) {
    args.push('-d', init.body);
  }
  args.push(url);

  let lastError = '';
  for (let attempt = 0; attempt < MAX_RETRIES_ON_WAF_403; attempt++) {
    try {
      const { stdout } = await execFileP('curl', args, {
        timeout: FETCH_TIMEOUT_MS,
        maxBuffer: 4 * 1024 * 1024,
      });
      const { status, body } = parseRawHttpResponse(stdout);

      if (status === 403 && body.includes('Forbidden')) {
        lastError = `Bictorys WAF returned 403 (attempt ${attempt + 1}/${MAX_RETRIES_ON_WAF_403})`;
        if (attempt < MAX_RETRIES_ON_WAF_403 - 1) {
          await new Promise((r) => setTimeout(r, 2000 * Math.pow(2, attempt)));
          continue;
        }
      }

      return {
        ok: status >= 200 && status < 300,
        status,
        text: body,
        json: async <T>() => JSON.parse(body) as T,
      };
    } catch (err) {
      lastError = (err as Error).message;
      if (attempt < MAX_RETRIES_ON_WAF_403 - 1) {
        await new Promise((r) => setTimeout(r, 2000 * Math.pow(2, attempt)));
      }
    }
  }

  return {
    ok: false,
    status: 0,
    text: lastError,
    json: async () => {
      throw new Error(lastError);
    },
  };
}

export async function initiateBictorysPayment(
  params: InitiateBictorysPaymentParams
): Promise<InitiateBictorysPaymentResult> {
  const apiKey = getBictorysApiKey();
  const merchantCountry = params.merchantCountry || 'SN';
  const currency = params.currency || 'XOF';
  const paymentCategory = params.paymentCategory || 'mobile_money';

  // Ensure amount is an integer (CFA Francs have 0 decimal places)
  const amount = Math.round(params.amount);

  const body = {
    amount,
    currency,
    country: merchantCountry,
    paymentReference: params.reference,
    successRedirectUrl: params.returnUrl,
    // Send both casings for maximum gateway compatibility
    errorRedirectUrl: params.cancelUrl,
    ErrorRedirectUrl: params.cancelUrl,
    customerObject: {
      name: params.customerName || 'Client Vileads',
      email: params.customerEmail || '',
      phone: params.customerPhone || '',
      city: params.customerCity || 'Dakar',
      country: merchantCountry,
      locale: params.locale || 'fr-FR',
    },
  };

  const url = `${bictorysApiUrl(apiKey)}/pay/v1/charges`;
  const res = await bictorysFetch(url, {
    method: 'POST',
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const isWaf = res.status === 403 && res.text.includes('Forbidden');
    return {
      ok: false,
      error: isWaf
        ? 'Bictorys WAF a bloqué la requête. Vérifiez la clé API et le réseau.'
        : `Bictorys a répondu ${res.status}: ${res.text.slice(0, 300)}`,
    };
  }

  let data: {
    transactionId?: string;
    chargeId?: string;
    link?: string;
    redirectUrl?: string;
  };

  try {
    data = await res.json();
  } catch {
    return { ok: false, error: 'Réponse JSON invalide de Bictorys.' };
  }

  const txId = data.transactionId || data.chargeId;
  let checkoutUrl = data.link || data.redirectUrl;

  if (!txId || !checkoutUrl) {
    return {
      ok: false,
      error: 'Réponse incomplète de Bictorys (identifiant ou lien manquant).',
    };
  }

  // Pre-select tab (mobile_money | card) on the hosted checkout page
  try {
    const u = new URL(checkoutUrl);
    if (!u.searchParams.has('payment_category')) {
      u.searchParams.set('payment_category', paymentCategory);
      checkoutUrl = u.toString();
    }
  } catch {
    // If URL parsing fails, return as-is
  }

  return {
    ok: true,
    providerTransactionId: txId,
    checkoutUrl,
    status: 'pending',
  };
}

/**
 * Webhook signature verification supporting both HMAC (preferred) and static X-Secret-Key modes.
 */
export function verifyBictorysSignature(
  rawBody: string,
  headers: {
    signature?: string | null;
    timestamp?: string | null;
    secretKeyHeader?: string | null;
  }
): boolean {
  const secret = getBictorysWebhookSecret();
  if (!secret) {
    // If no webhook secret is configured, fallback to accepting if secret isn't required in dev
    return false;
  }

  // Mode 1: HMAC with timestamp
  if (headers.signature && headers.timestamp) {
    let tsNum = parseInt(headers.timestamp, 10);
    // Auto-detect ms vs seconds
    if (tsNum > 0 && tsNum < 10_000_000_000) {
      tsNum *= 1000;
    }
    // Replay window: ±5 minutes
    if (isNaN(tsNum) || Math.abs(Date.now() - tsNum) > 5 * 60_000) {
      return false;
    }

    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${headers.timestamp}.${rawBody}`)
      .digest('hex');

    const a = Buffer.from(headers.signature.trim());
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }

  // Mode 2: Static X-Secret-Key header
  if (headers.secretKeyHeader) {
    const a = Buffer.from(headers.secretKeyHeader.trim());
    const b = Buffer.from(secret);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }

  return false;
}

export function computeBictorysEventId(rawBody: string): string {
  return `synthetic-${crypto.createHash('sha256').update(rawBody).digest('hex').slice(0, 32)}`;
}

export interface NormalizedBictorysEvent {
  providerTransactionId: string;
  status: 'completed' | 'failed' | 'pending';
  failureReason?: string;
  reportedAmount?: number;
  reportedCurrency?: string;
  paymentReference?: string; // our credit_purchases.id
}

export function parseBictorysEvent(body: unknown): NormalizedBictorysEvent | null {
  const b = body as {
    event?: string;
    status?: string;
    transactionId?: string;
    chargeId?: string;
    paymentReference?: string;
    amount?: number | string;
    currency?: string;
  } | null;

  if (!b) return null;

  const id = b.transactionId || b.chargeId;
  if (!id) return null;

  const rawStatus = (b.status || b.event || '').toLowerCase();
  const reportedAmount =
    typeof b.amount === 'number'
      ? b.amount
      : typeof b.amount === 'string'
      ? parseInt(b.amount, 10)
      : undefined;

  if (
    rawStatus.includes('succeed') ||
    rawStatus === 'succeeded' ||
    rawStatus === 'payment.succeeded' ||
    rawStatus === 'success'
  ) {
    return {
      providerTransactionId: id,
      status: 'completed',
      reportedAmount,
      reportedCurrency: b.currency,
      paymentReference: b.paymentReference,
    };
  }

  if (rawStatus.includes('fail') || rawStatus.includes('cancel') || rawStatus === 'payment.failed') {
    return {
      providerTransactionId: id,
      status: 'failed',
      failureReason: rawStatus,
      reportedAmount,
      reportedCurrency: b.currency,
      paymentReference: b.paymentReference,
    };
  }

  return null;
}
