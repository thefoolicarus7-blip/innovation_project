import { Server, Socket } from "socket.io";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const setupInterviewSocket = (io: Server) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn(
      "GEMINI_API_KEY is not defined in environment variables. AI Interview features will fail.",
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey || "");
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction:
      "You are an expert technical interviewer conducting a voice-only interview. IMPORTANT: Never use markdown, bolding, italics, or bullet points. Avoid all special characters like asterisks or hashtags. Speak in natural, plain text only, as your response will be read aloud by a text-to-speech engine. Ask one concise, technical question at a time. Briefly evaluate the user's previous answer and then ask the next question.",
  });

  io.on("connection", (socket: Socket) => {
    console.log(`Socket connected for AI Interview: ${socket.id}`);

    const chat = model.startChat({});

    socket.on("interview:start", async (data: { topic: string }) => {
      try {
        const prompt = `Let's start the voice interview. The topic is ${data.topic || "General Software Engineering"}. Ask me the first question. Remember: use plain text only, no markdown or asterisks.`;
        const result = await chat.sendMessage(prompt);
        socket.emit("interview:reply", { reply: result.response.text() });
      } catch (error) {
        console.error("Gemini Start Error:", error);
        socket.emit("interview:error", {
          message: "Failed to start interview.",
        });
      }
    });

    socket.on("interview:message", async (data: { message: string }) => {
      try {
        const result = await chat.sendMessage(data.message);
        socket.emit("interview:reply", { reply: result.response.text() });
      } catch (error) {
        console.error("Gemini API Error:", error);
        socket.emit("interview:error", {
          message: "Failed to process your response.",
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
