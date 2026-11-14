// ==UserScript==
// @name        DNA Social Media Plus
// @namespace   DNA Social Media Plus
// @version     3.0.0
// @author      Last Roze
// @description Replaces the custom video overlays on 9GAG, NSFW.com and Instagram with native browser controls: play, seek, time, volume, speed and fullscreen.
// @copyright   Copyright (c) 2020 - 2026 Yoga Budiman
// @homepage    https://github.com/LastRoze/DNA-Social-Media-Plus
// @homepageURL https://github.com/LastRoze/DNA-Social-Media-Plus
// @website     https://lastroze.github.io/
// @source      https://github.com/LastRoze/DNA-Social-Media-Plus
// @icon        https://github.com/LastRoze/DNA-Social-Media-Plus/raw/master/DNA.jpg
// @iconURL     https://github.com/LastRoze/DNA-Social-Media-Plus/raw/master/DNA.jpg
// @defaulticon https://github.com/LastRoze/DNA-Social-Media-Plus/raw/master/DNA.jpg
// @icon64      https://github.com/LastRoze/DNA-Social-Media-Plus/raw/master/DNA.jpg
// @icon64URL   https://github.com/LastRoze/DNA-Social-Media-Plus/raw/master/DNA.jpg
// @updateURL   https://github.com/LastRoze/DNA-Social-Media-Plus/raw/master/DNA-Social-Media-Plus.meta.js
// @downloadURL https://github.com/LastRoze/DNA-Social-Media-Plus/raw/master/DNA-Social-Media-Plus.user.js
// @supportURL  https://github.com/LastRoze/DNA-Social-Media-Plus/issues
// @match       *://*.9gag.com/*
// @match       *://*.nsfw.com/*
// @match       *://*.instagram.com/*
// @run-at      document-start
// @noframes
// @grant       none
// ==/UserScript==

(function () {
	'use strict';

	const SITES = [
		{
			host: /(^|\.)9gag\.com$/,
			css: '.video-post .sound-toggle, .video-post .length, .video-post .play { display: none !important; }'
		},
		{
			host: /(^|\.)nsfw\.com$/,
			css: '.media-frame > button[aria-label="View media"], .media-frame > button[aria-label="Unmute"], .media-frame > button[aria-label="Mute"] { display: none !important; }'
				+ ' .media-frame > video { cursor: auto; }'
		},
		{
			host: /(^|\.)instagram\.com$/,
			css: '',
			overlay: (video) => {
				const box = video.getBoundingClientRect();
				const x = box.left + box.width / 2;
				const y = box.top + box.height / 2;
				for (let node = video.parentElement, depth = 0; node && depth < 12; node = node.parentElement, depth++) {
					const group = node.nextElementSibling && node.nextElementSibling.querySelector('[role="group"]');
					if (!group || !group.querySelector(':scope > [role="presentation"]')) continue;
					const cover = group.getBoundingClientRect();
					return x >= cover.left && x <= cover.right && y >= cover.top && y <= cover.bottom ? group : null;
				}
				return null;
			}
		}
	];

	const site = SITES.find((entry) => entry.host.test(location.hostname));
	if (!site) return;

	const style = document.createElement('style');
	style.textContent = site.css + ' [data-dna-overlay] { display: none !important; }';
	if (document.documentElement) document.documentElement.appendChild(style);
	else new MutationObserver((_, observer) => {
		if (!document.documentElement) return;
		observer.disconnect();
		document.documentElement.appendChild(style);
	}).observe(document, { childList: true });

	const upgrade = (video, newSource) => {
		if (video.controls && !newSource) return;
		video.controls = true;
		const overlay = site.overlay && site.overlay(video);
		if (overlay) overlay.setAttribute('data-dna-overlay', '');
	};

	const enable = (event) => {
		if (event.target instanceof HTMLVideoElement) upgrade(event.target, event.type === 'loadstart');
	};

	const isolate = (event) => {
		const video = event.target;
		if (!(video instanceof HTMLVideoElement) || !video.controls) return;
		event.stopPropagation();
		const link = video.closest('a[href]');
		if (!link) return;
		const href = link.getAttribute('href');
		link.removeAttribute('href');
		setTimeout(() => link.setAttribute('href', href));
	};

	const userSound = new WeakSet();
	const scriptSound = new WeakMap();

	for (const key of ['muted', 'volume']) {
		const native = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, key);
		Object.defineProperty(HTMLMediaElement.prototype, key, {
			...native,
			set(value) {
				if (userSound.has(this)) return;
				native.set.call(this, value);
				scriptSound.set(this, { muted: this.muted, volume: this.volume });
			}
		});
	}

	const keepSound = (event) => {
		const video = event.target;
		if (!(video instanceof HTMLVideoElement) || !video.controls || userSound.has(video)) return;
		const expected = scriptSound.get(video) || { muted: video.defaultMuted, volume: 1 };
		if (video.muted !== expected.muted || video.volume !== expected.volume) userSound.add(video);
	};

	for (const type of ['loadstart', 'loadedmetadata', 'play']) document.addEventListener(type, enable, true);
	document.addEventListener('volumechange', keepSound, true);
	for (const type of ['click', 'dblclick']) window.addEventListener(type, isolate, true);

	const sweep = () => {
		for (const video of document.getElementsByTagName('video')) upgrade(video, false);
	};
	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sweep, { once: true });
	else sweep();
})();
