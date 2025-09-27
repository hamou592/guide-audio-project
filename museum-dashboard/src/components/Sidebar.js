import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Box,
  Avatar,
  IconButton,
  CircularProgress,
  Tooltip,
  useMediaQuery,
} from '@mui/material';

import InboxIcon from '@mui/icons-material/MoveToInbox';
import PeopleIcon from '@mui/icons-material/People';
import MuseumIcon from '@mui/icons-material/Museum';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import BarChartIcon from '@mui/icons-material/BarChart';
import { useTheme } from '@mui/material/styles';
import api from '../api';
import xpedLogo from './xped.png';

const drawerWidth = 240;
const collapsedWidth = 60;

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const [userMuseum, setUserMuseum] = useState(null);
  const [loadingMuseum, setLoadingMuseum] = useState(false);
  const [errorMuseum, setErrorMuseum] = useState('');
  const [open, setOpen] = useState(false); // default: closed

  useEffect(() => {
    // Set open based on screen size
    setOpen(isDesktop);
  }, [isDesktop]);

  useEffect(() => {
    const fetchUserMuseum = async () => {
      if (!user?.museum_id) {
        setUserMuseum(null);
        return;
      }
      setLoadingMuseum(true);
      setErrorMuseum('');
      try {
        const res = await api.get(`/museums/${user.museum_id}`);
        setUserMuseum(res.data);
      } catch (error) {
        console.error('Error fetching user museum:', error);
        setErrorMuseum('Failed to load museum');
        if (error.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setLoadingMuseum(false);
      }
    };

    fetchUserMuseum();
  }, [user?.museum_id, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const toggleDrawer = () => {
    setOpen((prev) => !prev);
  };

  const menuItems = [
    { text: 'Museums', path: '/museums', icon: <MuseumIcon />, showTo: 'superadmin' },
    { text: 'Rooms', path: '/rooms', icon: <MeetingRoomIcon />, showTo: 'admin' },
    { text: 'Objects', path: '/objects', icon: <InboxIcon />, showTo: 'admin' },
    { text: 'Tickets', path: '/tickets', icon: <ConfirmationNumberIcon />, showTo: 'admin' },
    // { text: 'Analytics', path: '/analytics', icon: <BarChartIcon  />, showTo: 'admin' },
    { text: 'Users', path: '/users', icon: <PeopleIcon />, showTo: 'superadmin' },
  ];

  return (
    <>
      {/* Toggle Button */}
      <IconButton
        onClick={toggleDrawer}
        aria-label={open ? 'Close sidebar' : 'Open sidebar'}
        sx={{
          position: 'fixed',
          top: 12,
          left: open ? drawerWidth + 12 : collapsedWidth + 12,
          zIndex: 1400,
          backgroundColor: 'background.paper',
          boxShadow: 3,
          borderRadius: 2,
          transition: 'left 0.3s ease',
          '&:hover': { backgroundColor: 'grey.100' },
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </IconButton>

      {/* Drawer */}
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: open ? drawerWidth : collapsedWidth,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          overflowX: 'hidden',
          transition: 'width 0.3s ease',
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : collapsedWidth,
            boxSizing: 'border-box',
            overflowX: 'hidden',
            transition: 'width 0.3s ease',
            backgroundColor: 'background.paper',
            borderRight: '1px solid rgba(0,0,0,0.12)',
          },
        }}
      >
        <Toolbar
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: open ? 'flex-start' : 'center',
            px: 2,
            gap: 2,
            minHeight: 64,
          }}
        >
          {loadingMuseum ? (
            <CircularProgress size={40} />
          ) : userMuseum?.photo ? (
            <Avatar
              src={`https://nasro.expedgs-audioguide.duckdns.org/images/${userMuseum.photo}`}
              alt={userMuseum.title}
              sx={{
                width: open ? 48 : 40,
                height: open ? 48 : 40,
                borderRadius: 1,
                transition: 'all 0.3s',
              }}
              variant="square"
            />
          ) : (
            <MuseumIcon sx={{ fontSize: open ? 48 : 40, transition: 'all 0.3s' }} />
          )}
          {open && (
            <Typography
              variant="h6"
              noWrap
              sx={{
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                flexGrow: 1,
                transition: 'opacity 0.3s',
              }}
            >
              {userMuseum?.title || 'Admin Panel'}
            </Typography>
          )}
        </Toolbar>

        <Divider />

        <List>
          {menuItems.map((item) => {
            if (!(user?.status === 'superadmin' || item.showTo === 'admin')) return null;

            return (
              <Tooltip
                key={item.text}
                title={!open ? item.text : ''}
                placement="right"
                arrow
              >
                <ListItem disablePadding sx={{ display: 'block' }}>
                  <ListItemButton
                    component={NavLink}
                    to={item.path}
                    sx={{
                      minHeight: 48,
                      justifyContent: open ? 'initial' : 'center',
                      px: 2.5,
                    }}
                    activeClassName="Mui-selected"
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: open ? 3 : 'auto',
                        justifyContent: 'center',
                        color: 'inherit',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {open && <ListItemText primary={item.text} />}
                  </ListItemButton>
                </ListItem>
              </Tooltip>
            );
          })}

          <Divider />

          <Tooltip title={!open ? 'Logout' : ''} placement="right" arrow>
            <ListItem disablePadding sx={{ display: 'block' }}>
              <ListItemButton
                onClick={handleLogout}
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : 'auto',
                    justifyContent: 'center',
                    color: 'inherit',
                  }}
                >
                  <LogoutIcon />
                </ListItemIcon>
                {open && <ListItemText primary="Logout" />}
              </ListItemButton>
            </ListItem>
          </Tooltip>
        </List>

        {/* Footer */}
        <Box
          sx={{
            mt: 'auto',
            py: 2,
            px: open ? 2 : 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: open ? 'flex-start' : 'center',
            borderTop: '1px solid rgba(0,0,0,0.12)',
            gap: 1,
          }}
        >
          <Box
            component="img"
            src={xpedLogo}
            alt="Exped Gs"
            sx={{
              width: open ? 50 : 20,
              height: open ? 24 : 20,
              objectFit: 'contain',
              transition: 'all 0.3s',
            }}
          />
          {open && (
            <Typography variant="body2" color="textSecondary">
              Powered by{' '}
              <a
                href="https://exped360.com/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none', color: 'inherit', fontWeight: 500 }}
              >
                ExpedGS
              </a>
            </Typography>
          )}
        </Box>
      </Drawer>
    </>
  );
}

export default Sidebar;
