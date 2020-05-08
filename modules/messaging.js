"use strict";
const nodemailer = require("nodemailer");

const theme = require('./colortheme');
const flags = require('./flags');
const utils = require('./utils');
const gui = require('./gui');

// Email information
const mailInfo = {
    address: '',
    subject: '',
    plaintext: '',
    htmltext: '',
};

// Authenthication information
let authInfo;

// Create HTML message
function createMessage(link) {
    let message = utils.readHTML('./email/message.html');
    return message.replace(/YOUTUBE_LINK/g, link);
}

// CLI
// Replace fields in email
function replaceFieldsInMail(curClass) {
    let options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}
    let startDateAndTime = curClass.startDate.toLocaleString('de-CH', options);
    mailInfo.subject = mailInfo.subject.concat(' - ', curClass.classDescription, ', ' , startDateAndTime);
    mailInfo.htmltext = mailInfo.htmltext.replace(/CLASSNAME/g, curClass.classDescription);
}

// Get Mail info
function getMailInformation(youtube) {
    let mailData = utils.readJSON('./email/metadata.json');
    mailInfo.address = mailData.emailaddress;
    mailInfo.subject = mailData.subject;
    mailInfo.plaintext = mailData.plaintext.replace(/YOUTUBE_LINK/g, youtube);
    mailInfo.htmltext = createMessage(youtube);

    return mailInfo;
}

// Creates Mail info and returns it
function createMailInformation(youtube, classModel) {
    let mailData = utils.readJSON('./email/metadata.json');
    mailInfo.address = mailData.emailaddress;
    mailInfo.subject = mailData.subject;
    mailInfo.plaintext = mailData.plaintext.replace(/YOUTUBE_LINK/g, youtube);
    mailInfo.htmltext = createMessage(youtube);

    let classDate = new Date(classModel.startDate);
    let options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}
    let startDateAndTime = classDate.toLocaleString('de-CH', options);
    mailInfo.subject = mailInfo.subject.concat(' - ', classModel.name, ', ' , startDateAndTime);
    mailInfo.htmltext = mailInfo.htmltext.replace(/CLASSNAME/g, classModel.name);

    return mailInfo;
}

// Set authentication information
function setAuthentication(info) {
    authInfo = info;
}

// send mail with defined transport object
function sendMails(addresses, cli = false)
{
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: authInfo.host,
        port: authInfo.port,
        secure: true,
        auth: {
            user: authInfo.user,
            pass: authInfo.pwd
        }
    });

    return new Promise((resolve,reject) => {
        addresses.forEach(function(client) {
            // create message
            let message = {
                from: mailInfo.address, // sender address
                to: client.emailaddr, // list of receivers
                subject: mailInfo.subject, // Subject line
                text: mailInfo.plaintext, // plain text body
                html: mailInfo.htmltext.replace(/VORNAME/g, client.firstname)
            };

            if(addresses.length == 0) {
                if(flags.DEV) {
                    reject(theme.error('No new users!'));                
                }
                reject('There was a problem!');
            } else {
                if(flags.MAILING_ACTIVE) {
                    transporter.sendMail(message)
                    .then(info => {
                        if (!cli) {
                            console.log(info);
                        }
                        resolve(addresses);
                    })
                    .catch(err => reject(err));
                } else {
                    // No mailing
                    resolve(addresses);
                }
            }
        });
    });
}

// CLI
// Send mails to staff and clients
async function sendAllMails(staff, clients, cli = false) {
    // Send mails to staff first
    if(!staff.status) {
        staff.status = true;
        console.log(theme.italic('Staff mails sent: ') + staff.addresses.length);
        sendMails(staff.addresses, cli)
        .then(staff => {
            if(flags.DEV) {
                console.log(staff)
            }
        })
        .catch(err => {
            if(flags.DEV) {
                console.log(theme.error('Staff email sending failed: ' + err));
            }
        });
    }
    // Send mails to clients
    sendMails(clients, cli)
    .then(sentClients => {
        gui.showClientInfo(clients);
    })
    .catch(err => {
        console.log(theme.error('Client email sending failed: ') + err);
    });
}

// CLI
// Resend Link, returns true if user wants to exit
async function resendLink(staff, clients, youtube) {
    // get the new link
    let sendInfo = await gui.getNewLinkAndToWho(youtube);
    getMailInformation(sendInfo.link);

    if(sendInfo.link != undefined) {
        // set the new link as valid
        youtube.link = sendInfo.link;

        // Resend staff and client mails
        let resend = [];
        if(sendInfo.who == undefined) {
            return false;
        } else if(sendInfo.who == 0) {
            staff.status = false;
            resend = clients;
        } else if(sendInfo.who == 'N' || sendInfo.who == 'n') {
            let newEmails = await gui.getNewEmailAddresses();
            if(newEmails == undefined) {
                return true;
            }
            for(let idx = 0; idx < newEmails.address.length; idx++) {
                let client = new Client();
                // Create unique id
                client.id = new Date().valueOf();
                client.firstname = '';
                client.lastname = 'manually added';
                client.email = newEmails.address[idx];
                resend.push(client);
                clients.push(client);
            }
        } else {
            for(let idx = 0; idx < sendInfo.who.length; idx++) {
                let index = parseInt(sendInfo.who[idx])-1;
                resend.push(clients[index]);
            }
        }
        await sendAllMails(staff, resend, true);
       
        // Wait a bit....
        await utils.sleep(5000);
       
        return false;
    }
    return true;
}

module.exports = {
    createMailInformation: createMailInformation,
    getMailInformation: getMailInformation,
    setAuthentication: setAuthentication,
    replaceFieldsInMail: replaceFieldsInMail,
    sendMails: sendMails,
    sendAllMails: sendAllMails,
    resendLink: resendLink
}