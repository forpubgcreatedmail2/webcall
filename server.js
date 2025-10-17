// Simple Express + ws based signaling server
const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');


const app = express();
const PORT = process.env.PORT || 3000;


// Serve static frontend from /public
app.use(express.static(path.join(__dirname, 'public')));


const server = http.createServer(app);
const wss = new WebSocket.Server({ server });


// Map of userId -> ws
const clients = new Map();


wss.on('connection', (ws) => {
ws.on('message', (raw) => {
let msg;
try {
msg = JSON.parse(raw);
} catch (e) {
console.warn('invalid JSON', raw);
return;
}


const { type, from, to, data } = msg;


if (type === 'register') {
// Client registers as a userId
clients.set(from, ws);
ws.userId = from;
console.log(`registered ${from}`);
return;
}


// Forward messages / signaling to the target if connected
if (to && clients.has(to)) {
const target = clients.get(to);
target.send(JSON.stringify({ type, from, data }));
} else if (to) {
// If target not found, notify sender
ws.send(JSON.stringify({ type: 'error', message: `User ${to} not connected` }));
}
});


ws.on('close', () => {
if (ws.userId) {
clients.delete(ws.userId);
console.log(`disconnected ${ws.userId}`);
}
});
});


server.listen(PORT, () => {
console.log(`Server listening on port ${PORT}`);
});  