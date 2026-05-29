import Anthropic from '@anthropic-ai/sdk';
import { MAHARI_SYSTEM_PROMPT, LOW_DATA_ADDENDUM } from './prompts';
import type { AiAnonymizedPayload, AiClaudeResponse } from '@/lib/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const MODEL         = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';
const MAX_RETRIES   = parseInt(process.env.AI_MAX_RETRIES ?? '3', 10);
const CONF_THRESHOLD = parseFloat(process.env.AI_CONFIDENCE_THRESHOLD ?? '0.60');
const RETRY_DELAYS  = [5_000, 15_000, 30_000]; // ms

/**
 * Calls Claude API with Mahari's governed system prompt.
 * Retries on transient failures. Returns structured response.
 *
 * NEVER called from client-side code — only from Next.js API routes.
 */
export async function callClaudeForCapability(
  payload: AiAnonymizedPayload,
  totalAssessments: number
): Promise<AiClaudeResponse & { lowConfidenceFlag: boolean }> {
  const systemPrompt = totalAssessments < 3
    ? `${MAHARI_SYSTEM_PROMPT}\n\n${LOW_DATA_ADDENDUM}`
    : MAHARI_SYSTEM_PROMPT;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(RETRY_DELAYS[attempt - 1] ?? 30_000);
    }

    try {
      const response = await anthropic.messages.create({
        model:      MODEL,
        max_tokens: 1024,
        system:     systemPrompt,
        messages:   [{ role: 'user', content: JSON.stringify(payload) }],
      });

      const block = response.content[0];
      if (!block || block.type !== 'text') {
        throw new Error('Unexpected response type from Claude API');
      }

      const parsed = parseClaudeResponse(block.text);
      return {
        ...parsed,
        lowConfidenceFlag: parsed.confidence < CONF_THRESHOLD,
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Don't retry on authentication or quota errors
      if (lastError.message.includes('401') || lastError.message.includes('403')) {
        throw lastError;
      }
    }
  }

  throw new Error(`Claude API unavailable after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}

function parseClaudeResponse(text: string): AiClaudeResponse {
  // Strip any accidental markdown code fences
  const clean = text.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();

  try {
    const obj = JSON.parse(clean) as Partial<AiClaudeResponse>;

    if (typeof obj.content !== 'string' || obj.content.length < 20) {
      throw new Error('Invalid content in Claude response');
    }

    return {
      type:        obj.type === 'ability_signature' ? 'ability_signature' : 'capability_insight',
      content:     obj.content,
      confidence:  typeof obj.confidence === 'number'
        ? Math.max(0, Math.min(1, obj.confidence))
        : 0.4,
      keyDomains:  Array.isArray(obj.keyDomains) ? obj.keyDomains : [],
    };
  } catch {
    // Fallback: extract text if JSON parse fails (graceful degradation)
    return {
      type:        'capability_insight',
      content:     clean.slice(0, 500),
      confidence:  0.4,
      keyDomains:  [],
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
