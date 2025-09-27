import { AppBar, Toolbar, Button, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

function Navigation() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" style={{ flexGrow: 1 }}>
          Museum Audio Guide
        </Typography>
        {user && (
          <>
            <Typography variant="subtitle1" sx={{ mr: 2 }}>
              {user.name}
            </Typography>
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Navigation;