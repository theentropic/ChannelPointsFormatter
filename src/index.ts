var element = document.createElement('script');
// @ts-ignore
element.src = chrome.runtime.getURL('points-formatter.js');
document.body.appendChild(element);
