import OpenAI from "openai";
import axios from "axios";

type SummaryInput = {
  fullName: string;
  yearsOfExperience: number;
  education: string;
  skills: string[];
  workExperiences?: { jobTitle: string; company: string; description?: string }[];
};

function getAiClient(): { client: OpenAI | null; isGemini: boolean; geminiKey?: string } {
  const geminiKey = process.env.GEMINI_API_KEY;
  const nvidiaKey = process.env.NVIDIA_API_KEY;

  if (geminiKey) {
    return {
      client: null,
      isGemini: true,
      geminiKey,
    };
  }

  if (nvidiaKey) {
    return {
      client: new OpenAI({
        apiKey: nvidiaKey,
        baseURL: "https://integrate.api.nvidia.com/v1",
      }),
      isGemini: false,
    };
  }

  throw new Error("Neither GEMINI_API_KEY nor NVIDIA_API_KEY is configured on the server.");
}

export async function generateCvSummary(input: SummaryInput): Promise<string> {
  const { client, isGemini, geminiKey } = getAiClient();

  const experiences = input.workExperiences?.map(e => `- ${e.jobTitle} at ${e.company}: ${e.description || ""}`).join("\n") || "None provided";

  const prompt = `Write a comprehensive and highly professional CV summary or "Professional Profile" for a job seeker with the following details:
- Name: ${input.fullName}
- Years of experience: ${input.yearsOfExperience}
- Education: ${input.education}
- Skills: ${input.skills.join(", ")}
- Work Experience:
${experiences}

Rules:
- Write 1 to 2 well-crafted paragraphs.
- Highlight their key skills and summarize their work experience accomplishments.
- Write in first person (e.g., "I am a..." or "As a...").
- Sound professional, confident, and specific to their background.
- Do NOT use bullet points, markdown, asterisks, or headers.
- Return ONLY the summary paragraph text, nothing else.`;

  if (isGemini) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
        }),
      }
    );
    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  }

  const response = await client!.chat.completions.create({
    model: "meta/llama-3.1-70b-instruct",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 500,
  });

  return response.choices[0]?.message?.content?.trim() ?? "";
}

export async function extractSkillsFromCV(cvUrl: string): Promise<string[]> {
  let aiConfig: { client: OpenAI | null; isGemini: boolean; geminiKey?: string };
  try {
    aiConfig = getAiClient();
  } catch (error) {
    console.warn("No AI API key found, skipping skill extraction.");
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
  const client = aiConfig.client;

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

    if (aiConfig.isGemini) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${aiConfig.geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 100, temperature: 0.3 },
          }),
        }
      );
      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }
      const data = await response.json();
      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      return resultText.split(",").map((s: string) => s.trim()).filter((s: string) => s.length > 0).slice(0, 7);
    }

    const result = await client!.chat.completions.create({
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
