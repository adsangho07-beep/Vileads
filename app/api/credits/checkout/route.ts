import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCreditPackage } from '@/lib/credits';
import { initiateBictorysPayment } from '@/lib/bictorys/client';
import { initiateMonerooPayment } from '@/lib/moneroo/client';

import { getCountryPaymentConfig } from '@/lib/payment-methods';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié. Veuillez vous connecter.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { packageId, country = 'SN', paymentMode = 'mobile_money', paymentOperator } = body;

    const pkg = getCreditPackage(packageId);
    if (!pkg) {
      return NextResponse.json({ error: 'Pack de crédits invalide.' }, { status: 400 });
    }

    const countryConfig = getCountryPaymentConfig(country);
    const customerPhone =
      user.user_metadata?.phone || `${countryConfig.phonePrefix || '+221'}770000000`;

    // 1. Insert a pending purchase row BEFORE calling the payment provider
    const { data: purchase, error: insertError } = await supabase
      .from('credit_purchases')
      .insert({
        user_id: user.id,
        package_id: pkg.id,
        credits: pkg.credits,
        amount_total: pkg.amount,
        currency: pkg.currency || 'XOF',
        status: 'pending',
        provider: 'bictorys',
        metadata: {
          country,
          paymentMode,
          paymentOperator,
          userEmail: user.email,
        },
      })
      .select()
      .single();

    if (insertError || !purchase) {
      console.error('Error creating credit_purchases record:', insertError);
      return NextResponse.json(
        { error: "Impossible d'initialiser l'achat de crédits." },
        { status: 500 }
      );
    }

    const origin = request.nextUrl.origin;
    const returnUrl = `${origin}/settings?tab=credits&purchase=${purchase.id}&paymentStatus=success`;
    const cancelUrl = `${origin}/settings?tab=credits&purchase=${purchase.id}&paymentStatus=cancelled`;

    // Try Bictorys first
    const hasBictorysKey = Boolean(process.env.BICTORYS_API_KEY);
    let bictorysErrorMessage: string | null = null;

    if (hasBictorysKey) {
      const bictorysResult = await initiateBictorysPayment({
        amount: pkg.amount,
        currency: pkg.currency || 'XOF',
        description: `Vileads — ${pkg.credits} crédits (${pkg.label})`,
        reference: purchase.id,
        returnUrl,
        cancelUrl,
        customerEmail: user.email || '',
        customerName: user.user_metadata?.full_name || user.user_metadata?.name || 'Client Vileads',
        customerPhone,
        paymentCategory: paymentMode === 'card' ? 'card' : 'mobile_money',
        merchantCountry: ['SN', 'CI', 'ML', 'BF', 'BJ', 'TG'].includes(country?.toUpperCase())
          ? country.toUpperCase()
          : 'SN',
      });

      if (bictorysResult.ok) {
        await supabase
          .from('credit_purchases')
          .update({
            provider: 'bictorys',
            provider_transaction_id: bictorysResult.providerTransactionId,
            checkout_url: bictorysResult.checkoutUrl,
          })
          .eq('id', purchase.id);

        return NextResponse.json({
          success: true,
          checkoutUrl: bictorysResult.checkoutUrl,
          purchaseId: purchase.id,
          provider: 'bictorys',
        });
      } else {
        bictorysErrorMessage = bictorysResult.error;
        console.warn('Bictorys initiation failed, attempting Moneroo fallback:', bictorysResult.error);
      }
    }


    // Fallback to Moneroo if Bictorys is not available or failed
    if (process.env.MONEROO_SECRET_KEY) {
      let monerooResult = await initiateMonerooPayment({
        amount: pkg.amount,
        currency: pkg.currency || 'XOF',
        description: `Vileads — ${pkg.credits} crédits (${pkg.label})`,
        returnUrl,
        customerEmail: user.email || '',
        customerName: user.user_metadata?.full_name || user.user_metadata?.name,
        customerPhone,
        metadata: {
          paymentId: purchase.id,
          userId: user.id,
          packageId: pkg.id,
          country,
          paymentMode,
        },
      });

      // If Moneroo sandbox rejects XOF because currency is not activated in their test dashboard
      if (!monerooResult.ok && monerooResult.error?.includes('No payment methods enabled for this currency')) {
        console.log('Retrying Moneroo with USD fallback amount...');
        monerooResult = await initiateMonerooPayment({
          amount: pkg.amountUsd || Math.round(pkg.amount / 655) || 2,
          currency: 'USD',
          description: `Vileads — ${pkg.credits} crédits (${pkg.label})`,
          returnUrl,
          customerEmail: user.email || '',
          customerName: user.user_metadata?.full_name || user.user_metadata?.name,
          customerPhone,
          metadata: {
            paymentId: purchase.id,
            userId: user.id,
            packageId: pkg.id,
            country,
            paymentMode,
          },
        });
      }

      if (monerooResult.ok) {
        await supabase
          .from('credit_purchases')
          .update({
            provider: 'moneroo',
            provider_transaction_id: monerooResult.providerTransactionId,
            checkout_url: monerooResult.checkoutUrl,
          })
          .eq('id', purchase.id);

        return NextResponse.json({
          success: true,
          checkoutUrl: monerooResult.checkoutUrl,
          purchaseId: purchase.id,
          provider: 'moneroo',
        });
      } else {
        console.warn('Moneroo fallback failed:', monerooResult.error);
      }
    }



    const failureReason = bictorysErrorMessage || 'Échec de la passerelle de paiement. Veuillez vérifier vos clés API dans .env.local.';

    await supabase
      .from('credit_purchases')
      .update({ status: 'failed', error_message: failureReason })
      .eq('id', purchase.id);

    return NextResponse.json(
      {
        error: failureReason,
      },
      { status: 502 }
    );
  } catch (err: any) {
    console.error('Unexpected error in POST /api/credits/checkout:', err);
    return NextResponse.json(
      { error: err?.message || 'Erreur serveur inattendue lors de la commande.' },
      { status: 500 }
    );
  }
}

