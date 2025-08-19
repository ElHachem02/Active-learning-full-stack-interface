import React from 'react';
import { Box } from '@mui/material';
import WaveformDisplay from './WaveformDisplay';
import { AudioControls } from './AudioControls';

interface WaveformWithControlsProps {
  className?: string;
  audioUrl: string;
  onWaveformReady: (wavesurfer: any) => void;
  segments?: Array<{ start_time: number; uncertainty: number }>;
  chunkDuration?: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  volume: number;
  onVolumeChange: (v: number) => void;
  showUncertainty?: boolean;
  highlightChunk?: number | null;
}

const WaveformWithControls: React.FC<WaveformWithControlsProps> = ({
  className,
  audioUrl,
  onWaveformReady,
  segments,
  chunkDuration,
  isPlaying,
  onPlay,
  onPause,
  onStop,
  volume,
  onVolumeChange,
  showUncertainty = false,
  highlightChunk = null
}) => (
  <Box className={className} sx={{maxHeight: "300px", width: "100%", height: "90%", display: "flex", flexDirection: "column", justifyContent: "end", mr: 4}}>
    <WaveformDisplay
      audioUrl={audioUrl}
      onWaveformReady={onWaveformReady}
      segments={segments}
      chunkDuration={chunkDuration}
      showUncertainty={showUncertainty}
      highlightChunk={highlightChunk}
    />
    <AudioControls
      isPlaying={isPlaying}
      onPlay={onPlay}
      onPause={onPause}
      onStop={onStop}
      volume={volume}
      onVolumeChange={onVolumeChange}
    />
    <Box sx={{
      height: '2px',
      width: '100%',
      bgcolor: '#1f2937',
      opacity: 0.3,
      borderRadius: 1} }
    />
  </Box>
);

export default WaveformWithControls;
