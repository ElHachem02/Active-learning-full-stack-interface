import React from 'react';
import WaveformDisplay from './WaveformDisplay';

interface Segment {
  start_time: number;
  uncertainty: number;
}

interface ExpertWaveformProps {
  audioUrl: string;
  onWaveformReady: (wavesurfer: any) => void;
  segments: Segment[];
  chunkDuration?: number;
}

const ExpertWaveform: React.FC<ExpertWaveformProps> = ({
  audioUrl,
  onWaveformReady,
  segments,
  chunkDuration = 5,
}) => {
  return (
    <WaveformDisplay
      audioUrl={audioUrl}
      onWaveformReady={onWaveformReady}
      segments={segments}
      chunkDuration={chunkDuration}
      showUncertainty={true}  
    />
  );
};

export default ExpertWaveform;
