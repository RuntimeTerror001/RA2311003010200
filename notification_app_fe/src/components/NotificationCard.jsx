import { Card, CardContent, Typography, Chip, Box } from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import EventIcon from '@mui/icons-material/Event';
import FiberNewIcon from '@mui/icons-material/FiberNew';

// map notification type to color + icon
const typeConfig = {
  Placement: { color: '#4caf50', bg: 'rgba(76,175,80,0.1)', icon: <WorkIcon fontSize="small" /> },
  Result:    { color: '#ff9800', bg: 'rgba(255,152,0,0.1)', icon: <SchoolIcon fontSize="small" /> },
  Event:     { color: '#2196f3', bg: 'rgba(33,150,243,0.1)', icon: <EventIcon fontSize="small" /> }
};

export default function NotificationCard({ notification, isNew, rank }) {
  const cfg = typeConfig[notification.Type] || typeConfig.Event;

  // format the timestamp to something readable
  const dateStr = new Date(notification.Timestamp).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 2,
        borderRadius: 2,
        borderColor: isNew ? '#1976d2' : '#333',
        bgcolor: '#1e1e1e',
        position: 'relative',
        '&:hover': {
          borderColor: '#444',
          bgcolor: '#252525'
        }
      }}
    >
      {/* simple new badge */}
      {isNew && (
        <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
          <Chip label="NEW" size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 'bold' }} />
        </Box>
      )}

      <CardContent sx={{ py: 2, px: 2.5 }}>
         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          {rank && (
            <Typography
              variant="caption"
              sx={{
                bgcolor: '#9c27b0',
                color: '#fff',
                px: 1, py: 0.2,
                borderRadius: 1,
                fontWeight: 'bold',
                fontSize: '0.75rem'
              }}
            >
              Rank {rank}
            </Typography>
          )}
          <Chip
            icon={cfg.icon}
            label={notification.Type}
            size="small"
            sx={{
              bgcolor: cfg.bg,
              color: cfg.color,
              fontWeight: 'bold',
              fontSize: '0.75rem',
              '& .MuiChip-icon': { color: cfg.color }
            }}
          />
        </Box>

        <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5, pr: isNew ? 4 : 0 }}>
          {notification.Message}
        </Typography>

        <Typography variant="caption" sx={{ color: '#888' }}>
          {dateStr}
        </Typography>
      </CardContent>
    </Card>
  );
}
