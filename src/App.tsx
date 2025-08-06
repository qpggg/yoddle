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
import Profile from './pages/Profile';
import MyBenefits from './pages/MyBenefits';
import Progress from './pages/Progress';
import Preferences from './pages/Preferences';
import Wallet from './pages/Wallet';
import ContactsPage from './pages/Contacts';
import TermsPage from './pages/Terms';
import PrivacyPage from './pages/Privacy';
import { WalletProvider } from './hooks/useWallet';
import ToastNotification, { useToast } from './components/ToastNotification';
import React, { createContext, useContext } from 'react';

// Контекст для Toast уведомлений
const ToastContext = createContext<ReturnType<typeof useToast> | undefined>(undefined);

export const useGlobalToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useGlobalToast must be used within ToastProvider');
  }
  return context;
};

const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const toast = useToast();
  
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastNotification 
        toasts={toast.toasts} 
        onRemove={toast.removeToast}
        position="top-right"
      />
    </ToastContext.Provider>
  );
};

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
      <ToastProvider>
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
              <Route path="/contacts" element={<ContactsPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/my-benefits" element={<MyBenefits />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/preferences" element={<Preferences />} />
              <Route path="/wallet" element={
                <WalletProvider userId={Number(JSON.parse(localStorage.getItem('user') || '{}').id || 0)}>
                  <Wallet />
                </WalletProvider>
              } />
            </Routes>
            <Footer />
          </Box>
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App; 