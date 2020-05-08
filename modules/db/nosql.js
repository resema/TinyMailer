"use strict"

// modules
const ClassModel = require('../../models/classModel');
const ClientModel = require('../../models/clientModel');
const utils = require('../utils');

// Classes with Clients
var dbClient = new Map();
var dbClass = new Map();

function addClass(key, value) {
    dbClass.set(key, value);
}

function addClasses(key) {
    values.forEach((value) => {
        addClass(key, value);
    });
}

function removeClass(key) {
    // not implemented yet!
}

function getAllClasses() {
    return dbClass.get(key);
}

function addClient(key, value) {
    let newClient;
    let values = dbClient.get(key);
    if (!values) {
        dbClient.set(key, [value]);
        newClient = value;
    } else if (!utils.containsObject(value, values)) {
        values.push(value);
        newClient = value;
    } else {
        // nothing
    }

    return newClient;
}

function addClients(key, values) {
    let newClients = [];
    values.forEach((value) => {
        let newCl = addClient(key, value);
        if (newCl) {
            newClients.push(newCl);
        }
    });

    return newClients;
}

function removeClients() {
    dbClient = new Map();
}

function getAllClients(key) {
    return dbClient.get(key);
}

function show(both = true) {
    if (both) {
        console.log(dbClass);
    }
    console.log(dbClient);
}

module.exports = {
    addClass: addClass,
    addClasses: addClasses,
    removeClass: removeClass,
    getAllClasses: getAllClasses,
    addClients: addClients,
    addClient: addClient,
    removeClients: removeClients,
    getAllClients: getAllClients,
    show: show
}