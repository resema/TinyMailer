"use strict"

// modules
const bodyParser = require('body-parser');
const polling = require('../polling');
const messaging = require('../messaging');
const theme = require('../colortheme');
const ClientModel = require('../../models/clientModel');
const ClassModel = require('../../models/classModel');
const database = require('../db/nosql')
const utils = require('../utils');

module.exports = function(app) {

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });

    // get all classes
    app.get('/api/classes', function(req, res) {
        // return a JSON to the frontend
        let classes = []
        polling.getAllClasses(classes)
        .then((suc) => {
            utils.sortClassByDateTime(classes);
            res.send(classes);
        })
        .catch((err) => {
            console.log(theme.error(err));
            res.send(err);
        });
    });

    // get clients in class with id
    app.get('/api/class/:id', function(req, res) {
        // poll all clients of the class
        let clients = [];
        polling.getAllClientsByClassID(req.params.id, clients)
        .then(_ => {
            res.send(clients);
        })
        .catch(err => {
            console.log(theme.error(err));
        });        
    });

    // get clients in class with id
    app.get('/api/class-db/:id', function(req, res) {
        // poll all clients of the class
        let clients = [];
        clients = database.getAllClients(parseInt(req.params.id));
        if (!clients) {
            clients = [];
        }
        res.send(clients);        
    });

    // get raw message body
    app.get('/api/message', function(req, res) {
        let message = messaging.getMailInformation('YOUTUBE_LINK');
        res.send(message);
    })

    // get raw message body
    app.get('/api/staff', function(req, res) {
        const configPath = utils.getConfigFile();
        let staffList = utils.readJSON(configPath + '/staffList.json');
        res.send(staffList);
    })

    // create message containing a link
    app.post('/api/message', function(req, res) {
        const link = req.body.link.link;
        const obj = req.body.selClass;
        let selClass = new ClassModel(true,
                                      obj.id,
                                      obj.name,
                                      obj.startDate,
                                      obj.startDate + 1,
                                      obj.clients);
        let message = messaging.createMailInformation(link, selClass);
        res.send(message);
    });

    // sending a mail to a specific client
    app.post('/api/email', function(req, res) {
        let addresses = [];
        let elem = req.body;
        let client = new ClientModel(
                        elem.id,
                        elem.firstname,
                        elem.lastname,
                        elem.emailaddr
                    );
        addresses.push(client);

        messaging.sendMails(addresses)
        .then(suc => {
            res.send(suc);
        })
        .catch(err => {
            res.send(err);
        });    
    });

    // sending mails to all clients in the class
    app.post('/api/emails', function(req, res) {
        let addresses = [];
        req.body.forEach(elem => {
            let client = new ClientModel(
                            elem.id,
                            elem.firstname,
                            elem.lastname,
                            elem.emailaddr
                        );
            addresses.push(client);
        });
        messaging.sendMails(addresses)
        .then(suc => {
            res.send(suc);
        })
        .catch(err => {
            res.send(err);
        });
    });
}