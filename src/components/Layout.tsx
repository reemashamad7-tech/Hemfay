import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { HemafyLogo } from './HemafyLogo';
import { LanguageToggle } from './LanguageToggle';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Pill, 
  MessageSquare, 
  FileText, 
  User, 
  Bluetooth, 
  LogOut,
  X,
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  
  const { 
    user, 
    logout, 
    deviceState, 
    toasts, 
    removeToast,
    language,
    t
  } = useStore();

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    }
  }, [language]);

  const menuItems = [
    { name: t('dashboard'), path: '/dashboard', icon: LayoutDashboard },
    { name: t('progress'), path: '/progress', icon: TrendingUp },
    { name: t('medication'), path: '/medication', icon: Pill },
    { name: t('aiAssistant'), path: '/ai', icon: MessageSquare },
    { name: t('medicalReports'), path: '/report', icon: FileText },
    { name: t('profile'), path: '/profile', icon: User },
  ];

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  // Skip layout on splash and auth routes
  const isPlainPage = ['/splash', '/auth'].includes(currentPath);

  if (isPlainPage) {
    return (
      <div className="min-h-screen bg-white text-text-primary relative font-sans">
        {/* Language switcher on top floating bar for auth/splash */}
        <div className="absolute top-4 ltr:right-4 rtl:left-4 z-50">
          <LanguageToggle />
        </div>
        {children}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-text-primary relative font-sans flex flex-col md:flex-row">
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex flex-col w-64 bg-white ltr:border-r rtl:border-l border-burgundy-soft/40 h-screen sticky top-0 shrink-0">
        {/* Logo and Brand & Language Toggle */}
        <div className="p-6 border-b border-burgundy-soft/20 flex items-center justify-between">
          <Link to="/dashboard">
            <HemafyLogo size="md" />
          </Link>
          <LanguageToggle />
        </div>

        {/* Navigation menu */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-primary text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-burgundy text-white shadow-sm shadow-burgundy/10'
                    : 'text-text-secondary hover:text-burgundy hover:bg-burgundy-light'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-burgundy'} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer info & Device Status */}
        <div className="p-4 border-t border-burgundy-soft/20 space-y-4">
          {/* Device status widget */}
          <Link
            to="/connect"
            className="flex items-center justify-between p-3 rounded-primary bg-burgundy-light/60 hover:bg-burgundy-soft/40 transition-colors border border-burgundy-soft/20 group"
          >
            <div className="flex items-center gap-2.5">
              <Bluetooth 
                size={18} 
                className={
                  deviceState === 'Connected' 
                    ? 'text-success animate-pulse' 
                    : deviceState === 'Scanning' 
                      ? 'text-warning animate-spin' 
                      : 'text-text-muted group-hover:text-burgundy'
                } 
              />
              <span className="text-xs font-semibold text-text-secondary">
                {deviceState === 'Connected' ? t('analyzerActive') : t('analyzer')}
              </span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              deviceState === 'Connected' 
                ? 'bg-success/15 text-success' 
                : deviceState === 'Scanning' || deviceState === 'Connecting'
                  ? 'bg-warning/15 text-warning' 
                  : 'bg-text-muted/10 text-text-muted'
            }`}>
              {deviceState === 'Connected' ? 'ON' : deviceState === 'Scanning' ? 'SCAN' : 'OFF'}
            </span>
          </Link>

          {/* User profile brief */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-burgundy-soft text-burgundy font-bold text-sm flex items-center justify-center shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden text-start">
                <p className="text-xs font-bold truncate text-text-primary">{user?.name}</p>
                <p className="text-[10px] text-text-muted truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-full text-text-muted hover:text-error hover:bg-error/10 transition-colors shrink-0"
              title={t('signOut')}
            >
              <LogOut size={16} className="rtl:rotate-180" />
            </button>
          </div>
        </div>
      </aside>

      {/* --- MOBILE HEADER & LAYOUT --- */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile top header */}
        <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-burgundy-soft/30 sticky top-0 z-40">
          <Link to="/dashboard">
            <HemafyLogo size="sm" />
          </Link>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            
            {/* Device Bluetooth status dot indicator */}
            <Link to="/connect" className="p-2 rounded-full hover:bg-burgundy-light transition-colors relative">
              <Bluetooth 
                size={20} 
                className={
                  deviceState === 'Connected' 
                    ? 'text-success animate-pulse' 
                    : deviceState === 'Scanning' 
                      ? 'text-warning animate-spin' 
                      : 'text-burgundy/60'
                } 
              />
              {deviceState === 'Connected' && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-success ring-1 ring-white" />
              )}
            </Link>
            
            <Link to="/profile" className="w-8 h-8 rounded-full bg-burgundy-soft text-burgundy font-bold text-sm flex items-center justify-center">
              {user?.name?.charAt(0) || 'U'}
            </Link>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 px-4 md:px-8 py-6 md:py-8 overflow-y-auto pb-24 md:pb-8 max-w-5xl w-full mx-auto bg-white">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-burgundy-soft/30 px-4 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom,0px))] flex items-center justify-around z-40 shadow-lg shadow-black/5">
          {menuItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1.5 px-3 py-1 transition-all ${
                  isActive ? 'text-burgundy' : 'text-text-muted hover:text-burgundy'
                }`}
              >
                <div className={`p-1 rounded-full ${isActive ? 'bg-burgundy-light text-burgundy' : ''}`}>
                  <Icon size={20} />
                </div>
                <span className="text-[10px] font-bold tracking-tight">{item.name}</span>
              </Link>
            );
          })}
          <Link
            to="/profile"
            className={`flex flex-col items-center gap-1.5 px-3 py-1 transition-all ${
              currentPath === '/profile' ? 'text-burgundy' : 'text-text-muted hover:text-burgundy'
            }`}
          >
            <div className={`p-1 rounded-full ${currentPath === '/profile' ? 'bg-burgundy-light text-burgundy' : ''}`}>
              <User size={20} />
            </div>
            <span className="text-[10px] font-bold tracking-tight">{t('profile')}</span>
          </Link>
        </nav>
      </div>

      {/* Floating Toast Notification Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

// Sub-component for rendering Toasts
const ToastContainer: React.FC<{ toasts: any[]; removeToast: (id: string) => void }> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 ltr:right-4 rtl:left-4 left-4 md:left-auto md:w-96 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          let bgColor = 'bg-white border-info';
          let textColor = 'text-text-primary';
          let icon = <Info className="text-info shrink-0" size={20} />;

          if (toast.type === 'success') {
            bgColor = 'bg-white border-success/30 ring-1 ring-success/10';
            icon = <CheckCircle className="text-success shrink-0" size={20} />;
          } else if (toast.type === 'warning') {
            bgColor = 'bg-white border-warning/30 ring-1 ring-warning/10';
            icon = <AlertTriangle className="text-warning shrink-0" size={20} />;
          } else if (toast.type === 'error') {
            bgColor = 'bg-white border-error/30 ring-1 ring-error/10';
            icon = <XCircle className="text-error shrink-0" size={20} />;
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              className={`p-4 rounded-primary border shadow-md flex items-start justify-between gap-3 pointer-events-auto ${bgColor}`}
            >
              <div className="flex items-center gap-3">
                {icon}
                <span className={`text-xs font-semibold ${textColor}`}>{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-text-muted hover:text-text-primary transition-colors shrink-0 mt-0.5"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
export default Layout;
