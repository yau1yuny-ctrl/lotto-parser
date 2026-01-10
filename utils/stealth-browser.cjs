// This is a CommonJS wrapper to use playwright-extra with stealth in ES modules
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();

chromium.use(stealth);

module.exports = { chromium };
