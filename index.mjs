/**
 * English teacher panel — Host half.
 *
 * The panel itself lives in the browser half (`client.js`). This half owns the
 * two things a browser must not do: reading the plugin's own settings and
 * asking a model for an answer. It publishes one private RPC channel, so it
 * never touches the shared `/api` route (intercepting that route replaces its
 * fallback and takes the whole Web UI's API down with it).
 *
 * @module dsh-english-teacher
 */

import z from '@deepseek-ai/schemastery';

export const name = 'dsh-english-teacher';

/**
 * No module-level `inject`. Cordis treats every declared entry as *required*: a
 * service absent from this composition would leave the plugin pending forever —
 * no error, no RPC channel. Both services are therefore taken optionally inside
 * `apply`, and the handler reports a clear error if the model service never
 * arrives.
 */

/**
 * Settings schema. Every field is `.volatile()`, which is what makes it appear
 * on the settings page — a schema with no volatile field is skipped entirely
 * and gets no page. Volatile fields arrive here as live `Volatile<T>` handles
 * rather than plain values, so they are unwrapped at the boundary below.
 */
export const Config = z
  .object({
    provider: z.string().default('bailian').volatile(),
    model: z.string().default('deepseek-v4.1-flash').volatile(),
    maxTokens: z.number().default(1600).volatile(),
    temperature: z.number().default(0).volatile(),
    extraInstruction: z.string().default('').volatile(),
  })
  .description('English teacher panel: which provider and model answer, and how.');

/** Private RPC channel; deliberately not `/api`. */
const CHANNEL = '/dsh-english-teacher';

const VOLATILE_WRITE = Symbol.for('cosmokit.volatile.write');

/** Read a config field, unwrapping a live volatile handle when present. */
function plain(value) {
  return value !== null && typeof value === 'object' && VOLATILE_WRITE in value
    ? value.get()
    : value;
}

/** Resolve the plugin config into plain values, one field at a time. */
function resolveConfig(config) {
  const read = (field, fallback) => {
    const value = plain(config?.[field]);
    return value === undefined ? fallback : value;
  };
  return {
    provider: read('provider', 'bailian'),
    model: read('model', 'deepseek-v4.1-flash'),
    maxTokens: read('maxTokens', 1600),
    temperature: read('temperature', 0),
    extraInstruction: read('extraInstruction', ''),
  };
}

/**
 * The output contract. The model is asked for one JSON object so the four
 * columns stay separable; models that answer with prose still get parsed
 * tolerantly by {@link parseAnswer}.
 */
const INSTRUCTIONS = [
  'You are an experienced English teacher for a Chinese engineer.',
  'Read the input the user gives you. It is either English (check it) or Chinese (translate it).',
  'Answer with ONE JSON object and nothing else, using exactly these keys:',
  '{"grammar": "...", "corrected": "...", "common": "...", "professional": "..."}',
  '',
  'grammar: English input -> the issues found, each written as `original -> corrected` plus a short reason,',
  '         one per line, plain text, no markdown tables and no long lecture.',
  '         Chinese input -> leave an empty string here.',
  'corrected: the English sentence with the fixes applied; for Chinese input this is the faithful translation.',
  'common: how a native speaker would say it in everyday work talk.',
  'professional: the polished, formal version for documents, emails and reviews.',
  '',
  'Keep every value on one line where possible. Do not add extra keys. Do not explain the JSON.',
].join('\n');

/** Pull the visible text out of one stream chunk, tolerating shape drift. */
function chunkText(chunk) {
  if (chunk === null || typeof chunk !== 'object') return '';
  if (chunk.type === 'text-delta' || chunk.type === 'text') {
    return typeof chunk.text === 'string' ? chunk.text : typeof chunk.delta === 'string' ? chunk.delta : '';
  }
  return '';
}

/** Collect a whole completion for one prompt. */
async function complete(llm, cfg, prompt) {
  const options = {
    provider: cfg.provider,
    model: cfg.model,
    messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
  };
  if (Number.isFinite(cfg.maxTokens)) options.maxTokens = cfg.maxTokens;
  if (Number.isFinite(cfg.temperature)) options.temperature = cfg.temperature;

  let text = '';
  for await (const chunk of llm.stream(options)) text += chunkText(chunk);
  return text;
}

/**
 * Read the four columns out of a model answer.
 *
 * A strict-JSON model parses directly; a chatty one is recovered by taking the
 * outermost braces. When neither works the whole answer becomes `corrected`,
 * so the panel still shows something useful instead of an error box.
 */
function parseAnswer(raw) {
  const text = String(raw ?? '').trim();
  const cleaned = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      const parsed = JSON.parse(cleaned.slice(start, end + 1));
      const pick = (key) => (typeof parsed[key] === 'string' ? parsed[key].trim() : '');
      const answer = {
        grammar: pick('grammar'),
        corrected: pick('corrected'),
        common: pick('common'),
        professional: pick('professional'),
      };
      if (answer.corrected || answer.common || answer.professional || answer.grammar) return answer;
    } catch {
      /* fall through to the prose fallback */
    }
  }
  return { grammar: '', corrected: cleaned, common: '', professional: '' };
}

