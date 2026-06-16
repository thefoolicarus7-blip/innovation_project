process.env.NODE_ENV = "test";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import jwt from "jsonwebtoken";

import { createHttpServer } from "../src/index.js";
import User from "../src/models/user.model.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-jwt-secret";

type AddressInfo = {
  port: number;
};

type MockedUserModel = {
  findOne: (query: unknown) => Promise<unknown>;
  create: (payload: unknown) => Promise<unknown>;
  findById: (id: string) => { select: (selection: string) => Promise<unknown> };
};

const mockedUserModel = User as unknown as MockedUserModel;
const originalFindOne = mockedUserModel.findOne;
const originalCreate = mockedUserModel.create;
const originalFindById = mockedUserModel.findById;

afterEach(() => {
  mockedUserModel.findOne = originalFindOne;
  mockedUserModel.create = originalCreate;
  mockedUserModel.findById = originalFindById;
});

async function withServer<T>(run: (baseUrl: string) => Promise<T>) {
  const server = createHttpServer();

  await new Promise<void>((resolve) => {
    server.listen(0, resolve);
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Unable to resolve dynamic test port");
  }

  try {
    return await run(`http://127.0.0.1:${(address as AddressInfo).port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error: Error | undefined) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}

test("GET /health returns OK", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`);
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.equal(body, "OK");
  });
});

test("GET /api returns welcome payload", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api`);
    const payload = await response.json() as { message: string; version: string };

    assert.equal(response.status, 200);
    assert.equal(payload.message, "Welcome to Nysa API");
    assert.equal(payload.version, "1.0.0");
  });
});

test("POST /api/users/register returns token and user payload", async () => {
  mockedUserModel.findOne = async () => null;
  mockedUserModel.create = async (payload: unknown) => ({
    _id: "507f191e810c19729de860ea",
    ...(payload as Record<string, string>),
  });

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName: "Prashant",
        lastName: "K",
        email: "prashant@example.com",
        password: "secret123",
      }),
    });

    const payload = await response.json() as {
      token: string;
      user: { email: string; firstName: string };
    };

    assert.equal(response.status, 201);
    assert.equal(typeof payload.token, "string");
    assert.equal(payload.user.email, "prashant@example.com");
    assert.equal(payload.user.firstName, "Prashant");
  });
});

test("POST /api/users/login returns unauthorized on wrong password", async () => {
  mockedUserModel.findOne = async () => ({
    _id: "507f191e810c19729de860ea",
    firstName: "Prashant",
    lastName: "K",
    email: "prashant@example.com",
    password: "$2b$10$TQ9fLs1VnH9q5s6hUZ3P4e2ixRX8Ff5xRW6fCAQ6xI0SvfGo1k4Vm",
    isVerified: "false",
    role: "User",
  });

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "prashant@example.com",
        password: "wrong-password",
      }),
    });

    assert.equal(response.status, 401);
  });
});

test("GET /api/users/me returns profile for valid token", async () => {
  mockedUserModel.findById = (id: string) => ({
    select: async () => ({
      _id: id,
      firstName: "Prashant",
      lastName: "K",
      email: "prashant@example.com",
      isVerified: "false",
      role: "User",
    }),
  });

  const token = jwt.sign(
    {
      userId: "507f191e810c19729de860ea",
      email: "prashant@example.com",
      role: "User",
    },
    JWT_SECRET,
    { expiresIn: "1h" },
  );

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const payload = await response.json() as {
      user: { email: string; role: string };
    };

    assert.equal(response.status, 200);
    assert.equal(payload.user.email, "prashant@example.com");
    assert.equal(payload.user.role, "User");
  });
});

test("GET /api/jobs returns paginated job cards for authenticated user", async () => {
  const token = jwt.sign(
    {
      userId: "507f191e810c19729de860ea",
      email: "prashant@example.com",
      role: "User",
    },
    JWT_SECRET,
    { expiresIn: "1h" },
  );

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/jobs?offset=0&limit=5`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const payload = await response.json() as {
      items: Array<{ id: number; title: string; company: string }>;
      pagination: { total: number; limit: number; offset: number };
    };

    assert.equal(response.status, 200);
    assert.equal(payload.items.length, 5);
    assert.equal(payload.pagination.limit, 5);
    assert.equal(payload.pagination.offset, 0);
    assert.equal(typeof payload.pagination.total, "number");
  });
});

