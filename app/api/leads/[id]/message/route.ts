import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOpenAIClient, getDefaultModel } from '@/lib/openai/client';
import { buildProspectionPrompt, generateFallbackProspectionMessage } from '@/lib/prompts';
import { MessageChannel, MessageTone } from '@/types/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leadId = params.id;
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { getDemoLead, addDemoMessage, getDemoMessagesForLead } = await import('@/lib/demo');
    const isDemo = user.id === '00000000-0000-0000-0000-000000000001';

    // 1. Fetch and verify ownership of the lead
    let lead: any = isDemo ? getDemoLead(leadId) : null;
    if (!lead) {
      const { data, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .eq('user_id', user.id)
        .single();

      if (leadError || !data) {
        // Fallback search in demo store
        lead = getDemoLead(leadId);
        if (!lead) {
          return NextResponse.json({ error: 'Lead introuvable ou accès non autorisé.' }, { status: 404 });
        }
      } else {
        lead = data;
      }
    }

    // TODO: quota check here (e.g. check user AI credits)

    const body = await request.json();
    const language: 'fr' | 'en' = body.language === 'en' ? 'en' : 'fr';
    const channel: MessageChannel = ['whatsapp', 'email', 'sms'].includes(body.channel)
      ? body.channel
      : 'whatsapp';
    const tone: MessageTone = ['professional', 'direct', 'friendly', 'persuasive'].includes(body.tone)
      ? body.tone
      : 'professional';

    let generatedContent = '';
    let usedModel = getDefaultModel();

    // 2. Try generating via AI provider (Groq / Gemini / OpenAI)
    try {
      const openai = getOpenAIClient();
      const { systemPrompt, userPrompt } = buildProspectionPrompt({
        lead,
        language,
        channel,
        tone,
      });

      const completion = await openai.chat.completions.create({
        model: usedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: tone === 'friendly' || tone === 'persuasive' ? 0.75 : 0.6,
        max_tokens: channel === 'sms' ? 100 : 400,
      });

      generatedContent = completion.choices[0]?.message?.content?.trim() || '';
    } catch (aiErr: any) {
      console.warn('AI API call failed. Using tailored template engine:', aiErr?.message);
      // Seamless Fallback
      generatedContent = generateFallbackProspectionMessage({
        lead,
        language,
        channel,
        tone,
      });
      usedModel = 'smart-template-engine';
    }

    if (!generatedContent) {
      generatedContent = generateFallbackProspectionMessage({
        lead,
        language,
        channel,
        tone,
      });
      usedModel = 'smart-template-engine';
    }

    // 3. Save to public.messages (append-only)
    const newMessageObj = {
      id: `msg-${Date.now()}`,
      lead_id: lead.id,
      user_id: user.id,
      language,
      channel,
      tone,
      content: generatedContent,
      model: usedModel,
      created_at: new Date().toISOString(),
    };

    if (isDemo) {
      addDemoMessage(newMessageObj);
    } else {
      try {
        await supabase.from('messages').insert({
          lead_id: lead.id,
          user_id: user.id,
          language,
          channel,
          tone,
          content: generatedContent,
          model: usedModel,
        });
      } catch (err) {
        addDemoMessage(newMessageObj);
      }
    }

    return NextResponse.json({
      success: true,
      message: newMessageObj,
    });
  } catch (err: any) {
    console.error('Error in POST /api/leads/[id]/message:', err);
    return NextResponse.json(
      { error: err?.message || 'Erreur lors de la génération du message' },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leadId = params.id;
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('lead_id', leadId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
