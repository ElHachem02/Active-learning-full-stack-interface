import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Fade,
  ThemeProvider,
} from '@mui/material';
import { theme } from '../theme';
import { BirdSelectionList } from './birds/BirdSelectionList';
import type WaveSurfer from 'wavesurfer.js';
import { AudioData } from '../types/data';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/config';
import { submitLabels, pollRetrainStatus, reloadAudioFile, LabelSubmission } from '../utils/labelSubmission';
import Header from '../components/Header';
import StyledButton from '../components/StyledButton';
import LinearProgress from '@mui/material/LinearProgress';
import WaveformWithControls from './audio/WaveformWithControls';
import { GlobalStyles } from '@mui/material';
import introJs from 'intro.js';
import 'intro.js/minified/introjs.min.css';
import { HeaderHeightPx } from './Header';

const CHUNK_DURATION = 5;

export const LaymanView: React.FC = () => {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBirds, setSelectedBirds] = useState<string[]>([]);
  const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null);
  const [audioData, setAudioData] = useState<AudioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(1);
  const [isNextAudioLoading, setIsNextAudioLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isRetraining, setIsRetraining] = useState(false);
  const [submissionCounter, setSubmissionCounter] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [isFinalMessage, setIsFinalMessage] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);
  const [popupMessage, setPopupMessage] = useState<string>('');

  useEffect(() => {
    const fetchAudio = async () => {
      try {
        const response = await axiosClient.get('/audio', { params: { mode: 'layman' } });
        setAudioData(response.data);
      } catch {
        setError('Failed to load audio data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAudio();
  }, []);

  const fetchNextAudio = useCallback(async () => {
    try {
      setIsNextAudioLoading(true);
      const response = await axiosClient.get('/audio', { params: { mode: 'layman' } });
      console.log("received audio", response)
      setAudioData(response.data);
      setSelectedBirds([]);
      wavesurfer?.stop();
      setIsPlaying(false);
    } catch {
      setError('Failed to load next audio');
    } finally {
      setIsNextAudioLoading(false);
    }
  }, [wavesurfer]);

  useEffect(() => {
    setCurrentChunk(Math.floor(currentTime / CHUNK_DURATION));
  }, [currentTime]);

  useEffect(() => { 
    if (!showPopup) return;

    const timeout = setTimeout(() => {
      setShowPopup(false);
    }, isFinalMessage ? 10000 : 3000);

    return () => clearTimeout(timeout);
  }, [showPopup, isFinalMessage]);

  useEffect(() => {
    if (!wavesurfer) return;
    const update = () => setCurrentTime(wavesurfer.getCurrentTime());
    wavesurfer.on('audioprocess', update);
    wavesurfer.on('interaction', update);
    return () => {
      wavesurfer.un('audioprocess', update);
      wavesurfer.un('interaction', update);
    };
  }, [wavesurfer]);

  const handlePlayPause = () => {
    if (wavesurfer) {
      wavesurfer.playPause();
      setIsPlaying(wavesurfer.isPlaying());
    }
  };

  const handleBirdSelect = useCallback((bird: string) => {
    setSelectedBirds(prev =>
      prev.includes(bird) ? prev.filter(b => b !== bird) : [...prev, bird]
    );
  }, []);

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    wavesurfer?.setVolume(v);
  };

  const handleSubmitLabels = useCallback(async () => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      if (!audioData) {
        throw new Error('No audio data available');
      }

      if(!audioData.filename){
        console.log("Found a file with an empty filename", audioData)
        throw new Error("Audio file with empty filename ...")
      }

      console.log('About to submit the audio ', audioData)

      const submission: LabelSubmission = {
        audio_filename: audioData.filename,
        segment_id: audioData.segments[0].id,
        labels: selectedBirds
      };

      const result = await submitLabels(submission);
      const newCount = submissionCounter + 1;

      if (newCount >= 20) {
        setSubmissionCounter(0);
        setIsFinalMessage(true);
        setPopupMessage('Thanks for all your help :) you\'re making our model smarter with every click! We\'ll chirp back once retraining is done!');
      } else {
        setSubmissionCounter(newCount);
        setIsFinalMessage(false);
        setPopupMessage('Thanks for your contribution! Your label has been submitted.');
      }

      if (result.retrain) {
        setIsRetraining(true);
        console.log("started retraining !!!!")
      }
      setShowPopup(true);
      setSelectedBirds([]);
      await fetchNextAudio();

    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit labels');
    } finally {
      setIsSubmitting(false);
    }
  }, [currentTime, selectedBirds, audioData, submissionCounter, fetchNextAudio]);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;

    if (isRetraining) {
      pollInterval = setInterval(async () => {
        try {
          const status = await pollRetrainStatus();
          console.log("Retrain status:", status.status);
          
          if (status.status === 'ready') {
            if (audioData) {
              console.log("Retrainign is done :))")
              const updatedAudio = await reloadAudioFile(audioData.filename, 'layman');
              setAudioData(updatedAudio);
            }
            setIsRetraining(false);
            if (pollInterval) {
              clearInterval(pollInterval);
              pollInterval = null;
            }
          }
        } catch (error) {
          console.error('Error polling retrain status:', error);
        }
      }, 2000);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [isRetraining, audioData]);

  const getCurrentSegment = useCallback(() => {
    if (!audioData) return null;
    return audioData.segments.find(segment =>
      currentTime >= segment.start_time &&
      currentTime < (segment.start_time + CHUNK_DURATION)
    );
  }, [audioData, currentTime]);

  const currentSegment = getCurrentSegment();

  const renderSegmentTimeline = () => {
    if (!currentSegment) return null;
    return (
      <Box sx={{ mt: 1, position: 'relative', height: '24px', px: 1 }}>
        <Box sx={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', bgcolor: '#e0e0e0', transform: 'translateY(-50%)', borderRadius: '1px' }} />
        <Box sx={{ position: 'absolute', top: '50%', left: `${((currentTime - currentSegment.start_time) / CHUNK_DURATION) * 100}%`, width: '2px', height: '12px', bgcolor: '#ff0000', transform: 'translate(-50%, -50%)', transition: 'left 0.1s linear' }} />
        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#666' }}>
          <Typography variant="caption">{currentSegment.start_time}s</Typography>
          <Typography variant="caption">{currentSegment.start_time + CHUNK_DURATION}s</Typography>
        </Box>
      </Box>
    );
  };

  const startTour = useCallback(() => {
    const tour = introJs();
    tour.setOptions({
      steps: [
        {
          title: 'Audio Controls',
          intro: 'Welcome to the audio annotation interface! Here you can control the audio playback. Use the play/pause button to start and stop the audio, adjust the volume using the slider, and click directly on the waveform to jump to specific parts of the recording.',
          element: '.waveform-controls',
          position: 'top'
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

  if (isLoading || !audioData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>{error || 'Loading audio...'}</Typography>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles styles={{
        body: {
          margin: 0,
          height: '100vh',
          overflow: 'auto',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
      }} />
      <Header onStartTour={startTour} isTourActive={isTourActive} />
      <Box sx={{
        bgcolor: 'background.default',
        minHeight: '100vh',
        overflow: 'visible',
        pb: 4
      }}>
        <Fade in timeout={600}>
          <Box sx={{ 
            display: 'flex', 
            px: 3, 
            pt: 4, 
            gap: 4, 
            minHeight: `calc(100vh - ${HeaderHeightPx}px)`,
            overflow: 'visible'
          }}>
            <Box sx={{flexGrow: 2, display: 'flex', flexDirection: 'column'}}>
              <Box sx={{ flexGrow: 2, display: 'flex', flexDirection: 'column', gap: 2, mt: 0, maxHeight: '100%' }}>
                <Typography variant="h5" sx={{ color: '#606C38', fontWeight: 700 }}>
                  Please indicate which birds you hear in the audio
                </Typography>

                <WaveformWithControls
                  className="waveform-controls"
                  audioUrl={audioData.audio_url}
                  onWaveformReady={setWavesurfer}
                  segments={audioData.segments}
                  chunkDuration={CHUNK_DURATION}
                  isPlaying={isPlaying}
                  onPlay={handlePlayPause}
                  onPause={handlePlayPause}
                  onStop={() => { wavesurfer?.stop(); setIsPlaying(false); }}
                  volume={volume}
                  onVolumeChange={handleVolumeChange}
                  showUncertainty={false}
                />
                <Box sx={{ mt: 2, px: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <LinearProgress
                      variant="determinate"
                      value={(submissionCounter / 20) * 100}
                      sx={{ 
                        flexGrow: 1, 
                        height: 8, 
                        borderRadius: 4,
                        bgcolor: '#e0e0e0',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: '#606C38'
                        }
                      }}
                    />
                    <Typography variant="caption" sx={{ color: '#606C38', fontWeight: 600, minWidth: '45px' }}>
                      {submissionCounter}/20
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#606C38', display: 'block', textAlign: 'center' }}>
                    {20 - submissionCounter} more segments until retraining
                  </Typography>
                </Box>
              </Box>
              <Box sx={{mb: 3}}>
                <StyledButton onClick={() => navigate('/')} bgcolor="#dda15e" scale={1}>
                  End
                </StyledButton>
              </Box>
            </Box>

            <Box 
              className="bird-selection-box"
              sx={{ 
                width: '400px', 
                flexShrink: 0, 
                display: 'flex', 
                flexDirection: 'column', 
                bgcolor: '#c6be8c80', 
                borderRadius: 2, 
                p: 2, 
                gap: 2, 
                mb: 3,
                height: 'calc(100vh - 200px)',  // Fixed height for the container
                overflow: 'hidden'  // Hide overflow on the container
              }}>
              <Box sx={{ 
                flexGrow: 1,        // Take up remaining space
                overflowY: 'auto',  // Make this box scrollable
                overflowX: 'hidden', // Prevent horizontal scroll
                '&::-webkit-scrollbar': {  // Customize scrollbar
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f1f1',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#c6be8c',
                  borderRadius: '4px',
                  '&:hover': {
                    background: '#a89f6d',
                  },
                },
                mb: 2
              }}>
                <BirdSelectionList
                  selectedBirds={selectedBirds}
                  onBirdSelect={handleBirdSelect}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  error={submitError}
                  hideButtons
                />
              </Box>
              <Box sx={{ 
                display: 'flex', 
                gap: 0,
                flexShrink: 0  // Prevent buttons from shrinking
              }}>
                <StyledButton 
                  fullWidth 
                  onClick={async () => {
                    setSelectedBirds([]);
                    setPopupMessage('Happens to the best of us ;)\n Fetched a new segment to label !');
                    setShowPopup(true);
                    setIsFinalMessage(false);
                    await fetchNextAudio();
                  }} 
                  bgcolor="#dda15e" 
                  scale={0.85}
                  disabled={selectedBirds.length > 0}
                  sx={{ 
                    '&:disabled': { 
                      bgcolor: '#dda15e80',  // More transparent version of the color
                      color: '#fff',
                      opacity: 0.7,
                      cursor: 'not-allowed',
                      '&:hover': {
                        bgcolor: '#dda15e80'  // Keep the same color on hover when disabled
                      }
                    } 
                  }}
                >
                  NOT SURE
                </StyledButton>
                <StyledButton
                  fullWidth
                  onClick={handleSubmitLabels}

                  disabled={isSubmitting || selectedBirds.length === 0}
                  sx={{ 
                    '&:disabled': { 
                      bgcolor: '#dda15e80',  // More transparent version of the color
                      color: '#fff',
                      opacity: 0.7,
                      cursor: 'not-allowed',
                      '&:hover': {
                        bgcolor: '#dda15e80'  // Keep the same color on hover when disabled
                      }
                    } 
                  }}                  
                  bgcolor="#dda15e" 
                  scale={0.85}
                >
                  SUBMIT
                </StyledButton>
              </Box>
            </Box>

          </Box>
        </Fade>
        {(isRetraining || showPopup) && (
          <Box sx={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 320,
            bgcolor: '#fdf7eb',
            borderRadius: 2,
            boxShadow: 4,
            p: 2,
          }}>
            <Typography sx={{ color: '#4a5d23', fontWeight: 600, mb: 1, textAlign: 'center' }}>
              {popupMessage}
            </Typography>

            {isRetraining && !isFinalMessage && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={(submissionCounter / 20) * 100}
                    sx={{ flexGrow: 1, height: 10, borderRadius: 5 }}
                  />
                  <Typography variant="caption" sx={{ width: 40, textAlign: 'right', color: '#4a5d23' }}>
                    {submissionCounter}/20
                  </Typography>
                </Box>
                <Typography
                  variant="caption"
                  sx={{ textAlign: 'center', color: '#4a5d23', mt: 1 }}
                >
                  {20 - submissionCounter} labels until retraining
                </Typography>
              </>
            )}
          </Box>
        )}
      </Box>
    </ThemeProvider>
  );
}