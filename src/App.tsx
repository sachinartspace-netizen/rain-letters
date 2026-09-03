import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Analytics } from '@vercel/analytics/react';

import { AuthProvider } from './contexts/AuthContext';
import { WeatherProvider } from './contexts/WeatherContext';
import { GardenProvider } from './contexts/GardenContext';

import LandingPage from './components/landing/LandingPage';
import AuthCallback from './components/auth/AuthCallback';
import AccessDenied from './components/auth/AccessDenied';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PrivateWorld from './components/private/PrivateWorld';
import PageTransition from './components/layout/PageTransition';

import './App.css';

/* Wrap PrivateWorld with GardenProvider.
   bothOnline will be managed internally by PrivateWorld via usePresence */
const PrivateWorldWithGarden = () => (
  <GardenProvider bothOnline={false}>
    <PrivateWorld />
  </GardenProvider>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
        <Route path="/auth/callback" element={<PageTransition><AuthCallback /></PageTransition>} />
        <Route path="/denied" element={<PageTransition><AccessDenied /></PageTransition>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/garden" element={
            <PageTransition>
              <PrivateWorldWithGarden />
            </PageTransition>
          } />
        </Route>
      </Routes>
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WeatherProvider>
          <div className="app">
            <AnimatedRoutes />
            <Analytics />
          </div>
        </WeatherProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
