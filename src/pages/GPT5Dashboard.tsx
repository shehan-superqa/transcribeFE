import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Sidebar from '../components/Sidebar';
import GPT5Page from './tools/GPT5Page';
import '../pages/Dashboard.css';

// Create Material-UI dark theme matching Dashboard colors
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00c6ff',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#e0e0e0',
      secondary: '#a0a0a0',
    },
    divider: '#333333',
  },
});

export default function GPT5Dashboard() {
  return (
    <div className="dashboard-container">
      <div className="dashboard-content-wrapper full-width">
        <Sidebar />
        <div className="dashboard-main-layout" style={{ gridTemplateColumns: '1fr' }}>
          <div className="tool-wrapper">
            <div className="tool-container">
              <ThemeProvider theme={darkTheme}>
                <CssBaseline />
                <Routes>
                  <Route path="/" element={<GPT5Page />} />
                  <Route path="*" element={<Navigate to="/gpt5" replace />} />
                </Routes>
              </ThemeProvider>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



