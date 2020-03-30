"use strict";
const fs = require('fs');
const nodemailer = require("nodemailer");
const MBO = require('mindbody-sdk');
const prompts = require('prompts');
const chalk = require('chalk');

// Dev flags
let DEV = true;
let CONSOLE_ACTIVE = false;
let TIMEWARP_ACTIVE = false;

// Going live flags
let MAILING_ACTIVE = true;
let POOLING_ACTIVE = true;
let CONFIGURATION_ACTIVE = false;

// Configuration
const error = chalk.bold.redBright;
const warning = chalk.bold.italic.yellow;
const title = chalk.bold.whiteBright;
const bar = chalk.magenta;
const italic = chalk.italic.white;

// Auth information
const authInfo = {
    host: '',
    port: 465,
    emailAddr: '',
    user: '',
    pwd: '',
    apiKey: '',
    siteId: -1
};

const mailInfo = {
    address: '',
    subject: '',
    plaintext: '',
    htmltext: '',
};

// read json file
function readJSON(filename) {
    return JSON.parse(fs.readFileSync(filename, 'utf8'));
}

// read HTML file
function readHTML(filename) {
    return fs.readFileSync(filename, 'utf8');
}

// Get filepath
function getFilepath() {
    let filepath = './'
    if(CONFIGURATION_ACTIVE) {
        filepath = filepath.concat('config/');
    } else {
        filepath = filepath.concat('dev/');
    }
    return filepath;
}

// Get Authentication info
function getAuthenticationInfo(filepath) {
    // Read Auth File
    let authData = readJSON(filepath + 'authentication.json');
    authInfo.host = authData.host;
    authInfo.port = authData.port;
    authInfo.emailAddr = authData.emailaddress;
    authInfo.user = authData.username;
    authInfo.pwd = authData.password;
    authInfo.apiKey = authData.apikey;
    authInfo.siteId = authData.siteid;
}

// Get Mail info
function getMailInformation(youtube) {
    let mailData = readJSON('./email/metadata.json');
    mailInfo.address = mailData.emailaddress;
    mailInfo.subject = mailData.subject;
    mailInfo.plaintext = mailData.plaintext;
    mailInfo.htmltext = createMessage(youtube);

}

// Create HTML message
function createMessage(youtube) {
    let message = readHTML('./email/message.html');
    return message.replace(/YOUTUBE_LINK/g, youtube.link);
}

