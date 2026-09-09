/**
 * Builds a Postman collection out of the route files themselves.
 *
 *   npm run postman
 *
 * A generator rather than a hand-kept JSON because the API is two hundred-odd
 * endpoints across thirty-odd modules: a collection typed out once is accurate
 * for a week and then it is a second source of truth quietly disagreeing with
 * the routes. Re-run this after changing a route and the collection catches up.
 *
 * ── On the example bodies ──────────────────────────────────────────────────
 *
 * The first version of this read the validation files as text and picked field
 * names out with a regular expression. It produced bodies that were partly
 * invented: `PATCH /:id/status` came out as `{ status, update }`, and `update`
 * is not a field — it was the name of the neighbouring schema, caught by a
 * pattern that could not tell code from prose. A wrong field name in an example
 * is worse than no example, because it is followed.
 *
 * So the schemas are imported and walked instead. Zod knows exactly what it
 * accepts — the field names, the types, which are optional, what an enum's
 * values are — and asking it is both simpler and incapable of inventing
 * anything.
 */
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

const HERE = __dirname;
const ROOT = path.resolve(HERE, "..");
const MODULES = path.join(ROOT, "src/app/modules");
const INDEX = path.join(ROOT, "src/app/routes/index.ts");

/* ── 1. Where each router is mounted ─────────────────────────────────────── */

const indexSrc = fs.readFileSync(INDEX, "utf8");

const importedFrom = new Map<string, string>();
for (const m of indexSrc.matchAll(
  /import\s+(?:\{\s*(\w+)\s*\}|(\w+))\s+from\s+"\.\.\/modules\/([^"]+)"/g,
)) {
  importedFrom.set((m[1] ?? m[2]) as string, m[3]);
}

const mounts: { base: string; file: string }[] = [];
for (const m of indexSrc.matchAll(/path:\s*"([^"]+)"\s*,\s*route:\s*(\w+)/g)) {
  const file = importedFrom.get(m[2]);
  if (file) mounts.push({ base: m[1], file: path.join(MODULES, `${file}.ts`) });
}

/* ── 2. Example bodies, asked of the schemas themselves ──────────────────── */

/** A value that satisfies this field, chosen to be obviously a placeholder. */
const exampleFor = (schema: z.ZodTypeAny, field: string, depth = 0): unknown => {
  // Unwrap the layers that only add rules: .optional(), .default(), .nullable().
  const def = (schema as { _def?: Record<string, unknown> })._def ?? {};
  const inner = (def.innerType ?? def.schema ?? def.type) as
    | z.ZodTypeAny
    | undefined;

  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable)
    return exampleFor(schema.unwrap(), field, depth);
  if (schema instanceof z.ZodDefault) return schema._def.defaultValue();
  if (schema instanceof z.ZodEffects)
    return exampleFor(schema.innerType(), field, depth);

  if (schema instanceof z.ZodEnum) return schema.options[0];
  if (schema instanceof z.ZodNativeEnum)
    return Object.values(schema.enum as Record<string, unknown>)[0];
  if (schema instanceof z.ZodLiteral) return schema.value;
  if (schema instanceof z.ZodUnion)
    return exampleFor(schema.options[0] as z.ZodTypeAny, field, depth);

  if (schema instanceof z.ZodNumber) return 0;
  if (schema instanceof z.ZodBoolean) return true;
  if (schema instanceof z.ZodDate) return "2026-01-01";

  if (schema instanceof z.ZodArray) {
    if (depth > 2) return [];
    return [exampleFor(schema.element, field, depth + 1)];
  }

  if (schema instanceof z.ZodObject) {
    if (depth > 2) return {};
    return shapeToExample(schema, depth + 1);
  }
  if (schema instanceof z.ZodRecord) return {};

  if (schema instanceof z.ZodString) {
    const f = field.toLowerCase();
    if (f.includes("email")) return "someone@example.com";
    if (f.includes("password")) return "12345678";
    if (f.includes("phone") || f.includes("mobile")) return "01700000000";
    if (f.endsWith("id") || f.endsWith("ids")) return "<objectId>";
    if (f.includes("date") || f.endsWith("at")) return "2026-01-01";
    if (f.includes("url") || f.includes("link")) return "https://example.com";
    return `<${field}>`;
  }

  if (inner) return exampleFor(inner, field, depth);
  return null;
};

