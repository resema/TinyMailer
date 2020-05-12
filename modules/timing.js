"use strict";
const flags = require('./flags');
const theme = require('./colortheme');

// Pooling time span
const timeSpan = {
    isRunning: true,
    milliseconds: 10000,
    counter: 0
};

// Get initial timespan
function getInitialSpan() {
    return timeSpan;
}

function calculateMin(date0, date1) {
    const time0 = date0.split(', ')[1];
    const time1 = date1.split(', ')[1];

    const split0 = time0.split(':');
    const split1 = time1.split(':');

    const min0 = parseInt(split0[0]) * 60 + parseInt(split0[1]);
    const min1 = parseInt(split1[0]) * 60 + parseInt(split1[1]);
 
    return (min0 - min1);
}

// Get actual timespan or terminate app
function getTimeSpan(isClassFound) {    
    // increase counter
    timeSpan.counter++;

    // Check if tinymailer can be terminated or time span adapted.
    let options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}
    var europeTime = Date.now();
    var curTime = new Date(europeTime).toLocaleString("de-CH", options);;

    // var diffMin = Math.floor(date1 - date2)/1000/60;
    var diffMin = calculateMin(curTime, isClassFound.startDate)
    console.log('diffMin: ' + diffMin);

    if(diffMin > 0.16) {
        timeSpan.isRunning = false;
    }
    else if(diffMin <= -20) {
        timeSpan.milliseconds = 300000;     // more than +20min before class
    }
    else if(diffMin > -5) {
        timeSpan.milliseconds = 20000;      // less than +5min before class
    }
    else if(diffMin > -11) {
        timeSpan.milliseconds = 30000;      // less than +11min before class
    }
    else if(diffMin > -20) {
        timeSpan.milliseconds = 60000;      // less than +20min before class
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