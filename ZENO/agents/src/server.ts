import http from "node:http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";

import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "./sockets/events";
import { createSessionStore } from "./sessions/store";
import { registerSocketHandlers } from "./sockets/handlers";
import { renderQrPage } from "./http/qrPage";

export type StartOptions = {
  port: number;
  serverUrlOverride: string | undefined;
  geminiApiKey: string | undefined;
  geminiModel: string;
  elevenLabsApiKey: string | undefined;
  elevenLabsVoiceId: string | undefined;
  elevenLabsVoiceName: string;
  elevenLabsModelId: string;
};

export function startServer(options: StartOptions): http.Server {
  const app = express();
  app.use(cors({ origin: "*" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/qr", (_req, res) => {
    res.type("html").send(renderQrPage());
  });

  const httpServer = http.createServer(app);

  const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
    cors: { origin: "*" },
  });

  const sessions = createSessionStore({ ttlMs: 10 * 60 * 1000 });

  const interval = setInterval(() => {
    sessions.pruneExpired(Date.now());
  }, 30_000);
  interval.unref();

  io.on("connection", (socket) => {
    registerSocketHandlers({
      io,
      socket,
      sessions,
      port: options.port,
      serverUrlOverride: options.serverUrlOverride,
      geminiApiKey: options.geminiApiKey,
      geminiModel: options.geminiModel,
      elevenLabsApiKey: options.elevenLabsApiKey,
      elevenLabsVoiceId: options.elevenLabsVoiceId,
      elevenLabsVoiceName: options.elevenLabsVoiceName,
      elevenLabsModelId: options.elevenLabsModelId,
    });
  });

  httpServer.listen(options.port, () => {
    // eslint-disable-next-line no-console
    console.log(`ZENO server running on port ${options.port}`);
    // eslint-disable-next-line no-console
    console.log(`Pairing UI: http://localhost:${options.port}/qr`);
  });

  return httpServer;
}
