import React, {
  useState,
  useEffect,
  useCallback,
  useRef
} from 'react';
import {
  CardMedia,
  Box,
  Typography,
  ThemeProvider,
  Snackbar,
  Alert,
  LinearProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type WaveSurfer from 'wavesurfer.js';

import Header from '../components/Header';
import StyledButton from '../components/StyledButton';
import { BirdSelectionList } from './birds/BirdSelectionList';
import WaveformWithControls from './audio/WaveformWithControls';
import { useAudioData } from '../utils/useAudioData';
import { submitLabels, LabelSubmission } from '../utils/labelSubmission';
import { theme } from '../theme';
import { HeaderHeightPx } from './Header';
import introJs from 'intro.js';
import 'intro.js/minified/introjs.min.css';

import {
  waveformPanelSx,
  waveformHeaderSx,
  waveformButtonSx,
  retrainingBoxSx,
} from './styles/ExpertViewStyles';

const CHUNK_DURATION = 5; // seconds

// --- Hooks -----------------------------------------------------

function useExpertAudio(audioUrl: string) {
  const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [highestUncertaintyChunk, setHighestUncertaintyChunk] = useState<number | null>(null);
  const [maxChunkId, setMaxChunkId] = useState<number>(1);

  // time updates & play state
  useEffect(() => {
    if (!wavesurfer) return;
    const onTime = () => {
      const t = wavesurfer.getCurrentTime();
      setCurrentTime(t);
      setIsPlaying(wavesurfer.isPlaying());
    };
    wavesurfer.on('audioprocess', onTime);
    wavesurfer.on('interaction', onTime);
    return () => {
      wavesurfer.un('audioprocess', onTime);
      wavesurfer.un('interaction', onTime);
    };
  }, [wavesurfer]);

  // chunk index
  useEffect(() => {
    setCurrentChunk(Math.floor(currentTime / CHUNK_DURATION));
  }, [currentTime]);

  const handlePlayPause = useCallback(() => {
    if (!wavesurfer) return;
    wavesurfer.playPause();
    setIsPlaying(wavesurfer.isPlaying());
  }, [wavesurfer]);

  return {
    wavesurfer,
    setWavesurfer,
    currentTime,
    currentChunk,
    isPlaying,
    handlePlayPause,
    volume,
    setVolume,
    highestUncertaintyChunk,
    setHighestUncertaintyChunk,
    maxChunkId, 
    setMaxChunkId
  };
}

function useLabelSubmission(
  onRetraining: () => void,
  onSubmission: (count: number) => void,
  onShowToast: (message: string, isFinal: boolean) => void
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const counterRef = useRef(0);

  const submit = useCallback(
    async (maxChunk: number, labels: string[], filename: string) => {
      setIsSubmitting(true);
      setSubmitError(null);
      counterRef.current += 1;

      const payload: LabelSubmission = {
        labels,
        segment_id: maxChunk,
        audio_filename: filename,
      };

      try {
        const result = await submitLabels(payload);
        if (result.is_retraining) {
          onRetraining();
        }
        
        // Update counter and show appropriate message
        if (counterRef.current >= 20) {
          counterRef.current = 0;
          onShowToast('Thanks for all your help :) you\'re making our model smarter with every click! We\'ll chirp back once retraining is done!', true);
        } else {
          onShowToast('Thanks for your contribution! Your label has been submitted.', false);
        }
        
        onSubmission(counterRef.current);
      } catch (err: any) {
        setSubmitError(err?.message ?? 'Failed to submit labels');
        console.error(err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [onRetraining, onSubmission, onShowToast]
  );

  return {
    isSubmitting,
    submitError,
    submit,
    submissionCount: counterRef.current,
  };
}

// --- Subcomponents --------------------------------------------

interface WaveformPanelProps {
  className?: string;
  audioUrl: string;
  wavesurfer: WaveSurfer | null;
  setWavesurfer: (ws: WaveSurfer) => void;
  segments: Array<{ start_time: number; uncertainty: number }>;
  isPlaying: boolean;
  onPlayPause: () => void;
  volume: number;
  onVolumeChange: (v: number) => void;
  onEnd: () => void;
  highestUncertaintyChunk: number | null;
}
const WaveformPanel: React.FC<WaveformPanelProps> = ({
  className,
  audioUrl,
  wavesurfer,
  setWavesurfer,
  segments,
  isPlaying,
  onPlayPause,
  volume,
  onVolumeChange,
  onEnd,
  highestUncertaintyChunk,
}) => (
  <Box className={className} sx={{...waveformPanelSx, height: "40%"}}>
    <Box sx={{...waveformHeaderSx, height: "15%"}}>
      <Typography
        variant="h5"
        sx={{ color: '#000', fontWeight: 400, fontSize: 20, m: 0 }}
      >
        Please indicate which birds you hear{' '}
        <Box
          component="span"
          sx={{
            fontWeight: 700,
            textDecoration: 'underline',
            display: 'inline',
          }}
        >
          in the greyed out area
        </Box>
      </Typography>
    </Box>
    <Box sx={{height: "85%", display: "flex", flexDirection: "row", gap: 2, justifyContent: "center", alignItems: "center"}}>
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        height: '100%',      // ← make sure the Box actually has some height
        gap: 2,
        p: 2}}>
      <StyledButton
        onClick={onEnd}
        sx={waveformButtonSx}
        bgcolor="#dda15e"
        scale={1}
      >
        END
      </StyledButton>
      </Box>
      <WaveformWithControls
        className="audio-controls"
        audioUrl={audioUrl}
        onWaveformReady={setWavesurfer}
        segments={segments}
        chunkDuration={CHUNK_DURATION}
        isPlaying={isPlaying}
        onPlay={onPlayPause}
        onPause={onPlayPause}
        onStop={() => {
          wavesurfer?.stop();
        }}
        volume={volume}
        onVolumeChange={onVolumeChange}
        showUncertainty={true}
        highlightChunk={highestUncertaintyChunk}
      />
    </Box>
  </Box>
);

interface SubmissionToastProps {
  open: boolean;
  onClose: () => void;
  message: string;
  isFinalMessage: boolean;
  submissionCount?: number;
}
const SubmissionToast: React.FC<SubmissionToastProps> = ({
  open,
  onClose,
  message,
  isFinalMessage,
  submissionCount = 0,
}) => (
  <Box sx={{
    position: 'fixed',
    top: 0, // Position at the very top
    left: '50%',
    transform: 'translateX(-50%)',
    width: 320,
    bgcolor: '#fdf7eb',
    borderRadius: '0 0 8px 8px', // Round only bottom corners
    boxShadow: 4,
    p: 2,
    zIndex: 100,
  }}>
    {!isFinalMessage && submissionCount > 0 && (
      <>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <LinearProgress
            variant="determinate"
            value={(submissionCount / 20) * 100}
            sx={{ 
              flexGrow: 1, 
              height: 10, 
              borderRadius: 5,
              bgcolor: '#e0e0e0',
              '& .MuiLinearProgress-bar': {
                bgcolor: '#606C38'
              }
            }}
          />
          <Typography variant="caption" sx={{ width: 40, textAlign: 'right', color: '#4a5d23' }}>
            {submissionCount}/20
          </Typography>
        </Box>
        <Typography
          variant="caption"
          sx={{ textAlign: 'center', color: '#4a5d23', mb: 1, display: 'block' }}
        >
          {20 - submissionCount} labels until retraining
        </Typography>
      </>
    )}
    <Typography sx={{ color: '#4a5d23', fontWeight: 600, textAlign: 'center' }}>
      {message}
    </Typography>
  </Box>
);

// --- Main Component -------------------------------------------
export const ExpertView: React.FC = () => {
  const [isTourActive, setIsTourActive] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [isFinalMessage, setIsFinalMessage] = useState(false);
  const [submissionCount, setSubmissionCount] = useState(0);

  const navigate = useNavigate();
  const {
    audioData,
    isLoading,
    error,
    isRetraining,
    setRetraining,
    fetchNextAudio,
  } = useAudioData('expert');

  // audio & time/chunk logic
  const {
    wavesurfer,
    setWavesurfer,
    currentChunk,
    isPlaying,
    handlePlayPause,
    volume,
    setVolume,
    highestUncertaintyChunk,
    setHighestUncertaintyChunk, 
    maxChunkId, 
    setMaxChunkId
  } = useExpertAudio(audioData?.audio_url || '');

  // Calculate highest uncertainty chunk when segments change
  useEffect(() => {
    if (!audioData?.segments) return;
    
    let maxUncertainty = -1;
    let maxChunk = null;
    let maxChunk_id = 1;
    
    audioData.segments.forEach(segment => {
      const chunkIndex = Math.floor((segment.start_time % 60) / CHUNK_DURATION);
      if (segment.uncertainty > maxUncertainty) {
        maxUncertainty = segment.uncertainty;
        maxChunk = chunkIndex;
        maxChunk_id = segment.id
      }
    });
    
    setMaxChunkId(maxChunk_id)
    setHighestUncertaintyChunk(maxChunk);
  }, [audioData?.segments]);

  const handleShowToast = useCallback((message: string, isFinal: boolean) => {
    setPopupMessage(message);
    setIsFinalMessage(isFinal);
    setShowToast(true);
    
    // Auto-hide toast after 2 seconds unless it's the final message
    if (!isFinal) {
      setTimeout(() => {
        setShowToast(false);
      }, 2000);
    }
  }, []);

  const handleSubmissionCount = useCallback((count: number) => {
    setSubmissionCount(count);
  }, []);

  // labels & submission
  const {
    isSubmitting,
    submitError,
    submit
  } = useLabelSubmission(
    () => setRetraining(true),
    handleSubmissionCount,
    handleShowToast
  );

  // selection + search
  const [selectedBirds, setSelectedBirds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleBirdSelect = useCallback((b: string) => {
    setSelectedBirds((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
    );
  }, []);

  const handleSubmitLabels = useCallback(async () => {
    if (!audioData) return;
    await submit(maxChunkId, selectedBirds, audioData.filename);
    setSelectedBirds([]);
    await fetchNextAudio();
  }, [submit, maxChunkId, selectedBirds, audioData, fetchNextAudio]);

  const handleClear = useCallback(() => {
    setSelectedBirds([]);
  }, []);

  // determine current spectrogram segment
  const currentSegment = audioData?.segments.find((seg) => {
    const t = seg.start_time % 60;
    return (
      (currentChunk * CHUNK_DURATION >= t &&
      currentChunk * CHUNK_DURATION < t + CHUNK_DURATION)
    );
  });

  console.log('Current segment for spectrogram:', currentSegment);

  
  const startTour = useCallback(() => {
    const tour = introJs();
    tour.setOptions({
      steps: [
        {
          title: 'Waveform Panel',
          intro: 'This panel shows the audio waveform split into 5-second chunks. The colored bars above each chunk show our model\'s uncertainty - the higher the bar, the less certain we are about that segment.',
          element: '.waveform-panel',
          position: 'top'
        },
        {
          title: 'Audio Controls',
          intro: 'Use these controls to play, pause, stop, and adjust the volume of the audio recording. You can also click directly on the waveform to jump to specific parts.',
          element: '.audio-controls',
          position: 'top'
        },
        {
          title: 'Spectrogram',
          intro: 'This visual representation shows the frequency content of the audio over time. Different bird species have distinct patterns in the spectrogram, which can help in identification.',
          element: '.spectrogram-container',
          position: 'left'
        },
        {
          title: 'Bird Selection',
          intro: 'Here you can select the birds you hear in the current chunk. Search for birds by name, click to select them, and use the buttons below to either submit your selection or indicate you\'re not sure about this chunk.',
          element: '.bird-selection-box',
          position: 'right'
        },
        {
          title: 'Track Your Impact',
          intro: 'Click the Statistics button in the header to see how your annotations are helping improve the model! You can track the model\'s uncertainty over time and see the impact of your contributions.',
          element: '.statistics-button',
          position: 'bottom'
        }
      ],
      showProgress: true,
      showBullets: true,
      exitOnOverlayClick: false,
      exitOnEsc: false,
      scrollToElement: true,
      scrollPadding: HeaderHeightPx
    });

    tour.oncomplete(() => {
      setIsTourActive(false);
    });

    tour.onexit(() => {
      setIsTourActive(false);
    });

    tour.start();
    setIsTourActive(true);
  }, []);

  // Add handler for NOT SURE button
  const handleNotSure = useCallback(async () => {
    setSelectedBirds([]);
    setPopupMessage('Happens to the best of us ;)\n Fetched a new segment to label !');
    setShowToast(true);
    setIsFinalMessage(false);
    await fetchNextAudio();
    
    // Auto-hide not sure toast after 2 seconds
    setTimeout(() => {
      setShowToast(false);
    }, 2000);
  }, [fetchNextAudio]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Typography>Loading audio data...</Typography>
      </Box>
    );
  }

  if (error || !audioData) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Typography color="error">
          {error || 'No audio data available'}
        </Typography>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Header onStartTour={startTour} isTourActive={isTourActive} />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div style={{ height: `calc(100vh - ${HeaderHeightPx}px)` }}>
          {/* Top section with spectrogram and bird labeling */}
          <Box component="section" sx={{ display: 'flex', height: '60%', gap: 2, p: 2 }}>
            {/* Spectrogram */}
            <Box sx={{ flex: 1.25, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', ml: 3 }}>
              <Box className="spectrogram-container" sx={{
                p: 2,
                height: 350,
                width: '90%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'white',
                borderRadius: 2,
                border: '1px solid #c6be8c',
                borderWidth: 2,
              }}>
                
                  {/* Left: spectrogram */}
          {currentSegment?.spectrogram_url && (
            <CardMedia
              component="img"
              image={currentSegment.spectrogram_url}
              alt={`Spectrogram ${currentSegment.start_time}`}
              sx={{objectFit: "contain", height: '110%', width: '110%', alignSelf: 'center', justifySelf: 'center'
              }}
            />
          )}

            
              </Box>
            </Box>

            {/* Bird Selection Box */}
            <Box className="bird-selection-box" sx={{ 
              width: '400px', 
              flexShrink: 0, 
              display: 'flex', 
              flexDirection: 'column', 
              bgcolor: '#c6be8c80', 
              borderRadius: 2, 
              p: 1, 
              gap: 2, 
              mb: 0 
            }}>
              <Box sx={{ flexGrow: 1, minHeight: 0, maxHeight: '100%', overflowY: 'auto', mb: 2 }}>
                <BirdSelectionList
                  selectedBirds={selectedBirds}
                  onBirdSelect={handleBirdSelect}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  error={submitError}
                  hideButtons
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 0 }}>
                <StyledButton 
                  fullWidth 
                  onClick={handleNotSure}
                  bgcolor='#dda15e' 
                  scale={0.85}
                  disabled={selectedBirds.length > 0}
                  sx={{ 
                    '&:disabled': { 
                      bgcolor: '#dda15e80',
                      color: '#fff',
                      opacity: 0.7,
                      cursor: 'not-allowed',
                      '&:hover': {
                        bgcolor: '#dda15e80'
                      }
                    } 
                  }}
                >
                  NOT SURE
                </StyledButton>
                <StyledButton
                  fullWidth
                  onClick={handleSubmitLabels}
                  bgcolor='#dda15e' 
                  scale={0.85}
                  disabled={isSubmitting || selectedBirds.length === 0}
                  sx={{ 
                    '&:disabled': { 
                      bgcolor: '#dda15e80',
                      color: '#fff',
                      opacity: 0.7,
                      cursor: 'not-allowed',
                      '&:hover': {
                        bgcolor: '#dda15e80'
                      }
                    } 
                  }}
                >
                  SUBMIT
                </StyledButton>
              </Box>
            </Box>
          </Box>

          {/* Bottom section with waveform */}
          <WaveformPanel
            className="waveform-panel"
            audioUrl={audioData.audio_url}
            wavesurfer={wavesurfer}
            setWavesurfer={setWavesurfer}
            segments={audioData.segments}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            volume={volume}
            onVolumeChange={setVolume}
            onEnd={() => navigate('/')}
            highestUncertaintyChunk={highestUncertaintyChunk}
          />
        </div>
      </Box>

      {/* Add the toast */}
      {(showToast || isRetraining) && (
        <SubmissionToast
          open={showToast}
          onClose={() => setShowToast(false)}
          message={popupMessage}
          isFinalMessage={isFinalMessage}
          submissionCount={submissionCount}
        />
      )}
    </ThemeProvider>
  );
};

export default ExpertView;
