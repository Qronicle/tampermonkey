// ==UserScript==
// @name         Refresh CSS
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @include      https://deprono.qronicle.be/*
// @include      *.test/*
// @icon         https://www.google.com/s2/favicons?domain=qronicle.be
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    document.addEventListener('keyup', (e) => {
        if (e.ctrlKey && e.keyCode == 82) {
            refreshCss();
        }
    });

    function refreshCss() {
        const version = Date.now();
        const stylesheets = document.querySelectorAll('link[rel=stylesheet]');
        for (const link of stylesheets) {
            link.href = updateQueryStringParameter(link.href, 'v', version);
        }
    }

    function updateQueryStringParameter(uri, key, value) {
        var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
        var separator = uri.indexOf('?') !== -1 ? "&" : "?";
        if (uri.match(re)) {
            return uri.replace(re, '$1' + key + "=" + value + '$2');
        }
        else {
            return uri + separator + key + "=" + value;
        }
    }
})();
