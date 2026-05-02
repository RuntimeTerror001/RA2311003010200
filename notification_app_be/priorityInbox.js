/**
 * Stage 1 - Priority Inbox for Campus Notifications
 *
 * Fetches notifications from the evaluation server and ranks them
 * using a weighted priority system:
 *   Placement (weight 3) > Result (weight 2) > Event (weight 1)
 *
 * Ties in weight are broken by recency (newer = higher priority).
 * Outputs the top 10 most important notifications.
 */

const { Log, getAuthToken } = require('../logging_middleware');

const NOTIF_API = 'http://20.207.122.201/evaluation-service/notifications';

// how many top notifications to show
const TOP_N = 10;

// priority weights - placement matters most, then results, then events
const TYPE_WEIGHTS = {
  'Placement': 3,
  'Result': 2,
  'Event': 1
};

// fetch all notifications from the test server
async function fetchNotifications() {
  await Log('backend', 'info', 'controller', 'Fetching notifications from API');

  const token = await getAuthToken();
  const resp = await fetch(NOTIF_API, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!resp.ok) {
    await Log('backend', 'error', 'controller', `API error: status ${resp.status}`);
    throw new Error(`Notifications API returned ${resp.status}`);
  }

  const body = await resp.json();
  await Log('backend', 'info', 'db', `Got ${body.notifications.length} notifications`);
  return body.notifications;
}

/**
 * Calculates a priority score for a single notification.
 *
 * The score combines two factors:
 *  1) Type weight (Placement=3, Result=2, Event=1)
 *  2) Recency - we convert the timestamp to epoch seconds
 *     and normalize it so newer items score higher
 *
 * Final score = typeWeight * 1e10 + epochSeconds
 *
 * Multiplying the weight by a large constant ensures that
 * type always takes precedence, but within the same type
 * the more recent notification wins.
 */
function computePriorityScore(notification) {
  const typeWeight = TYPE_WEIGHTS[notification.Type] || 0;
  const ts = new Date(notification.Timestamp).getTime() / 1000;
  // large multiplier so type weight dominates, recency breaks ties
  return typeWeight * 1e10 + ts;
}

// sort all notifications by priority and return top N
function getTopPriorityNotifications(notifications, n) {
  // compute scores and attach them
  const scored = notifications.map(notif => ({
    ...notif,
    _score: computePriorityScore(notif)
  }));

  // sort descending by score
  scored.sort((a, b) => b._score - a._score);

  // grab the top n
  return scored.slice(0, n);
}

// format the output nicely for the console
function printResults(topNotifs) {
  console.log('\n========================================');
  console.log(`  PRIORITY INBOX - Top ${topNotifs.length} Notifications`);
  console.log('========================================\n');

  topNotifs.forEach((notif, idx) => {
    const rank = String(idx + 1).padStart(2, ' ');
    const weight = TYPE_WEIGHTS[notif.Type] || 0;
    console.log(`  #${rank}  [${notif.Type}] (weight: ${weight})`);
    console.log(`       Message:   ${notif.Message}`);
    console.log(`       Timestamp: ${notif.Timestamp}`);
    console.log(`       ID:        ${notif.ID}`);
    console.log(`       Score:     ${notif._score.toFixed(2)}`);
    console.log('');
  });

  console.log('========================================');
  console.log('  Priority weights: Placement(3) > Result(2) > Event(1)');
  console.log('  Ties broken by most recent timestamp');
  console.log('========================================\n');
}

// main execution
async function main() {
  await Log('backend', 'info', 'controller', 'Stage 1 priority inbox starting');

  try {
    // step 1: pull notifications from the server
    const allNotifs = await fetchNotifications();
    console.log(`\nTotal notifications fetched: ${allNotifs.length}`);

    await Log('backend', 'info', 'domain', `Processing ${allNotifs.length} notifications`);

    // step 2: break them down by type so we can see the distribution
    const counts = { Placement: 0, Result: 0, Event: 0 };
    allNotifs.forEach(n => {
      if (counts[n.Type] !== undefined) counts[n.Type]++;
    });
    console.log(`Breakdown -> Placement: ${counts.Placement}, Result: ${counts.Result}, Event: ${counts.Event}`);

    await Log('backend', 'debug', 'domain', `Types: P=${counts.Placement} R=${counts.Result} E=${counts.Event}`);

    // step 3: compute priorities and get top 10
    const topNotifs = getTopPriorityNotifications(allNotifs, TOP_N);

    await Log('backend', 'info', 'domain', `Computed top ${TOP_N} priority notifs`);

    // step 4: display results
    printResults(topNotifs);

    await Log('backend', 'info', 'controller', 'Stage 1 completed successfully');
  } catch (err) {
    await Log('backend', 'fatal', 'controller', `Fatal: ${err.message}`);
    console.error('Error running priority inbox:', err);
    process.exit(1);
  }
}

main();
