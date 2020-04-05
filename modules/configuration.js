"use strict";
const utils = require('./utils');

// Auth information
const authInfo = {
    host: '',
    port: 465,
    emailAddr: '',
    user: '',
    pwd: '',
    apiKey: '',
    siteId: -1
};

// Get Authentication info
function getAuthenticationInfo(filepath) {
    // Read Auth File
    let authData = utils.readJSON(filepath + 'authentication.json');
    authInfo.host = authData.host;
    authInfo.port = authData.port;
    authInfo.emailAddr = authData.emailaddress;
    authInfo.user = authData.username;
    authInfo.pwd = authData.password;
    authInfo.apiKey = authData.apikey;
    authInfo.siteId = authData.siteid;

    return authInfo;
}

module.exports = {
    getAuthenticationInfo: getAuthenticationInfo
}