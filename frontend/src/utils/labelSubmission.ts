import axiosClient from '../api/config';

export interface LabelSubmission {
  labels: string[];
  segment_id: number;
  audio_filename: string;
}

export const submitLabels = async (submission: LabelSubmission): Promise<any> => {
  try {
    console.log('Submitting labels with payload:', submission);
    const response = await axiosClient.post('/label', submission);  

    if (response.status !== 200) {
      throw new Error(response.data.error || 'Failed to submit labels');
    }
    console.log('Labels submitted successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error submitting labels:', error);
    throw error;
  }
};

export const pollRetrainStatus = async (): Promise<{ status: 'ready' | 'retraining' }> => {
  try {
    const response = await axiosClient.get('/retrain/status');
    return response.data;
  } catch (error) {
    console.error('Error polling retrain status:', error);
    throw error;
  }
};

export const reloadAudioFile = async (filename: string, mode: string = 'layman'): Promise<any> => {
  try {
    const response = await axiosClient.get(`/audio/${filename}`, { params: { mode: mode } });
    return response.data;
  } catch (error) {
    console.error('Error reloading audio file:', error);
    throw error;
  }
};
