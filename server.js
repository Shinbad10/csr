import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/authRoutes.js";
import appRoutes from "./src/routes/index.js";
import { setupSocket } from "./src/websocket/socket.js";
import config from './src/config/dotenv.js';

const app = express();

app.use(express.json());
app.use(cors({ origin: '*' }));

app.use("/api/auth", authRoutes);
app.use("/api", appRoutes);

// Export để Vercel sử dụng như một API handler
export default app;
