"use strict"

// modules
const polling = require('../polling');
const messaging = require('../messaging');
const timing = require('../timing');
const database = require('../db/nosql');
const theme = require('../colortheme');
const flags = require('../flags');
const utils = require('../utils');

let timeSpan = timing.getInitialSpan();

function prepare(io) {
    // Get all classes of the day
    let classes = []
    polling.getAllClasses(classes)
    .then(_ => {
        utils.sortClassByDateTime(classes);
        classes.forEach((elem) => {
            database.addClass(elem.id, elem);
        });
        database.show();
        io.emit('classes', 'new classes');
    })
    .catch((err) => {
        console.log(theme.error(err));
    });
}

// start main loop
async function run(io, selClass) {
    timeSpan.isRunning = true;
    timeSpan = timing.getTimeSpan(selClass);

    // Read Staff List
    if(timeSpan.isRunning) {
        const configPath = utils.getConfigFile();
        let staffList = utils.readJSON(configPath + '/staffList.json');
        messaging.sendMails(staffList.addresses)
    }

    while(timeSpan.isRunning) {
        // poll all clients of the class
        let clients = [];
        polling.getAllClientsByClassID(selClass.id, clients)
        .then((res) => {
            // add to DB
            let newClients = database.addClients(selClass.id, clients);
            console.log('New Clients:')
            console.log(newClients); 

            // print the infos
            if (flags.DEV) {
                database.show(false);
                console.log('Timespan: ' + timeSpan.milliseconds.toString());
            }

            // send Mails to new Clients
            messaging.sendMails(newClients);

            // emit the ticktock
            io.emit('update', timeSpan.milliseconds.toString());
        })
        .catch((err) => { 
            console.log(theme.error(err))
        });

        timeSpan = timing.getTimeSpan(selClass);
        await utils.sleep(timeSpan.milliseconds);
    }
    console.log('Main Loop finished.');
}

// stop main loop
function stop() {
    timeSpan.isRunning = false;
    database.removeClients();
    console.log('Main Loop stopped.')
}

module.exports = {
    prepare: prepare,
    run: run,
    stop: stop
}