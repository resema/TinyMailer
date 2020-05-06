"use strict"

// modules
const bodyParser = require('body-parser');
const polling = require('../polling');
const messaging = require('../messaging');
const theme = require('../colortheme');
const ClientModel = require('../../models/clientModel');

module.exports = function(app) {

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));

    // get all classes
    app.get('/api/classes', function(req, res) {
        // return a JSON to the frontend
        let classes = []
        polling.getAllClasses(classes)
        .then((suc) => {
            res.send(classes);
        })
        .catch((err) => {
            console.log(theme.error(err));
            res.send(err);
        });
    });

    // get clients in class with id
    app.get('/api/class/:id', function(req, res) {
        // return the specific class as JSON
        let clients = [];
        polling.getAllClientsByClassID(req.params.id, clients)
        .then((suc) => {
            res.send(clients);
        })
        .catch((err) => {
            console.log(theme.error(err));
            res.send(err);
        })
    });

    // create message containing a link
    app.post('/api/message', function(req, res) {
        let message = messaging.createMailInformation(req.body.youtube.link, req.body.classModel);
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

        messaging.sendMail(addresses)
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
        messaging.sendMail(addresses)
        .then(suc => {
            res.send(suc);
        })
        .catch(err => {
            res.send(err);
        });
    });
}