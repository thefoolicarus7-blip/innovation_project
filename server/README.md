# Nysa Server - Express

Express server that runs the same app on both Node.js and Bun.

## Features

- ✅ Express-based HTTP server
- ✅ Same route behavior on Node.js and Bun
- ✅ TypeScript-first setup
- ✅ Tests runnable on both runtimes

## Quick Start

### Prerequisites
- [Bun](https://bun.sh) installed
- Node.js 20+ (for Node run/test scripts)

### Installation

```bash
bun install
```

### Development

```bash
bun run dev
```

or with Bun runtime directly:

```bash
bun run dev:bun
```

The server will start at `http://localhost:3000`

### Testing

```bash
bun test
```

or test the same app with Node:

```bash
bun run test
```

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /api` - Welcome message
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login and receive JWT
- `GET /api/users/me` - Get current user profile (requires `Authorization: Bearer <token>`)
- `GET /api/jobs?offset=0&limit=10` - Get swipeable jobs (auth required)
- `POST /api/jobs/:jobId/swipe` - Save swipe action (`left`/`right`/`up`) (auth required)
- `GET /api/applications?tab=matches|let_it_go` - Get applied jobs grouped by tab (auth required)
- `POST /api/media/upload` - Upload image/pdf to Cloudinary via multipart `file` field (auth required)

## Project Structure

```
server/
├── src/
│   └── index.ts          # Express app + startup
├── __tests__/
│   └── server.test.ts    # Runtime-agnostic test suite
├── package.json          # Dependencies
└── README.md            # This file
```

## Configuration

### Environment Variables

- `PORT` - Server port (default: 3000)
- `JWT_SECRET` - Secret used to sign and verify JWT tokens
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

Example:

```bash
PORT=3000
JWT_SECRET=super-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Upload Request Example

```bash
curl -X POST http://localhost:3000/api/media/upload \
	-H "Authorization: Bearer <token>" \
	-F "file=@/absolute/path/to/resume.pdf"
```

Set via `.env` file or directly:
```bash
PORT=8000 bun run dev
```

## Building

This template runs TypeScript directly. Production builds can be added later if needed.

## License

MIT
