import dns from "node:dns";
import mongoose from "mongoose";

let initialized = false;

function configureDnsForSrv(): void {
  const dnsServers = process.env.DNS_SERVERS?.split(",").map((server) =>
    server.trim(),
  ).filter(Boolean);

  if (dnsServers?.length) {
    dns.setServers(dnsServers);
    console.log(`🔧 Using DNS_SERVERS from environment: ${dnsServers.join(", ")}`);
    return;
  }

  const currentServers = dns.getServers();
  const isLocalResolver =
    currentServers.length === 1 &&
    ["127.0.0.1", "::1"].includes(currentServers[0]);

  if (isLocalResolver) {
    const fallbackServers = ["8.8.8.8", "1.1.1.1"];
    dns.setServers(fallbackServers);
    console.warn(
      "⚠️ Node DNS resolver was using localhost; switched to public DNS servers for SRV lookups.",
    );
    console.warn(`   ${fallbackServers.join(", ")}`);
  }
}

let attemptedDnsFallback = false;

export async function connectDB(): Promise<void> {
  if (initialized) return;

  const mongoUri = process.env.MONGODB_URI?.trim();
  const localMongoUri = process.env.LOCAL_MONGODB_URI?.trim();
  const uri = mongoUri || localMongoUri;

  if (!uri) {
    initialized = true;
    console.warn(
      "⚠️ No MongoDB URI configured. Continuing without database connectivity.",
    );
    return;
  }

  mongoose.set("strictQuery", false);

  if (uri.startsWith("mongodb+srv://")) {
    configureDnsForSrv();
  }

  try {
    await mongoose.connect(uri);
    initialized = true;
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    const isSrvLookupFailure =
      uri.startsWith("mongodb+srv://") &&
      error instanceof Error &&
      "code" in error &&
      (error as { code?: string }).code === "ECONNREFUSED" &&
      "syscall" in error &&
      (error as { syscall?: string }).syscall === "querySrv";

    if (isSrvLookupFailure && !attemptedDnsFallback) {
      attemptedDnsFallback = true;
      console.warn(
        "⚠️ MongoDB SRV lookup failed. Retrying with public DNS servers.",
      );
      configureDnsForSrv();
      await mongoose.connect(uri);
      initialized = true;
      console.log("✅ Connected to MongoDB after DNS fallback");
      return;
    }

    if (process.env.NODE_ENV === "production") {
      throw error;
    }

    initialized = true;
    console.warn("⚠️ MongoDB connection failed. Continuing in development mode.");
    console.warn(
      "   Please verify MONGODB_URI, LOCAL_MONGODB_URI, or DNS_SERVERS if you need database access.",
    );
    console.warn(error);
  }
}
