import React, { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Box } from '@mui/material';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.js';
import PropTypes from 'prop-types';

interface WaveformDisplayProps {
  audioUrl: string;
  onWaveformReady: (wavesurfer: WaveSurfer) => void;
  segments?: Array<{
    start_time: number;
    uncertainty: number;
  }>;
  chunkDuration?: number;
  showUncertainty?: boolean;
  highlightChunk?: number | null;
}

const getUncertaintyColor = (uncertainty: number): string => {
  if (uncertainty <= 0.3) return '#6B8E23'; // green
  if (uncertainty <= 0.6) return '#D8A03D'; // orange
  return '#A0522D'; // red
};

const ErrorBarHeightPx: number = 20; // Height of the uncertainty error bars

const WaveformDisplay: React.FC<WaveformDisplayProps> = ({
  audioUrl,
  onWaveformReady,
  segments = [],
  chunkDuration = 5,
  showUncertainty = false,
  highlightChunk = null,
}) => {
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [waveformWidth, setWaveformWidth] = useState<number>(0);
  const [waveformHeight, setWaveformHeight] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);

  // Calculate normalized uncertainties
  const normalizedSegments = React.useMemo(() => {
    if (!segments.length) return [];
    const maxUncertainty = Math.max(...segments.map(s => s.uncertainty));
    return segments.map(segment => ({
      ...segment,
      uncertainty: (segment.uncertainty / maxUncertainty) * 100 // Convert to percentage relative to max
    }));
  }, [segments]);

  useEffect(() => {
    const updateSize = () => {
      if (waveformRef.current) {
        setWaveformWidth(waveformRef.current.clientWidth);
        setWaveformHeight(waveformRef.current.clientHeight);
      }
    };

    updateSize();  // Update once on mount

    window.addEventListener('resize', updateSize);  // Update on resize

    return () => window.removeEventListener('resize', updateSize);  // Cleanup on unmount
  }, []);

  useEffect(() => {
    if (!waveformRef.current || !timelineRef.current) return;

    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
      wavesurferRef.current = null;
    }

    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#222',
      progressColor: '#222',
      cursorColor: '#222',
      height: waveformHeight - ErrorBarHeightPx, // Adjust height to account for error bars
      cursorWidth: 3,
      normalize: true,
      url: audioUrl,
      fillParent: true,
      backend: 'MediaElement',
      plugins: [
        TimelinePlugin.create({
          container: timelineRef.current,
          primaryLabelInterval: showUncertainty ? 5 : 1,
        }),
      ],
    });

    wavesurfer.on('ready', () => {
      setAudioDuration(wavesurfer.getDuration());
      onWaveformReady(wavesurfer);
    });

    wavesurfer.on('error', (err) => {
      console.error('WaveSurfer error:', err);
    });

    wavesurferRef.current = wavesurfer;

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, [audioUrl, onWaveformReady, waveformHeight]);
   

  return (
    <Box sx={{
      position: 'relative',
      width: '100%',
      // border: "2px solid purple",
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
      height: '80%',
      }}>
      <Box
      ref={containerRef}
        sx={{
          position: 'relative',
          width: '100%',
          overflowX: 'hidden',
          height: '100%',
          border: '1.5px solid #444',
          borderRadius: '20px',
          padding: '0px',
          bgcolor: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
        }}
      >
        {/* Highlight overlay - placed before the waveform to be on top */}
        {highlightChunk !== null && (
          <Box
            sx={{
              position: 'absolute',
              left: `${(highlightChunk * 100) / 12}%`,
              width: `${100 / 12}%`,
              height: '100%',
              bgcolor: 'rgba(128, 128, 128, 0.3)', // More opaque gray
              zIndex: 10, // Above the waveform
              pointerEvents: 'none', // Allow clicking through
            }}
          />
        )}
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}>
         {/* Uncertainty bars (above) */}
          <Box sx={{ height: ErrorBarHeightPx, width: '100%' }}>
            {showUncertainty && audioDuration > 0 && (
              <Box sx={{ 
                position: 'absolute', 
                width: `${waveformWidth}px`, 
                height: ErrorBarHeightPx, 
                zIndex: 5, 
                pointerEvents: 'none' 
              }}>
                {normalizedSegments.map((segment, index) => {
                  return (
                    <Box
                      key={index}
                      sx={{
                        position: 'absolute',
                        left: `${index * 100 / 12}%`,
                        width: `${100 / 12}%`,
                        height: '100%',
                        bgcolor: getUncertaintyColor(segment.uncertainty / 100), // Convert back to 0-1 range for color
                        opacity: 0.7,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'auto',
                        '&:hover': { opacity: 1 },
                      }}
                      title={`Uncertainty: ${segment.uncertainty.toFixed(1)}% (relative to max)`}
                    >
                      <Box sx={{ fontSize: '0.7rem', color: 'white', fontWeight: 'bold', opacity: 0.8 }}>
                        {segment.uncertainty.toFixed(0)}%
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
          <Box 
            ref={waveformRef}
            sx={{ 
              width: '100%',
              height: '100%'
            }} /> 
          </Box>
        </Box>

      {/* Timeline container */}
      <Box sx={{
        width: '100%',
        // height: "100%",
        overflowX: 'auto',
        '& .wavesurfer-timeline': {
          width: `${waveformWidth}px`,
          minWidth: '100%',
          height: '20px',
          position: 'relative'
        },
        '& .wavesurfer-timeline .wavesurfer-timeline-notch': {
          height: '32px',
          backgroundColor: '#222',
          width: '4px'
        },
        '& .wavesurfer-timeline .wavesurfer-timeline-notch-minor': {
          display: 'none'
        }
      }}>
        <div ref={timelineRef} />
      </Box>
    </Box>
  );
};

WaveformDisplay.propTypes = {
  audioUrl: PropTypes.string.isRequired,
  onWaveformReady: PropTypes.func.isRequired
};

export default WaveformDisplay;
