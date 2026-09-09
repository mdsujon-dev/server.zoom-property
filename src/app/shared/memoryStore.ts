// Small in-process key/value store with optional TTL.
//
// This is a plain in-memory replacement for the few places that need a
// short-lived string store (booking OTP codes, coarse order rate-limit
// counters). No external service, no network. State is per-process, so on a
// multi-instance deployment each instance keeps its own copy — acceptable for
// OTPs and abuse counters (worst case a code isn't shared across instances).

type Entry = { value: string; expireAt?: number };

const store = new Map<string, Entry>();

const now = () => Date.now();

const read = (key: string): Entry | undefined => {
  const e = store.get(key);
  if (e && e.expireAt !== undefined && e.expireAt <= now()) {
    store.delete(key);
    return undefined;
  }
  return e;
};

export const memGet = (key: string): string | null => {
  const e = read(key);
  return e ? e.value : null;
};

export const memSet = (key: string, value: string, ttlSeconds?: number): void => {
  store.set(key, {
    value: String(value),
    expireAt: ttlSeconds ? now() + ttlSeconds * 1000 : undefined,
  });
};

export const memDel = (key: string): void => {
  store.delete(key);
};

export const memIncr = (key: string): number => {
  const e = read(key);
  const next = (e ? Number(e.value) || 0 : 0) + 1;
  store.set(key, { value: String(next), expireAt: e?.expireAt });
  return next;
};

export const memExpire = (key: string, seconds: number): void => {
  const e = read(key);
  if (!e) return;
  e.expireAt = now() + seconds * 1000;
  store.set(key, e);
};

export const memTtl = (key: string): number => {
  const e = read(key);
  if (!e) return -2;
  if (e.expireAt === undefined) return -1;
  return Math.max(0, Math.ceil((e.expireAt - now()) / 1000));
};
