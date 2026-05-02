const LOG_API = '/evaluation-service/logs';
const AUTH_URL = '/evaluation-service/auth';

const AUTH_BODY = {
  email: 'as9977@srmist.edu.in',
  name: 'as9977',
  rollNo: 'RA2311003010200',
  accessCode: 'QkbpxH',
  clientID: '52a8382b-17b8-4d86-8e92-6fec536170c3',
  clientSecret: 'pvdTepdwtgzJbxPP'
};

let token = null;
let expiry = 0;

async function refreshToken() {
  const now = Math.floor(Date.now() / 1000);
  if (token && now < expiry - 60) return token;

  try {
    const r = await fetch(AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(AUTH_BODY)
    });
    const d = await r.json();
    token = d.access_token;
    expiry = d.expires_in;
  } catch (e) {
    console.error('token refresh failed', e);
  }
  return token;
}

// reusable Log function for frontend logging middleware integration
export async function Log(stack, level, pkg, message) {
  const validStacks = ['backend', 'frontend'];
  const validLevels = ['debug', 'info', 'warn', 'error', 'fatal'];
  const validPkgs = ['cache', 'controller', 'cron_job', 'db', 'domain'];

  const s = validStacks.includes(stack) ? stack : 'frontend';
  const l = validLevels.includes(level) ? level : 'info';
  const p = validPkgs.includes(pkg) ? pkg : 'domain';
  const msg = String(message).substring(0, 48);

  try {
    const t = await refreshToken();
    await fetch(LOG_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${t}`
      },
      body: JSON.stringify({ stack: s, level: l, package: p, message: msg })
    });
  } catch (err) {
    // silently fail logging, don't break user experience
  }
}

export { refreshToken };
