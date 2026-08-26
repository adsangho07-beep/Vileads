import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCreditPackage } from '@/lib/credits';
import { initiateMonerooPayment } from '@/lib/moneroo/client';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié. Veuillez vous connecter.' }, { status: 401 });
    }

    const body = await request.json();
    const pkg = getCreditPackage(body.packageId);

    if (!pkg) {
      return NextResponse.json({ error: 'Pack de crédits invalide.' }, { status: 400 });
    }

    // 1. Insert a pending purchase row BEFORE calling Moneroo — the webhook may
    //    arrive before this HTTP response does.
    const { data: purchase, error: insertError } = await supabase
      .from('credit_purchases')
      .insert({
        user_id: user.id,
        package_id: pkg.id,
        credits: pkg.credits,
        amount_total: pkg.amountXof,
        currency: 'XOF',
        status: 'pending',
      })
      .select()
      .single();

    if (insertError || !purchase) {
      console.error('Error creating credit_purchases record:', insertError);
      return NextResponse.json({ error: "Impossible d'initialiser l'achat de crédits." }, { status: 500 });
    }

    const origin = request.nextUrl.origin;

    const result = await initiateMonerooPayment({
      amount: pkg.amountXof,
      currency: 'XOF',
      description: `Vileads — ${pkg.credits} crédits (${pkg.label})`,
      returnUrl: `${origin}/settings?tab=credits&purchase=${purchase.id}`,
      customerEmail: user.email || '',
      customerName: user.user_metadata?.full_name || user.user_metadata?.name,
      metadata: {
        paymentId: purchase.id,
        userId: user.id,
        packageId: pkg.id,
      },
    });

    if (!result.ok) {
      await supabase
        .from('credit_purchases')
        .update({ status: 'failed', error_message: result.error })
        .eq('id', purchase.id);

      return NextResponse.json(
        { error: `Échec de l'initialisation du paiement : ${result.error}` },
        { status: 502 }
      );
    }

    await supabase
      .from('credit_purchases')
      .update({
        provider_transaction_id: result.providerTransactionId,
        checkout_url: result.checkoutUrl,
      })
      .eq('id', purchase.id);

    return NextResponse.json({ success: true, checkoutUrl: result.checkoutUrl, purchaseId: purchase.id });
  } catch (err: any) {
    console.error('Unexpected error in POST /api/credits/checkout:', err);
    return NextResponse.json({ error: err?.message || 'Erreur serveur inattendue' }, { status: 500 });
  }
}
