"use strict";
const nodemailer = require("nodemailer");

const configuration = require('./configuration');
const theme = require('./colortheme');
const flags = require('./flags');
const utils = require('./utils');

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
function createMessage(youtube) {
    let message = utils.readHTML('./email/message.html');
    return message.replace(/YOUTUBE_LINK/g, youtube.link);
}

// Get Mail info
function getMailInformation(youtube) {
    let mailData = utils.readJSON('./email/metadata.json');
    mailInfo.address = mailData.emailaddress;
    mailInfo.subject = mailData.subject;
    mailInfo.plaintext = mailData.plaintext;
    mailInfo.htmltext = createMessage(youtube);
}

// Set authentication information
function setAuthentication(info) {
    authInfo = info;
}

// send mail with defined transport object
function sendMail(whiteList)
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

    let message = {
        from: mailInfo.address, // sender address
        bcc: whiteList.join(', '), // list of receivers
        subject: mailInfo.subject, // Subject line
        text: mailInfo.plaintext, // plain text body
        html: mailInfo.htmltext
    };

    return new Promise((resolve,reject) => {
        if(whiteList.length == 0) {
            if(flags.DEV) {
                reject(theme.error('No new users!'));                
            }
            reject();
        } else {
            if(flags.MAILING_ACTIVE) {
                transporter.sendMail(message).then(info => {
                        // console.log(info);
                        resolve(whiteList);
                }).catch(err => reject(err));
            } else {
                // No mailing
                resolve(whiteList);
            }
        }
    });
}

// Send mails to staff and clients
async function sendAllMails(staffEmails, clientEmails, nbrOfMailsSent) {
    // Send mails to staff first
    if(!staffEmails.status) {
        staffEmails.status = true;
        sendMail(staffEmails.addresses)
        .then(staffEmails => {
            console.log(theme.italic('Staff mails sent: ') + staffEmails.length);
            if(flags.DEV) {
                console.log(staffEmails)
            }
        })
        .catch(err => {
            if(flags.DEV) {
                console.log(theme.error('Staff email sending failed: ' + err));
            }
        });
    }
    // Send mails to clients
    sendMail(clientEmails)
    .then(sentEmails => {
        console.log(sentEmails)
        console.log(theme.italic('Current sent mails: ') + sentEmails.length);
        console.log('Total sent mails: ' + nbrOfMailsSent);
    })
    .catch(err => {
        if(flags.DEV) {
            console.log(theme.error('Client email sending failed: ') + err);
        }
    });
}

// Resend Link, returns true if user wants to exit
async function resendLink(staffEmails, clientEmails) {
    // get the new link
    let newLink = await getNewLink();
    getMailInformation(newLink);

    if(newLink.link != undefined) {
        // Resend staff and client mails
        staffEmails.status = false;
        await sendAllMails(staffEmails, clientEmails, clientEmails.length);
       
        // Wait a bit....
        await sleep(10000);
       
        return false;
    }
    return true;
}

module.exports = {
    getMailInformation: getMailInformation,
    setAuthentication: setAuthentication,
    sendMail: sendMail,
    sendAllMails: sendAllMails,
    resendLink: resendLink
}