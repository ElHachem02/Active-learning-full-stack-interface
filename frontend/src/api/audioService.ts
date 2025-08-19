import api from './config';

export interface AudioAnnotationSubmission {
  selectedBirds: string[];
  timestamp: number;
  audioId: string;
}

export const audioService = {
  // Get audio file for playback
  getAudio: async (audioId: string) => {
    const response = await api.get(`/api/audio/${audioId}`, {
      responseType: 'blob'
    });
    return URL.createObjectURL(response.data);
  },

  // Submit bird annotations
  submitAnnotation: async (data: AudioAnnotationSubmission) => {
    return api.post('/api/annotations', data);
  },

  // Get available bird species
  getBirdSpecies: async () => {
    const response = await api.get('/api/birds');
    return response.data;
  },
}; 