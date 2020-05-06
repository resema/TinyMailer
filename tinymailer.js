"use strict";

// modules
const theme = require('./modules/colortheme');
const flags = require('./modules/flags');
const configuration = require('./modules/configuration');
const utils = require('./modules/utils');
const messaging = require('./modules/messaging');
const gui = require('./modules/gui');
const polling = require('./modules/polling');
const timing = require('./modules/timing');

// Define filepath
const filepath = utils.getFilepath();

// Read Auth File
let authInfo = configuration.getAuthenticationInfo(filepath);
messaging.setAuthentication(authInfo);
polling.setAuthentication(authInfo);

// backend and api settings
var express = require('express');
var app = express();
var apiController = require('./modules/controller/apiControllers');

// setting up the controller
apiController(app);

var port = process.env.PORT || 3000;
app.listen(port);