test("POST /api/jobs/:jobId/swipe stores action and shows in /api/applications", async () => {
  const token = jwt.sign(
    {
      userId: "507f191e810c19729de860ef",
      email: "candidate@example.com",
      role: "User",
    },
    JWT_SECRET,
    { expiresIn: "1h" },
  );

  await withServer(async (baseUrl) => {
    const swipeResponse = await fetch(`${baseUrl}/api/jobs/2/swipe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: "right" }),
    });

    const swipePayload = await swipeResponse.json() as {
      application: { jobId: number; status: string; action: string };
    };

    assert.equal(swipeResponse.status, 200);
    assert.equal(swipePayload.application.jobId, 2);
    assert.equal(swipePayload.application.status, "Accepted for Interview");
    assert.equal(swipePayload.application.action, "right");

    const applicationsResponse = await fetch(`${baseUrl}/api/applications?tab=matches`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const applicationsPayload = await applicationsResponse.json() as {
      items: Array<{ jobId: number; status: string }>;
      total: number;
      tab: string;
    };

    assert.equal(applicationsResponse.status, 200);
    assert.equal(applicationsPayload.tab, "matches");
    assert.equal(applicationsPayload.total, 1);
    assert.equal(applicationsPayload.items[0]?.jobId, 2);
    assert.equal(applicationsPayload.items[0]?.status, "Accepted for Interview");
  });
});

test("POST /api/media/upload requires file", async () => {
  const token = jwt.sign(
    {
      userId: "507f191e810c19729de860ed",
      email: "media@example.com",
      role: "User",
    },
    JWT_SECRET,
    { expiresIn: "1h" },
  );

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/media/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: new FormData(),
    });

    const payload = await response.json() as { message: string };

    assert.equal(response.status, 400);
    assert.equal(payload.message, "file is required");
  });
});

test("POST /api/media/upload rejects unsupported file types", async () => {
  const token = jwt.sign(
    {
      userId: "507f191e810c19729de860ec",
      email: "media2@example.com",
      role: "User",
    },
    JWT_SECRET,
    { expiresIn: "1h" },
  );

  await withServer(async (baseUrl) => {
    const formData = new FormData();
    formData.append("file", new File(["hello"], "notes.txt", { type: "text/plain" }));

    const response = await fetch(`${baseUrl}/api/media/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const payload = await response.json() as { message: string };

    assert.equal(response.status, 400);
    assert.equal(payload.message, "Only image files (jpeg/png/webp/heic/heif) and pdf are supported");
  });
});

test("POST /api/users/verify-email validates code and email", async () => {
  let savedUser: any = null;
  mockedUserModel.findOne = async () => ({
    _id: "507f191e810c19729de860ea",
    email: "test-verify@example.com",
    isVerified: "false",
    verificationCode: "123456",
    verificationCodeExpiry: Date.now() + 600000,
    save: async function() {
      savedUser = this;
      return this;
    },
  });

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users/verify-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test-verify@example.com",
        code: "123456",
      }),
    });

    const payload = await response.json() as { message: string };

    assert.equal(response.status, 200);
    assert.equal(payload.message, "Email verified successfully");
    assert.ok(savedUser);
    assert.equal(savedUser.isVerified, "true");
  });
});

test("POST /api/users/resend-verification generates code and sends email", async () => {
  let savedUser: any = null;
  mockedUserModel.findOne = async () => ({
    _id: "507f191e810c19729de860ea",
    email: "test-resend@example.com",
    isVerified: "false",
    save: async function() {
      savedUser = this;
      return this;
    },
  });

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users/resend-verification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test-resend@example.com",
      }),
    });

    const payload = await response.json() as { message: string };

    assert.equal(response.status, 200);
    assert.equal(payload.message, "Verification code resent successfully");
    assert.ok(savedUser);
    assert.ok(savedUser.verificationCode);
    assert.ok(savedUser.verificationCodeExpiry > Date.now());
  });
});

