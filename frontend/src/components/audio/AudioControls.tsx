import React from 'react';
import { Box, IconButton, Slider, Tooltip } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import SkipNextIcon from '@mui/icons-material/SkipNext';

interface AudioControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
}

export const AudioControls: React.FC<AudioControlsProps> = ({
  isPlaying,
  onPlay,
  onPause,
  onStop,
  volume,
  onVolumeChange
}) => {
  const [isMuted, setIsMuted] = React.useState(false);
  const [previousVolume, setPreviousVolume] = React.useState(volume);

  const handleMuteToggle = () => {
    if (isMuted) {
      onVolumeChange(previousVolume);
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      onVolumeChange(0);
      setIsMuted(true);
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 2,
      px: 2
      }}>
      <IconButton 
        onClick={isPlaying ? onPause : onPlay}
        sx={{ 
          color: '#4a5d23',
          '&:hover': { color: '#6b7344' }
        }}
      >
        {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
      </IconButton>
      
      <IconButton 
        onClick={onStop}
        sx={{ 
          color: '#4a5d23',
          '&:hover': { color: '#6b7344' }
        }}
      >
        <StopIcon />
      </IconButton>

      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        ml: 'auto',
        width: 150
      }}>
        <IconButton 
          onClick={handleMuteToggle}
          sx={{ 
            color: '#4a5d23',
            '&:hover': { color: '#6b7344' }
          }}
        >
          {isMuted || volume === 0 ? <VolumeOffIcon /> : <VolumeUpIcon />}
        </IconButton>
        <Slider
          size="small"
          value={volume}
          onChange={(_, value) => {
            const newVolume = value as number;
            onVolumeChange(newVolume);
            if (newVolume > 0 && isMuted) {
              setIsMuted(false);
            }
          }}
          min={0}
          max={1}
          step={0.01}
          sx={{
            color: '#4a5d23',
            '& .MuiSlider-thumb': {
              width: 12,
              height: 12,
              '&:hover, &.Mui-focusVisible': {
                boxShadow: '0px 0px 0px 8px rgba(74, 93, 35, 0.16)'
              }
            },
            '& .MuiSlider-track': {
              height: 2
            },
            '& .MuiSlider-rail': {
              height: 2,
              opacity: 0.5
            }
          }}
        />
      </Box>
    </Box>
  );
};