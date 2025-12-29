export function basicAuthHeader(username: string, password: string): string {
  const token = Buffer.from(`${username}:${password}`, "utf-8").toString(
    "base64",
  );
  return `Basic ${token}`;
}
