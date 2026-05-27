import { Router } from "express";\nimport { getMessages } from "../controllers/chatController.js";\nconst router = Router();\nrouter.get("/", getMessages);\nexport default router;
