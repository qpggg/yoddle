import './styles/index.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import AboutPage from './pages/About';
import BenefitsPage from './pages/Benefits';
import PricingPage from './pages/Pricing';
import ServicesPage from './pages/Services';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import { ScrollToTop } from './components/ScrollToTop';

const HomePage = () => (
  <Box>
    <Hero />
    <About />
    <Benefits />
    <Features />
    <Testimonials />
    <Contact />
  </Box>
);

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <ScrollToTop />
        <Box>
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/benefits" element={<BenefitsPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
          <Footer />
        </Box>
      </Router>
    </ThemeProvider>
  );
};

export default App; 