// src/hooks/useExpertAudio.ts
import { useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/config';
import { AudioData } from '../types/data';

export function useAudioData(mode: 'expert'|'layman') {
  const [audioData, setAudioData] = useState<AudioData|null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [isRetraining, setRetraining] = useState(false);
  const [uncertaintyDiff, setUncertaintyDiff] = useState(0)

  const fetchAudio = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const response = await axiosClient.get('/audio', { params: { mode } });
      setAudioData(response.data);
      console.log("Got the following audio ", response.data)
    } catch (err) {
      setError('Failed to load audio data');
    } finally {
      setLoading(false);
    }
  }, []);

  // initial load
  useEffect(() => { fetchAudio(); }, [fetchAudio]);

  // poll retraining when flagged
  useEffect(() => {
    if (!isRetraining) return;
    const iv = setInterval(async () => {
      try {
        const { data } = await axiosClient.get('/retrain/status');
        if (data.status === 'ready') {
          setRetraining(false);
          console.log("Uncertainty difference is: ",data.current_uncertainty - data.prev_uncertainty)
          setUncertaintyDiff(data.current_uncertainty - data.prev_uncertainty)
          // show pop up message with the differnence of uncertainties caled
          // status["current_uncertainty"] - status["prev_uncertainty"],
          await fetchAudio();
        }
      } catch { /* swallow */ }
    }, 5_000);
    return () => clearInterval(iv);
  }, [isRetraining, fetchAudio]);

  const fetchNext = useCallback(() => {
    setRetraining(false);
    return fetchAudio();
  }, [fetchAudio]);

  return {
    audioData,
    isLoading,
    error,
    isRetraining,
    setRetraining,
    fetchNextAudio: fetchNext,
    uncertaintyDiff, 
    setUncertaintyDiff
  };
}
