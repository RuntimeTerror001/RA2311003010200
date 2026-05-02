import { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, ToggleButtonGroup, ToggleButton, Pagination,
  CircularProgress, Alert, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import NotificationCard from '../components/NotificationCard';
import { fetchNotifications } from '../utils/api';
import { Log } from '../utils/logger';

// key for persisting viewed notification IDs in localStorage
const VIEWED_KEY = 'campus_viewed_ids';

function getViewedIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(VIEWED_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function markAsViewed(ids) {
  const existing = getViewedIds();
  ids.forEach(id => existing.add(id));
  localStorage.setItem(VIEWED_KEY, JSON.stringify([...existing]));
}

export default function AllNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // filter by type
  const [typeFilter, setTypeFilter] = useState('all');
  // pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // track which ones have been seen before
  const [viewedIds, setViewedIds] = useState(getViewedIds());

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Log('frontend', 'info', 'controller', 'Loading all notifications');

      // build query params for the API
      const params = { limit: perPage, page: page };
      if (typeFilter !== 'all') {
        params.notificationType = typeFilter;
      }

      const data = await fetchNotifications(params);
      setNotifications(data);

      await Log('frontend', 'info', 'domain', `Loaded ${data.length} items, page ${page}`);
    } catch (err) {
      setError('Could not load notifications. Please try again.');
      await Log('frontend', 'error', 'controller', `Load failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, page, perPage]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // mark currently displayed notifications as viewed after a short delay
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        const currentIds = notifications.map(n => n.ID);
        markAsViewed(currentIds);
        setViewedIds(getViewedIds());
        Log('frontend', 'debug', 'cache', 'Marked visible notifs as viewed');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  const handleTypeChange = (e, val) => {
    if (val !== null) {
      setTypeFilter(val);
      setPage(1); // reset to page 1 on filter change
      Log('frontend', 'info', 'domain', `Filter changed to: ${val}`);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
        All Notifications
      </Typography>
      <Typography variant="body2" sx={{ color: '#aaa', mb: 3 }}>
        Browse campus updates, placement calls, results, and events
      </Typography>

      {/* Filter Controls */}
      <Box sx={{
        display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3,
        alignItems: 'center', justifyContent: 'space-between'
      }}>
        <ToggleButtonGroup
          value={typeFilter}
          exclusive
          onChange={handleTypeChange}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              color: '#bbb',
              borderColor: '#444',
              textTransform: 'none',
              px: 2,
              '&.Mui-selected': {
                bgcolor: '#1976d2',
                color: '#fff',
                borderColor: '#1976d2'
              }
            }
          }}
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="Placement">Placement</ToggleButton>
          <ToggleButton value="Result">Result</ToggleButton>
          <ToggleButton value="Event">Event</ToggleButton>
        </ToggleButtonGroup>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel sx={{ color: '#bbb' }}>Per page</InputLabel>
          <Select
            value={perPage}
            label="Per page"
            onChange={(e) => { setPerPage(e.target.value); setPage(1); }}
            sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }}
          >
            <MenuItem value={5}>5 per page</MenuItem>
            <MenuItem value={10}>10 per page</MenuItem>
            <MenuItem value={15}>15 per page</MenuItem>
            <MenuItem value={20}>20 per page</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Loading state */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress color="primary" />
        </Box>
      )}

      {/* Error state */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Notification list */}
      {!loading && !error && (
        <>
          {notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8, color: '#888' }}>
              <Typography>No notifications found.</Typography>
            </Box>
          ) : (
            notifications.map(notif => (
              <NotificationCard
                key={notif.ID}
                notification={notif}
                isNew={!viewedIds.has(notif.ID)}
              />
            ))
          )}

          {/* Pagination */}
          {notifications.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={5}
                page={page}
                onChange={(e, val) => setPage(val)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
}
