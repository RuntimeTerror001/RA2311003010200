import { refreshToken, Log } from './logger';

const BASE = '/evaluation-service/notifications';

// type weights for priority scoring - matches Stage 1 algorithm
const TYPE_WEIGHTS = { Placement: 3, Result: 2, Event: 1 };

/**
 * Fetch notifications from the evaluation server.
 * Supports optional query params: limit, page, notification_type
 */
export async function fetchNotifications({ limit, page = 1, notificationType } = {}) {
  await Log('frontend', 'info', 'controller', 'Fetching notifs from server');

  const tok = await refreshToken();
  const reqLimit = limit ? Number(limit) : 10;

  if (reqLimit <= 10) {
    const params = new URLSearchParams();
    if (limit) params.set('limit', reqLimit);
    if (page) params.set('page', page);
    if (notificationType) params.set('notification_type', notificationType);

    const url = params.toString() ? `${BASE}?${params}` : BASE;

    try {
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${tok}` }
      });

      if (!res.ok) {
        await Log('frontend', 'error', 'controller', `API err: ${res.status}`);
        throw new Error(`API returned ${res.status}`);
      }

      const data = await res.json();
      await Log('frontend', 'info', 'domain', `Got ${data.notifications?.length || 0} notifs`);
      return data.notifications || [];
    } catch (err) {
      await Log('frontend', 'error', 'controller', `Fetch failed: ${err.message}`);
      throw err;
    }
  } else {
    // if requested limit is 15 or 20, we fetch 2 pages of 10 items each and combine them
    const p1 = (page - 1) * 2 + 1;
    const p2 = (page - 1) * 2 + 2;
    const filterQuery = notificationType ? `&notification_type=${notificationType}` : '';

    try {
      const [res1, res2] = await Promise.all([
        fetch(`${BASE}?limit=10&page=${p1}${filterQuery}`, {
          headers: { 'Authorization': `Bearer ${tok}` }
        }).then(r => r.json()),
        fetch(`${BASE}?limit=10&page=${p2}${filterQuery}`, {
          headers: { 'Authorization': `Bearer ${tok}` }
        }).then(r => r.json())
      ]);

      const combined = [...(res1.notifications || []), ...(res2.notifications || [])];
      await Log('frontend', 'info', 'domain', `Fetched 2 pages, combined into ${combined.length} notifs`);
      return combined.slice(0, reqLimit);
    } catch (err) {
      await Log('frontend', 'error', 'controller', `Combined fetch failed: ${err.message}`);
      throw err;
    }
  }
}

/**
 * Compute priority score for a notification.
 * Same algorithm from Stage 1:
 *   score = typeWeight * 1e10 + epochSeconds
 */
function getPriorityScore(notif) {
  const w = TYPE_WEIGHTS[notif.Type] || 0;
  const ts = new Date(notif.Timestamp).getTime() / 1000;
  return w * 1e10 + ts;
}

/**
 * Sort notifications by priority and return top N.
 * Placement > Result > Event, then by recency within same type.
 */
export function getTopPriority(notifications, n = 10) {
  const scored = notifications.map(item => ({
    ...item,
    _score: getPriorityScore(item)
  }));
  scored.sort((a, b) => b._score - a._score);
  return scored.slice(0, n);
}

export { TYPE_WEIGHTS };
