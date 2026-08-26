import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  getScrapeRunStatus,
  getScrapeDatasetItems,
  normalizeApifyPlace,
} from '@/lib/apify/client';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchId = params.id;
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // 1. Fetch current search from DB
    const { data: search, error: fetchError } = await supabase
      .from('searches')
      .select('*')
      .eq('id', searchId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !search) {
      return NextResponse.json({ error: 'Recherche introuvable' }, { status: 404 });
    }

    // If search is already succeeded or failed, fetch leads and return
    if (search.status === 'succeeded' || search.status === 'failed') {
      const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .eq('search_id', searchId)
        .order('created_at', { ascending: true });

      return NextResponse.json({
        search,
        leads: leads || [],
      });
    }

    // If search is pending or running, check Apify run
    if (!search.apify_run_id) {
      return NextResponse.json({ search, leads: [] });
    }

    const adminClient = createAdminClient();

    try {
      const run = await getScrapeRunStatus(search.apify_run_id);
      const runStatus = run.status; // 'READY' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'TIMED-OUT' | 'ABORTED'

      if (runStatus === 'SUCCEEDED') {
        const datasetId = run.defaultDatasetId || search.apify_dataset_id;
        let normalizedLeads: any[] = [];

        if (datasetId) {
          const rawItems = await getScrapeDatasetItems(datasetId, search.max_results || 100);
          normalizedLeads = rawItems.map((item: any) => {
            const normalized = normalizeApifyPlace(item);
            return {
              search_id: search.id,
              user_id: user.id,
              place_id: normalized.place_id,
              name: normalized.name,
              category: normalized.category,
              address: normalized.address,
              phone: normalized.phone,
              website: normalized.website,
              rating: normalized.rating,
              reviews_count: normalized.reviews_count,
              latitude: normalized.latitude,
              longitude: normalized.longitude,
              raw: normalized.raw,
            };
          });

          // Filter duplicates within the current dataset by place_id if present
          const uniqueLeadsMap = new Map<string, any>();
          normalizedLeads.forEach((lead, index) => {
            const key = lead.place_id || `lead_idx_${index}`;
            if (!uniqueLeadsMap.has(key)) {
              uniqueLeadsMap.set(key, lead);
            }
          });
          const deduplicatedLeads = Array.from(uniqueLeadsMap.values());

          if (deduplicatedLeads.length > 0) {
            const { error: upsertError } = await adminClient
              .from('leads')
              .upsert(deduplicatedLeads, {
                onConflict: 'search_id,place_id',
                ignoreDuplicates: false,
              });

            if (upsertError) {
              console.error('Error upserting leads:', upsertError);
            }
          }
        }

        // Update search status to succeeded
        await adminClient
          .from('searches')
          .update({
            status: 'succeeded',
            finished_at: new Date().toISOString(),
          })
          .eq('id', search.id);

        const { data: savedLeads } = await supabase
          .from('leads')
          .select('*')
          .eq('search_id', searchId)
          .order('created_at', { ascending: true });

        return NextResponse.json({
          search: {
            ...search,
            status: 'succeeded',
            finished_at: new Date().toISOString(),
          },
          leads: savedLeads || [],
        });
      }

      if (['FAILED', 'TIMED-OUT', 'ABORTED'].includes(runStatus)) {
        const errorMsg = `Le scraping Apify a échoué avec le statut : ${runStatus}`;
        await adminClient
          .from('searches')
          .update({
            status: 'failed',
            error_message: errorMsg,
            finished_at: new Date().toISOString(),
          })
          .eq('id', search.id);

        return NextResponse.json({
          search: {
            ...search,
            status: 'failed',
            error_message: errorMsg,
          },
          leads: [],
        });
      }

      // Still running or ready
      return NextResponse.json({
        search: {
          ...search,
          status: 'running',
        },
        leads: [],
      });
    } catch (apifyPollError: any) {
      console.error('Error checking Apify run status:', apifyPollError);
      return NextResponse.json({ search, leads: [] });
    }
  } catch (err: any) {
    console.error('Unexpected error in GET /api/searches/[id]/status:', err);
    return NextResponse.json(
      { error: err?.message || 'Erreur interne' },
      { status: 500 }
    );
  }
}
