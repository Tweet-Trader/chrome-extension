import { storage } from "../storage";

export const login = async () => {
  try {
    const response = await (await fetch(`${import.meta.env.VITE_NODE_URL}/request_access_token`)).json();
    const authUrl = new URL('https://api.twitter.com/oauth/authenticate');
    authUrl.searchParams.set('oauth_token', response.token);
    authUrl.searchParams.set('force_login', 'false');

    console.log('authUrl: ', authUrl.href);
    const responseUrl = await chrome.identity.launchWebAuthFlow({ url: authUrl.href, interactive: true },)
    const oauth_token = responseUrl!.split('?')[1].split('&')[0].split('=')[1];
    const oauth_verifier = responseUrl!.split('?')[1].split('&')[1].split('=')[1];

    console.log('oauth token: ', oauth_token);
    console.log('oauth verifier: ', oauth_verifier);

    const data = { token: oauth_token, verifier: oauth_verifier, secret: response.secret };
    const access_token = await fetch(`${import.meta.env.VITE_NODE_URL}/access_token`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
    });
    const { twitterId, token, refreshToken } = await access_token.json();

    await storage.set({ twitterId, token, refreshToken });
    console.log('token saved');

    return true;
  } catch (err) {
    console.log(err);
  }
};

export const testTokens = async () => {
  const { twitterId, ...tokens } = await storage.get();
  console.log("tokens: ", tokens);
  // tokens don't exist
  if (tokens.token === '' && tokens.refreshToken === '') {
    return false
  }
  console.log("tokens exist")

  // test if access token is valid
  const testAccessTokenResponse = await fetch(`${import.meta.env.VITE_AUTH_WORKER_URL}/testAccessToken`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token: tokens.token, twitterId })
  })
  console.log("testAccessTokenResponse: ", testAccessTokenResponse.status);

  if (testAccessTokenResponse.status === 403) {
    // test is refresh token is valid
    const refreshAccessTokenResponse = await fetch(`${import.meta.env.VITE_AUTH_WORKER_URL}/refreshAccessToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken: tokens.refreshToken, twitterId })
    })
    console.log("refeshAccessTokenResponse: ", refreshAccessTokenResponse.status);
    
    if (refreshAccessTokenResponse.status === 403) return false 
    const { token, refreshToken } = await refreshAccessTokenResponse.json()
    await storage.set({ twitterId, token, refreshToken })
    console.log("tokens have been refreshed")

    return true
  }
  const { isValid } = await testAccessTokenResponse.json()
  console.log("tokens are valid: ", isValid);

  return isValid
}

