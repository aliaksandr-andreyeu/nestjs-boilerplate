export function dedupeParams(record: Record<string, unknown>): void {
  for (const key of Object.keys(record)) {
    const value = record[key];
    if (Array.isArray(value)) {
      record[key] = value.at(-1);
    }
  }
}
