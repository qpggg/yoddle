import './styles/index.css';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import { theme } from './theme';
import Navbar from './components/Navbar';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Benefits } from './components/Benefits';
import { Features } from './components/Features';
import { Testimonials } from './components/Testimonials';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box>
          <Navbar />
          <Hero />
          <About />
          <Benefits />
          <Features />
          <Testimonials />
          <Contact />
          <Footer />
        </Box>
      </Router>
    </ThemeProvider>
  );
};

export default App; 