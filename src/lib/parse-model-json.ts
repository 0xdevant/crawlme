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
 * First ```…``` block containing `{` wins — avoids failing when the model puts prose or an empty
 * fence before the real JSON block.
 */
function firstFenceBlockContainingBrace(text: string): string | null {
  const re = /```(?:json)?\s*([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const inner = m[1].trim();
    if (inner.includes("{")) return inner;
  }
  return null;
}

function normalizeModelText(text: string): string {
  return text.replace(/\uFEFF/g, "").trim();
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
  const raw = normalizeModelText(text);
  if (!raw) {
    throw new Error(
      "Model output was empty — try again, shorten the URL / fewer extra pages, or switch VENICE_MODEL.",
    );
  }

  let s = stripCodeFence(raw);
  if (s.indexOf("{") < 0) {
    const fromFence = firstFenceBlockContainingBrace(raw);
    if (fromFence) s = fromFence;
  }
  if (s.indexOf("{") < 0) {
    const idx = raw.indexOf("{");
    if (idx >= 0) s = raw.slice(idx);
  }

  const start = s.indexOf("{");
  if (start < 0) {
    const preview = raw.length > 500 ? `${raw.slice(0, 500)}…` : raw;
    const head = raw.trimStart().slice(0, 1);
    const hint =
      head === "["
        ? " (output starts with `[` — expected a JSON object `{…}`, not an array.)"
        : "";
    throw new Error(
      `Model output did not contain a JSON object${hint}. len=${raw.length} preview=${JSON.stringify(preview)}`,
    );
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
