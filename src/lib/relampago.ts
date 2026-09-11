const RELAMPAGO_WINDOW_MS = 48 * 60 * 60 * 1000;

export function getRelampagoCutoff(): Date {
  return new Date(Date.now() + RELAMPAGO_WINDOW_MS);
}