/** Turn `listProviders()` output into the catalog the settings page shows. */
function providerCatalog(providers) {
  if (!Array.isArray(providers)) return [];
  return providers.map((entry) => ({
    id: String(entry?.id ?? entry?.provider ?? entry?.name ?? ''),
    displayName: String(entry?.displayName ?? entry?.name ?? entry?.id ?? ''),
    models: Array.isArray(entry?.models)
      ? entry.models.map((model) => String(model?.id ?? model?.name ?? model)).filter(Boolean)
      : [],
  }));
}

/**
 * Model ids each route serves, read out of the settings namespaces that declare
 * them.
 *
 * Endpoint discovery only answers for providers pi-ai ships a catalog for; every
 * route this profile declares by hand — `bailian`, `hy-mt`, and the opencode-go
 * plugin's route — has no catalog, and discovery refuses them outright. Their
 * models are in configuration instead, in one of two shapes:
 *   - `{ providers: { <route>: { models: [{ id }] } } }` (the `llm-pi-ai` row)
 *   - `{ modelVisibility: { <modelId>: boolean } }` (the plugin's own row)
 */
function declaredModels(settings) {
  const byRoute = new Map();
  const byNamespace = new Map();
  if (typeof settings?.describe !== 'function') return { byRoute, byNamespace };

  let descriptors = [];
  try {
    descriptors = settings.describe({ redactSecrets: true }) || [];
  } catch {
    return { byRoute, byNamespace };
  }
  if (!Array.isArray(descriptors)) descriptors = [descriptors];

  for (const descriptor of descriptors) {
    const value = descriptor?.value;
    if (value === null || typeof value !== 'object') continue;

    const providers = value.providers;
    if (providers !== null && typeof providers === 'object') {
      for (const [route, profile] of Object.entries(providers)) {
        const ids = (profile?.models ?? [])
          .map((model) => (typeof model === 'string' ? model : model?.id))
          .filter(Boolean);
        if (ids.length) byRoute.set(route, ids);
      }
    }

    const visibility = value.modelVisibility;
    if (visibility !== null && typeof visibility === 'object') {
      const ids = Object.keys(visibility);
      if (ids.length) byNamespace.set(String(descriptor.ns), ids);
    }
  }
  return { byRoute, byNamespace };
}

/**
 * Resolve one live route to its model ids: an exact route match first, then the
 * namespace that names the route (`dsh-opencode-go` is declared by the
 * `opencode-go` row).
 */
function modelsForRoute(routeId, declared) {
  if (declared.byRoute.has(routeId)) return declared.byRoute.get(routeId);
  const match = [...declared.byNamespace.keys()].find(
    (ns) => routeId === ns || routeId.includes(ns) || ns.includes(routeId),
  );
  return match ? declared.byNamespace.get(match) : [];
}

/** The RPC surface: one endpoint per thing the panel asks for. */
function createHandler(getLlm, getSettings, getConfig) {
  return async (endpoint, payload) => {
    try {
      switch (endpoint) {
        case 'ping':
          return { ok: true, value: { ok: true } };

        case 'config':
          return { ok: true, value: getConfig() };

        case 'models': {
          const llm = getLlm();
          if (!llm) return { ok: false, error: { code: 'llm-unavailable', message: 'The model service is not available.', details: {} } };
          const providers = typeof llm.listProviders === 'function' ? llm.listProviders() : [];
          const declared = declaredModels(getSettings());
          const catalog = providerCatalog(await providers).map((entry) => ({
            ...entry,
            models: modelsForRoute(entry.id, declared),
          }));
          return { ok: true, value: { providers: catalog } };
        }

        case 'analyze': {
          const text = typeof payload?.text === 'string' ? payload.text.trim() : '';
          if (!text) return { ok: false, error: { code: 'empty-input', message: 'Nothing to check yet.', details: {} } };
          if (text.length > 8000) return { ok: false, error: { code: 'too-long', message: 'Input is longer than 8000 characters.', details: { length: text.length } } };

          const llm = getLlm();
          if (!llm) return { ok: false, error: { code: 'llm-unavailable', message: 'The model service is not available.', details: {} } };

          const cfg = getConfig();
          const extra = cfg.extraInstruction ? `\n\nAdditional instruction from the user's settings:\n${cfg.extraInstruction}` : '';
          const prompt = `${INSTRUCTIONS}${extra}\n\n---\nInput:\n${text}`;
          const started = Date.now();
          const raw = await complete(llm, cfg, prompt);
          return {
            ok: true,
            value: {
              ...parseAnswer(raw),
              provider: cfg.provider,
              model: cfg.model,
              elapsedMs: Date.now() - started,
            },
          };
        }

        default:
          return { ok: false, error: { code: 'not-found', message: `unknown endpoint: ${endpoint}`, details: {} } };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { ok: false, error: { code: 'failed', message: message.slice(0, 500), details: {} } };
    }
  };
}

export function apply(ctx, config) {
  const getConfig = () => resolveConfig(config);
  let llm = null;
  let settings = null;
  ctx.inject(['llm'], (scope) => {
    llm = scope.root.llm;
  });
  // Optional: without it the settings page simply cannot list declared models.
  ctx.inject(['settings'], (scope) => {
    settings = scope.root.settings;
  });
  // The root Context owns `connection` (a child scope does not), and the
  // dedicated registrar mounts the route through the Context that reads it.
  ctx.inject(['connection', 'webServer'], (scope) => {
    const connection = scope.root.connection;
    scope.effect(
      () => connection.rpc.handle(CHANNEL, createHandler(() => llm, () => settings, getConfig)),
      'dsh-english-teacher: RPC channel',
    );
  });
}


