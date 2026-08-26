import { DbLead, MessageChannel, MessageTone } from '@/types/db';

export interface PromptContext {
  lead: Partial<DbLead>;
  language: 'fr' | 'en';
  channel?: MessageChannel;
  tone?: MessageTone;
  senderRole?: string;
  valueProposition?: string;
}

export function buildProspectionPrompt({
  lead,
  language,
  channel = 'whatsapp',
  tone = 'professional',
}: PromptContext): { systemPrompt: string; userPrompt: string } {
  const isFrench = language === 'fr';

  // Instructions by channel
  const channelInstructions = {
    whatsapp: isFrench
      ? `CANAL : WhatsApp. Rédige un message court, moderne et direct, avec quelques emojis professionnels (ex: 👋, 🚀, 🤝). Format adapté à la lecture sur smartphone. Pas d'objet, va droit au but.`
      : `CHANNEL: WhatsApp. Write a short, engaging, modern message with discrete professional emojis (e.g. 👋, 🚀, 🤝). Mobile-friendly paragraph spacing. No subject line.`,
    email: isFrench
      ? `CANAL : Email professionnel. Inclus impérativement une ligne "Objet: [Objet percutant]" au tout début, suivie du corps de l'email bien structuré avec salutations et signature.`
      : `CHANNEL: Cold Email. Start strictly with a line "Subject: [Compelling Subject]" followed by a well-structured email body with proper greeting and sign-off.`,
    sms: isFrench
      ? `CANAL : SMS. Message ULTRA-CONCIS (maximum 160 caractères ou ~25 mots), direct et percutant avec CTA clair.`
      : `CHANNEL: SMS. ULTRA-COMPACT message (maximum 160 characters or ~25 words), punchy value proposition with immediate CTA.`,
  };

  // Instructions by tone
  const toneInstructions = {
    professional: isFrench
      ? `TON : Professionnel, courtois, respectueux et institutionnel (vouvoiement irréprochable).`
      : `TONE: Professional, courteous, respectful and consultative.`,
    direct: isFrench
      ? `TON : Direct, percutant, concis et axé sur les résultats concrets.`
      : `TONE: Direct, concise, no fluff, straight to the bottom-line value.`,
    friendly: isFrench
      ? `TON : Chaleureux, convivial, accessible et enthousiaste (très adapté aux échanges business WhatsApp en Afrique).`
      : `TONE: Warm, friendly, approachable, relational and engaging.`,
    persuasive: isFrench
      ? `TON : Commercial persuasif, orienté retour sur investissement (ROI), croissance et gain de temps/clients.`
      : `TONE: High-converting, persuasive, focused on ROI, client acquisition and growth.`,
  };

  const systemPrompt = isFrench
    ? `Tu es un expert d'élite en prospection commerciale B2B et B2C, spécialisé dans les marchés africains et internationaux.
Règles strictes :
1. ${channelInstructions[channel]}
2. ${toneInstructions[tone]}
3. Ne JAMAIS inventer de faux faits, partenariats imaginaires ou prix fictifs.
4. Personnalise le message avec le nom de l'entreprise, son secteur et sa localisation.
5. Termine par un appel à l'action (CTA) clair (ex: échange rapide de 5-10 min).
6. Respecte la langue demandée.`
    : `You are an elite sales outreach and copywriter specialized in African and global markets.
Strict rules:
1. ${channelInstructions[channel]}
2. ${toneInstructions[tone]}
3. NEVER make up unprovided facts or fake testimonials.
4. Personalize strictly with the business name, category, and city/country.
5. Conclude with a low-friction Call To Action (e.g. 5-minute chat).
6. Match the specified language.`;

  const leadDetails = [
    `Nom de l'entreprise : ${lead.name || 'Entreprise'}`,
    lead.category ? `Secteur / Catégorie : ${lead.category}` : null,
    lead.address ? `Adresse / Ville : ${lead.address}` : null,
    lead.website ? `Site web : ${lead.website}` : null,
    lead.rating ? `Note Google : ${lead.rating}/5 (${lead.reviews_count || 0} avis)` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const userPrompt = isFrench
    ? `Prospect ciblé :\n${leadDetails}\n\nCanal: ${channel.toUpperCase()} | Ton: ${tone.toUpperCase()}\nRédige le message sur-mesure en français.`
    : `Targeted Lead:\n${leadDetails}\n\nChannel: ${channel.toUpperCase()} | Tone: ${tone.toUpperCase()}\nWrite the tailored outreach message in English.`;

  return { systemPrompt, userPrompt };
}

/**
 * Intelligent fallback message generator by channel & tone
 */
export function generateFallbackProspectionMessage({
  lead,
  language,
  channel = 'whatsapp',
  tone = 'professional',
}: PromptContext): string {
  const isEn = language === 'en';
  const company = lead.name || (isEn ? 'your business' : 'votre établissement');
  const category = lead.category || (isEn ? 'your industry' : 'votre secteur');
  const city = lead.address ? lead.address.split(',')[0] : '';

  // SMS Channel
  if (channel === 'sms') {
    if (isEn) {
      return `Hi ${company}! We help ${category} in ${city} attract more clients every month. Open to a 5-min chat this week? Best,`;
    }
    return `Bonjour ${company} ! Nous aidons les spécialistes en ${category.toLowerCase()} à ${city} à générer + de clients qualifiés. Dispo pour 5 min d'échange cette semaine ?`;
  }

  // Email Channel
  if (channel === 'email') {
    if (isEn) {
      return `Subject: Partnership & Growth for ${company}

Hello Team ${company},

I came across ${company} ${city ? `in ${city}` : ''} and wanted to reach out regarding your presence in ${category}.

We help dynamic businesses like yours scale customer acquisition and streamline digital client engagement across key target markets.

Would you be open to a brief 10-minute discovery call this Thursday or Friday to explore if we can add value to your current goals?

Best regards,
Lead Generation Team`;
    }
    return `Objet : Opportunité de développement pour ${company}

Bonjour à toute l'équipe de ${company},

Je découvre votre activité ${city ? `à ${city}` : ''} et tenais à vous saluer pour votre positionnement dans le domaine : ${category.toLowerCase()}.

Nous accompagnons les entreprises de référence comme ${company} pour accélérer l'acquisition de nouveaux clients et optimiser leur visibilité commerciale.

Seriez-vous disponible pour un court échange téléphonique de 10 minutes cette semaine afin d'échanger sur vos objectifs de croissance ?

Bien cordialement,
L'équipe Vileads`;
  }

  // WhatsApp Channel (Default)
  if (tone === 'friendly') {
    if (isEn) {
      return `Hello ${company} team! 👋

I noticed your great work in ${category} ${city ? `in ${city}` : ''} and wanted to connect! 🚀

We help businesses like ${company} get more high-value inquiries and boost their sales directly through digital outreach. 

Would you be free for a quick 5-min chat on WhatsApp this week? 🤝`;
    }
    return `Bonjour à l'équipe de ${company} ! 👋

Je découvre votre superbe travail dans le domaine ${category.toLowerCase()} ${city ? `à ${city}` : ''} et je tenais à vous féliciter ! ✨

Nous aidons les entreprises comme la vôtre à attirer plus de clients qualifiés chaque mois grâce à des stratégies d'acquisition ciblées. 🚀

Seriez-vous partant(e) pour un rapide échange de 5 minutes ici sur WhatsApp cette semaine ? 🤝`;
  }

  if (tone === 'direct') {
    if (isEn) {
      return `Hello ${company},

We specialize in bringing new qualified customers to ${category} companies ${city ? `in ${city}` : ''}.

Are you currently looking to expand your client pipeline this quarter? Let's connect for 5 minutes.`;
    }
    return `Bonjour ${company},

Nous aidons directement les acteurs du secteur ${category.toLowerCase()} ${city ? `à ${city}` : ''} à augmenter leur flux de clients qualifiés.

Cherchez-vous à développer votre portefeuille ce mois-ci ? Disponible pour 5 min d'échange ?`;
  }

  if (tone === 'persuasive') {
    if (isEn) {
      return `Hello Team ${company} 👋,

Your expertise in ${category} has huge potential to capture additional market share ${city ? `in ${city}` : ''}.

We provide proven outbound lead generation systems that help businesses like yours generate high-ROI leads predictably.

Can we set up a quick 10-minute call this week to show you how? 📈`;
    }
    return `Bonjour à l'équipe de ${company} 👋,

Votre savoir-faire dans le secteur ${category.toLowerCase()} ${city ? `à ${city}` : ''} possède un fort potentiel de croissance inexploité.

Nous mettons en place des leviers d'acquisition ciblés qui permettent aux entreprises comme la vôtre de générer des opportunités commerciales régulières à fort ROI. 📈

Seriez-vous ouvert(e) à un bref appel de 10 minutes cette semaine pour en discuter ? 🚀`;
  }

  // WhatsApp - Professional default
  if (isEn) {
    return `Hello Team ${company},

I hope this message finds you well. I came across your business ${city ? `in ${city}` : ''} and was impressed by your profile in ${category}.

We assist companies like ${company} in growing their client base and maximizing their commercial reach across regional markets.

Would you be open to a quick 10-minute conversation this week to discuss potential collaboration?

Best regards,`;
  }

  return `Bonjour à toute l'équipe de ${company},

J'espère que vous allez bien. Je découvre votre activité ${city ? `à ${city}` : ''} et tenais à vous féliciter pour la qualité de votre présence dans le secteur ${category.toLowerCase()}.

Nous accompagnons les entreprises ambitieuses comme ${company} pour accélérer l'acquisition de nouveaux clients et développer leur visibilité commerciale.

Seriez-vous disponible pour un bref échange de 10 minutes cette semaine ?

Bien cordialement,`;
}