const shapeToExample = (schema: z.ZodObject<z.ZodRawShape>, depth = 0) => {
  const out: Record<string, unknown> = {};
  for (const [field, child] of Object.entries(schema.shape)) {
    out[field] = exampleFor(child as z.ZodTypeAny, field, depth);
  }
  return out;
};

/**
 * Peels a body schema down to the object underneath it.
 *
 * Half of these are not plain objects: a create schema usually ends
 * `.refine(...)` to check something across fields — that instalments add up to
 * the fee, that the end date is not before the start — and a refine wraps the
 * object in a `ZodEffects`. Testing for `ZodObject` alone missed eleven
 * endpoints, and they were the interesting ones: creating a listing, a project, an
 * exam, a notice. Exactly the requests somebody opens Postman to try.
 */
const toObject = (
  schema: z.ZodTypeAny | undefined,
  depth = 0,
): z.ZodObject<z.ZodRawShape> | null => {
  if (!schema || depth > 6) return null;
  if (schema instanceof z.ZodObject) return schema;
  if (schema instanceof z.ZodEffects)
    return toObject(schema.innerType(), depth + 1);
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable)
    return toObject(schema.unwrap() as z.ZodTypeAny, depth + 1);
  if (schema instanceof z.ZodDefault)
    return toObject(schema._def.innerType as z.ZodTypeAny, depth + 1);
  return null;
};

/** Cache: one require per file, however many routes come from it. */
const moduleCache = new Map<string, Record<string, unknown> | null>();

const loadModule = (file: string) => {
  if (moduleCache.has(file)) return moduleCache.get(file);
  let loaded: Record<string, unknown> | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    loaded = require(file) as Record<string, unknown>;
  } catch (err) {
    // Reported rather than swallowed: a file that will not load is a gap in the
    // collection, and a silent gap is the failure this generator exists to
    // avoid.
    console.warn(
      `  ! could not load ${path.basename(file)}: ${
        (err as Error).message.split(String.fromCharCode(10))[0]
      }`,
    );
  }
  moduleCache.set(file, loaded);
  return loaded;
};

const loadValidation = (moduleDir: string) => {
  const file = fs
    .readdirSync(moduleDir)
    .find((f) => f.endsWith(".validation.ts"));
  return file ? loadModule(path.join(moduleDir, file)) : null;
};

/** `propertyValidation.create` → an example body, or null if there is no schema. */
const bodyFor = (moduleDir: string, ref: string | null, routeFile?: string) => {
  if (!ref) return null;
  const [namespace, key] = ref.split(".");

  let schema: z.ZodTypeAny | undefined;

  /*
   * `examBody.deepPartial()` reads as namespace `examBody`, key `deepPartial` —
   * a method, not a schema. Applied rather than looked up, because an update
   * route saying "the same fields, all optional" is the commonest shape here and
   * skipping it left every PATCH without an example.
   */
  const MODIFIERS = new Set(["deepPartial", "partial", "strict", "passthrough"]);

  if (key && MODIFIERS.has(key)) {
    const base =
      (loadModule(routeFile ?? "")?.[namespace] as z.ZodTypeAny | undefined) ??
      (Object.values(loadValidation(moduleDir) ?? {})[0] as
        | Record<string, unknown>
        | undefined)?.[namespace];
    const fn = (base as unknown as Record<string, () => z.ZodTypeAny>)?.[key];
    schema = typeof fn === "function" ? fn.call(base) : (base as z.ZodTypeAny);
  } else if (key) {
    const mod = loadValidation(moduleDir);
    const group = (mod?.[namespace] ?? (mod ? Object.values(mod)[0] : null)) as
      | Record<string, unknown>
      | undefined;
    schema = group?.[key] as z.ZodTypeAny | undefined;
  } else if (routeFile) {
    // Declared in the route file and exported for exactly this.
    schema = loadModule(routeFile)?.[namespace] as z.ZodTypeAny | undefined;
  }

  if (!schema) return null;

  // Every schema here is `z.object({ body: ..., params: ..., query: ... })`.
  const top = schema as z.ZodObject<z.ZodRawShape>;
  const body = top?.shape?.body as z.ZodTypeAny | undefined;
  if (!body) return null;

  const unwrapped = toObject(body);
  if (!unwrapped) return null;

  const example = shapeToExample(unwrapped);
  return Object.keys(example).length ? example : null;
};

