import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "./src/services/db.js";
import { generateCvSummary } from "./src/services/ai.service.js";
import Candidate from "./src/models/candidate.model.js";

dotenv.config({ path: "./.env" });

async function main() {
  console.log("Connecting to MongoDB using custom DNS fallback...");
  await connectDB();
  console.log("Connected successfully.");

  const candidates = await Candidate.find();
  console.log(`Found ${candidates.length} candidates in the database.`);

  let updatedCount = 0;

  for (const candidate of candidates) {
    console.log(`Processing candidate: ${candidate.fullName || candidate.id}`);
    
    // Only process if they actually have some details filled out
    if (!candidate.fullName && (!candidate.skills || candidate.skills.length === 0)) {
      console.log(`  Skipping: Not enough details filled out.`);
      continue;
    }

    try {
      const enhancedSummary = await generateCvSummary({
        fullName: candidate.fullName || "Candidate",
        yearsOfExperience: candidate.yearsOfExperience || 0,
        education: candidate.education || "Not specified",
        skills: candidate.skills || [],
        workExperiences: (candidate.workExperiences as any) || [],
      });

      if (enhancedSummary && enhancedSummary.length > 20) {
        candidate.summary = enhancedSummary;
        await candidate.save();
        console.log(`  Successfully generated and saved AI-enhanced CV profile!`);
        updatedCount++;
      } else {
        console.log(`  AI returned empty or short summary, skipping.`);
      }
      
      // Sleep slightly to respect AI rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error: any) {
      console.error(`  Failed to generate summary: ${error.message}`);
    }
  }

  console.log(`Finished processing. Successfully updated ${updatedCount} candidates.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
