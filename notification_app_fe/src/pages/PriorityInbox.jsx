import { useState, useEffect } from 'react';
import {
  Container, Typography, Box, CircularProgress, Alert,
  Slider, Chip
} from '@mui/material';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import NotificationCard from '../components/NotificationCard';
import { fetchNotifications, getTopPriority, TYPE_WEIGHTS } from '../utils/api';
import { Log } from '../utils/logger';

// same viewed tracking approach
const VIEWED_KEY = 'campus_viewed_ids';
function getViewedIds() {
  try { return new Set(JSON.parse(localStorage.getItem(VIEWED_KEY) || '[]')); }
  catch { return new Set(); }
}

export default function PriorityInbox() {
  const [priorityNotifs, setPriorityNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topN, setTopN] = useState(10);
  const [viewedIds] = useState(getViewedIds());

  useEffect(() => {
    async function loadPriority() {
      setLoading(true);
      setError(null);
      try {
        await Log('frontend', 'info', 'controller', 'Loading priority inbox');

        // fetch notifications without filter so we can rank them client-side
        const all = await fetchNotifications({});

        await Log('frontend', 'info', 'domain', `Scoring ${all.length} notifs for priority`);

        const top = getTopPriority(all, topN);
        setPriorityNotifs(top);

        await Log('frontend', 'info', 'domain', `Priority inbox built, top ${topN}`);
      } catch (err) {
        setError('Failed to load priority notifications: ' + err.message);
        await Log('frontend', 'error', 'controller', `Priority load err: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
    loadPriority();
  }, [topN]);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <PriorityHighIcon sx={{ color: '#d32f2f', fontSize: 30 }} />
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Priority Inbox
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ color: '#aaa', mb: 2 }}>
        Top notifications ranked by importance — Placements first, then Results, then Events
      </Typography>

      {/* weight legend */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        {Object.entries(TYPE_WEIGHTS).map(([type, weight]) => (
          <Chip
            key={type}
            label={`${type}: weight ${weight}`}
            size="small"
            variant="outlined"
            sx={{
              color: '#bbb',
              borderColor: '#444',
              fontSize: '0.75rem'
            }}
          />
        ))}
      </Box>

      {/* slider for choosing how many top items */}
      <Box sx={{ mb: 4, px: 1 }}>
        <Typography variant="body2" sx={{ color: '#aaa', mb: 1 }}>
          Show top <strong style={{ color: '#1976d2' }}>{topN}</strong> notifications
        </Typography>
        <Slider
          value={topN}
          onChange={(e, val) => setTopN(val)}
          min={5}
          max={20}
          step={5}
          marks={[
            { value: 5, label: '5' },
            { value: 10, label: '10' },
            { value: 15, label: '15' },
            { value: 20, label: '20' }
          ]}
          sx={{
            color: '#1976d2',
            maxWidth: 300,
            '& .MuiSlider-markLabel': { color: '#888', fontSize: '0.75rem' }
          }}
        />
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress color="primary" />
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && !error && (
        priorityNotifs.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: '#888' }}>
            <Typography>No notifications available.</Typography>
          </Box>
        ) : (
          priorityNotifs.map((notif, idx) => (
            <NotificationCard
              key={notif.ID}
              notification={notif}
              isNew={!viewedIds.has(notif.ID)}
              rank={idx + 1}
            />
          ))
        )
      )}
    </Container>
  );
}
