import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  computeBictorysEventId,
  getBictorysWebhookSecret,
  parseBictorysEvent,
  verifyBictorysSignature,
} from '@/lib/bictorys/client';

export const runtime = 'nodejs';

const AMOUNT_TOLERANCE = 0; // FCFA settles in exact whole integer amounts

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-webhook-signature');
  const timestamp = request.headers.get('x-webhook-timestamp');
  const secretKeyHeader = request.headers.get('x-secret-key');

  const webhookSecret = getBictorysWebhookSecret();
  if (webhookSecret) {
    const signatureValid = verifyBictorysSignature(rawBody, {
      signature,
      timestamp,
      secretKeyHeader,
    });

    if (!signatureValid) {
      console.warn('[WEBHOOK BICTORYS] Invalid webhook signature received.');
      return NextResponse.json({ error: 'Signature invalide.' }, { status: 401 });
    }
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Corps de requête JSON invalide.' }, { status: 400 });
  }

  const event = parseBictorysEvent(parsedBody);
  const adminClient = createAdminClient();

  if (!event) {
    // Unknown or in-flight event (e.g. pending/processing) - ack it gracefully
    return NextResponse.json({ received: true, ignored: true });
  }

  // Idempotency: dedup via processed_webhook_events
  const eventId = computeBictorysEventId(rawBody);
  const { error: dedupError } = await adminClient
    .from('processed_webhook_events')
    .insert({ provider: 'bictorys', event_id: eventId });

  if (dedupError) {
    if (dedupError.code === '23505') {
      // Duplicate event
      return NextResponse.json({ received: true, deduped: true });
    }
    console.error('[WEBHOOK BICTORYS] Dedup insert failed:', dedupError);
    return NextResponse.json({ error: 'Erreur interne de déduplication.' }, { status: 500 });
  }

  // Find purchase row by paymentReference (our UUID) or providerTransactionId
  let purchaseQuery = adminClient.from('credit_purchases').select('*');
  if (event.paymentReference) {
    purchaseQuery = purchaseQuery.eq('id', event.paymentReference);
  } else {
    purchaseQuery = purchaseQuery.eq('provider_transaction_id', event.providerTransactionId);
  }

  const { data: purchase, error: fetchError } = await purchaseQuery.maybeSingle();

  if (fetchError || !purchase) {
    console.error('[WEBHOOK BICTORYS] Purchase row not found for event:', {
      paymentReference: event.paymentReference,
      providerTransactionId: event.providerTransactionId,
    });
    return NextResponse.json({ received: true, ignored: true });
  }

  if (purchase.status !== 'pending') {
    return NextResponse.json({ received: true, alreadyProcessed: true });
  }

  if (event.status === 'failed') {
    await adminClient
      .from('credit_purchases')
      .update({
        status: 'failed',
        error_message: event.failureReason || 'Paiement échoué ou annulé',
        updated_at: new Date().toISOString(),
      })
      .eq('id', purchase.id)
      .eq('status', 'pending');

    return NextResponse.json({ received: true });
  }

  // Verify amount tampering
  if (
    event.reportedAmount !== undefined &&
    Math.abs(event.reportedAmount - purchase.amount_total) > AMOUNT_TOLERANCE
  ) {
    console.error('[WEBHOOK BICTORYS] Amount tampering detected:', {
      purchaseId: purchase.id,
      expected: purchase.amount_total,
      got: event.reportedAmount,
    });
    return NextResponse.json({ error: 'Montant invalide.' }, { status: 400 });
  }

  // Atomic state transition
  const { data: updated } = await adminClient
    .from('credit_purchases')
    .update({
      status: 'completed',
      provider_transaction_id: event.providerTransactionId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', purchase.id)
    .eq('status', 'pending')
    .select()
    .maybeSingle();

  if (!updated) {
    return NextResponse.json({ received: true, alreadyProcessed: true });
  }

  // Grant credits to user
  const { error: creditError } = await adminClient.rpc('add_credits', {
    p_user_id: purchase.user_id,
    p_amount: purchase.credits,
    p_type: 'purchase',
    p_reference_type: 'credit_purchase',
    p_reference_id: purchase.id,
    p_description: `Achat de ${purchase.credits} crédits (${purchase.package_id}) via Bictorys`,
  });

  if (creditError) {
    console.error('[WEBHOOK BICTORYS] Failed to grant credits in Supabase:', creditError);
    return NextResponse.json({ error: 'Erreur lors du crédit du compte.' }, { status: 500 });
  }

  return NextResponse.json({ received: true, success: true });
}
