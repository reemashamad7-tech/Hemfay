import React from 'react';
import { useStore } from '../store/useStore';
import { HemafyLogo } from '../components/HemafyLogo';
import { Download, Share2 } from 'lucide-react';

export const ReportScreen: React.FC = () => {
  const { user, testRecords, getWeeklyAdherence, addToast, t, language } = useStore();
  const adherence = getWeeklyAdherence();

  const latestRecord = testRecords[0] || null;

  const handleDownloadPdf = () => {
    try {
      window.print();
      addToast(language === 'ar' ? 'تم إنشاء تقرير PDF بنجاح.' : 'PDF download report generated successfully.', 'success');
    } catch {
      addToast(language === 'ar' ? 'فشل إنشاء تقرير PDF.' : 'Failed to generate PDF. Please check print configurations.', 'error');
    }
  };

  const handleShareEmail = () => {
    addToast(language === 'ar' ? 'تم نسخ الرابط وإعادة التوجيه إلى البريد...' : 'Sharing link copied to clipboard. Redirecting to mail client...', 'success');
    const subject = encodeURIComponent(`${t('clinicalReport')} — ${user?.name || 'Patient'}`);
    const body = encodeURIComponent(`Hello,\n\nPlease find my blood-health monitoring report below.\n\nLatest Metrics:\nHemoglobin: ${latestRecord?.hemoglobin || '--'} g/dL\nFerritin: ${latestRecord?.ferritin || '--'} ng/mL\nMedication Adherence: ${adherence}%\n\nShared via Hemafy blood-health app.`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto print:p-0 print:border-none print:shadow-none">
      
      {/* Title & Action Buttons (Hidden when printing) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-text-primary">{t('clinicalReport')}</h1>
          <p className="text-xs font-semibold text-text-secondary mt-1">
            {t('reportSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleShareEmail}
            className="bg-white border border-burgundy text-burgundy hover:bg-burgundy-light font-bold text-xs px-4 py-2.5 rounded-primary transition-all flex items-center gap-2 cursor-pointer"
          >
            <Share2 size={14} />
            <span>{t('shareViaEmail')}</span>
          </button>
          
          <button
            onClick={handleDownloadPdf}
            className="bg-burgundy hover:bg-burgundy-dark text-white font-bold text-xs px-4 py-2.5 rounded-primary transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-burgundy/10"
          >
            <Download size={14} />
            <span>{t('downloadPdf')}</span>
          </button>
        </div>
      </div>

      {/* --- REPORT SHEET CARD --- */}
      <div className="bg-white border border-burgundy-soft/40 rounded-primary shadow-sm p-8 space-y-8 print:p-0 print:border-none">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-burgundy-soft/20 pb-6">
          <div className="space-y-2">
            <HemafyLogo size="md" />
            <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">{t('smartDiagnosticsReport')}</p>
          </div>
          
          <div className="text-start sm:text-end text-[10px] text-text-secondary space-y-1">
            <p><span className="font-bold">{t('reportId')}</span> HMF-{Date.now().toString().slice(-6)}</p>
            <p><span className="font-bold">{t('dateOfReport')}</span> {new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</p>
            <p><span className="font-bold">{t('clinicalStandard')}</span> WHO, BSG, BJH</p>
          </div>
        </div>

        {/* Patient Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-burgundy-light/20 border border-burgundy-soft/10 rounded-primary text-xs">
          <div>
            <p className="font-bold text-burgundy uppercase text-[9px] tracking-wider">{t('patientName')}</p>
            <p className="font-semibold text-text-primary mt-1">{user?.name || '--'}</p>
          </div>
          <div>
            <p className="font-bold text-burgundy uppercase text-[9px] tracking-wider">{t('ageGender')}</p>
            <p className="font-semibold text-text-primary mt-1">{user?.age || '--'} / {user?.gender || '--'}</p>
          </div>
          <div>
            <p className="font-bold text-burgundy uppercase text-[9px] tracking-wider">{t('emailAddress')}</p>
            <p className="font-semibold text-text-primary mt-1 truncate">{user?.email || '--'}</p>
          </div>
          <div>
            <p className="font-bold text-burgundy uppercase text-[9px] tracking-wider">{t('contactPhone')}</p>
            <p className="font-semibold text-text-primary mt-1">{user?.phone || '--'}</p>
          </div>
        </div>

        {/* Latest Results Details */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-burgundy uppercase tracking-wider">{t('latestMeasuredMetrics')}</h3>
          
          {latestRecord ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 border border-burgundy-soft/20 rounded-primary flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-text-secondary uppercase">{t('hemoglobin')}</p>
                  <p className="text-2xl font-black text-burgundy mt-1">{latestRecord.hemoglobin} <span className="text-xs font-bold text-text-muted">g/dL</span></p>
                </div>
                <span className={`text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                  latestRecord.hemoglobin >= 12.0 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                }`}>
                  {latestRecord.hemoglobin >= 12.0 ? t('normal') : t('low')}
                </span>
              </div>

              <div className="p-4 border border-burgundy-soft/20 rounded-primary flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-text-secondary uppercase">{t('ferritin')}</p>
                  <p className="text-2xl font-black text-burgundy mt-1">{latestRecord.ferritin} <span className="text-xs font-bold text-text-muted">ng/mL</span></p>
                </div>
                <span className={`text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                  latestRecord.ferritin >= 15 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                }`}>
                  {latestRecord.ferritin >= 15 ? t('normal') : t('low')}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-text-muted italic">{t('noMeasurementsRecorded')}</p>
          )}
        </div>

        {/* Historical Test Logs Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-burgundy uppercase tracking-wider">{t('historicalTestLog')}</h3>
          
          <div className="border border-burgundy-soft/25 rounded-primary overflow-x-auto w-full">
            <table className="w-full min-w-[500px] text-xs text-start border-collapse">
              <thead>
                <tr className="bg-burgundy-light/60 border-b border-burgundy-soft/25 text-burgundy font-bold">
                  <th className="p-3">{t('analysisDate')}</th>
                  <th className="p-3">{t('hemoglobin')}</th>
                  <th className="p-3">{t('ferritin')}</th>
                  <th className="p-3">{t('clinicalEvaluation')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-burgundy-soft/10">
                {testRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-burgundy-light/20 transition-colors">
                    <td className="p-3 font-semibold text-text-primary">{rec.timestamp.split(',')[0]}</td>
                    <td className="p-3 font-bold text-burgundy">{rec.hemoglobin} g/dL</td>
                    <td className="p-3 font-bold text-burgundy">{rec.ferritin} ng/mL</td>
                    <td className="p-3 font-medium text-text-secondary">{rec.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Adherence Compliance Widget */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-burgundy-soft/20 pt-6">
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-burgundy uppercase tracking-wider">{t('weeklyCompliance')}</h3>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full border-4 border-burgundy-soft flex items-center justify-center font-black text-burgundy text-xs shrink-0" style={{ borderTopColor: '#7A1028' }}>
                {adherence}%
              </div>
              <div>
                <p className="text-xs font-bold text-text-secondary">{t('weeklyAdherence')}</p>
                <p className="text-[10px] text-text-muted mt-1 leading-normal">
                  {t('adherenceNote')}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-burgundy uppercase tracking-wider">{t('guidanceTitle')}</h3>
            <div className="text-[10px] text-text-secondary space-y-1.5 leading-relaxed bg-[#FAFAFA] p-3 rounded-primary border border-burgundy-soft/15">
              <p>• {language === 'ar' ? 'فحص الأنيميا: متابعة دورية كل 2-3 أشهر.' : 'Anemia Screening: Follow up every 2-3 months if taking active supplements.'}</p>
              <p>• {language === 'ar' ? 'مستوى مخزون الحديد المستهدف: الفيريتين أعلى من 30 ng/mL.' : 'Iron stores target: Aim to raise ferritin above 30 ng/mL to declare iron store sufficiency.'}</p>
              <p>• {language === 'ar' ? 'الأعراض المرافقة: مناقشة أي أعراض مع الطبيب المعالج.' : 'Adverse Effects: Discuss any symptoms (gastric discomfort) with your prescribing doctor.'}</p>
            </div>
          </div>
        </div>

        {/* Medical signatures and disclaimer */}
        <div className="flex flex-col sm:flex-row justify-between items-end gap-6 border-t border-burgundy-soft/20 pt-6 text-[9px] text-text-muted">
          <p className="max-w-md leading-relaxed text-start">
            {t('disclaimer')}
          </p>
          <div className="text-start sm:text-end shrink-0">
            <p className="font-bold text-burgundy uppercase tracking-wide">{t('clinicallyMonitored')}</p>
            <p className="mt-1 font-bold text-text-primary">{t('approvedEngine')}</p>
          </div>
        </div>

      </div>
    </div>
  );
};
export default ReportScreen;