// send mail with defined transport object
function sendMail(whiteList, youtube)
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
            if(DEV) {
                reject(error('No new users!'));                
            }
            reject();
        } else {
            if(MAILING_ACTIVE) {
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

// Get all subscibed clients
function getClassClients(classData, youtube)
{
    return new Promise((resolve,reject) => {
        // Mindbody API Credentials
        var mbo = new MBO({
            ApiKey: authInfo.apiKey,
            SiteId: authInfo.siteId
        });

        // Get current date and time
        var europeTime = new Date().toLocaleString("en-US", {timeZone: "Europe/Berlin"});
        let date = new Date(europeTime).toISOString().split('.')[0];

        // Print class information
        let showClassInfo = (curClass) => {
            if(!classData.status) {
                classData.status = true;
                classData.classId = curClass.Id;
                classData.startDate = new Date(curClass.StartDateTime);

                let startDateAndTime = curClass.StartDateTime.toLocaleString().split('T');
                let endDateAndTime = curClass.EndDateTime.toLocaleString().split('T');

                if(!CONSOLE_ACTIVE) {
                    console.clear();
                }
                console.log(bar('**********************************************************'));
                console.log(title('Actual class: \t\t') + curClass.ClassDescription.Name);
                console.log(title('Start time: \t\t') + startDateAndTime[0] + ', ' + startDateAndTime[1]);
                console.log(title('End time: \t\t') + endDateAndTime[0] + ', ' + endDateAndTime[1]);
                console.log();
                console.log(title('YouTube link: \t\t' + youtube.link));
                console.log();
                console.log(italic('To quit the tool: \t') + italic('CTRL + C'));
                console.log(bar('**********************************************************'));

                if(DEV) {
                    console.log(warning('DEV Flags: ') + error('DEV mode'));
                }
                if(!POOLING_ACTIVE) {
                    console.log(warning('DEV Flags: ') + error('No POOLING activated'));
                }
                if(!MAILING_ACTIVE) {
                    console.log(warning('DEV Flags: ') + error('No MAILING activated'));
                }
                if(TIMEWARP_ACTIVE) {
                    console.log(warning('DEV Flags: ') + error('TIMEWARP activated'));
                }
            }
        }

        // Callback to return Emails
        let returnEmails = (err,data) => {
            if (err) {
                reject(err);
            } else {
                if(data.Clients.length == 0) {
                    reject('No clients in class found!');
                } else {
                    var emails = [];
                    var idx = 0;
                    for (let i = 0; i < data.Clients.length; i++)
                    {
                        if(data.Clients[i].Email != null) {
                            emails[idx] = data.Clients[i].Email;
                            idx++;
                        } else {
                            console.log(warning('Client ' + italic.blueBright(data.Clients[i].LastName + ', ' + data.Clients[i].FirstName) + ' has no email!'));
                        }
                    }
                    resolve(emails);
                }
            }
        }

        // Callback to find all Emails
        let findVisits = (err,data) => {
            if (err) {
                reject(err);
            } else {
                let ids = [];
                for(let i = 0; i < data.Class.Visits.length; i++)
                {
                    ids[i] = data.Class.Visits[i].ClientId;
                }

                mbo.client.clients({
                    'ClientIds': ids
                },returnEmails);
            }
        }

        // Callback to get all Clients from Class 
        let findClass = (err,data) => {
            if (err) {
                reject(err);
            } else {
                // Find next class
                if(data.Classes.length > 0) {
                    var idxClass = 0;
                    var nextClass = data.Classes[0].StartDateTime;
                    for(let i = 1; i < data.Classes.length; i++) {
                        var classDate = data.Classes[i].StartDateTime;
                        if (new Date(classDate) < new Date(nextClass)) {
                            nextClass = classDate;
                            idxClass = i;
                        }
                    }
                    let curClass = data.Classes[idxClass];
                    showClassInfo(curClass);

                    // Find all clients of this class
                    mbo.class.classVisits({
                        'ClassID': curClass.Id,       // Classes.Id
                    },findVisits);
                } else {
                    let noClass = {
                        Id: -1,
                        StartDateTime: '2020-01-01T12:00:00',
                        EndDateTime: '2020-01-01T13:00:00',
                        ClassDescription: {
                            Name: 'NO CLASS FOUND'
                        }
                    };
                    showClassInfo(noClass);                    
                    reject('No class found');
                }
            }
        }

        // Main Pooling loop: Get all Classes
        if(POOLING_ACTIVE) {
            // Class found            
            if(classData.status && classData.classId != -1) {
                // Find all clients of this class
                mbo.class.classVisits({
                    'ClassID': classData.classId,       // Classes.Id
                },findVisits);
            } else {
                mbo.class.classes({
                    'StartDateTime': date,
                    'HideCanceledClasses': true,
                    'SchedulingWindow': true
                },findClass);
            }
        } else {
            // Fake Pooling
            let fakeClass = { 
                StartDateTime: '20200101T12:00:00',
                EndDateTime: '20200101T13:00:00',
                ClassDescription: {
                    Name: 'Zumba'
                }
            };
            showClassInfo(fakeClass);
            let fakeEmails = ['mail.mail@mail.mail'];
            resolve(fakeEmails);
        }
    });
}

// Sleeper helper function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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
    // Pooling time span
    const timeSpan = {
        milliseconds: 10000,
        counter: 0
    };
    // Staff email addresses
    const staffEmails = {
        status: false,
        addresses: []
    };

    // Define filepath
    const filepath = getFilepath();

    // Get YouTube link
    if(!CONSOLE_ACTIVE) {
        console.clear();
    }
    console.log(bar(  '**********************************************************'));
    console.log(title('Live Streaming Helper                             v1.0.1.0'));
    console.log(bar(  '**********************************************************'));
    let youtube = await prompts({
        type: 'text',
        name: 'link',
        message: 'Enter the YouTube link:',
        // validate: link => 
    });

    let divisor = 1;
    if(TIMEWARP_ACTIVE) {
        divisor = 100;
    }

    // Read Auth File
    getAuthenticationInfo(filepath);

    // Read Mail File
    getMailInformation(youtube);

    // Read Staff List
    let staffList = readJSON(filepath + 'staffList.json');
    staffEmails.addresses = staffList.addresses;

    // Get actual timespan or terminate app
    let getTimeSpan = () => {
        // increase counter
        timeSpan.counter++;

        // Check if tinymailer can be terminated or time span adapted.
        var europeTime = new Date().toLocaleString("en-US", {timeZone: "Europe/Berlin"});
        var curTime = new Date(europeTime);
        if(DEV && !CONFIGURATION_ACTIVE) {
            var usTime = new Date().toLocaleString("en-US", {timeZone: "America/Los_Angeles"});
            curTime = new Date(usTime);
        }
        var diffMin = Math.floor(curTime - isClassFound.startDate)/1000/60;

        if(diffMin > 2) {
            isRunning = false;
            console.log();
            console.log(title('Bye bye 🙏'));
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

        if(DEV) {
            console.log('curTime: ' + curTime);
            console.log('startDate: ' + isClassFound.startDate);
            console.log(diffMin);
            console.log(italic(timeSpan.milliseconds));
            console.log(timeSpan.counter);
        }
    }

    var isRunning = true;
    while(isRunning) {
        getClassClients(isClassFound, youtube)
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
            // Send mails to staff first
            if(!staffEmails.status) {
                staffEmails.status = true;
                sendMail(staffEmails.addresses, youtube)
                .then(staffEmails => {
                    console.log(italic('Staff mails sent: ') + staffEmails.length);
                    if(DEV) {
                        console.log(staffEmails)
                    }
                })
                .catch(err => {
                    if(DEV) {
                        console.log(error('Staff email sending failed: ' + err));
                    }
                });
            }
            // Send mails to clients
            sendMail(whiteList, youtube)
            .then(sentEmails => {
                console.log(sentEmails)
                console.log(italic('Current sent mails: ') + sentEmails.length);
                console.log('Total sent mails: ' + blackList.length);
            })
            .catch(err => {
                if(DEV) {
                    console.log(error('Client email sending failed: ') + err);
                }
            });
        })
        .catch(err => {
            if(DEV) {
                console.log(error(err));
            }
        });

        await sleep(timeSpan.milliseconds / divisor);

        // adjust time span
        await getTimeSpan();
    }

}

main();