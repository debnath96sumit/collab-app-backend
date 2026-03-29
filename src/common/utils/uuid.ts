export async function generateUUID(): Promise<string> {
  const { v4 } = await import('uuid');
  return v4();
}
