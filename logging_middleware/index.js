const LOG_API = 'http://20.207.122.201/evaluation-service/logs';

// auth credentials for the test server
const AUTH_CONFIG = {
  email: 'as9977@srmist.edu.in',
  name: 'as9977',
  rollNo: 'RA2311003010200',
  accessCode: 'QkbpxH',
  clientID: '52a8382b-17b8-4d86-8e92-6fec536170c3',
  clientSecret: 'pvdTepdwtgzJbxPP'
};

let cachedToken = null;
let tokenExpiry = 0;

// grab a fresh bearer token from the auth endpoint
async function getAuthToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && now < tokenExpiry - 30) {
    return cachedToken;
  }

  try {
    const resp = await fetch('http://20.207.122.201/evaluation-service/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(AUTH_CONFIG)
    });
    const data = await resp.json();
    cachedToken = data.access_token;
    tokenExpiry = data.expires_in;
    return cachedToken;
  } catch (err) {
    console.error('Failed to refresh auth token:', err.message);
    return cachedToken; // return stale token as fallback
  }
}

/**
 * Reusable logging function - sends structured logs to the evaluation server.
 *
 * @param {string} stack    - 'backend' or 'frontend'
 * @param {string} level    - 'debug' | 'info' | 'warn' | 'error' | 'fatal'
 * @param {string} pkg      - 'cache' | 'controller' | 'cron_job' | 'db' | 'domain'
 * @param {string} message  - descriptive log message (max 48 chars)
 */
async function Log(stack, level, pkg, message) {
  // validate inputs against allowed values
  const allowedStacks = ['backend', 'frontend'];
  const allowedLevels = ['debug', 'info', 'warn', 'error', 'fatal'];
  const allowedPkgs = ['cache', 'controller', 'cron_job', 'db', 'domain'];

  const s = allowedStacks.includes(stack) ? stack : 'backend';
  const l = allowedLevels.includes(level) ? level : 'info';
  const p = allowedPkgs.includes(pkg) ? pkg : 'domain';

  // server enforces 48 char limit on message field
  const truncated = String(message).substring(0, 48);

  try {
    const token = await getAuthToken();
    const res = await fetch(LOG_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        stack: s,
        level: l,
        package: p,
        message: truncated
      })
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`[Log] server returned ${res.status}: ${errBody}`);
    }
    return res.ok;
  } catch (err) {
    console.error('[Log] network error:', err.message);
    return false;
  }
}

module.exports = { Log, getAuthToken, AUTH_CONFIG };
