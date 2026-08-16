export function cookieLooksSigned(token: string | undefined) {
  if (!token) return false;
  const [body, sig] = token.split(".");
  return Boolean(body && sig);
}
