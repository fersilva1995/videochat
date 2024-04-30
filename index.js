const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require("path");



const privateKey  = fs.readFileSync(path.join(__dirname,  "cert.key"), 'utf8');
const certificate = fs.readFileSync(path.join(__dirname,  "cert.crt"), 'utf8');

const credentials = {key: privateKey, cert: certificate, passphrase: 'Senha@mtw'};
const app = express();

const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);


const PORT = 4000;
httpsServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


app.use(express.static("public"))

const io = require('socket.io')(httpsServer, {
    cors: {
        origin: '*',
    }
});




io.on('connection', function(socket) {
    console.log('User Connected :' + socket.id);
    
    socket.on("join", function(roomName) {
        var rooms = io.sockets.adapter.rooms;
        var room = rooms.get(roomName);

        if(room == undefined){
            socket.join(roomName);
            socket.emit('created');
        } else if(room.size == 1){
            socket.join(roomName);
            socket.emit('joined');
        } else {
            socket.emit('full');
        }

        console.log(rooms);
    });

    socket.on("ready", function (roomName) {
        io.to(roomName).emit('ready'); //Informs the other peer in the room.
    });

    socket.on('candidate', function(candidate, roomName) {
        console.log('Candidate');
        socket.broadcast.to(roomName).emit('candidate', candidate);
    });

    socket.on('offer', function(offer, roomName) {
        console.log('Offer');
        socket.broadcast.to(roomName).emit('offer', offer);
    });

    socket.on('answer', function(answer, roomName) {
        console.log('Answer');
        socket.broadcast.to(roomName).emit('answer', answer);
    });
});
