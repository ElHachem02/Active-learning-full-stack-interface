import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, ThemeProvider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import introJs from 'intro.js';
import 'intro.js/minified/introjs.min.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from 'chart.js';
import { theme } from '../theme';
import Header from './Header';
import { HeaderHeightPx } from './Header';
import axiosClient from '../api/config';
import { Uncertainties } from '../types/data';
import StyledButton from './StyledButton';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const StatisticsView: React.FC = () => {
  const navigate = useNavigate();
  const [uncertainties, setUncertainties] = useState<Uncertainties>([]);
  const [isTourActive, setIsTourActive] = useState(false);

  useEffect(() => {
    const fetchUncertainties = async () => {
      try {
        const response = await axiosClient.get('/stats');
        console.log('Got the following answer: ', response);
        const values = response.data.uncertainty_values;
        console.log('Setting uncertainties to: ', values);
        setUncertainties(values);
      } catch (error) {
        console.error('Failed to fetch uncertainties:', error);
      }
    };
    fetchUncertainties();
  }, []);

  // Log whenever uncertainties state changes
  useEffect(() => {
    console.log('Uncertainties state updated to: ', uncertainties);
  }, [uncertainties]);

  const chartData: ChartData<'line'> = React.useMemo(() => {
    if (!uncertainties.length) return {
      labels: [],
      datasets: [{
        label: 'Model Uncertainty',
        data: [],
        borderColor: '#606C38',
        backgroundColor: '#606C38',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      }]
    };

    // Find the maximum uncertainty value
    const maxUncertainty = Math.max(...uncertainties);
    console.log('Max uncertainty value:', maxUncertainty);
    
    // Normalize the values as percentages relative to the maximum
    const normalizedUncertainties = uncertainties.map(value => (value / maxUncertainty) * 100);
    console.log('Normalized uncertainties (as percentages):', normalizedUncertainties);

    return {
      labels: uncertainties.map((_, index) => `Step ${index + 1}`),
      datasets: [
        {
          label: 'Model Uncertainty (%)',
          data: normalizedUncertainties,
          borderColor: '#606C38',
          backgroundColor: '#606C38',
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [uncertainties]);

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 14,
            family: "'Inter', sans-serif",
          },
        },
      },
      title: {
        display: true,
        text: 'Model Uncertainty Over Time',
        font: {
          size: 20,
          family: "'Inter', sans-serif",
          weight: 'bold' as const,
        },
        color: '#606C38',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            return `Uncertainty: ${value.toFixed(1)}%`;
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        beginAtZero: true,
        min: 0,
        max: 100,
        title: {
          display: true,
          text: 'Uncertainty (%)',
          font: {
            size: 14,
            family: "'Inter', sans-serif",
          },
        },
        ticks: {
          callback: function(tickValue) {
            return `${tickValue}%`;
          },
        },
      },
      x: {
        type: 'category' as const,
        title: {
          display: true,
          text: 'Training Steps',
          font: {
            size: 14,
            family: "'Inter', sans-serif",
          },
        },
      },
    },
  };

  const startTour = useCallback(() => {
    const tour = introJs();
    tour.setOptions({
      steps: [
        {
          title: 'Uncertainty Graph',
          intro: 'This graph shows how our model\'s uncertainty changes over time. The y-axis shows the uncertainty level, while the x-axis represents different training steps.',
          element: '.uncertainty-chart',
          position: 'top'
        },
        {
          title: 'Uncertainty Values',
          intro: 'The uncertainty values indicate how confident the model is in its predictions. Higher values (closer to 100%) show where the model needs more training, while lower values indicate more confident predictions.',
          element: '.uncertainty-chart',
          position: 'bottom'
        },
        {
          title: 'Navigation',
          intro: 'Use these buttons to switch between different views of the application. The Expert View provides detailed controls for bird identification, while the Layman View offers a simpler interface.',
          element: '.navigation-buttons',
          position: 'bottom'
        },
        {
          title: 'About Active Learning',
          intro: 'This section explains how active learning works in our application and how the model improves over time through your annotations.',
          element: '.about-section',
          position: 'top'
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

  return (
    <ThemeProvider theme={theme}>
      <Header onStartTour={startTour} isTourActive={isTourActive} />
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: `calc(100vh - ${HeaderHeightPx}px)`,
        p: 4,
        gap: 3,
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" sx={{ color: '#606C38', fontWeight: 600 }}>
            Model Performance Statistics
          </Typography>
          <Box className="navigation-buttons" sx={{ display: 'flex', gap: 2 }}>
            <StyledButton 
              onClick={() => navigate('/layman')} 
              bgcolor="#dda15e" 
              scale={1}
            >
              Layman View
            </StyledButton>
            <StyledButton 
              onClick={() => navigate('/expert')} 
              bgcolor="#dda15e" 
              scale={1}
            >
              Expert View
            </StyledButton>
          </Box>
        </Box>
        
        <Box className="uncertainty-chart" sx={{ 
          flex: 1,
          bgcolor: 'white',
          borderRadius: 2,
          p: 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          height: '500px',
        }}>
          <Line data={chartData} options={options} />
        </Box>

        <Box className="about-section" sx={{ mt: 2 }}>
          <Typography variant="body1" sx={{ color: '#4a5d23', mb: 1, fontWeight: 600 }}>
            About Active Learning and Model Uncertainty
          </Typography>
          <Typography variant="body2" sx={{ color: '#666', maxWidth: '800px', mb: 2 }}>
            This graph shows how our model's uncertainty changes over time through active learning. 
            Active learning is a process where the model identifies segments it's most uncertain about, 
            asks for your help in labeling those segments, and then learns from your annotations to improve.
          </Typography>
          <Typography variant="body2" sx={{ color: '#666', maxWidth: '800px', mb: 2 }}>
            The uncertainty values represent how confident the model is in its predictions:
            • Higher values (closer to 100%) indicate segments where the model needs more training
            • Lower values (closer to 0%) show segments where the model is more confident
          </Typography>
          <Typography variant="body2" sx={{ color: '#666', maxWidth: '800px' }}>
            As you annotate more audio segments, especially those with high uncertainty, 
            the model learns and becomes more confident in its predictions, which you can see 
            reflected in the decreasing trend of uncertainty values over time.
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default StatisticsView