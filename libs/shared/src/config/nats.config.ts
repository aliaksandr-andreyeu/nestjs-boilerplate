export function getNatsServers(): string[] {
  const url = process.env.NATS_URL;
  if (url) return [url];

  const host = process.env.NATS_HOST ?? '127.0.0.1';
  const port = process.env.NATS_PORT ?? '4222';
  return [`nats://${host}:${port}`];
}
