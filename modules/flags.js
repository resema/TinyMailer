"use strict";
const flags = {
    // Dev flags
    DEV: true,
    CONSOLE_ACTIVE: true,
    TIMEWARP_ACTIVE: false,

    // Going live flags
    MAILING_ACTIVE: true,
    POOLING_ACTIVE: false,
    CONFIGURATION_ACTIVE: false,

    // Theme flag
    DARKTHEME_ACTIVE: true
}

module.exports = flags;