"use strict";
const flags = require('./flags');
const theme = require('./colortheme');

// Pooling time span
const timeSpan = {
    milliseconds: 10000,
    counter: 0
};

// Get initial timespan
function getInitialSpan() {
    return timeSpan;
}

// Get actual timespan or terminate app
function getTimeSpan(isClassFound) {
    // increase counter
    timeSpan.counter++;

    // Check if tinymailer can be terminated or time span adapted.
    var europeTime = new Date().toLocaleString("en-US", {timeZone: "Europe/Berlin"});
    var curTime = new Date(europeTime);
    if(flags.DEV && !flags.CONFIGURATION_ACTIVE) {
        var usTime = new Date().toLocaleString("en-US", {timeZone: "America/Los_Angeles"});
        curTime = new Date(usTime);
    }
    var diffMin = Math.floor(curTime - isClassFound.startDate)/1000/60;

    if(diffMin > 2) {
        isRunning = false;
    }
    else if(diffMin <= -20) {
        timeSpan.milliseconds = 300000;     // +20min before class
    }
    else if(diffMin > -5) {
        timeSpan.milliseconds = 20000;      // +5min before class
    }
    else if(diffMin > -11) {
        timeSpan.milliseconds = 30000;      // +11min before class
    }
    else if(diffMin > -20) {
        timeSpan.milliseconds = 60000;      // +20min before clas 
    }

    if(flags.DEV) {
        console.log('curTime: ' + curTime);
        console.log('startDate: ' + isClassFound.startDate);
        console.log(diffMin);
        console.log(theme.italic(timeSpan.milliseconds));
        console.log(timeSpan.counter);
    }

    return timeSpan;
}

module.exports = {
    getInitialSpan: getInitialSpan,
    getTimeSpan: getTimeSpan
}