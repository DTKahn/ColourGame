// Local persistence. Wrapped in try/catch because storage can be unavailable
// (private browsing, blocked cookies). Swap for a server API for global high scores.

const PREFIX = 'hexact:';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

const bestKey = ({ format, rounds }) => `best:${format}:${rounds}`;

export const getBest = (mode) => read(bestKey(mode), null);

/** Saves the score if it beats the stored best. Returns true for a new best. */
export function recordScore(mode, score) {
  const best = getBest(mode);
  if (best != null && best >= score) return false;
  write(bestKey(mode), score);
  return true;
}

export const getPref = (key, fallback) => read(`pref:${key}`, fallback);
export const setPref = (key, value) => write(`pref:${key}`, value);
