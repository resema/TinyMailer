"use strict";
const MBO = require('mindbody-sdk');

const gui = require('./gui');
const messaging = require('./messaging');
const flags = require('./flags');
const theme = require('./colortheme');
const ClassModel = require('../models/classModel');
const ClientModel = require('../models/clientModel');

// Authentication information
let authInfo;

// Set authentication information
function setAuthentication(info) {
    authInfo = info;
}
// Returns a status and all classes [in/out]
function getAllClasses(classes)
{
    return new Promise((resolve,reject) => {
        // Mindbody API Credentials
        var mbo = new MBO({
            ApiKey: authInfo.apiKey,
            SiteId: authInfo.siteId
        });

        // Get current date and time for polling
        var europeTime = new Date().toLocaleString("en-US");
        let date = new Date(europeTime).toISOString().split('.')[0];

        // Callback to get all Clients from Class 
        let findClass = (err,data) => {
            if (err) {
                reject('findClass: ' + err);
            } else {
                // Find all class
                if(data.Classes && data.Classes.length > 0) {
                    for(let idx = 0; idx < data.Classes.length; idx++) {
                        let classModel = new ClassModel();
                        classModel.id = data.Classes[idx].Id;
                        classModel.name = data.Classes[idx].ClassDescription.Name;
                        let options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}
                        classModel.startDate = new Date(data.Classes[idx].StartDateTime).toLocaleString("de-CH", options);
                        classModel.endDate = new Date(data.Classes[idx].EndDateTime).toLocaleString("de-CH", options);
                        classes.push(classModel);
                    }
                    resolve('Success')
                } else {    
                    reject('findClass: No classes found');
                }
            }
        }

        // Main Pooling loop: Get all Classes
        if(flags.POOLING_ACTIVE) {
            mbo.class.classes({
                'StartDateTime': date,
                'HideCanceledClasses': true,
                'SchedulingWindow': false
            },findClass)
        } else {
            // Fake Pooling
            let options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'};
            let fakeClass = new ClassModel(
                true,
                1,
                'Zumba',
                new Date('April 9 2020 22:53').toLocaleString("de-CH", options),
                new Date('April 9 2020 23:30'.toLocaleString("de-CH", options))
            );
            let fakeClass2 = new ClassModel(
                true,
                2,
                'Trampolin',
                new Date('April 19 2020 22:53').toLocaleString("de-CH", options),
                new Date('April 19 2020 23:30').toLocaleString("de-CH", options)
            );
            classes.push(fakeClass);
            classes.push(fakeClass2);
            resolve('FakeClass Success');
        }
    });
}

// Returns all clients from a class by id
function getAllClientsByClassID(id, clients)
{
    return new Promise((resolve,reject) => {
        // Mindbody API Credentials
        var mbo = new MBO({
            ApiKey: authInfo.apiKey,
            SiteId: authInfo.siteId
        });

        // Get current date and time
        // @todo rensem->rensem: de-CH
        var europeTime = new Date().toLocaleString("en-US");
        let date = new Date(europeTime).toISOString().split('.')[0];

        // Callback to return Emails
        let returnEmails = (err,data) => {
            if (err) {
                reject(err);
            } else {
                if(data.Clients.length == 0) {
                    reject('No clients in class found!');
                } else {
                    // console.log(data.Clients.length);
                    for (let i = 0; i < data.Clients.length; i++)
                    {
                        if(data.Clients[i].Email != null) {
                            let clientModel = new ClientModel(
                                                data.Clients[i].Id,
                                                data.Clients[i].FirstName,
                                                data.Clients[i].LastName,
                                                data.Clients[i].Email);
                            clients.push(clientModel);
                        } else {
                            console.log(theme.warning('Client ' + theme.italic.blueBright(data.Clients[i].LastName + ', ' + data.Clients[i].FirstName) + ' has no email!'));
                        }
                    }
                    resolve('Success');
                }
            }
        }

        // Callback to find all Emails
        let findVisits = (err,data) => {
            if (err) {
                reject(err);
            } else {
                if (!data.Class) {
                    reject('Something wrong with class');
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
        }


        // Main Pooling loop: Get all Classes
        if(flags.POOLING_ACTIVE) {
            // Find all clients of this class
            mbo.class.classVisits({
                'ClassID': id,       // Classes.Id
            },findVisits);
        } else {
            // Fake Pooling
            let fakeClient = new ClientModel(42, 'Tamara', 'Blösch', 'renato.semadeni@gmail.com');
            let fakeClient2 = new ClientModel(11, 'Dev', 'Eloper', 'renato.semadeni@gmail.com');
            clients.push(fakeClient);
            clients.push(fakeClient2);
            resolve('FakeClient Success');
        }
    });
}

// CLI
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
                    let clients = [];
                    var idx = 0;
                    for (let i = 0; i < data.Clients.length; i++)
                    {
                        if(data.Clients[i].Email != null) {
                            let client = new ClientModel();
                            client.id = data.Clients[i].Id;
                            client.firstname = data.Clients[i].FirstName;
                            client.lastname = data.Clients[i].LastName;
                            client.emailaddr = data.Clients[i].Email;
                            clients.push(client);
                            idx++;
                        } else {
                            console.log(warning('Client ' + italic.blueBright(data.Clients[i].LastName + ', ' + data.Clients[i].FirstName) + ' has no email!'));
                        }
                    }
                    resolve(clients);
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
                StartDateTime: new Date('April 9 2020 22:53'),
                EndDateTime: new Date('April 9 2020 23:30'),
                ClassDescription: {
                    Name: 'Zumba'
                }
            };

            gui.showClassInfo(classData, fakeClass, youtube);
            let fakeClient = new ClientModel();
            fakeClient.firstname = 'Renato';
            fakeClient.emailaddr = 'renato.semadeni@gmail.com';
            let clients = [fakeClient];
            resolve(clients);
        }
    });
}

module.exports = {
    setAuthentication: setAuthentication,
    getAllClasses: getAllClasses,
    getAllClientsByClassID: getAllClientsByClassID,
    getClassClients: getClassClients
}