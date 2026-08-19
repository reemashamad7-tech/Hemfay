import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useStore } from '../store/useStore';
import { User, Bell, LogOut, Save, Moon } from 'lucide-react';
import { LanguageToggle } from '../components/LanguageToggle';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  age: z.number().min(1, 'Please enter a valid age').max(120, 'Please enter a valid age'),
  gender: z.enum(['Male', 'Female', 'Other'])
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateProfile, notificationsEnabled, setNotificationsEnabled, logout, addToast, t } = useStore();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      age: user?.age || 26,
      gender: (user?.gender as 'Male' | 'Female' | 'Other') || 'Female'
    }
  });

  const onSubmit = (data: ProfileFormValues) => {
    updateProfile(data);
    addToast('Profile updated successfully.', 'success');
  };

  const handleLogout = () => {
    logout();
    addToast('Logged out successfully.', 'info');
    navigate('/auth');
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-text-primary">{t('profileAndSettings')}</h1>
        <p className="text-xs font-semibold text-text-secondary mt-1">
          {t('profileSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        {/* Profile Card & Form */}
        <div className="bg-white border border-burgundy-soft/40 p-6 rounded-primary shadow-sm space-y-6">
          <h2 className="text-xs font-bold text-burgundy uppercase tracking-wider flex items-center gap-2 border-b border-burgundy-soft/20 pb-3">
            <User size={18} />
            <span>{t('personalProfile')}</span>
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase">{t('fullName')}</label>
                <input
                  type="text"
                  {...register('name')}
                  className={`w-full text-xs p-3 bg-[#FAFAFA] border rounded-primary transition-all ${
                    errors.name ? 'border-error ring-1 ring-error/10' : 'border-burgundy-soft/30'
                  }`}
                />
                {errors.name && <p className="text-[9px] text-error font-semibold">{errors.name.message}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase">{t('emailAddress')}</label>
                <input
                  type="email"
                  {...register('email')}
                  className={`w-full text-xs p-3 bg-[#FAFAFA] border rounded-primary transition-all ${
                    errors.email ? 'border-error ring-1 ring-error/10' : 'border-burgundy-soft/30'
                  }`}
                />
                {errors.email && <p className="text-[9px] text-error font-semibold">{errors.email.message}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase">{t('contactPhone')}</label>
                <input
                  type="text"
                  {...register('phone')}
                  className="w-full text-xs p-3 bg-[#FAFAFA] border border-burgundy-soft/30 rounded-primary"
                />
              </div>

              {/* Age */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase">{t('ageGender').split('/')[0]}</label>
                <input
                  type="number"
                  {...register('age', { valueAsNumber: true })}
                  className={`w-full text-xs p-3 bg-[#FAFAFA] border rounded-primary transition-all ${
                    errors.age ? 'border-error ring-1 ring-error/10' : 'border-burgundy-soft/30'
                  }`}
                />
                {errors.age && <p className="text-[9px] text-error font-semibold">{errors.age.message}</p>}
              </div>

              {/* Gender */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-bold text-text-secondary uppercase">{t('gender')}</label>
                <select
                  {...register('gender')}
                  className="w-full text-xs p-3 bg-[#FAFAFA] border border-burgundy-soft/30 rounded-primary"
                >
                  <option value="Male">Male / ذكر</option>
                  <option value="Female">Female / أنثى</option>
                  <option value="Other">Other / آخر</option>
                </select>
              </div>

            </div>

            <button
              type="submit"
              className="bg-burgundy hover:bg-burgundy-dark text-white font-bold text-xs px-5 py-3 rounded-primary transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-burgundy/10"
            >
              <Save size={14} />
              <span>{t('saveChanges')}</span>
            </button>
          </form>
        </div>

        {/* Preferences Settings */}
        <div className="bg-white border border-burgundy-soft/40 p-6 rounded-primary shadow-sm space-y-6">
          <h2 className="text-xs font-bold text-burgundy uppercase tracking-wider flex items-center gap-2 border-b border-burgundy-soft/20 pb-3">
            <Bell size={18} />
            <span>{t('preferencesSettings')}</span>
          </h2>

          <div className="space-y-4">
            {/* Language Switcher Row */}
            <div className="flex items-center justify-between py-2 border-b border-burgundy-soft/10 pb-4">
              <div>
                <p className="text-xs font-bold text-text-primary">{t('language')}</p>
                <p className="text-[10px] text-text-muted mt-0.5">اختر لغة واجهة التطبيق (العربية / English)</p>
              </div>
              <LanguageToggle variant="full" />
            </div>
            
            {/* Notifications Toggle */}
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-xs font-bold text-text-primary">{t('medicationReminders')}</p>
                <p className="text-[10px] text-text-muted mt-0.5">{t('medicationRemindersDesc')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => {
                    setNotificationsEnabled(e.target.checked);
                    addToast(`Notifications ${e.target.checked ? 'enabled' : 'disabled'}.`, 'info');
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-text-muted/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-text-muted/30 after:border after:rounded-full after:height after:h-4 after:w-4 after:transition-all peer-checked:bg-burgundy"></div>
              </label>
            </div>

            {/* Appearance Theme */}
            <div className="flex items-center justify-between py-2 border-t border-burgundy-soft/10 pt-4">
              <div>
                <p className="text-xs font-bold text-text-primary">{t('appAppearance')}</p>
                <p className="text-[10px] text-text-muted mt-0.5">{t('lightModeOnly')}</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-burgundy-light/60 text-burgundy text-[9px] font-bold uppercase tracking-wider">
                <Moon size={12} />
                <span>{t('lightModeOnly')}</span>
              </div>
            </div>

          </div>
        </div>

        {/* Sign Out Card */}
        <div className="bg-white border border-burgundy-soft/40 p-6 rounded-primary shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-start space-y-1">
            <p className="text-xs font-bold text-text-primary">{t('signOutOfHemafy')}</p>
            <p className="text-[10px] text-text-muted">{t('signOutDesc')}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full sm:w-auto bg-white border border-error text-error hover:bg-error/5 font-bold text-xs px-5 py-3 rounded-primary transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut size={14} className="rtl:rotate-180" />
            <span>{t('signOut')}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
export default ProfileScreen;
