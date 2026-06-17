import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../../layouts/Navbar';
import HeroSection from './HeroSection';
import AboutSection from './AboutSection';
import FeaturedBooksSection from './FeaturedBooksSection';
import ContactSection from './ContactSection';

interface LocationState {
  scrollTo?: string;
}

export default function LandingPage() {
  const location = useLocation();

  /**
   * When Navbar on another page sends navigate('/', { state: { scrollTo: 'about' } }),
   * we pick it up here and smooth-scroll to the target section after the page mounts.
   */
  useEffect(() => {
    const state = location.state as LocationState | undefined;
    if (state?.scrollTo) {
      // Small timeout allows DOM to fully render before scrolling
      const timer = setTimeout(() => {
        document.getElementById(state.scrollTo!)?.scrollIntoView({ behavior: 'smooth' });
        // Clear state so back-navigation doesn't re-trigger scroll
        window.history.replaceState({}, '', window.location.pathname);
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        {/* Section order: Home → About → Featured Books → Contact */}
        <HeroSection />
        <AboutSection />
        <FeaturedBooksSection />
        <ContactSection />
      </main>
    </div>
  );
}
