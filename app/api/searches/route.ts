import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { startGooglePlacesScrape } from '@/lib/apify/client';

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

    // TODO: quota check here (e.g. check user credits / active subscription)

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

    // 1. Insert initial pending record
    const { data: searchRecord, error: insertError } = await supabase
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

    if (insertError || !searchRecord) {
      console.error('Error creating search record:', insertError);
      return NextResponse.json(
        { error: 'Impossible d\'initialiser la recherche en base de données.' },
        { status: 500 }
      );
    }

    // 2. Start Apify Actor asynchronously
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
