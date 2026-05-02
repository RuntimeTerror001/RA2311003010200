import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Button, Box, useMediaQuery, IconButton, Drawer, List, ListItem, ListItemText
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import MenuIcon from '@mui/icons-material/Menu';

const navLinks = [
  { label: 'All Notifications', path: '/' },
  { label: 'Priority Inbox', path: '/priority' }
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width:768px)');
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <AppBar
        position="sticky"
        elevation={1}
        sx={{
          background: '#1c1c1c',
          borderBottom: '1px solid #333'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <NotificationsActiveIcon sx={{ color: '#1976d2', fontSize: 26 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Campus Notify
            </Typography>
          </Box>

          {isMobile ? (
            <IconButton color="inherit" onClick={() => setDrawerOpen(true)}>
              <MenuIcon />
            </IconButton>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {navLinks.map(link => (
                <Button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  sx={{
                    color: location.pathname === link.path ? '#1976d2' : '#ddd',
                    fontWeight: location.pathname === link.path ? 600 : 400,
                    textTransform: 'none',
                    fontSize: '0.9rem',
                    borderBottom: location.pathname === link.path ? '2px solid #1976d2' : 'none',
                    borderRadius: 0,
                    px: 1,
                    '&:hover': { color: '#fff' }
                  }}
                >
                  {link.label}
                </Button>
              ))}
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* mobile side drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { background: '#1e1e1e', width: 240 } }}
      >
        <List sx={{ mt: 2 }}>
          {navLinks.map(link => (
            <ListItem
              key={link.path}
              onClick={() => { navigate(link.path); setDrawerOpen(false); }}
              sx={{
                cursor: 'pointer',
                bgcolor: location.pathname === link.path ? 'rgba(25,118,210,0.1)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
              }}
            >
              <ListItemText
                primary={link.label}
                primaryTypographyProps={{
                  fontWeight: location.pathname === link.path ? 600 : 400,
                  color: location.pathname === link.path ? '#1976d2' : '#ccc'
                }}
              />
            </ListItem>
          ))}
        </List>
      </Drawer>
    </>
  );
}
