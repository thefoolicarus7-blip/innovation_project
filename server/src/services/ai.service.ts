import OpenAI from "openai";
import axios from "axios";

type SummaryInput = {
  fullName: string;
  yearsOfExperience: number;
  education: string;
  skills: string[];
};

function getNvidiaClient(): OpenAI {
  const apiKey = process.env.NVIDIA_API_KEY || "";
  if (!apiKey) {
    throw new Error("NVIDIA_API_KEY is not configured on the server.");
  }
  return new OpenAI({
    apiKey,
    baseURL: "https://integrate.api.nvidia.com/v1",
  });
}

export async function generateCvSummary(input: SummaryInput): Promise<string> {
  const client = getNvidiaClient();

  const prompt = `Write a professional CV summary paragraph for a job seeker with the following details:
- Name: ${input.fullName}
- Years of experience: ${input.yearsOfExperience}
- Education: ${input.education}
- Skills: ${input.skills.join(", ")}

Rules:
- Write exactly 2-3 sentences.
- Write in first person (e.g. "I am..." or "Results-driven professional...").
- Sound professional, confident, and specific to their skills.
- Do NOT use bullet points, markdown, asterisks, or headers.
- Return ONLY the summary paragraph text, nothing else.`;

  const response = await client.chat.completions.create({
    model: "meta/llama-3.1-70b-instruct",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 200,
  });

  return response.choices[0]?.message?.content?.trim() ?? "";
}

export async function extractSkillsFromCV(cvUrl: string): Promise<string[]> {
  const apiKey = process.env.NVIDIA_API_KEY || "";
  if (!apiKey) {
    console.warn("NVIDIA_API_KEY not found, skipping skill extraction.");
    return [];
  }

  if (typeof global !== "undefined" && !(global as any).DOMMatrix) {
    try {
      const canvas = await import("@napi-rs/canvas");
      (global as any).DOMMatrix = canvas.DOMMatrix;
      (global as any).ImageData = canvas.ImageData;
      (global as any).Path2D = canvas.Path2D;
    } catch (e) {
      console.warn("Could not load @napi-rs/canvas polyfills:", e);
    }
  }

  const { PDFParse } = await import("pdf-parse");
  const client = new OpenAI({
    apiKey,
    baseURL: "https://integrate.api.nvidia.com/v1",
  });

  try {
    const response = await axios.get(cvUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data);

    let text = "";
    let parser: any = null;
    try {
      parser = new PDFParse({ data: buffer });
      const data = await parser.getText();
      text = data.text || "";
    } catch (pdfError) {
      console.error("PDF Parsing error, attempting as plain text:", pdfError);
      text = buffer.toString("utf-8");
    } finally {
      if (parser && typeof parser.destroy === "function") {
        await parser.destroy().catch(() => {});
      }
    }

    if (!text || text.trim().length < 50) {
      console.warn("Extracted text is too short, verification might be required.");
      return [];
    }

    const prompt = `Extract up to 7 major technical and soft skills from the following resume text.
Focus on core technologies (e.g., React.js, Next.js, Node.js, Python, etc.) and significant professional skills.
Return ONLY a comma-separated list of skills, nothing else. Max 7 skills.
Example output: React.js, Next.js, TypeScript, Node.js, AWS, Agile, Project Management

Resume Text:
${text.substring(0, 10000)}`;

    const result = await client.chat.completions.create({
      model: "meta/llama-3.1-70b-instruct",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 100,
    });

    const resultText = result.choices[0]?.message?.content ?? "";
    const skills = resultText
      .split(",")
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0)
      .slice(0, 7);

    return skills;
  } catch (error) {
    console.error("Error extracting skills from CV:", error);
    return [];
  }
}
