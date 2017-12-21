const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;
const socket = require('socket.io');

const listen = app.listen(PORT, () => {
    console.log(`listening on *:${PORT}`);
});

const io = socket(listen);


app.get(`/`, (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get(`/client`, (req, res) => {
    res.sendFile(__dirname + '/client.js');
});


io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('chat message', (msg) => {
        console.log('message: ' + msg);
        io.emit('chat message', msg);
    });
});