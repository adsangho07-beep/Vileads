import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  computeMonerooEventId,
  parseMonerooEvent,
  verifyMonerooPayment,
  verifyMonerooSignature,
} from '@/lib/moneroo/client';

export const runtime = 'nodejs';

const AMOUNT_TOLERANCE = 0; // Moneroo settles in full — refuse any mismatch

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-moneroo-signature');

  let signatureValid = false;
  try {
    signatureValid = verifyMonerooSignature(rawBody, signature);
  } catch (err: any) {
    console.error('Moneroo webhook secret misconfigured:', err.message);
    return NextResponse.json({ error: 'Webhook non configuré côté serveur.' }, { status: 500 });
  }

  if (!signatureValid) {
    return NextResponse.json({ error: 'Signature invalide.' }, { status: 401 });
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 });
  }

  const event = parseMonerooEvent(parsedBody);
  const adminClient = createAdminClient();

  // payment.initiated or unrecognized shape — nothing to do, ack it.
  if (!event) {
    return NextResponse.json({ received: true, ignored: true });
  }

  // Dedup: Moneroo retries webhooks; the same payload may arrive several times.
  const eventId = computeMonerooEventId(rawBody);
  const { error: dedupError } = await adminClient
    .from('processed_webhook_events')
    .insert({ provider: 'moneroo', event_id: eventId });

  if (dedupError) {
    if (dedupError.code === '23505') {
      // Unique violation → already processed this exact payload.
      return NextResponse.json({ received: true, deduped: true });
    }
    // Any other error (transient DB issue, etc.) — let Moneroo retry rather
    // than silently dropping a legitimate new event.
    console.error('Moneroo webhook dedup insert failed:', dedupError);
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 });
  }

  if (!event.paymentId) {
    console.error('Moneroo webhook missing metadata.paymentId', { providerTransactionId: event.providerTransactionId });
    return NextResponse.json({ received: true, ignored: true });
  }

  const { data: purchase, error: fetchError } = await adminClient
    .from('credit_purchases')
    .select('*')
    .eq('id', event.paymentId)
    .maybeSingle();

  if (fetchError || !purchase) {
    console.error('Moneroo webhook: unknown credit_purchases id', event.paymentId);
    return NextResponse.json({ received: true, ignored: true });
  }

  if (purchase.status !== 'pending') {
    return NextResponse.json({ received: true, alreadyProcessed: true });
  }

  if (event.status === 'failed') {
    await adminClient
      .from('credit_purchases')
      .update({ status: 'failed', error_message: event.failureReason || 'Paiement échoué', updated_at: new Date().toISOString() })
      .eq('id', purchase.id)
      .eq('status', 'pending');

    return NextResponse.json({ received: true });
  }

  // event.status === 'completed' — re-query Moneroo for defense-in-depth before granting credits.
  const live = await verifyMonerooPayment(event.providerTransactionId);
  if (!live || live.status !== 'success') {
    await adminClient
      .from('credit_purchases')
      .update({
        status: 'failed',
        error_message: `Re-query mismatch: live=${live?.status ?? 'unavailable'}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', purchase.id)
      .eq('status', 'pending');

    console.error('Moneroo re-query mismatch, refusing to grant credits', { purchaseId: purchase.id, live });
    return NextResponse.json({ received: true });
  }

  const reportedAmount = live.amount ?? event.reportedAmount;
  const reportedCurrency = live.currency ?? event.reportedCurrency;
  if (
    reportedAmount === undefined ||
    Math.abs(reportedAmount - purchase.amount_total) > AMOUNT_TOLERANCE ||
    (reportedCurrency && reportedCurrency !== purchase.currency)
  ) {
    console.error('[WEBHOOK] Moneroo amount tampering detected', {
      purchaseId: purchase.id,
      expected: purchase.amount_total,
      got: reportedAmount,
    });
    return NextResponse.json({ error: 'Montant invalide.' }, { status: 400 });
  }

  // Atomic status transition — the WHERE clause guards against concurrent webhook retries.
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

  const { error: creditError } = await adminClient.rpc('add_credits', {
    p_user_id: purchase.user_id,
    p_amount: purchase.credits,
    p_type: 'purchase',
    p_reference_type: 'credit_purchase',
    p_reference_id: purchase.id,
    p_description: `Achat de ${purchase.credits} crédits (${purchase.package_id})`,
  });

  if (creditError) {
    console.error('Failed to grant credits after Moneroo payment success:', creditError);
    return NextResponse.json({ error: 'Erreur lors du crédit du compte.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
