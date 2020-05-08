"use strict";
const { workerData, parentPort } = require('worker_threads');

const database = require('../db/nosql');
const timing = require('../timing');
const polling = require('../polling');
const messaging = require('../messaging');
const theme = require('../colortheme');
const utils = require('../utils');

function runWorker() {
	// run loop
	console.log('Worker Thread running...')
	parentPort.once('message', (selClass) => {
		let timeSpan = timing.getInitialSpan();
		while(timeSpan.isRunning) {
			timeSpan = timing.getTimeSpan(selClass);
			utils.sleep(timeSpan.milliseconds/100);
			parentPort.postMessage(timeSpan);
		}
	});
	console.log('Worker Thread finished.');
}

runWorker();