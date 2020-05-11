"use strict";
let fs = require('fs');
const flags = require('./flags');

// Sleeper helper function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Get filepath
function getProjectPath() {
    let filepath = process.cwd();
    return filepath;
}

// Get filepath of Configuration file
function getConfigFile() {
    let filepath = './';
    if(flags.CONFIGURATION_ACTIVE) {
        console.log(process.cwd());
        filepath = filepath.concat('config/');
    } else {
        filepath = filepath.concat('dev/');
    }
    return filepath;
}

// read json file
function readJSON(filename) {
    let file;
    try {
        // console.log(process.cwd());
        file = fs.readFileSync(filename, 'utf8');
    } catch(e) {
        console.log('Error:', e.stack);
    }
    
    return JSON.parse(file);
}

// read HTML file
function readHTML(filename) {
    let file;
    try {
        file = fs.readFileSync(filename, 'utf8');
    } catch(e) {
        console.log('Error:', e.stack);
    }
    return file;
}

// Helper function to check if object is already in list
function containsObject(obj, list) {
    var i;
    for (i = 0; i < list.length; i++) {
        if (list[i].id === obj.id) {
            return true;
        }
    }
    return false;
}

module.exports = {
    sleep: sleep,
    getProjectPath: getProjectPath,
    getConfigFile: getConfigFile,
    readJSON: readJSON,
    readHTML: readHTML,
    containsObject: containsObject
}