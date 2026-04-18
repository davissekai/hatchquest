import Anthropic from "@anthropic-ai/sdk";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface LLMCallOptions {
  system: string;
  user: string;
  maxTokens: number;
  timeoutMs: number;
}

function provider(): "openrouter" | "anthropic" {
  return process.env.LLM_PROVIDER === "openrouter" ? "openrouter" : "anthropic";
}

export function llmModel(): string {
  if (provider() === "openrouter") {
    return process.env.LLM_MODEL ?? "google/gemma-3-27b-it:free";
  }
  return process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5";
}

async function callOpenRouter(opts: LLMCallOptions): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs);

  try {
    const res = await fetch(OPENROUTER_BASE_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: llmModel(),
        max_tokens: opts.maxTokens,
        messages: [
          { role: "system", content: opts.system },
          { role: "user", content: opts.user },
        ],
      }),
    });

    if (!res.ok) return null;
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return json.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function callAnthropic(opts: LLMCallOptions): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const client = new Anthropic({ apiKey, timeout: opts.timeoutMs, maxRetries: 0 });
  try {
    const msg = await client.messages.create({
      model: llmModel(),
      max_tokens: opts.maxTokens,
      system: opts.system,
      messages: [{ role: "user", content: opts.user }],
    });
    return msg.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim() || null;
  } catch {
    return null;
  }
}

/** Single entry point for all LLM calls in the backend.
 *  Switch provider by setting LLM_PROVIDER=openrouter + OPENROUTER_API_KEY.
 *  Defaults to Anthropic when LLM_PROVIDER is unset. */
export async function callLLM(opts: LLMCallOptions): Promise<string | null> {
  return provider() === "openrouter"
    ? callOpenRouter(opts)
    : callAnthropic(opts);
}
