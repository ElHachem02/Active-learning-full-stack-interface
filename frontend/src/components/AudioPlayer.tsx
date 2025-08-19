import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Container, 
  Button, 
  Box,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, PlayArrow as PlayArrowIcon } from '@mui/icons-material';
import { AudioData, AudioFiles } from '../types/data';

interface AudioPlayerProps {
  mainAudio: AudioData | undefined;
  audioFiles: AudioFiles | undefined;
  onFileSelect: (fileName: string) => void;
  onBack: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  mainAudio,
  audioFiles,
  onFileSelect,
  onBack
}) => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color="primary">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onBack}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Wildlife Audio Player
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8} component="div">
            <Paper elevation={3} sx={{ p: 3 }}>
              {mainAudio && (
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {mainAudio.filename}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <audio 
                      controls 
                      src={mainAudio.audio_url}
                      style={{ width: '100%' }}
                    >
                      Your browser does not support the audio element.
                    </audio>
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={4} component="div">
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Available Files
              </Typography>
              <List>
                {audioFiles?.files.map(fileName => (
                  <ListItem key={fileName} disablePadding>
                    <ListItemButton
                      selected={mainAudio?.filename === fileName}
                      onClick={() => onFileSelect(fileName)}
                    >
                      <ListItemText primary={fileName} />
                      {mainAudio?.filename === fileName && (
                        <PlayArrowIcon color="primary" />
                      )}
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}; 