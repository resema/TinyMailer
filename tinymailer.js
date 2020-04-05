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
    const staffEmails = {
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
    messaging.getMailInformation(youtube);

    // Read Staff List
    let staffList = utils.readJSON(filepath + 'staffList.json');
    staffEmails.addresses = staffList.addresses;

    let timeSpan = timing.getInitialSpan();
    var isRunning = true;
    while(isRunning) {
        polling.getClassClients(isClassFound, youtube)
        .then(emailList => {
            // fill white list with new email addresses
            // console.log(emailList);
            let whiteList = [];
            for(let i = 0; i < emailList.length; i++) {
                if(blackList.indexOf(emailList[i]) == -1) {
                    // console.log(emailList[i]);
                    blackList.push(emailList[i]);
                    whiteList.push(emailList[i]);
                }
            }
            // Send mails to staff and clients
            messaging.sendAllMails(staffEmails, whiteList, blackList.length);
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

    // Show new link info
    gui.showNewLink(blackList);

    // Need to resend the mail or quit
    let isFinished = false;
    while(!isFinished) {
        // Get new link
        isFinished = await messaging.resendLink(staffEmails, blackList);
    }
    
    gui.byebye();
}

main();