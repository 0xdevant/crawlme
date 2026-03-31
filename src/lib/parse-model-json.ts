import { jsonrepair } from "jsonrepair";

/** Strip optional ``` / ```json fences (LLMs often wrap JSON). */
function stripCodeFence(text: string): string {
  const t = text.trim();
  const full = /^```(?:json)?\s*\r?\n?([\s\S]*?)\r?\n?```$/m.exec(t);
  if (full) return full[1].trim();
  const inner = /```(?:json)?\s*\r?\n?([\s\S]*?)```/.exec(t);
  if (inner) return inner[1].trim();
  return t;
}

/**
 * Extract first top-level `{ … }` using string-aware brace matching (so `}` inside strings does not truncate).
 * Returns null if there is no closing brace (e.g. truncated output).
 */
function extractBalancedObject(src: string, start: number): string | null {
  if (src[start] !== "{") return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (inString) {
      if (c === "\\") escape = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  return null;
}

function extractFirstJsonObjectBlob(text: string): string {
  const s = stripCodeFence(text);
  const start = s.indexOf("{");
  if (start < 0) {
    throw new Error("Model output did not contain a JSON object");
  }
  const balanced = extractBalancedObject(s, start);
  if (balanced) return balanced;
  return s.slice(start);
}

/**
 * Parse model output that should be a single JSON object: tolerates markdown fences,
 * unescaped newlines in strings, minor truncation, and other common LLM JSON mistakes
 * via `jsonrepair`.
 */
export function parseModelJsonObject(text: string): Record<string, unknown> {
  const blob = extractFirstJsonObjectBlob(text);
  let repaired: string;
  try {
    repaired = jsonrepair(blob);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Model JSON could not be repaired: ${msg}`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(repaired);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Model JSON parse failed after repair: ${msg}`);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Model output was not a JSON object");
  }
  return parsed as Record<string, unknown>;
}
