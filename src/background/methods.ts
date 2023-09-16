import { storage } from "../storage";

export const login = async () => {
  try {
    const response = await (await fetch(`${import.meta.env.VITE_NODE_URL}/requestAccessToken`)).json();
    const authUrl = new URL('https://api.twitter.com/oauth/authenticate');
    authUrl.searchParams.set('oauth_token', response.token);
    authUrl.searchParams.set('force_login', 'false');

    const responseUrl = await chrome.identity.launchWebAuthFlow({ url: authUrl.href, interactive: true },)
    const oauth_token = responseUrl!.split('?')[1].split('&')[0].split('=')[1];
    const oauth_verifier = responseUrl!.split('?')[1].split('&')[1].split('=')[1];

    const data = { token: oauth_token, verifier: oauth_verifier, secret: response.secret };
    const access_token = await fetch(`${import.meta.env.VITE_NODE_URL}/accessToken`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
    });
    const { twitterId, token, refreshToken } = await access_token.json();

    await storage.set({ twitterId, token, refreshToken });

    return true;
  } catch (err) {
    console.log(err);
  }
};

export const testTokens = async () => {
  const { twitterId, ...tokens } = await storage.get();
  // tokens don't exist
  if (tokens.token === '' && tokens.refreshToken === '') {
    return false
  }

  // test if access token is valid
  const testAccessTokenResponse = await fetch(`${import.meta.env.VITE_WORKER_URL}/testAccessToken`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token: tokens.token, twitterId })
  })

  if (testAccessTokenResponse.status === 403) {
    // test is refresh token is valid
    const refreshAccessTokenResponse = await fetch(`${import.meta.env.VITE_WORKER_URL}/refreshAccessToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken: tokens.refreshToken, twitterId })
    })
    
    if (refreshAccessTokenResponse.status === 403) return false 
    const { token, refreshToken } = await refreshAccessTokenResponse.json()
    await storage.set({ twitterId, token, refreshToken })

    return true
  }
  const { isValid } = await testAccessTokenResponse.json()

  return isValid
}

export const getAddress = async () => {
  const { twitterId, ...tokens } = await storage.get();

  const response = await fetch(`${import.meta.env.VITE_WORKER_URL}/getAddress`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokens.token}`
    },
    body: JSON.stringify({ twitterId })
  });

  if (response.status === 401 || response.status === 404) {
    return { error: true, message: response.statusText }
  }

  const { address } = await response.json();

  return address
}

export const deposit = async (to: `0x${string}`, amount: string) => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    console.log("tab: ", tab);
    await chrome.scripting.executeScript({
      target: { tabId: tab!.id! },
      world: 'MAIN',
      func: async (to: `0x${string}`, amount: string) => {
        try {
          console.log("gets in here: ", window.ethereum);

          const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' });
          console.log("account: ", account);
          console.log("to: ", to);
          const txHash = await window.ethereum.request({ 
            method: 'eth_sendTransaction',
            params: [{
              from: account,
              to,
              value: amount,
            }]
          })
          console.log("tx hash: ", txHash);
          const receipt = await new Promise((resolve) => setInterval(async () => {
            const receipt = await window.ethereum.request({ method: 'eth_getTransactionReceipt', params: [txHash] })
            console.log("receipt: ", receipt);
            if (receipt) resolve(receipt)
          }, 1000))

          console.log("receipt outside the promise: ", receipt);

          return receipt
        } catch (err) {
          console.log("err: ", err);
        }
      },
      args: [to, amount]
    })
  } catch (err) {
    console.log("err: ", err);
  }
}

export const getNightMode = async () => {
  const nightModeCookie = await chrome.cookies.get({ url: 'https://twitter.com', name: 'night_mode' });
  const nightMode = nightModeCookie?.value || '0'
  console.log("night mode: ", nightMode);

  return nightMode
}