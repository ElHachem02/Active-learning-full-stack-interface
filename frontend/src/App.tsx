import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { LaymanView } from './components/LaymanView';
import { LandingPage } from './components/LandingPage';
import { ExpertView } from './components/ExpertView';
import { StatisticsView } from './components/StatisticsView';
import { theme } from './theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        {/* Landing page is the default route */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Expert view route */}
        <Route path="/expert" element={<ExpertView />} />
        
        {/* Layman view route */}
        <Route path="/layman" element={<LaymanView />} />

        {/* Statistics view route */}
        <Route path="/stats" element={<StatisticsView />} />
        
        {/* Catch all route - redirect to landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
