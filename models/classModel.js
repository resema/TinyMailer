"use strict";

function ClassModel(status = false, 
                    id = -1,
                    name = '',
                    startDate = new Date(),
                    endDate = new Date(),
                    clients = []) {
    this.status = status,
    this.id = id,
    this.name = name,
    this.startDate = startDate,
    this.endDate = endDate,
    this.clients = clients
};

module.exports = ClassModel;