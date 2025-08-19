import React from 'react';
import { Box } from '@mui/material';

interface TimelineChunksProps {
  chunks: Array<{
    start: number;
    end: number;
    label: string;
  }>;
  duration: number;
}

export const TimelineChunks: React.FC<TimelineChunksProps> = ({ chunks, duration }) => {
  return (
    <Box sx={{ 
      position: 'relative', 
      width: '100%', 
      height: '20px', 
      bgcolor: '#f5f5f5',
      border: '1px solid #ddd',
      borderRadius: '4px',
      overflow: 'hidden',
      mb: 2
    }}>
      {chunks.map((chunk, index) => (
        <Box
          key={index}
          sx={{
            position: 'absolute',
            left: `${(chunk.start / duration) * 100}%`,
            width: `${((chunk.end - chunk.start) / duration) * 100}%`,
            height: '100%',
            bgcolor: '#2196F3',
            opacity: 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            color: '#fff'
          }}
        >
          {chunk.label}
        </Box>
      ))}
    </Box>
  );
}; 