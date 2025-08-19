import React from 'react';
import { AppBar, Toolbar, Typography, Box, Button, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import birdLogo from '../visuals/birdLogo.png';
import StyledButton from '../components/StyledButton';

interface HeaderProps {
  onStartTour?: () => void;
  isTourActive?: boolean;
}
export const HeaderHeightPx = 64;

const Header: React.FC<HeaderProps> = ({ onStartTour, isTourActive }) => {

  const navigate = useNavigate();

  return (
    <>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          background: 'transparent',
          boxShadow: 'none',
          zIndex: 9999,
          height: HeaderHeightPx,
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', px: { xs: 2, md: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <img src={birdLogo} alt="Bird Logo" style={{ height: 32 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#606c38' }}>
              BirdSongClassifier
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              onClick={() => navigate('/stats')}
              className="statistics-button"
              sx={{
                fontWeight: 500,
                color: '#ffffff',
                textTransform: 'none',
                background: '#606c38',
                '&:hover': { color: '#c6be8c' },
              }}
            >
              Statistics
            </Button>
            <Button
              onClick={onStartTour}
              disabled={isTourActive}
              sx={{
                fontWeight: 500,
                color: '#ffffff',
                textTransform: 'none',
                background: '#606c38',
                '&:hover': { color: '#c6be8c' },
                '&:disabled': {
                  color: '#c6be8c80',
                  background: '#606c3880'
                }
              }}
            >
              Live Demo
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Divider sx={{ borderColor: '#c6be8c' }} />
    </>
  );
};

export default Header;
