import express from 'express';
import * as path from 'path';
import { WebSocketServer } from 'ws';
import http from 'http';
import { consumeKafkaMessages } from './loggerConsumer';
const app = express();

const wsServer = new WebSocketServer({ noServer: true });
export const clients = new Set<WebSocket>();

wsServer.on("connections", (ws) => {
  console.log("New logger client connected");
  clients.add(ws);

  ws.on("close", () => {
    console.log("Logger client disconnected");
    clients.delete(ws);
  });
});

const server = http.createServer(app);

server.on("upgrade", (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, (ws) => {
    wsServer.emit("connection", ws, request);
  });
});


const port = process.env.PORT || 6008;

server.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
// server.on('error', console.error);


//start kafka consumer
consumeKafkaMessages();