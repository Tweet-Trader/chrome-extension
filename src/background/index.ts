import { 
	login, 
	testTokens,
	getAddress,
	getNightMode,
	deposit,
} from './methods';
import {
	getBalance,
	getTokenBalance,
	getTokenData,
	getPairAddress,
	getReserves,
	getDecimals,
	buy,
	sell,
	getAllowance,
	approve,
	waitForTransactionReceipt,
} from './contractMethods'

// Background service workers
// https://developer.chrome.com/docs/extensions/mv3/service_workers/

// background script
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
	if (message.type === 'login') login().then(value => sendResponse(value)).catch((error) => sendResponse(error));
	if (message.type === 'testTokens') testTokens().then(value => sendResponse(value)).catch((error) => sendResponse(error));
	if (message.type === 'getAddress') getAddress().then(value => sendResponse(value)).catch((error) => sendResponse(error));
	if (message.type === 'getNightMode') getNightMode().then(value => sendResponse(value)).catch((error) => sendResponse(error));
	if (message.type === 'deposit') deposit(message.to, message.amount).then(value => sendResponse(value)).catch((error) => sendResponse(error));

	// CONTRACT METHODS
	if (message.type === 'waitForTransactionReceipt') waitForTransactionReceipt(message.txHash).then(value => sendResponse(value)).catch((error) => sendResponse(error));
	if (message.type === 'getBalance') getBalance(message.walletAddress).then(value => sendResponse(value)).catch((error) => sendResponse(error));
	if (message.type === 'getTokenBalance') getTokenBalance(message.walletAddress, message.tokenAddress).then(value => sendResponse(value)).catch((error) => sendResponse(error));
	if (message.type === 'getPairAddress') getPairAddress(message.tokenAddress).then(value => sendResponse(value)).catch((error) => sendResponse(error));
	if (message.type === 'getReserves') getReserves(message.pair, message.tokenAddress).then(value => sendResponse(value)).catch((error) => sendResponse(error));
	if (message.type === 'getDecimals') getDecimals(message.tokenAddress).then(value => sendResponse(value)).catch((error) => sendResponse(error));
	if (message.type === 'getAllowance') getAllowance(message.walletAddress, message.tokenAddress).then(value => sendResponse(value)).catch((error) => sendResponse(error));
	if (message.type === 'getTokenData') getTokenData(message.walletAddress, message.tokenAddress).then(value => sendResponse(value)).catch((error) => sendResponse(error));
	if (message.type === 'approve') approve(message.walletAddress, message.tokenAddress).then(value => sendResponse(value)).catch((error) => sendResponse(error));
	if (message.type === 'buy') buy(message).then(value => sendResponse(value)).catch((error) => console.log("error: ", error) || sendResponse(error));
	if (message.type === 'sell') sell(message).then(value => sendResponse(value)).catch((error) => sendResponse(error));

	return true;
});
