"use strict";

function ClientModel(id = '', firstname = '', lastname = '', emailaddr = '') {
    this.id = id,
    this.firstname = firstname,
    this.lastname = lastname,
    this.emailaddr = emailaddr  
};

module.exports = ClientModel;