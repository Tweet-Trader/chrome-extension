import { login, testTokens } from './methods';

// Background service workers
// https://developer.chrome.com/docs/extensions/mv3/service_workers/

// background script
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
	if (message.type === 'login') login().then(value => sendResponse(value)); 
	if (message.type === 'testTokens') testTokens().then(value => sendResponse(value)); 

	return true;
});
