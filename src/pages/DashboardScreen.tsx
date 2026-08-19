import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { 
  Plus, 
  MessageSquare, 
  TrendingUp, 
  Calendar, 
  Check, 
  Pill, 
  Award,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export const DashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const { 
    user, 
    testRecords, 
    medications, 
    markMedicationTaken, 
    getWeeklyAdherence, 
    addToast,
    t,
    language
  } = useStore();

  const latestRecord = testRecords[0] || null;
  const adherence = getWeeklyAdherence();

  // Find next dose (e.g. iron supplement)
  const ironMed = medications.find(m => m.name.toLowerCase().includes('iron'));
  const todayStr = new Date().toISOString().split('T')[0];
  const isTakenToday = ironMed ? ironMed.takenDays[todayStr] === true : false;

  const handleMarkTaken = () => {
    if (!ironMed) return;
    markMedicationTaken(ironMed.id, todayStr, true);
    addToast(t('medMarkedTaken'), 'success');
  };

  const handleNewTest = () => {
    navigate('/test');
  };

  return (
    <div className="space-y-8">
      {/* --- GREETING HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-primary">
            {t('hello')}, {user?.name.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-xs font-semibold text-text-secondary mt-1">
            {t('healthSummaryToday')}
          </p>
        </div>

        {/* Small greeting disclaimer */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 text-success text-[10px] font-bold uppercase tracking-wider self-start md:self-auto">
          <ShieldCheck size={14} />
          <span>{t('clinicallyMonitored')}</span>
        </div>
      </div>

      {/* --- HEALTH CARDS GRID --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hemoglobin Card */}
        <div className="bg-white rounded-primary border border-burgundy-soft/40 p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group">
          <div className="absolute top-[-30%] ltr:right-[-10%] rtl:left-[-10%] w-32 h-32 rounded-full bg-burgundy-light/20 blur-2xl group-hover:scale-110 transition-transform" />
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">{t('hemoglobin')}</span>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                latestRecord?.hemoglobin && latestRecord.hemoglobin >= 12.0
                  ? 'bg-success/15 text-success'
                  : 'bg-error/15 text-error animate-pulse'
              }`}>
                {latestRecord ? (latestRecord.hemoglobin >= 12.0 ? t('normal') : t('low')) : t('noData')}
              </span>
            </div>
            
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-burgundy">
                {latestRecord ? latestRecord.hemoglobin : '--'}
              </span>
              <span className="text-xs font-bold text-text-muted">g/dL</span>
            </div>
          </div>

          <div className="border-t border-burgundy-soft/20 pt-4 mt-6 flex justify-between items-center text-[10px] text-text-secondary">
            <span>{t('reference')}: 12.0 - 16.0 g/dL</span>
            <span className="font-medium text-text-muted">{t('lastTested')}: {latestRecord ? latestRecord.timestamp.split(',')[0] : t('never')}</span>
          </div>
        </div>

        {/* Ferritin Card */}
        <div className="bg-white rounded-primary border border-burgundy-soft/40 p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group">
          <div className="absolute top-[-30%] ltr:right-[-10%] rtl:left-[-10%] w-32 h-32 rounded-full bg-burgundy-light/20 blur-2xl group-hover:scale-110 transition-transform" />

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">{t('ferritin')}</span>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                latestRecord?.ferritin && latestRecord.ferritin >= 15
                  ? 'bg-success/15 text-success'
                  : 'bg-error/15 text-error animate-pulse'
              }`}>
                {latestRecord ? (latestRecord.ferritin >= 15 ? t('normal') : t('low')) : t('noData')}
              </span>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-burgundy">
                {latestRecord ? latestRecord.ferritin : '--'}
              </span>
              <span className="text-xs font-bold text-text-muted">ng/mL</span>
            </div>
          </div>

          <div className="border-t border-burgundy-soft/20 pt-4 mt-6 flex justify-between items-center text-[10px] text-text-secondary">
            <span>{t('reference')}: 15 - 150 ng/mL</span>
            <span className="font-medium text-text-muted">{t('lastTested')}: {latestRecord ? latestRecord.timestamp.split(',')[0] : t('never')}</span>
          </div>
        </div>
      </div>

      {/* --- MEDICATION, SCHEDULE, AND ADHERENCE GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Medication Tracking Card */}
        <div className="bg-white rounded-primary border border-burgundy-soft/40 p-6 shadow-sm space-y-5 flex flex-col justify-between lg:col-span-2">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Pill className="text-burgundy" size={18} />
              <h2 className="text-xs font-bold text-burgundy uppercase tracking-wider">{t('todaysMedication')}</h2>
            </div>

            {ironMed ? (
              <div className="flex items-start justify-between p-4 rounded-primary bg-burgundy-light/20 border border-burgundy-soft/10">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-text-primary">{ironMed.name}</h3>
                  <p className="text-[11px] text-text-secondary">{ironMed.dosage}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-semibold mt-2">
                    <Calendar size={12} className="text-burgundy" />
                    <span>{t('doseScheduledTodayAt')} {ironMed.time}</span>
                  </div>
                </div>
                
                {isTakenToday ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-success bg-success/15 px-3 py-1.5 rounded-full">
                    <Check size={12} />
                    <span>{t('taken')}</span>
                  </span>
                ) : (
                  <button
                    onClick={handleMarkTaken}
                    className="bg-burgundy hover:bg-burgundy-dark text-white font-bold text-xs px-4 py-2 rounded-primary transition-all cursor-pointer shadow-sm"
                  >
                    {t('markAsTaken')}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-text-muted italic">{t('noMedicationsScheduled')}</p>
            )}
          </div>

          {/* Next Test Schedule */}
          <div className="border-t border-burgundy-soft/20 pt-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-burgundy" />
              <span className="font-bold text-text-secondary">{t('nextBloodAnalysis')}</span>
            </div>
            <span className="font-black text-burgundy bg-burgundy-light/60 px-3 py-1 rounded-full text-[10px]">
              {language === 'ar' ? '15 أكتوبر' : 'October 15'}
            </span>
          </div>
        </div>

        {/* Weekly Adherence Progress Ring */}
        <div className="bg-white rounded-primary border border-burgundy-soft/40 p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
          <h2 className="text-xs font-bold text-burgundy uppercase tracking-wider self-start flex items-center gap-2">
            <Award size={18} className="text-burgundy" />
            <span>{t('weeklyAdherence')}</span>
          </h2>

          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* SVG Progress circle */}
            <svg className="absolute w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="48"
                stroke="#F7E9ED"
                strokeWidth="7"
                fill="transparent"
              />
              <circle
                cx="64"
                cy="64"
                r="48"
                stroke="#7A1028"
                strokeWidth="7"
                fill="transparent"
                strokeDasharray={301}
                strokeDashoffset={301 - (301 * adherence) / 100}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            </svg>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-burgundy">{adherence}%</span>
              <span className="text-[8px] font-bold text-text-muted uppercase tracking-wider mt-0.5">{t('compliant')}</span>
            </div>
          </div>

          <p className="text-[10px] text-text-muted leading-relaxed">
            {t('adherenceNote')}
          </p>
        </div>

      </div>

      {/* --- QUICK ACTIONS SECTION --- */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider">{t('quickActions')}</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-3 gap-4">
          
          <button
            onClick={handleNewTest}
            className="bg-white hover:bg-burgundy-light/20 border border-burgundy-soft/40 rounded-primary p-4 text-start flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-burgundy-light text-burgundy">
                <Plus size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-text-primary">{t('newTest')}</p>
                <p className="text-[9px] text-text-muted mt-0.5">{t('analyzeMetrics')}</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-text-muted group-hover:text-burgundy transition-colors rtl:rotate-180" />
          </button>

          <button
            onClick={() => navigate('/progress')}
            className="bg-white hover:bg-burgundy-light/20 border border-burgundy-soft/40 rounded-primary p-4 text-start flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-burgundy-light text-burgundy">
                <TrendingUp size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-text-primary">{t('historyCharts')}</p>
                <p className="text-[9px] text-text-muted mt-0.5">{t('trackHistoricalTrends')}</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-text-muted group-hover:text-burgundy transition-colors rtl:rotate-180" />
          </button>

          <button
            onClick={() => navigate('/ai')}
            className="bg-white hover:bg-burgundy-light/20 border border-burgundy-soft/40 rounded-primary p-4 text-start flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-burgundy-light text-burgundy">
                <MessageSquare size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-text-primary">{t('aiAssistant')}</p>
                <p className="text-[9px] text-text-muted mt-0.5">{t('sourceGroundedAdvisor')}</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-text-muted group-hover:text-burgundy transition-colors rtl:rotate-180" />
          </button>

        </div>
      </div>
    </div>
  );
};
export default DashboardScreen;
