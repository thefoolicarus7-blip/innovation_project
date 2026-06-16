import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";

dotenv.config();

// Some environments block or refuse the DNS queries Node's resolver uses for
// SRV records. Use known public DNS servers as a fallback so `mongodb+srv`
// URIs can be resolved reliably from the server process.
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  // Non-fatal; continue and let mongoose/dns throw if resolution still fails.
}

const MONGODB_URI = process.env.MONGODB_URI;


let isConnected = false;

export async function connectDB() {
  if (isConnected) {
    return;
  }

  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI is not set in environment variables");
    throw new Error("❌ MONGODB_URI is not set in environment variables");
  }

  try {
    console.log("⏳ Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of default 30s
    });
    isConnected = true;
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    throw error;
  }
}
