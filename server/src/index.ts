import http, { type Server } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config();

import cors from "cors";
import cookieParser from "cookie-parser";
import express, { type Request, type Response } from "express";
import applicationRouter from "./routes/application.routes.js";
import companyRouter from "./routes/company.routes.js";
import jobRouter from "./routes/job.routes.js";
import mediaRouter from "./routes/media.routes.js";
import userRouter from "./routes/user.routes.js";
import adminRouter from "./routes/admin.routes.js";
import { setupInterviewSocket } from "./controllers/ai.interview.controller.js";
import { connectDB } from "./services/db.js";
export const app = express();

app.use(
  async (request: Request, _response: Response, next: express.NextFunction) => {
    // Skip DB check for basic health and info routes
    if (request.path === "/health" || request.path === "/api") {
      return next();
    }

    try {
      await connectDB();
      next();
    } catch (error) {
      next(error);
    }
  },
);

const ALLOWED_ORIGINS = (
  process.env.CORS_ALLOWED_ORIGINS ?? "http://localhost:5173"
)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Postman, server-to-server)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

app.get("/health", (_request: Request, response: Response) => {
  response.status(200).type("text/plain").send("OK");
});

app.get("/api", (_request: Request, response: Response) => {
  response.status(200).json({
    message: "Welcome to swipe2work API",
    version: "1.0.0",
  });
});

app.use("/api/user", userRouter);
app.use("/api/job", jobRouter);
app.use("/api/applications", applicationRouter);
app.use("/api/media", mediaRouter);
app.use("/api/company", companyRouter);
app.use("/api/admin", adminRouter);

app.use(
  (
    error: unknown,
    _request: Request,
    response: Response,
    _next: express.NextFunction,
  ) => {
    if (
      error instanceof Error &&
      "name" in error &&
      "code" in error &&
      error.name === "MulterError" &&
      (error as { code?: string }).code === "LIMIT_FILE_SIZE"
    ) {
      response
        .status(400)
        .json({ message: "File size exceeds the 10MB limit" });
      return;
    }

    if (error instanceof Error) {
      response.status(500).json({ message: error.message });
      return;
    }

    response.status(500).json({ message: "Unexpected server error" });
  },
);

app.use((_request: Request, response: Response) => {
  response.status(404).type("text/plain").send("Not Found");
});

export function createHttpServer() {
  return http.createServer(app);
}

export async function startServer(
  port = Number(process.env.PORT ?? 3000),
): Promise<Server> {
  try {
    await connectDB();
  } catch (error) {
    process.exit(1);
  }

  const server = createHttpServer();

  const io = new SocketIOServer(server, {
    cors: { origin: ALLOWED_ORIGINS, credentials: true },
  });

  setupInterviewSocket(io);

  await new Promise<void>((resolve) => {
    server.listen(port, resolve);
  });

  console.log(`🚀 Server running at http://localhost:${port}`);
  return server;
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  void startServer();
}

export default app;
