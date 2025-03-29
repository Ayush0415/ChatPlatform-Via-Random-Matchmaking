// const http = require('http');

// const server = http.createServer((req, res) => {
//     res.writeHead(200, { 'Content-Type': 'text/plain' });
//     res.end('Hello, World!\n');
// });

// const PORT = 3000;
// server.listen(PORT, () => {
//     console.log(`Server chal raha hai: http://localhost:${PORT}`);
// });


const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server);


const waitingUsers = [];

app.use(express.static('public')); 

io.on('connection', (socket) => {
    
    const sessionId = uuidv4();
    socket.sessionId = sessionId;
    socket.emit('session', sessionId); 
    console.log(`New User Connected: ${sessionId}`);

   
    if (waitingUsers.length > 0) {
        
        const partnerSocket = waitingUsers.shift();
        const partnerSessionId = partnerSocket.sessionId;


        socket.partner = partnerSocket;
        partnerSocket.partner = socket;

        
        socket.emit('chat_start', { partnerId: partnerSessionId });
        partnerSocket.emit('chat_start', { partnerId: sessionId });
        console.log(`Matched: ${sessionId} aur ${partnerSessionId}`);
    } else {
        
        waitingUsers.push(socket);
        socket.emit('waiting', 'wait for someone to join the chat...');
    }


    socket.on('message', (data) => {
        if (socket.partner) {
            socket.partner.emit('message', { sender: sessionId, text: data.text });
        }
    });

    
    socket.on('disconnect', () => {
        if (socket.partner) {
            socket.partner.emit('chat_end', ' partner disconnect ho gaya.');
            socket.partner.partner = null;
        } else {
            const index = waitingUsers.indexOf(socket);
            if (index !== -1) waitingUsers.splice(index, 1);
        }
        console.log(`User disconnected: ${sessionId}`);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server Started: http://localhost:${PORT}`);
});