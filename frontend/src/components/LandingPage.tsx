import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Container, Fade } from '@mui/material';
import bird from '../visuals/bird.png';
import Header from '../components/Header';
import StyledButton from '../components/StyledButton';
import '@fontsource/playfair-display';
import '@fontsource/montserrat/400.css'; // Regular


export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#faf7dd',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Header />
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        
      </Box>

      {/* Bird Image */}
      <Box
        component="img"
        src={bird}
        alt="Bird on branch"
        sx={{
          position: 'absolute',
          left: 0,
          bottom: '12%',
          width: { xs: '60vw', md: '40vw' },
          minWidth: 240,
          maxWidth: 400,
          zIndex: 1,
          pointerEvents: 'none',
          userSelect: 'none',
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))',
          transition: 'transform 0.4s ease-in-out',
          transform: 'translateX(-20px)',
          '&:hover': { transform: 'scale(1.02)' },
        }}
      />

      {/* Main Content */}
      <Container sx={{ zIndex: 2 }}>
        <Fade in timeout={700}>
          <Box
            sx={{
              mt: { xs: 6, md: 10 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              pb: 10,
              pt:6
            }}
          >
            <Typography variant="h3" sx={{ color: '#606C38', fontWeight: 400, fontSize: 95,  fontFamily: '"Playfair Display", serif', mb:1}}>
              Wildlife Audio Annotation
            </Typography>
            <Typography
              variant="subtitle1"
              noWrap
              sx={{
                fontFamily: '"Montserrat", sans-serif',
                fontWeight: 50,
                fontSize: 40,
                color: '#6b7a44',
                letterSpacing: 2,
                mb:10,
              }}
            >
              SUPPORT WILDLIFE RESEARCH - JUST BY LISTENING
            </Typography>
            <Box sx={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', mt: 1 }}>
              <StyledButton onClick={() => navigate('/layman')} bgcolor = '#dda15e' scale={1.5}>LAYMAN</StyledButton>
              <StyledButton onClick={() => navigate('/expert')} bgcolor = '#dda15e' scale={1.5} >EXPERT</StyledButton>
            </Box>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default LandingPage;
