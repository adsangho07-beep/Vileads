import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { startGooglePlacesScrape } from '@/lib/apify/client';
import { LEAD_SEARCH_CREDIT_COST } from '@/lib/credits';

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
    const { sector, city, country, max_results = 50 } = body;

    if (!sector?.trim() || !city?.trim()) {
      return NextResponse.json(
        { error: 'Le secteur d\'activité et la ville sont obligatoires.' },
        { status: 400 }
      );
    }

    const cleanSector = sector.trim();
    const cleanCity = city.trim();
    const cleanCountry = country?.trim() || null;
    const maxResults = Math.min(Math.max(Number(max_results) || 20, 5), 100);

    const isDemo = user.id === '00000000-0000-0000-0000-000000000001';

    if (isDemo) {
      const demoSearchId = `search-${Date.now()}`;
      const searchRecord = {
        id: demoSearchId,
        user_id: user.id,
        sector: cleanSector,
        city: cleanCity,
        country: cleanCountry,
        max_results: maxResults,
        status: 'pending' as const,
        apify_run_id: null,
        apify_dataset_id: null,
        error_message: null,
        created_at: new Date().toISOString(),
        started_at: null,
        finished_at: null,
      };

      const { addDemoSearch, updateDemoSearch, addDemoLeads } = await import('@/lib/demo');
      addDemoSearch(searchRecord);

      try {
        const apifyRun = await startGooglePlacesScrape({
          sector: cleanSector,
          city: cleanCity,
          country: cleanCountry,
          maxResults,
        });

        updateDemoSearch(demoSearchId, {
          status: 'running',
          apify_run_id: apifyRun.runId,
          apify_dataset_id: apifyRun.datasetId,
          started_at: new Date().toISOString(),
        });

        return NextResponse.json({
          success: true,
          searchId: demoSearchId,
          status: 'running',
          apifyRunId: apifyRun.runId,
        });
      } catch (apifyError: any) {
        console.warn('Apify scrape error in demo mode, generating simulated leads:', apifyError?.message);
        
        // Generate realistic mock leads for this query
        const simulatedLeads = [
          {
            id: `lead-${Date.now()}-1`,
            search_id: demoSearchId,
            user_id: user.id,
            place_id: `place-${Date.now()}-1`,
            name: `${cleanSector} Excellence`,
            category: cleanSector,
            address: `Centre-Ville, ${cleanCity}`,
            phone: '+221 77 000 11 22',
            website: `https://${cleanSector.toLowerCase().replace(/[^a-z0-9]/g, '')}-${cleanCity.toLowerCase()}.com`,
            rating: 4.8,
            reviews_count: 34,
            latitude: 14.69,
            longitude: -17.44,
            raw: {},
            created_at: new Date().toISOString(),
          },
          {
            id: `lead-${Date.now()}-2`,
            search_id: demoSearchId,
            user_id: user.id,
            place_id: `place-${Date.now()}-2`,
            name: `Grand ${cleanSector} Pro`,
            category: cleanSector,
            address: `Avenue Principale, ${cleanCity}`,
            phone: '+221 78 333 44 55',
            website: null,
            rating: 4.5,
            reviews_count: 19,
            latitude: 14.71,
            longitude: -17.46,
            raw: {},
            created_at: new Date().toISOString(),
          },
        ];

        addDemoLeads(simulatedLeads);
        updateDemoSearch(demoSearchId, {
          status: 'succeeded',
          finished_at: new Date().toISOString(),
        });

        return NextResponse.json({
          success: true,
          searchId: demoSearchId,
          status: 'succeeded',
        });
      }
    }

    // 1. Insert initial pending record
    let searchRecord: any = null;
    try {
      const { data, error: insertError } = await supabase
        .from('searches')
        .insert({
          user_id: user.id,
          sector: cleanSector,
          city: cleanCity,
          country: cleanCountry,
          max_results: maxResults,
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) throw insertError;
      searchRecord = data;
    } catch (insertError) {
      console.error('Error creating search record in Supabase:', insertError);
      return NextResponse.json(
        { error: 'Impossible d\'initialiser la recherche en base de données.' },
        { status: 500 }
      );
    }

    // 2. Consume credits for this search. The search row already exists so we
    //    can reference it in the ledger, and can be deleted if credits are insufficient.
    const { error: creditError } = await supabase.rpc('consume_credits', {
      p_amount: LEAD_SEARCH_CREDIT_COST,
      p_reference_type: 'search',
      p_reference_id: searchRecord.id,
      p_description: `Recherche ${cleanSector} / ${cleanCity}`,
    });

    if (creditError) {
      await supabase.from('searches').delete().eq('id', searchRecord.id);

      if (creditError.message?.includes('INSUFFICIENT_CREDITS')) {
        return NextResponse.json(
          {
            error: `Crédits insuffisants. Cette recherche coûte ${LEAD_SEARCH_CREDIT_COST} crédits.`,
            code: 'INSUFFICIENT_CREDITS',
          },
          { status: 402 }
        );
      }

      console.error('Error consuming credits:', creditError);
      return NextResponse.json({ error: 'Impossible de débiter vos crédits.' }, { status: 500 });
    }

    // 3. Start Apify Actor asynchronously
    try {
      const apifyRun = await startGooglePlacesScrape({
        sector: cleanSector,
        city: cleanCity,
        country: cleanCountry,
        maxResults,
      });

      const adminClient = createAdminClient();
      await adminClient
        .from('searches')
        .update({
          status: 'running',
          apify_run_id: apifyRun.runId,
          apify_dataset_id: apifyRun.datasetId,
          started_at: new Date().toISOString(),
        })
        .eq('id', searchRecord.id);

      return NextResponse.json({
        success: true,
        searchId: searchRecord.id,
        status: 'running',
        apifyRunId: apifyRun.runId,
      });
    } catch (apifyError: any) {
      console.error('Apify Start Error:', apifyError);

      const adminClient = createAdminClient();
      await adminClient
        .from('searches')
        .update({
          status: 'failed',
          error_message: apifyError?.message || 'Erreur lors du démarrage du scraper Apify.',
          finished_at: new Date().toISOString(),
        })
        .eq('id', searchRecord.id);

      // Refund the credits since the scrape never actually started.
      await adminClient.rpc('add_credits', {
        p_user_id: user.id,
        p_amount: LEAD_SEARCH_CREDIT_COST,
        p_type: 'refund',
        p_reference_type: 'search',
        p_reference_id: searchRecord.id,
        p_description: 'Remboursement — échec du lancement du scraping Apify',
      });

      return NextResponse.json(
        {
          error: `Échec du lancement du scraping : ${apifyError?.message || 'Erreur Apify'}`,
          searchId: searchRecord.id,
          status: 'failed',
        },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error('Unexpected error in POST /api/searches:', err);
    return NextResponse.json(
      { error: err?.message || 'Erreur serveur inattendue' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { data: searches, error } = await supabase
      .from('searches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ searches: searches || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
