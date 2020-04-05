"use strict";
const prompts = require('prompts');

const theme = require('./colortheme');
const flags = require('./flags');
const utils = require('./utils');


// Show intro message and ask for link
async function showIntroAndAskForLink() {
    let version = utils.readJSON('./version.json');

    // Get YouTube link
    if(!flags.CONSOLE_ACTIVE) {
        console.clear();
    }
    console.log(theme.bar(  '**********************************************************'));
    console.log(theme.title('Live Streaming Helper                             ') + theme.italic(version.version));
    console.log(theme.bar(  '**********************************************************'));
    let youtube = await prompts({
        type: 'text',
        name: 'link',
        message: 'Enter the YouTube link:',
        initial: '',
        validate: link => link.match(/http/i) ? true : 'Not valid input'
    });

    return youtube;
}

// Print class information
function showClassInfo(classData, curClass, youtube) {
    if(!classData.status) {
        classData.status = true;
        classData.classId = curClass.Id;
        classData.startDate = new Date(curClass.StartDateTime);

        let startDateAndTime = curClass.StartDateTime.toLocaleString().split('T');
        let endDateAndTime = curClass.EndDateTime.toLocaleString().split('T');

        if(!flags.CONSOLE_ACTIVE) {
            console.clear();
        }
        console.log(theme.bar('**********************************************************'));
        console.log(theme.title('Actual class: \t\t') + curClass.ClassDescription.Name);
        console.log(theme.title('Start time: \t\t') + startDateAndTime[0] + ', ' + startDateAndTime[1]);
        console.log(theme.title('End time: \t\t') + endDateAndTime[0] + ', ' + endDateAndTime[1]);
        console.log();
        console.log(theme.title('YouTube link: \t\t' + youtube.link));
        console.log();
        console.log(theme.italic('To quit the tool: \t') + theme.italic('CTRL + C'));
        console.log(theme.bar('**********************************************************'));

        if(flags.DEV) {
            console.log(theme.warning('DEV Flags: ') + theme.error('DEV mode'));
        }
        if(!flags.POOLING_ACTIVE) {
            console.log(theme.warning('DEV Flags: ') + theme.error('No POOLING activated'));
        }
        if(!flags.MAILING_ACTIVE) {
            console.log(theme.warning('DEV Flags: ') + theme.error('No MAILING activated'));
        }
        if(flags.TIMEWARP_ACTIVE) {
            console.log(theme.warning('DEV Flags: ') + theme.error('TIMEWARP activated'));
        }
    }
}

// Show new link info
function showNewLink(emails) {
    if(!flags.CONSOLE_ACTIVE) {
        console.clear();
    }
    console.log(theme.bar(  '**********************************************************'));
    console.log(theme.title('Resend emails with new link? - ') + theme.italic('To quit press \"Ctrl + C\"'));
    console.log(theme.bar(  '**********************************************************'));
    console.log(emails);
}

// Get new link
async function getNewLink(youtube) {
    let newLink = await prompts({
        type: 'text',
        name: 'link',
        message: 'Enter a new YouTube link or resend same link:',
        initial: youtube.link,
        validate: link => link.match(/http/i) ? true : 'Not valid input'
    });

    return newLink;
}

// Byebye message
function byebye() {
    // Terminating app
    console.log();
    console.log(theme.title('Bye bye 🙏'));
}

module.exports = {
    showIntroAndAskForLink: showIntroAndAskForLink,
    showClassInfo: showClassInfo,
    showNewLink: showNewLink,
    getNewLink: getNewLink,
    byebye: byebye
}