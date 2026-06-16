import { Router } from "express";

import { uploadMedia } from "../controllers/media.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { mediaUpload } from "../middlewares/upload.middleware.js";

const mediaRouter = Router();

mediaRouter.post("/upload", authenticate, mediaUpload.single("file"), uploadMedia);

export default mediaRouter;
