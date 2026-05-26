export function getNatsServers(): string[] {
  const url = process.env.NATS_URL ?? 'nats://localhost:4222';
  return [url];
}
