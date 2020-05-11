"use strict";
const flags = {
    // Dev flags
    DEV: false,
    CONSOLE_ACTIVE: false,
    TIMEWARP_ACTIVE: false,

    // Going live flags
    MAILING_ACTIVE: false,
    POOLING_ACTIVE: false,
    CONFIGURATION_ACTIVE: true,

    // Theme flag
    DARKTHEME_ACTIVE: true
}

module.exports = flags;