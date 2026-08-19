import React from 'react';
import { useStore } from '../store/useStore';
import { Pill, Clock, CheckCircle2, AlertCircle, Award } from 'lucide-react';

export const MedicationScreen: React.FC = () => {
  const { medications, markMedicationTaken, getWeeklyAdherence, addToast, t, language } = useStore();
  const adherence = getWeeklyAdherence();

  const daysOfWeek = language === 'ar' ? [
    { label: 'الإثنين', index: 6 },
    { label: 'الثلاثاء', index: 5 },
    { label: 'الأربعاء', index: 4 },
    { label: 'الخميس', index: 3 },
    { label: 'الجمعة', index: 2 },
    { label: 'السبت', index: 1 },
    { label: 'الأحد', index: 0 }
  ] : [
    { label: 'Mon', index: 6 },
    { label: 'Tue', index: 5 },
    { label: 'Wed', index: 4 },
    { label: 'Thu', index: 3 },
    { label: 'Fri', index: 2 },
    { label: 'Sat', index: 1 },
    { label: 'Sun', index: 0 }
  ];

  // Helper to format date strings for a specific daysAgo
  const getPastDateStr = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  const handleToggleTaken = (medId: string, daysAgo: number, isTaken: boolean) => {
    const dateStr = getPastDateStr(daysAgo);
    markMedicationTaken(medId, dateStr, !isTaken);
    
    if (!isTaken) {
      addToast(t('medMarkedTaken'), 'success');
    } else {
      addToast(t('medMarkedMissed'), 'info');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-text-primary">{t('medicationAdherence')}</h1>
        <p className="text-xs font-semibold text-text-secondary mt-1">
          {t('medicationSubtitle')}
        </p>
      </div>

      {/* Grid of compliance details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Adherence Percentage Card */}
        <div className="bg-white border border-burgundy-soft/40 p-5 rounded-primary shadow-sm flex flex-col items-center justify-center text-center space-y-3">
          <Award className="text-burgundy" size={24} />
          <div>
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">{t('weeklyCompliance')}</h3>
            <p className="text-3xl font-black text-burgundy mt-1">{adherence}%</p>
          </div>
          <p className="text-[10px] text-text-muted leading-relaxed">
            {t('adherenceGoalNote')}
          </p>
        </div>

        {/* Schedule Info Card */}
        <div className="bg-white border border-burgundy-soft/40 p-5 rounded-primary shadow-sm space-y-3 md:col-span-2 text-start">
          <h3 className="text-xs font-bold text-burgundy uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={16} className="text-burgundy" />
            <span>{t('supplementSchedule')}</span>
          </h3>
          
          <div className="space-y-2 text-xs text-text-secondary">
            <div className="flex justify-between py-1.5 border-b border-burgundy-soft/10">
              <span className="font-bold">{t('supplement')}:</span>
              <span className="font-medium text-burgundy">{language === 'ar' ? 'الحديد (فيروس سلفات)' : 'Iron (Ferrous Sulfate)'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-burgundy-soft/10">
              <span className="font-bold">{t('clinicalDosage')}:</span>
              <span className="font-medium text-text-primary">{language === 'ar' ? '325 ملغم (65 ملغم حديد صريح)' : '325 mg (65 mg elemental iron)'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="font-bold">{t('dailyTimeSlot')}:</span>
              <span className="font-semibold text-burgundy bg-burgundy-light/60 px-2 py-0.5 rounded-full text-[10px]">
                10:00 AM
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Checklist Card */}
      <div className="bg-white border border-burgundy-soft/40 p-6 rounded-primary shadow-sm space-y-6">
        <h2 className="text-xs font-bold text-burgundy uppercase tracking-wider flex items-center gap-2">
          <Pill className="text-burgundy" size={18} />
          <span>{t('checklistTitle')}</span>
        </h2>

        {medications.map((med) => (
          <div key={med.id} className="space-y-4">
            <div className="border-b border-burgundy-soft/20 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-text-primary">{language === 'ar' ? 'الحديد (فيروس سلفات)' : med.name}</h3>
                <p className="text-[10px] text-text-muted mt-0.5">{language === 'ar' ? '325 ملغم — يومياً' : `${med.dosage} — ${med.frequency}`}</p>
              </div>
            </div>

            {/* Weekly Checklist Grid */}
            <div className="flex sm:grid sm:grid-cols-7 gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-burgundy-soft/60">
              {daysOfWeek.map((day) => {
                const dateStr = getPastDateStr(day.index);
                const isTaken = med.takenDays[dateStr] === true;
                const isToday = day.index === 0;

                return (
                  <button
                    key={day.label}
                    onClick={() => handleToggleTaken(med.id, day.index, isTaken)}
                    className={`p-2.5 sm:p-3 rounded-primary border flex flex-col items-center gap-1.5 sm:gap-2 transition-all cursor-pointer min-w-[60px] sm:min-w-0 flex-1 shrink-0 ${
                      isTaken 
                        ? 'bg-success/5 border-success/30 text-success' 
                        : isToday
                          ? 'bg-burgundy-light/40 border-burgundy-soft text-burgundy shadow-sm'
                          : 'bg-[#FAFAFA] border-burgundy-soft/10 text-text-muted hover:border-burgundy-soft/40 hover:text-burgundy'
                    }`}
                  >
                    <span className="text-[9px] font-bold uppercase tracking-wider">{day.label}</span>
                    <div className={`p-1.5 rounded-full ${
                      isTaken 
                        ? 'bg-success/10 text-success' 
                        : isToday 
                          ? 'bg-burgundy-soft text-burgundy' 
                          : 'bg-white text-text-muted/40 border border-burgundy-soft/10'
                    }`}>
                      <CheckCircle2 size={16} className={isTaken ? 'fill-success/15' : ''} />
                    </div>
                    {isToday && (
                      <span className="text-[8px] font-bold uppercase tracking-widest text-burgundy">{t('today')}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Adherence Notice Advice */}
      <div className="bg-[#FAFAFA] border border-burgundy-soft/20 rounded-primary p-4 flex items-start gap-3">
        <AlertCircle className="text-burgundy shrink-0 mt-0.5" size={16} />
        <div>
          <h4 className="text-[10px] font-bold text-text-primary uppercase tracking-wider">{t('guidanceTitle')}</h4>
          <p className="text-[10px] text-text-secondary mt-1 leading-relaxed">
            {t('guidanceText')}
          </p>
        </div>
      </div>
    </div>
  );
};
export default MedicationScreen;
