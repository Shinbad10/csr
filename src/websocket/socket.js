import { Server } from "socket.io";
import jwt from "jsonwebtoken";

export const setupSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Unauthorized"));

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return next(new Error("Forbidden"));
      socket.user = user;
      next();
    });
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.email}`);

    socket.on("message", async (data) => {
      console.log(`Message from ${socket.user.email}:`, data);
      io.emit("message", { user: socket.user.email, text: data });
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user.email}`);
    });
  });

  return io;
};
