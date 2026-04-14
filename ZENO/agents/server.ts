const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const { handleSocketConnection } = require("./sockets/connection");
const app = express();
app.use(cors());

// creating the server
const server = http.createServer(app);

// creating the socket server
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

// socket logic
io.on("connection", (socket : any) => {
    handleSocketConnection(socket, io);
}
);

server.listen(5000, () => {
    console.log(" ZENO server running on port 5000");
});