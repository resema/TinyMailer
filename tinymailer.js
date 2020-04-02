"use strict";
const fs = require('fs');
const nodemailer = require("nodemailer");
const MBO = require('mindbody-sdk');
const prompts = require('prompts');
const chalk = require('chalk');

// Dev flags
let DEV = false;
let CONSOLE_ACTIVE = false;
let TIMEWARP_ACTIVE = false;

// Going live flags
let MAILING_ACTIVE = false;
let POOLING_ACTIVE = true;
let CONFIGURATION_ACTIVE = true;

// Theme flag
let DARKTHEME_ACTIVE = true;

// Configuration color theme
let error = chalk.bold.redBright;
let warning = chalk.bold.italic.yellow;
let bar = chalk.magenta;
let title;
let italic;
if(DARKTHEME_ACTIVE) {
    title = chalk.bold.whiteBright;
    italic = chalk.italic.white;
} else {
    title = chalk.bold;
    italic = chalk.italic;
}

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

// Send mails to staff and clients
async function sendAllMails(staffEmails, clientEmails, nbrOfMailsSent) {
    // Send mails to staff first
    if(!staffEmails.status) {
        staffEmails.status = true;
        sendMail(staffEmails.addresses)
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
    sendMail(clientEmails)
    .then(sentEmails => {
        console.log(sentEmails)
        console.log(italic('Current sent mails: ') + sentEmails.length);
        console.log('Total sent mails: ' + nbrOfMailsSent);
    })
    .catch(err => {
        if(DEV) {
            console.log(error('Client email sending failed: ') + err);
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
                    reject('findClass: No class found');
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
            let fakeEmails = ['renato.semadeni@gmail.com'];
            resolve(fakeEmails);
        }
    });
}

// Show intro message and ask for link
async function showIntroAndAskForLink() {
    let version = readJSON('./version.json');

    // Get YouTube link
    if(!CONSOLE_ACTIVE) {
        console.clear();
    }
    console.log(bar(  '**********************************************************'));
    console.log(title('Live Streaming Helper                             ') + italic(version.version));
    console.log(bar(  '**********************************************************'));
    let youtube = await prompts({
        type: 'text',
        name: 'link',
        message: 'Enter the YouTube link:',
        initial: '',
        validate: link => link.match(/http/i) ? true : 'Not valid input'
    });

    return youtube;
}

// Show new link info
function showNewLink () {
    if(!CONSOLE_ACTIVE) {
        console.clear();
    }
    console.log(bar(  '**********************************************************'));
    console.log(title('Resend emails with new link? - ') + italic('To quit press \"Ctrl + C\"'));
    console.log(bar(  '**********************************************************'));
}

// Get new link
async function getNewLink() {
    let newLink = await prompts({
        type: 'text',
        name: 'link',
        message: 'Enter a new YouTube link:',
        initial: '',
        validate: link => link.match(/http/i) ? true : 'Not valid input'
    });

    return newLink;
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

// Byebye message
function byebye() {
    // Terminating app
    console.log();
    console.log(title('Bye bye 🙏'));
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

    let youtube = await showIntroAndAskForLink();

    // If ctrl+c is clicked, terminated app
    if(youtube.link == undefined) {
        byebye();
        return;
    }

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
            // Send mails to staff and clients
            sendAllMails(staffEmails, whiteList, blackList.length);
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

    // if no class is found exit
    if(isClassFound.classId == -1) {
        byebye();
        return;
    }

    // Show new link info
    showNewLink();

    // Need to resend the mail or quit
    let isFinished = false;
    while(!isFinished) {
        // Get new link
        isFinished = await resendLink(staffEmails, blackList);
    }
    
    byebye();
}

main();