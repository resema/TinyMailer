"use strict";
const MBO = require('mindbody-sdk');

const flags = require('./flags');
const gui = require('./gui');

// Authentication information
let authInfo;

// Set authentication information
function setAuthentication(info) {
    authInfo = info;
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
                    gui.showClassInfo(classData, curClass, youtube);

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
                    gui.showClassInfo(classData, noClass, youtube);                    
                    reject('findClass: No class found');
                }
            }
        }

        // Main Pooling loop: Get all Classes
        if(flags.POOLING_ACTIVE) {
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
            gui.showClassInfo(classData, fakeClass, youtube);
            let fakeEmails = ['renato.semadeni@gmail.com'];
            resolve(fakeEmails);
        }
    });
}

module.exports = {
    setAuthentication: setAuthentication,
    getClassClients: getClassClients
}