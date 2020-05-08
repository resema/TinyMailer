"use strict"

// modules
const timing = require('../timing');
const mainLoop = require('../main/loop');

module.exports = function(io) {
    // Log client connection
    io.on("connection", (socket) => {
        console.log('Frontend connected');
        mainLoop.prepare(io);

        socket.on('disconnect', () => {
            console.log('Frontend disconnected');
        });

        // Start main loop due to selected class
        socket.on('runMainLoop', (selClass) => {
            mainLoop.run(io, selClass);
          });
        
        // Stop main loop
        socket.on('stopMainLoop', (msg) => {
            mainLoop.stop();
          });
    });
}