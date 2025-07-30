// ==UserScript==
// @name        DNA Social Media Plus
// @namespace   DNA Social Media Plus
// @version     1.0
// @author      Last Roze
// @description Dominion With Domination
// @copyright   ©2020 - 2025 Yoga Budiman
// @homepage    https://github.com/LastRoze/
// @homepageURL https://github.com/LastRoze/
// @website     https://lastroze.github.io/
// @source      https://github.com/LastRoze/DNA-Social-Media-Plus
// @icon        https://github.com/LastRoze/DNA-Social-Media-Plus/blob/master/DNA.jpg?raw=true
// @iconURL     https://github.com/LastRoze/DNA-Social-Media-Plus/blob/master/DNA.jpg?raw=true
// @defaulticon https://github.com/LastRoze/DNA-Social-Media-Plus/blob/master/DNA.jpg?raw=true
// @icon64      https://github.com/LastRoze/DNA-Social-Media-Plus/blob/master/DNA.jpg?raw=true
// @icon64URL   https://github.com/LastRoze/DNA-Social-Media-Plus/blob/master/DNA.jpg?raw=true
// @updateURL   https://github.com/LastRoze/DNA-Social-Media-Plus/raw/master/9GAG-Plus.meta.js
// @downloadURL https://github.com/LastRoze/DNA-Social-Media-Plus/raw/master/9GAG-Plus.user.js
// @supportURL  https://lastroze.github.io/
// @require     https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js
// @match       *://*.9gag.com/*
// @match       *://*.instagram.com/*
// @run-at      document-end
// @grant       none
// ==/UserScript==
/* global $, jQuery */

(function () {
    'use strict';
    const SITE_HANDLERS = {
        '9gag.com': handle9GAG,
        'instagram.com': handleInstagram
    };

    function enhanceVideos() {const hostname = window.location.hostname;const handler = getHandlerForHost(hostname);$('video').each(function () {const video = this;if (video.hasAttribute('data-dna-enhanced')) return;handler(video);video.setAttribute('data-dna-enhanced', 'true');});}

    function getHandlerForHost(hostname) {for (const domain in SITE_HANDLERS) {if (hostname.includes(domain)) {return SITE_HANDLERS[domain];}}return defaultHandler;}

    function handle9GAG(video) {$('.off.sound-toggle, .length, .play').remove();defaultHandler(video);}

    function handleInstagram(video) {defaultHandler(video);video.style.position = 'absolute';video.style.zIndex = '1000';const originalPlay = video.play;video.play = function () {this.muted = false;return originalPlay.apply(this, arguments);};}

    function defaultHandler(video) {video.controls = true;video.volume = 1;video.muted = true;}

    function setupEnhancer() {enhanceVideos();let scrollTimeout;$(window).on('scroll', function () {clearTimeout(scrollTimeout);scrollTimeout = setTimeout(enhanceVideos, 300);});const observer = new MutationObserver(function (mutations) {for (const mutation of mutations) {if (mutation.addedNodes.length) {enhanceVideos();break;}}});observer.observe(document.body, { childList: true, subtree: true });}
    $(document).ready(setupEnhancer);
})();
