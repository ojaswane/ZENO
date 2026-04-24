import { io } from "socket.io-client";

const socket = io("http://localhost:4000");

socket.on("connect", () => {
  socket.emit("create-session");
});

socket.on("session-created", ({ sessionId, qrCodeDataUrl, serverUrl }) => {
  // eslint-disable-next-line no-console
  console.log("Session ID:", sessionId);
  // eslint-disable-next-line no-console
  console.log("Server URL:", serverUrl);
  // eslint-disable-next-line no-console
  console.log("QR data URL length:", qrCodeDataUrl.length);

  socket.emit("user-command", { sessionId, text: "open chrome" });
});

socket.on("assistant-response", ({ command }) => {
  // eslint-disable-next-line no-console
  console.log("Assistant:", command);
});

socket.on("command-result", (r) => {
  // eslint-disable-next-line no-console
  console.log("Result:", r);
});

socket.on("error", (e) => {
  // eslint-disable-next-line no-console
  console.log("Error:", e);
});

