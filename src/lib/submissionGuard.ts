export function newRecordId(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return `${prefix}_${Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')}`;
}

// Protect the gap before React renders a disabled/closed form. Network retries
// retain their record IDs and are deduplicated separately by the server.
export function createSubmissionGuard() {
  const recent = new Map<string, number>();
  return (action: string, payload: unknown): boolean => {
    const now = Date.now();
    for (const [key, time] of recent) if (now - time >= 2000) recent.delete(key);
    const key = `${action}:${JSON.stringify(payload)}`;
    if (recent.has(key)) return false;
    recent.set(key, now);
    return true;
  };
}
