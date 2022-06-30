// ==UserScript==
// @name         Efficient Officient
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds estimation of amount of days still available where hours are displayed
// @author       Ruud Seberechts
// @match        https://selfservice.officient.io/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=officient.io
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // USER SETTINGS

    // The average amount of hours in a work day
    const hoursPerDay = 39/5;

    // Whether to replace the hours with the days completely
    // FALSE: "11h42min left" becomes "11h42min left (~1.5 days)"
    // TRUE:  "11h42min left" becomes "1.5 days left"
    const replaceHours = true;

    // Officient language setting
    // Only 'en' and 'nl' are supported for now
    const language = 'en';


    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // DO NOT CHANGE

    const debug = false;

    const i18n = {
        nl: {
            hourUnit: 'u',
            minuteUnit: 'min',
            days: 'dagen',
            remaining: 'resterend'
        },
        en: {
            hourUnit: 'h',
            minuteUnit: 'min',
            days: 'days',
            remaining: 'left'
        }
    };

    let registerCount = 0;

    if (debug) {
        runUnitTests();
    }
    registerBudgetDropdown(true);

    function registerBudgetDropdown(reset) {
        if (reset) {
            registerCount = 0;
        }
        if (debug) {
            console.info('Trying to register the budget dropdown (' + registerCount + ')');
        }
        const dropdowns = document.getElementsByClassName('budget-section--dropdown');
        if (!dropdowns.length) {
            if (++registerCount < 20) {
                setTimeout(registerBudgetDropdown, 500);
            }
            return;
        }
        if (debug) {
            console.info('Found budget dropdown!');
        }
        dropdowns[0].addEventListener('click', function(){
            setTimeout(updateBudgets, 0);
        });
    }

    function updateBudgets() {
        if (debug) {
            console.info('Updating budget nodes...');
        }
        const budgetNodes = document.querySelectorAll('.budget-section-time > span > span > span');
        for (let budgetNode of budgetNodes) {
            let budget = budgetNode.innerHTML;
            if (budget.match(getHourBudgetRegex())) {
                const timeStr = budget.split(' ').shift();
                const hours = parseTime(timeStr);
                const days = Math.round(hours / hoursPerDay * 10) / 10;
                if (debug) {
                    console.info('Found hourly budget: ' + budget + ', converted to ' + days + ' days');
                }
                const dayStr = getDaysRemainingText(days);
                if (replaceHours) {
                    budget = dayStr;
                } else {
                    budget += ' (~' + dayStr + ')';
                }
                budgetNode.innerHTML = budget;
            } else {
                if (debug) {
                    console.info('Found non-hourly budget: ' + budget);
                }
            }
        }
    }

    function parseTime(timeStr) {
        const timeParts = timeStr.split(t('hourUnit'));
        let minutes = parseInt(timeParts.pop() || 0);
        let hours = 0;
        if (timeParts.length) {
            hours = parseInt(timeParts.pop());
        } else {
            hours = 0;
        }
        return hours + (minutes / 60);
    }

    function getHourBudgetRegex() {
        return new RegExp('^[0-9]+(' + t('hourUnit') + '|' + t('minuteUnit') + ')([0-9]+' + t('minuteUnit') + ')? ' + t('remaining'));
    }

    function getDaysRemainingText(days) {
        return days + ' ' + t('days') + ' ' + t('remaining');
    }

    function t(key) {
        return i18n[language][key];
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // URL watching

    let currentPage = location.href;
    setInterval(watchUrl, 500);

    function watchUrl() {
        if (currentPage != location.href) {
            if (debug) {
                console.info('Page URL updated!');
            }
            currentPage = location.href;
            registerBudgetDropdown(true);
        }
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // Unit Tests

    function testParseTime(input, expectedOutput) {
        console.info('Testing parseTime "' + input + '"');
        const output = parseTime(input);
        console.assert(output == expectedOutput, 'Testing parseTime "' + input + '" resulted in ' + output + ' instead of ' + expectedOutput);
    }

    function runUnitTests() {
        // Test parseTime
        const h = t('hourUnit');
        const m = t('minuteUnit');
        testParseTime('9' + h, 9);
        testParseTime('12' + h + '15' + m, 12.25);
        testParseTime('45' + m, 0.75);
        testParseTime('0' + h + '30' + m, 0.5);
    }
})();
