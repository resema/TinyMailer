"use strict";

// modules
const configuration = require('./modules/configuration');
const utils = require('./modules/utils');
const messaging = require('./modules/messaging');
const polling = require('./modules/polling');
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const apiController = require('./modules/controller/apiControllers');
const serverController = require('./modules/controller/serverController');

// Define filepath
const filepath = utils.getFilepath();

// Read Auth File
let authInfo = configuration.getAuthenticationInfo(filepath);
messaging.setAuthentication(authInfo);
polling.setAuthentication(authInfo);

// Setting up controller
apiController(app);
serverController(io);

// listen on the port
var port = process.env.PORT || 4444;
http.listen(port, () => {
    console.log('listening on *:' + port);
});