export function validateFactObject(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  if (typeof o.fact !== 'string' || o.fact.trim().length === 0) return false;
  if ('source_url' in o && typeof o.source_url !== 'string') return false;
  if ('source_title' in o && typeof o.source_title !== 'string') return false;
  return true;
}
