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

// Client informations
function Client() {
    this.name = '';
    this.email =  '';
}

// Create HTML message
function createMessage(youtube) {
    let message = utils.readHTML('./email/message.html');
    return message.replace(/YOUTUBE_LINK/g, youtube);
}

// Get Mail info
function getMailInformation(youtube) {
    let mailData = utils.readJSON('./email/metadata.json');
    mailInfo.address = mailData.emailaddress;
    mailInfo.subject = mailData.subject;
    mailInfo.plaintext = mailData.plaintext.replace(/YOUTUBE_LINK/g, youtube);
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

    return new Promise((resolve,reject) => {
        whiteList.forEach(function(client) {
            // create message
            let message = {
                from: mailInfo.address, // sender address
                to: client.email, // list of receivers
                subject: mailInfo.subject, // Subject line
                text: mailInfo.plaintext, // plain text body
                html: mailInfo.htmltext.replace(/VORNAME/g, client.name)
            };

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
    });
}

// Send mails to staff and clients
async function sendAllMails(staff, clients) {
    // Send mails to staff first
    if(!staff.status) {
        staff.status = true;
        sendMail(staff.addresses)
        .then(staff => {
            console.log(theme.italic('Staff mails sent: ') + staff.length);
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
    sendMail(clients)
    .then(sentClients => {
        gui.showClientInfo(clients);
    })
    .catch(err => {
        if(flags.DEV) {
            console.log(theme.error('Client email sending failed: ') + err);
        }
    });
}

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
                client.name = '';
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
        await sendAllMails(staff, resend);
       
        // Wait a bit....
        await utils.sleep(5000);
       
        return false;
    }
    return true;
}

module.exports = {
    Client: Client,
    getMailInformation: getMailInformation,
    setAuthentication: setAuthentication,
    sendMail: sendMail,
    sendAllMails: sendAllMails,
    resendLink: resendLink
}