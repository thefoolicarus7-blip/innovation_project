import { io } from "socket.io-client";

const socket = io("http://localhost:3000", { transports: ["websocket"] });

const log = (label, msg) => console.log(`\n[${label}]\n${msg}`);

socket.on("connect", () => {
  log("CONNECTED", `Socket ID: ${socket.id}`);

  // Start the interview
  log("SENDING", "interview:start — topic: JavaScript");
  socket.emit("interview:start", { topic: "JavaScript" });
});

socket.on("interview:reply", (data) => {
  log("AI REPLY", data.reply);

  // After first reply, send one answer then disconnect
  if (!socket._answered) {
    socket._answered = true;
    const answer = "I use closures to preserve function scope and for data encapsulation, for example in module patterns.";
    log("SENDING", `interview:message — "${answer}"`);
    socket.emit("interview:message", { message: answer });
  } else {
    log("TEST COMPLETE", "AI interview is working end to end.");
    socket.disconnect();
    process.exit(0);
  }
});

socket.on("interview:error", (data) => {
  console.error("\n[ERROR]", data.message);
  socket.disconnect();
  process.exit(1);
});

socket.on("connect_error", (err) => {
  console.error("\n[CONNECT ERROR]", err.message);
  process.exit(1);
});

setTimeout(() => {
  console.error("\n[TIMEOUT] No response in 30s — NVIDIA may be slow or down.");
  process.exit(1);
}, 30000);
