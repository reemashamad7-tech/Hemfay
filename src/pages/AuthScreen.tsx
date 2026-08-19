import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useStore } from '../store/useStore';
import { HemafyLogo } from '../components/HemafyLogo';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Zod schemas
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

export const AuthScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const navigate = useNavigate();
  const { login, signup, addToast, t, language } = useStore();
  const [loading, setLoading] = useState(false);

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });

  const {
    register: registerSignup,
    handleSubmit: handleSignupSubmit,
    formState: { errors: signupErrors }
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema)
  });

  const onLogin = async (data: LoginFormValues) => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    login('Reemas Hamad', data.email);
    addToast(language === 'ar' ? 'تم تسجيل الدخول بنجاح كـ ريماس حمد.' : 'Signed in successfully as Reemas Hamad.', 'success');
    setLoading(false);
    navigate('/dashboard');
  };

  const onSignup = async (data: SignupFormValues) => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    signup(data.name, data.email);
    addToast(language === 'ar' ? 'تم إنشاء الحساب بنجاح!' : 'Account created successfully!', 'success');
    setLoading(false);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden font-sans">
      <div className="absolute top-[-15%] ltr:right-[-15%] rtl:left-[-15%] w-[50%] h-[50%] rounded-full bg-burgundy-light/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-15%] ltr:left-[-15%] rtl:right-[-15%] w-[50%] h-[50%] rounded-full bg-burgundy-light/30 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-primary border border-burgundy-soft/40 shadow-xl shadow-burgundy/5 p-8 relative z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <HemafyLogo size="md" className="mb-2" />
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            {language === 'ar' ? 'شريكك الذكي لصحة الدم' : 'Your Smart Partner for Blood Health'}
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-burgundy-light/60 p-1 rounded-full mb-6">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 text-xs font-bold py-2.5 rounded-full transition-all duration-200 ${
              activeTab === 'login'
                ? 'bg-burgundy text-white shadow-sm'
                : 'text-text-secondary hover:text-burgundy'
            }`}
          >
            {t('signIn')}
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`flex-1 text-xs font-bold py-2.5 rounded-full transition-all duration-200 ${
              activeTab === 'signup'
                ? 'bg-burgundy text-white shadow-sm'
                : 'text-text-secondary hover:text-burgundy'
            }`}
          >
            {t('createAccount')}
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'login' ? (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleLoginSubmit(onLogin)}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary">{t('emailAddress')}</label>
                <div className="relative">
                  <Mail size={16} className="absolute ltr:left-3.5 rtl:right-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    {...registerLogin('email')}
                    className={`w-full text-xs py-3 ltr:pl-10 ltr:pr-4 rtl:pr-10 rtl:pl-4 bg-white border rounded-primary transition-all ${
                      loginErrors.email ? 'border-error ring-1 ring-error/10' : 'border-burgundy-soft/50'
                    }`}
                  />
                </div>
                {loginErrors.email && (
                  <p className="text-[10px] text-error font-semibold flex items-center gap-1">
                    <AlertCircle size={10} /> {loginErrors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-text-secondary">{t('password')}</label>
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      addToast(language === 'ar' ? 'تم إرسال رابط إعادة التعيين للبريد الإلكتروني.' : 'Reset password link sent to email.', 'info');
                    }}
                    className="text-[10px] font-bold text-burgundy hover:underline"
                  >
                    {t('forgotPassword')}
                  </a>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute ltr:left-3.5 rtl:right-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...registerLogin('password')}
                    className={`w-full text-xs py-3 ltr:pl-10 ltr:pr-4 rtl:pr-10 rtl:pl-4 bg-white border rounded-primary transition-all ${
                      loginErrors.password ? 'border-error ring-1 ring-error/10' : 'border-burgundy-soft/50'
                    }`}
                  />
                </div>
                {loginErrors.password && (
                  <p className="text-[10px] text-error font-semibold flex items-center gap-1">
                    <AlertCircle size={10} /> {loginErrors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-burgundy hover:bg-burgundy-dark text-white font-bold text-xs py-3.5 rounded-primary transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-burgundy/10 disabled:opacity-75"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>{t('signIn')}</span>
                )}
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="signup"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSignupSubmit(onSignup)}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary">{t('fullName')}</label>
                <div className="relative">
                  <User size={16} className="absolute ltr:left-3.5 rtl:right-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Reemas Hamad"
                    {...registerSignup('name')}
                    className={`w-full text-xs py-3 ltr:pl-10 ltr:pr-4 rtl:pr-10 rtl:pl-4 bg-white border rounded-primary transition-all ${
                      signupErrors.name ? 'border-error ring-1 ring-error/10' : 'border-burgundy-soft/50'
                    }`}
                  />
                </div>
                {signupErrors.name && (
                  <p className="text-[10px] text-error font-semibold flex items-center gap-1">
                    <AlertCircle size={10} /> {signupErrors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary">{t('emailAddress')}</label>
                <div className="relative">
                  <Mail size={16} className="absolute ltr:left-3.5 rtl:right-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    {...registerSignup('email')}
                    className={`w-full text-xs py-3 ltr:pl-10 ltr:pr-4 rtl:pr-10 rtl:pl-4 bg-white border rounded-primary transition-all ${
                      signupErrors.email ? 'border-error ring-1 ring-error/10' : 'border-burgundy-soft/50'
                    }`}
                  />
                </div>
                {signupErrors.email && (
                  <p className="text-[10px] text-error font-semibold flex items-center gap-1">
                    <AlertCircle size={10} /> {signupErrors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary">{t('password')}</label>
                <div className="relative">
                  <Lock size={16} className="absolute ltr:left-3.5 rtl:right-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...registerSignup('password')}
                    className={`w-full text-xs py-3 ltr:pl-10 ltr:pr-4 rtl:pr-10 rtl:pl-4 bg-white border rounded-primary transition-all ${
                      signupErrors.password ? 'border-error ring-1 ring-error/10' : 'border-burgundy-soft/50'
                    }`}
                  />
                </div>
                {signupErrors.password && (
                  <p className="text-[10px] text-error font-semibold flex items-center gap-1">
                    <AlertCircle size={10} /> {signupErrors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary">{t('confirmPassword')}</label>
                <div className="relative">
                  <Lock size={16} className="absolute ltr:left-3.5 rtl:right-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...registerSignup('confirmPassword')}
                    className={`w-full text-xs py-3 ltr:pl-10 ltr:pr-4 rtl:pr-10 rtl:pl-4 bg-white border rounded-primary transition-all ${
                      signupErrors.confirmPassword ? 'border-error ring-1 ring-error/10' : 'border-burgundy-soft/50'
                    }`}
                  />
                </div>
                {signupErrors.confirmPassword && (
                  <p className="text-[10px] text-error font-semibold flex items-center gap-1">
                    <AlertCircle size={10} /> {signupErrors.confirmPassword.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-burgundy hover:bg-burgundy-dark text-white font-bold text-xs py-3.5 rounded-primary transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-burgundy/10 disabled:opacity-75"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>{t('createAccount')}</span>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-6 text-center text-[10px] text-text-muted select-none">
        <p>Hemafy Blood Health Manager</p>
      </div>
    </div>
  );
};
export default AuthScreen;
