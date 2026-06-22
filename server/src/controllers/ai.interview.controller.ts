import { Server, Socket } from "socket.io";
import OpenAI from "openai";

const SYSTEM_PROMPT =
  "You are an expert technical interviewer conducting a voice-only interview. IMPORTANT: Never use markdown, bolding, italics, or bullet points. Avoid all special characters like asterisks or hashtags. Speak in natural, plain text only, as your response will be read aloud by a text-to-speech engine. Ask one concise, technical question at a time. Briefly evaluate the user's previous answer and then ask the next question.";

export const setupInterviewSocket = (io: Server) => {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    console.warn(
      "NVIDIA_API_KEY is not defined in environment variables. AI Interview features will fail.",
    );
  }

  const client = new OpenAI({
    apiKey: apiKey || "dummy_key",
    baseURL: "https://integrate.api.nvidia.com/v1",
  });

  io.on("connection", (socket: Socket) => {
    console.log(`Socket connected for AI Interview: ${socket.id}`);

    const history: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    socket.on("interview:start", async (data: { topic: string }) => {
      try {
        const userMessage = `Let's start the voice interview. The topic is ${data.topic || "General Software Engineering"}. Ask me the first question. Remember: use plain text only, no markdown or asterisks.`;
        history.push({ role: "user", content: userMessage });

        const response = await client.chat.completions.create({
          model: "meta/llama-3.1-70b-instruct",
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
          temperature: 0.7,
          max_tokens: 300,
        });

        const reply = response.choices[0]?.message?.content ?? "";
        history.push({ role: "assistant", content: reply });
        socket.emit("interview:reply", { reply });
      } catch (error) {
        console.error("NVIDIA Start Error:", error);
        socket.emit("interview:error", { message: "Failed to start interview." });
      }
    });

    socket.on("interview:message", async (data: { message: string }) => {
      try {
        history.push({ role: "user", content: data.message });

        const response = await client.chat.completions.create({
          model: "meta/llama-3.1-70b-instruct",
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
          temperature: 0.7,
          max_tokens: 300,
        });

        const reply = response.choices[0]?.message?.content ?? "";
        history.push({ role: "assistant", content: reply });
        socket.emit("interview:reply", { reply });
      } catch (error) {
        console.error("NVIDIA API Error:", error);
        socket.emit("interview:error", { message: "Failed to process your response." });
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
