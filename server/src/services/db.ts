let initialized = false;

export async function connectDB(): Promise<void> {
  if (initialized) return;
  initialized = true;
  console.log("✅ Using file-based storage (server/data/ directory)");
}
