"use strict";
const chalk = require('chalk');

// Configuration color theme
const theme = {
    error: chalk.bold.redBright,
    warning: chalk.bold.italic.yellow,
    bar: chalk.magenta,
    title: chalk.bold.whiteBright,
    italic: chalk.italic.white,
    bold: chalk.bold,
    green: chalk.green
}

// const theme = {
//     error: chalk.bold.redBright,
//     warning: chalk.bold.italic.yellow,
//     bar: chalk.magenta,
//     title: chalk.bold,
//     italic: chalk.italic,
// }

module.exports = theme;