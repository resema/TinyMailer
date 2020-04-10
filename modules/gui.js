"use strict";
const prompts = require('prompts');

const theme = require('./colortheme');
const flags = require('./flags');
const utils = require('./utils');

// Global counter for sent emails
var cntr = 0;

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

// Show all client information sent
function showClientInfo(clients) {
    for(let idx = 0; idx < clients.length; idx++) {
        // increase global counter
        cntr++;
        const clientName = clients[idx].firstname + ' ' + clients[idx].lastname;
        console.log('[' + theme.bold(cntr) + ']' + '\t' 
        + theme.green(clientName.padEnd(30) + theme.green(clients[idx].email)));
    }
}

// Show new link info
function showNewLink(clients) {
    if(!flags.CONSOLE_ACTIVE) {
        console.clear();
    }
    console.log(theme.bar(  '**********************************************************'));
    console.log(theme.title('Resend emails with new link? - ') + theme.italic('To quit press \"Ctrl + C\"'));
    console.log(theme.bar(  '**********************************************************'));
    
    console.log('[' + theme.bold(0) + ']' + '\t' + theme.green('Complete list and staff'));
    console.log();
    showClientInfo(clients);
    console.log();
    console.log('[' + theme.bold('N') + ']' + '\t' + theme.green('New email address'));
}

// Get new link
async function getNewLinkAndToWho(youtube) {
    let sendInfo = {
        link: '',
        who: -1
    }
    let newLink = await prompts({
        type: 'text',
        name: 'link',
        message: 'Enter a new YouTube link or resend same link:',
        initial: youtube.link,
        validate: link => link.match(/http/i) ? true : 'Not valid input'
    });
    if(newLink.link == undefined) {
        sendInfo.link = undefined;
        sendInfo.who = undefined;
        return sendInfo;
    }

    let who = await prompts({
        type: 'list',
        name: 'value',
        message: 'To who should another mail be sent?',
        validate: value => value.match(/^([0-9]*(\s?,\s?[0-9]*)*$)|([N]$)/i) ? true : 'Not valid input!' 
    });
    if(who.value == undefined) {
        sendInfo.link = undefined;
        sendInfo.who = undefined;
        return sendInfo;
    }

    sendInfo.link = newLink.link;
    sendInfo.who = who.value;
    return sendInfo;
}

// Get a new email address
async function getNewEmailAddresses() {
    let newEmails = await prompts({
        type: 'list',
        name: 'address',
        message: 'Enter a new email address(es):',
        initial: ''
    });
    return newEmails;
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
    showClientInfo: showClientInfo,
    showNewLink: showNewLink,
    getNewLinkAndToWho: getNewLinkAndToWho,
    getNewEmailAddresses: getNewEmailAddresses,
    byebye: byebye
}