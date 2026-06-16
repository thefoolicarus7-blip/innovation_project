import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";

export async function extractSkillsFromCV(cvUrl: string): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    console.warn("GEMINI_API_KEY not found, skipping skill extraction.");
    return [];
  }

  // Apply polyfills for pdfjs-dist in Node.js environments
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

  // Dynamically import PDFParse to ensure polyfills are applied first
  const { PDFParse } = await import("pdf-parse");

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    // 1. Fetch CV content
    const response = await axios.get(cvUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data);

    // 2. Extract text from PDF (assuming it's a PDF based on cvUrl)
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

    // 3. Use Gemini to extract skills
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const prompt = `
      Extract up to 7 major technical and soft skills from the following resume text. 
      Focus on core technologies (e.g., React.js, Next.js, Node.js, Python, etc.) and significant professional skills.
      Return ONLY a comma-separated list of skills, nothing else. Max 7 skills.
      Example output: React.js, Next.js, TypeScript, Node.js, AWS, Agile, Project Management
      
      Resume Text:
      ${text.substring(0, 10000)} 
    `;

    const result = await model.generateContent(prompt);
    const resultText = result.response.text();

    // 4. Parse comma-separated list
    const skills = resultText
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, 7);

    return skills;
  } catch (error) {
    console.error("Error extracting skills from CV:", error);
    return [];
  }
}
