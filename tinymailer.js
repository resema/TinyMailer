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

async function main() {
    // Email sent black list
    const blackList = [];
    // Class data
    const isClassFound = { 
        status: false,
        classId: -1,
        startDate: new Date() 
    };
    // Info message box
    const isInfoShowed = {
        status: false
    };

    // Staff email addresses
    const staff = {
        status: false,
        addresses: []
    };

    // Define filepath
    const filepath = utils.getFilepath();

    let youtube = await gui.showIntroAndAskForLink();

    // If ctrl+c is clicked, terminated app
    if(youtube.link == undefined) {
        gui.byebye();
        return;
    }

    let divisor = 1;
    if(flags.TIMEWARP_ACTIVE) {
        divisor = 100;
    }

    // Read Auth File
    let authInfo = configuration.getAuthenticationInfo(filepath);
    messaging.setAuthentication(authInfo);
    polling.setAuthentication(authInfo);

    // Read Mail File
    messaging.getMailInformation(youtube.link);

    // Read Staff List
    let staffList = utils.readJSON(filepath + 'staffList.json');
    staff.addresses = staffList.addresses;
    console.log(staff);

    let timeSpan = timing.getInitialSpan();
    while(timeSpan.isRunning) {
        polling.getClassClients(isClassFound, youtube)
        .then(clients => {
            // fill white list with new clients
            let whiteList = [];
            for(let i = 0; i < clients.length; i++) {
                if(blackList.indexOf(clients[i]) == -1) {
                    blackList.push(clients[i]);
                    whiteList.push(clients[i]);
                }
            }
            // Send mails to staff and clients
            messaging.sendAllMails(staff, whiteList);
        })
        .catch(err => {
            if(flags.DEV) {
                console.log(theme.error(err));
            }
        });

        await utils.sleep(timeSpan.milliseconds / divisor);

        // adjust time span
        timeSpan = await timing.getTimeSpan(isClassFound);
    }

    // if no class is found exit
    if(isClassFound.classId == -1) {
        gui.byebye();
        return;
    }

    // Need to resend the mail or quit
    let isFinished = false;
    while(!isFinished) {
        // Show new link info
        gui.showNewLink(blackList);

        // Get new link
        isFinished = await messaging.resendLink(staff, blackList, youtube);
    }
    
    gui.byebye();
}

main();