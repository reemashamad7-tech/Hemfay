import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { HemafyLogo } from '../components/HemafyLogo';
import { motion } from 'framer-motion';

export const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, t } = useStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        navigate('/dashboard');
      } else {
        navigate('/auth');
      }
    }, 2200);

    return () => clearTimeout(timer);
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] ltr:left-[-10%] rtl:right-[-10%] w-[40%] h-[40%] rounded-full bg-burgundy-light/30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] ltr:right-[-10%] rtl:left-[-10%] w-[40%] h-[40%] rounded-full bg-burgundy-light/40 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="flex flex-col items-center text-center space-y-6 max-w-sm"
      >
        <motion.div
          initial={{ transform: 'rotate(-10deg) scale(0.9)' }}
          animate={{ transform: 'rotate(0deg) scale(1)' }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        >
          <HemafyLogo size="xl" iconOnly className="mx-auto" />
        </motion.div>

        <div className="space-y-3">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-4xl font-black text-burgundy tracking-widest font-sans"
          >
            HEMAFY
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="text-sm font-semibold text-text-secondary tracking-wide uppercase px-4"
          >
            Your Smart Partner for Blood Health
          </motion.p>
        </div>
      </motion.div>

      <div className="absolute bottom-10 flex flex-col items-center space-y-4">
        <div className="w-6 h-6 rounded-full border-2 border-burgundy-soft border-t-burgundy animate-spin" />
        <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">
          {t('loading')}
        </span>
      </div>
    </div>
  );
};
export default SplashScreen;
