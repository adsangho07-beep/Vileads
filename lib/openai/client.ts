import OpenAI from 'openai';

export function getOpenAIClient() {
  const apiKey =
    process.env.GROQ_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    '';

  const baseURL =
    process.env.OPENAI_BASE_URL ||
    (process.env.GROQ_API_KEY ? 'https://api.groq.com/openai/v1' : undefined) ||
    (process.env.GEMINI_API_KEY ? 'https://generativelanguage.googleapis.com/v1beta/openai/' : undefined);

  return new OpenAI({
    apiKey: apiKey || 'dummy-key',
    baseURL,
  });
}

export function getDefaultModel(): string {
  if (process.env.OPENAI_MODEL) {
    return process.env.OPENAI_MODEL;
  }
  if (process.env.GROQ_API_KEY) {
    return 'llama-3.3-70b-versatile';
  }
  if (process.env.GEMINI_API_KEY) {
    return 'gemini-1.5-flash';
  }
  return 'gpt-4o-mini';
}