/*
 * The few endpoints that validate by hand, so there is no schema to ask.
 * Kept deliberately short: every entry here is a body that can drift out of
 * date without anything noticing, which is exactly what the rest of this file
 * exists to prevent.
 */
const MANUAL_BODIES: Record<string, Record<string, unknown>> = {
  "POST /auth/login": { email: "admin@gmail.com", password: "12345678" },
  "POST /auth/forgot-password": { email: "admin@gmail.com" },
  "POST /auth/reset-password": { token: "<reset token>", newPassword: "12345678" },
  "POST /auth/change-password": {
    oldPassword: "12345678",
    newPassword: "12345678",
  },
  "POST /auth/refresh-token": { refreshToken: "<refresh token>" },
};

/* ── 3. The endpoints in one router ──────────────────────────────────────── */

interface Endpoint {
  method: string;
  route: string;
  auth: boolean;
  permission: string | null;
  upload: boolean;
  pattern: boolean;
  body: Record<string, unknown> | null;
}

const readRoutes = (file: string, base: string): Endpoint[] => {
  const src = fs.readFileSync(file, "utf8");
  const dir = path.dirname(file);

  /*
   * Quote-agnostic: some of these files use double quotes and some single, and
   * matching only one dropped fifteen endpoints without a word.
   */
  const STRING_ROUTE =
    /router\.(get|post|put|patch|delete)\(\s*["'`]([^"'`]*)["'`]\s*,([\s\S]*?)\n?\s*\);/g;

  /*
   * A few routes are declared as regular expressions rather than strings,
   * because the parameter is a storage key with slashes in it that a `:param`
   * cannot capture. They are real endpoints, so they are read too.
   */
  const REGEX_ROUTE =
    /router\.(get|post|put|patch|delete)\(\s*\/\^([^,]*?)\$\/\s*,([\s\S]*?)\n?\s*\);/g;

  const found = [
    ...[...src.matchAll(STRING_ROUTE)].map((m) => ({
      method: m[1],
      route: m[2] || "/",
      rest: m[3],
      pattern: false,
    })),
    ...[...src.matchAll(REGEX_ROUTE)].map((m) => ({
      method: m[1],
      route: m[2].split("\\/").join("/").split("(.+)").join(":key"),
      rest: m[3],
      pattern: true,
    })),
  ];

  return found.map(({ method: verb, route, rest: raw, pattern }) => {
    const method = verb.toUpperCase();
    const rest = raw.slice(0, 900);

    const perm = rest.match(
      /checkPermission\(\s*["'`]([^"'`]+)["'`]\s*,\s*["'`]([^"'`]+)["'`]/,
    );
    const anyPerm = [
      ...rest.matchAll(
        /module:\s*["'`]([^"'`]+)["'`]\s*,\s*action:\s*["'`]([^"'`]+)["'`]/g,
      ),
    ];
    /*
     * Two shapes: `xValidation.create` from a `.validation.ts`, and a bare
     * `examBody` declared in the route file itself. Both are real, and only
     * matching the first left the create endpoints of exams, notices and the
     * endpoint with no example body at all.
     */
    const validation = rest.match(/validateRequest\(\s*([\w.]+)\s*\(?\)?/);

    const full = `${method} ${base}${route === "/" ? "" : route}`;

    return {
      method,
      route,
      pattern,
      auth: /auth\(/.test(rest) || /adminAuth/.test(rest),
      permission: perm
        ? `${perm[1]} / ${perm[2]}`
        : anyPerm.length
          ? anyPerm.map((p) => `${p[1]} / ${p[2]}`).join(" OR ")
          : null,
      upload: /upload\.|multer|\.single\(|\.array\(/.test(rest),
      body: ["POST", "PUT", "PATCH"].includes(method)
        ? (MANUAL_BODIES[full] ??
            bodyFor(dir, validation ? validation[1] : null, file))
        : null,
    };
  });
};

/* ── 4. Assemble ─────────────────────────────────────────────────────────── */

const urlOf = (full: string) => {
  const clean = full.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
  return {
    raw: `{{baseUrl}}${clean}`,
    host: ["{{baseUrl}}"],
    path: clean.split("/").filter(Boolean),
  };
};

const folders: unknown[] = [];
let total = 0;
let bodied = 0;

for (const { base, file } of mounts) {
  if (!fs.existsSync(file)) continue;

  const items = readRoutes(file, base).map((e) => {
    total += 1;
    if (e.body) bodied += 1;

    const notes = [
      e.auth ? "Requires login." : "Public — no token needed.",
      e.permission ? `Permission: ${e.permission}` : null,
      e.upload
        ? "Sends multipart/form-data — attach the file in Postman's Body tab."
        : null,
      e.route.includes(":")
        ? "Replace every :param in the URL before sending."
        : null,
      e.pattern
        ? "Declared as a regular expression: :key is a storage key and may contain slashes."
        : null,
    ].filter(Boolean);

    return {
      name: `${e.method} ${e.route === "/" ? "" : e.route}`.trim(),
      request: {
        method: e.method,
        header: e.body
          ? [{ key: "Content-Type", value: "application/json" }]
          : [],
        ...(e.body
          ? {
              body: {
                mode: "raw",
                raw: JSON.stringify(e.body, null, 2),
                options: { raw: { language: "json" } },
              },
            }
          : {}),
        url: urlOf(`${base}${e.route === "/" ? "" : e.route}`),
        description: notes.join("\n"),
      },
      response: [],
    };
  });

  if (items.length) {
    folders.push({
      name: base.replace(/^\//, "") || "root",
      item: items.sort((a, b) => a.name.localeCompare(b.name)),
    });
  }
}

/*
 * Login leads, and stores the token for everything else — otherwise the first
 * thing anybody does with this collection is get a 401 and go hunting for where
 * a token is meant to be pasted.
 */
const startHere = {
  name: "00 · Start here",
  item: [
    {
      name: "Login (saves {{token}})",
      event: [
        {
          listen: "test",
          script: {
            type: "text/javascript",
            exec: [
              "const body = pm.response.json();",
              "const token = body && body.data && body.data.token;",
              "pm.test('login returned a token', function () {",
              "  pm.expect(token, JSON.stringify(body)).to.be.a('string');",
              "});",
              "if (token) pm.collectionVariables.set('token', token);",
            ],
          },
        },
      ],
      request: {
        method: "POST",
        header: [{ key: "Content-Type", value: "application/json" }],
        body: {
          mode: "raw",
          raw: JSON.stringify(MANUAL_BODIES["POST /auth/login"], null, 2),
          options: { raw: { language: "json" } },
        },
        url: urlOf("/auth/login"),
        description:
          "Send this first. The test script stores the token in a collection variable and every other request picks it up automatically.",
      },
      response: [],
    },
  ],
};

const collection = {
  info: {
    name: "Zoom Property API",
    description: [
      "Generated from the route files by `npm run postman`. Re-run that after changing a route rather than editing this file by hand.",
      "",
      `${total} endpoints across ${folders.length} modules.`,
      "",
      "1. Send **00 · Start here → Login**. The token is stored for you.",
      "2. Change `baseUrl` if the server is not on http://localhost:5008/api.",
      "3. Requests with `:param` in the address need a real id pasted in.",
      "",
      "Example bodies come from the zod validation schemas themselves, so the field names, the optional ones and the allowed enum values are exactly what the server accepts. Values in angle brackets are placeholders to replace.",
      "Auth and permission requirements are written in each request's description.",
    ].join("\n"),
    schema:
      "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  auth: {
    type: "bearer",
    bearer: [{ key: "token", value: "{{token}}", type: "string" }],
  },
  variable: [
    { key: "baseUrl", value: "http://localhost:5008/api", type: "string" },
    { key: "token", value: "", type: "string" },
  ],
  item: [
    startHere,
    ...folders.sort((a, b) =>
      (a as { name: string }).name.localeCompare((b as { name: string }).name),
    ),
  ],
};

const out = path.join(HERE, "ZoomProperty.postman_collection.json");
fs.writeFileSync(out, JSON.stringify(collection, null, 2));

const writes = total;
console.log(
  `${total} endpoints · ${folders.length} folders · ${bodied} example bodies -> ${path.relative(
    ROOT,
    out,
  )}`,
);
void writes;
