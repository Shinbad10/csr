import express from "express";
import http from "http";
import cors from "cors";
import authRoutes from "./src/routes/authRoutes.js";
import appRoutes from "./src/routes/index.js";
import { setupSocket } from "./src/websocket/socket.js";
import config from './src/config/dotenv.js'
const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cors({
    origin: '*'
  }));
  

app.use("/api/auth", authRoutes);
app.use("/api", appRoutes);

setupSocket(server);

server.listen(config.PORT, () => console.log(`Server running on port ${config.PORT}`));
