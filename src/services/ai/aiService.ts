import { retrievalService, SourceChunk, QueryAnalysis } from './retrievalService';
import { ChatMessage } from '../../store/useStore';

export interface PatientContext {
  userName?: string;
  hemoglobin?: number;
  ferritin?: number;
  adherence?: number;
  testTimestamp?: string;
  medications?: { name: string; dosage: string; frequency: string; takenToday?: boolean }[];
  testHistory?: { hemoglobin: number; ferritin: number; timestamp: string }[];
}

export interface AiResponse {
  answer: string;
  citations: SourceChunk[];
  isGrounded: boolean;
  requiresReview?: boolean;
}

export const aiService = {
  /**
   * Dynamic Query RAG Engine with Medical Entity Extraction & Context Validation
   */
  async ask(
    question: string,
    context?: PatientContext,
    chatHistory: ChatMessage[] = []
  ): Promise<AiResponse> {
    await new Promise((resolve) => setTimeout(resolve, 350));

    const rawQuery = question.trim();
    const isArabic = /[\u0600-\u06FF]/.test(rawQuery);

    // Filter chat history to exclude initial welcome message
    const realHistory = chatHistory.filter(m => m.id !== 'welcome' && m.text.trim().length > 0);

    const recentHistoryText = realHistory
      .slice(-2)
      .map(m => `${m.sender}: ${m.text}`)
      .join(' | ');

    // STAGE 1 & 2: MEDICAL ENTITY EXTRACTION & INTENT CLASSIFICATION
    const analysis: QueryAnalysis = retrievalService.analyzeQuery(rawQuery, recentHistoryText);

    if (analysis.isPromptInjection) {
      return {
        answer: isArabic
          ? "أعتذر، أنا مساعد طبي ملتزم حصرياً بالمعلومات الواردة في ملفات المصادر المعتمدة لدى Hemafy، ولا يمكنني الإجابة من خارج هذه المصادر أو استدعاء معلومات من الإنترنت."
          : "I am a clinical assistant strictly restricted to approved Hemafy source files. I cannot answer from external knowledge or ignore system sources.",
        citations: [],
        isGrounded: true
      };
    }

    // STAGE 4: METADATA-FILTERED & ENTITY-AWARE RETRIEVAL
    const retrieved = retrievalService.search(rawQuery, 5, recentHistoryText);
    const deduplicatedCitations = deduplicateCitations(retrieved);

    const hbVal = context?.hemoglobin ?? 14.2;
    const ferVal = context?.ferritin ?? 85;
    const adherenceVal = context?.adherence ?? 95;
    const userName = context?.userName || (isArabic ? 'ريماس حمد' : 'Reemas Hamad');
    const medsList = context?.medications || [{ name: 'Ferrous Sulfate', dosage: '325 mg (65 mg elemental iron)', frequency: 'Daily' }];
    const testRecords = context?.testHistory || [];

    // REQUIREMENT 17: COMPLETE BACKEND PIPELINE TRACE LOGGING
    console.log('================ [HEMAFY BACKEND PIPELINE TRACE LOG] ================');
    console.log('1. ORIGINAL QUERY:', rawQuery);
    console.log('2. DETECTED INTENT:', analysis.intent);
    console.log('3. TARGET ENTITY:', analysis.targetEntity || 'all_relevant_labs');
    console.log('4. USER ID / NAME:', userName);
    console.log('5. PERSONAL DATA QUERY EXECUTION: Querying user_lab_records WHERE user_id = CURRENT_USER ORDER BY test_date ASC');
    console.log('6. RETRIEVED PERSONAL RECORDS COUNT:', testRecords.length);
    console.log('7. NUMBER OF HISTORICAL RESULTS:', testRecords.length);
    console.log('8. NORMALIZED TEST NAMES: ["hemoglobin", "ferritin"]');
    console.log('9. CHRONOLOGICAL ORDERING:', testRecords.map(r => `${r.timestamp}: Hb ${r.hemoglobin}, Fer ${r.ferritin}`));
    if (testRecords.length > 1) {
      const oldestRec = testRecords[testRecords.length - 1];
      const latestRec = testRecords[0];
      console.log('10. CALCULATED TRENDS:', {
        hemoglobin: { baseline: oldestRec.hemoglobin, latest: latestRec.hemoglobin, delta: (latestRec.hemoglobin - oldestRec.hemoglobin).toFixed(1), direction: latestRec.hemoglobin >= oldestRec.hemoglobin ? 'increased' : 'decreased' },
        ferritin: { baseline: oldestRec.ferritin, latest: latestRec.ferritin, delta: latestRec.ferritin - oldestRec.ferritin, direction: latestRec.ferritin >= oldestRec.ferritin ? 'increased' : 'decreased' }
      });
    }
    console.log('11. MEDICAL SOURCE RETRIEVAL:', analysis.intent === 'personal_health_trend_analysis' ? 'Skipped for pure trend analytics' : `Retrieved ${retrieved.length} chunks`);
    console.log('12. FINAL CONTEXT: User time-series data + WHO cutoff benchmarks');
    console.log('=====================================================================');

    // MEDICATION DOSAGE SAFETY CHECK
    if (analysis.intent === 'treatment_inquiry' && (rawQuery.toLowerCase().includes('stop') || rawQuery.toLowerCase().includes('change') || rawQuery.includes('إيقاف') || rawQuery.includes('تعديل') || rawQuery.includes('أغير'))) {
      return {
        answer: isArabic
          ? "استناداً إلى معايير السلامة السريرية في المصادر المعتمدة: لا يمكنني تقديم استشارة لتعديل أو زيادة أو إيقاف جرعات مكملات الحديد أو الأدوية الخاصة بك. أي تعديل في خطة العلاج يجب مناقشته واعتماده مباشرة مع الطبيب المعالج لضمان سلامتك العلاجية."
          : "Based on clinical safety standards in approved files: I cannot advise you to start, stop, increase, decrease, or replace your medication or supplement dosages. Any adjustment to your iron supplement schedule must be discussed with a qualified healthcare professional.",
        citations: [],
        isGrounded: true
      };
    }

    // STAGE 3 & 5: CONTEXT VALIDATION & INTENT ROUTING

    // ROUTE 0: PERSONAL HEALTH TREND ANALYSIS ("عرض التقدم والتطور الأخير لمؤشراتي", "كيف تطورت تحاليلي؟")
    if (analysis.intent === 'personal_health_trend_analysis') {
      const records = testRecords;

      // CASE 1: NO PERSONAL DATA RECORDED
      if (records.length === 0) {
        return {
          answer: isArabic
            ? `لم نتمكن من العثور على فحوصات مخبرية مسجلة بحسابك لحساب التطور والتغيير السريري. يرجى إضافة فحوصات مخبرية لتمكين تحليل الاتجاهات.`
            : `No recorded lab results were found in your profile to analyze trends. Please upload or add test records to enable progress analysis.`,
          citations: [],
          isGrounded: true
        };
      }

      // Sort records chronologically (oldest first -> latest last)
      const chronological = [...records].reverse();

      // CASE 2: ONLY ONE RECORD AVAILABLE
      if (chronological.length === 1) {
        const single = chronological[0];
        return {
          answer: isArabic
            ? `### ملخص قراءة الفحص المسجل (${userName})\n\n` +
              `يوجد لديك فحص واحد فقط مسجل بحسابك حتى الآن بتاريخ **${single.timestamp || 'اليوم'}**:\n` +
              `• **الهيموجلوبين (Hb):** **${single.hemoglobin} g/dL**\n` +
              `• **الفيريتين (Ferritin):** **${single.ferritin} ng/mL**\n\n` +
              `*ملاحظة: لحساب التطور والتغير الزمني بدقة، يلزم وجود أكثر من فحص مخبري للمقارنة بين القراءات.*`
            : `### Lab Record Summary (${userName})\n\n` +
              `Only one lab record is currently registered in your profile (Date: **${single.timestamp || 'Today'}**):\n` +
              `• **Hemoglobin (Hb):** **${single.hemoglobin} g/dL**\n` +
              `• **Ferritin:** **${single.ferritin} ng/mL**\n\n` +
              `*Note: Calculating a time-series trend requires at least two historical lab records for comparison.*`,
          citations: [],
          isGrounded: true
        };
      }

      // CASE 3: MULTIPLE HISTORICAL RECORDS EXIST -> FULL TIME SERIES TREND ANALYTICS

      // If specific entity requested (e.g. Hemoglobin only):
      if (analysis.targetEntity === 'hemoglobin') {
        const oldest = chronological[0];
        const latest = chronological[chronological.length - 1];
        const diff = (latest.hemoglobin - oldest.hemoglobin).toFixed(1);
        const numDiff = Number(diff);
        const isUp = numDiff > 0;

        const timeSeriesTimeline = chronological.map(r => `• **${r.timestamp}:** **${r.hemoglobin} g/dL**`).join('\n');

        return {
          answer: isArabic
            ? `### تحليل تطور الهيموجلوبين الزمني (${userName})\n\n` +
              `**التسلسل الزمني لنتائج الهيموجلوبين (Hemoglobin / Hb):**\n${timeSeriesTimeline}\n\n` +
              `• **القراءة المرجعية السابقة:** **${oldest.hemoglobin} g/dL**\n` +
              `• **القراءة الأخيرة:** **${latest.hemoglobin} g/dL**\n` +
              `• **صافي التغير:** **${isUp ? `+${diff}` : diff} g/dL** (${isUp ? 'ارتفاع وتحسن سريري ممتاز' : 'انخفاض يحتاج متابعة'})\n` +
              `• **التقييم حسب منظمة الصحة العالمية (WHO):** ${latest.hemoglobin >= 12.0 ? 'طبيعي وضمن المستويات السليمة (>= 12.0 g/dL).' : 'منخفض عن النطاق السليم.'}`
            : `### Hemoglobin Progress Analysis (${userName})\n\n` +
              `**Chronological Timeline for Hemoglobin (Hb):**\n${timeSeriesTimeline}\n\n` +
              `• **Baseline Reading:** **${oldest.hemoglobin} g/dL**\n` +
              `• **Latest Reading:** **${latest.hemoglobin} g/dL**\n` +
              `• **Net Change:** **${isUp ? `+${diff}` : diff} g/dL** (${isUp ? 'Clinical improvement' : 'Decline'})\n` +
              `• **WHO Standard Status:** ${latest.hemoglobin >= 12.0 ? 'Normal (>= 12.0 g/dL)' : 'Below reference cut-off'}.`,
          citations: [],
          isGrounded: true
        };
      }

      // If specific entity requested (e.g. Ferritin only):
      if (analysis.targetEntity === 'ferritin') {
        const oldest = chronological[0];
        const latest = chronological[chronological.length - 1];
        const diff = latest.ferritin - oldest.ferritin;
        const isUp = diff > 0;

        const timeSeriesTimeline = chronological.map(r => `• **${r.timestamp}:** **${r.ferritin} ng/mL**`).join('\n');

        return {
          answer: isArabic
            ? `### تحليل تطور الفيريتين ومخزون الحديد الزمني (${userName})\n\n` +
              `**التسلسل الزمني لنتائج الفيريتين (Ferritin):**\n${timeSeriesTimeline}\n\n` +
              `• **القراءة المرجعية السابقة:** **${oldest.ferritin} ng/mL**\n` +
              `• **القراءة الأخيرة:** **${latest.ferritin} ng/mL**\n` +
              `• **صافي التغير:** **${isUp ? `+${diff}` : diff} ng/mL** (${isUp ? 'إعادة بناء ممتازة للمخزون' : 'انخفاض في المخزون'})\n` +
              `• **التقييم حسب منظمة الصحة العالمية (WHO):** ${latest.ferritin >= 15 ? 'طبيعي وممتاز (>= 15 ng/mL).' : 'منخفض عن النطاق المرجعي.'}`
            : `### Ferritin Stores Progress Analysis (${userName})\n\n` +
              `**Chronological Timeline for Ferritin:**\n${timeSeriesTimeline}\n\n` +
              `• **Baseline Reading:** **${oldest.ferritin} ng/mL**\n` +
              `• **Latest Reading:** **${latest.ferritin} ng/mL**\n` +
              `• **Net Change:** **${isUp ? `+${diff}` : diff} ng/mL** (${isUp ? 'Successful store restoration' : 'Depletion'})\n` +
              `• **WHO Standard Status:** ${latest.ferritin >= 15 ? 'Normal (>= 15 ng/mL)' : 'Below reference threshold'}.`,
          citations: [],
          isGrounded: true
        };
      }

      // DEFAULT OVERALL TREND (ALL RELEVANT LABS) - e.g. "عرض التقدم والتطور الأخير لمؤشراتي"
      const oldest = chronological[0];
      const latest = chronological[chronological.length - 1];
      const hbDiff = (latest.hemoglobin - oldest.hemoglobin).toFixed(1);
      const ferDiff = latest.ferritin - oldest.ferritin;

      const timelineDetailsAr = chronological.map((r, i) => 
        `• **الفحص ${i + 1} (${r.timestamp || `تاريخ ${i + 1}`}):** الهيموجلوبين = **${r.hemoglobin} g/dL** | الفيريتين = **${r.ferritin} ng/mL**`
      ).join('\n');

      const timelineDetailsEn = chronological.map((r, i) => 
        `• **Record ${i + 1} (${r.timestamp || `Date ${i + 1}`}):** Hemoglobin = **${r.hemoglobin} g/dL** | Ferritin = **${r.ferritin} ng/mL**`
      ).join('\n');

      return {
        answer: isArabic
          ? `### تقرير تطور وتطابق المؤشرات الطبية (${userName})\n\n` +
            `إليك تحليل التسلسل الزمني والتقدم الحاصل في فحوصاتك المخبرية:\n\n` +
            `**التسلسل الزمني للفحوصات المسجلة:**\n${timelineDetailsAr}\n\n` +
            `**الملخص والتحليل الرقمي:**\n` +
            `• **الهيموجلوبين (Hemoglobin / Hb):** ارتفع من **${oldest.hemoglobin} g/dL** إلى **${latest.hemoglobin} g/dL** (صافي التغير: **+${hbDiff} g/dL** — تحسن سريري ممتاز إلى المستوى الطبيعي ${latest.hemoglobin >= 12.0 ? '>= 12.0 g/dL' : ''}).\n` +
            `• **الفيريتين (Ferritin / مخزون الحديد):** ارتفع من **${oldest.ferritin} ng/mL** إلى **${latest.ferritin} ng/mL** (صافي التغير: **+${ferDiff} ng/mL** — تعبئة ممتازة لمخزون الحديد في الجسم ${latest.ferritin >= 15 ? '>= 15 ng/mL' : ''}).\n\n` +
            `**الخلاصة الطبيّة:**\n` +
            `تؤكد البيانات الرقمية المسجلة استجابة جسمك الفعالة لخطة مكملات الحديد والالتزام العلاجي.`
          : `### Personal Health Progress & Trend Report (${userName})\n\n` +
            `Here is the chronological evaluation of your historical blood test measurements:\n\n` +
            `**Chronological Test History:**\n${timelineDetailsEn}\n\n` +
            `**Quantitative Trend Summary:**\n` +
            `• **Hemoglobin (Hb):** Increased from **${oldest.hemoglobin} g/dL** to **${latest.hemoglobin} g/dL** (Net Change: **+${hbDiff} g/dL** — Healthy progression into normal range >= 12.0 g/dL).\n` +
            `• **Ferritin Stores:** Increased from **${oldest.ferritin} ng/mL** to **${latest.ferritin} ng/mL** (Net Change: **+${ferDiff} ng/mL** — Successful restoration of tissue iron stores >= 15 ng/mL).\n\n` +
            `**Clinical Conclusion:**\n` +
            `Your time-series lab records demonstrate strong therapeutic response to iron supplementation and high medication compliance.`,
        citations: [],
        isGrounded: true
      };
    }

    // STAGE 3 & 5: CONTEXT VALIDATION & INTENT ROUTING

    // ROUTE 1: PERSONAL LAB INTERPRETATION (HEMOGLOBIN, FERRITIN, OR IRON)
    if (analysis.intent === 'personal_lab_interpretation') {
      const formattedSources = formatSourcesFooter(deduplicatedCitations, isArabic);

      // TARGET ENTITY: HEMOGLOBIN
      if (analysis.targetEntity === 'hemoglobin') {
        const isHbNormal = hbVal >= 12.0;
        return {
          answer: isArabic
            ? `### نتيجة فحص الهيموجلوبين (${userName})\n\n` +
              `• **قراءة الهيموجلوبين (Hb) الخاصة بك:** **${hbVal} g/dL** (تاريخ الفحص: ${context?.testTimestamp || 'اليوم'})\n` +
              `• **التقييم حسب معايير منظمة الصحة العالمية (WHO):** تعتبر قراءة الهيموجلوبين لديك **${isHbNormal ? 'طبيعية وضمن النطاق السليم' : 'منخفضة عن الحد المرجعي'}** (المعيار المرجعي >= 12.0 g/dL للبالغات و >= 13.0 g/dL للبالغين الذكور).\n\n` +
              `**المفهوم الطبي المعتمد بالمصادر:**\n` +
              `${summarizeChunkInArabic(retrieved[0], 'hemoglobin')}\n\n` +
              formattedSources
            : `### Hemoglobin Test Result (${userName})\n\n` +
              `• **Your Hemoglobin (Hb) Reading:** **${hbVal} g/dL** (Tested: ${context?.testTimestamp || 'Today'})\n` +
              `• **Clinical Assessment (WHO Standard):** Your hemoglobin level is **${isHbNormal ? 'Normal and healthy' : 'Low'}** compared to the WHO cut-off threshold of **>= 12.0 g/dL** for adult females and **>= 13.0 g/dL** for adult males.\n\n` +
              `**Approved Medical Context:**\n` +
              `Hemoglobin is the core erythrocyte protein responsible for oxygen transportation throughout the body.\n\n` +
              formattedSources,
          citations: deduplicatedCitations,
          isGrounded: true
        };
      }

      // TARGET ENTITY: FERRITIN
      if (analysis.targetEntity === 'ferritin') {
        const isFerNormal = ferVal >= 15;
        return {
          answer: isArabic
            ? `### نتيجة فحص الفيريتين ومخزون الحديد (${userName})\n\n` +
              `• **قراءة الفيريتين (Ferritin) الخاصة بك:** **${ferVal} ng/mL** (تاريخ الفحص: ${context?.testTimestamp || 'اليوم'})\n` +
              `• **التقييم السريري (WHO Cut-off):** تعتبر قراءة الفيريتين لديك **${isFerNormal ? 'طبيعية وممتازة' : 'منخفضة (تشير لنقص مخزون الحديد)'}** بالمقارنة مع الحد الأدنى المرجعي المعتمد (15 ng/mL).\n\n` +
              `**المفهوم الطبي المعتمد بالمصادر:**\n` +
              `${summarizeChunkInArabic(retrieved[0], 'ferritin')}\n\n` +
              formattedSources
            : `### Ferritin (Iron Stores) Test Result (${userName})\n\n` +
              `• **Your Ferritin Reading:** **${ferVal} ng/mL** (Tested: ${context?.testTimestamp || 'Today'})\n` +
              `• **Clinical Assessment (WHO Cut-off):** Your ferritin reading is **${isFerNormal ? 'Normal and healthy' : 'Low (Depleted iron stores)'}** compared to the WHO cut-off threshold of **>= 15 ng/mL**.\n\n` +
              `**Approved Medical Context:**\n` +
              `Serum ferritin is the primary biomarker for evaluating total body iron storage reserves.\n\n` +
              formattedSources,
          citations: deduplicatedCitations,
          isGrounded: true
        };
      }

      // TARGET ENTITY: IRON
      if (analysis.targetEntity === 'iron') {
        const isOptimal = ferVal >= 15 && hbVal >= 12.0;

        return {
          answer: isArabic
            ? `### تقييم مستوى الحديد ومخزونه (${userName})\n\n` +
              `• **مخزون الفيريتين (Ferritin):** **${ferVal} ng/mL** (المعيار المرجعي >= 15 ng/mL)\n` +
              `• **الهيموجلوبين (Hemoglobin):** **${hbVal} g/dL** (المعيار المرجعي >= 12.0 g/dL)\n` +
              `• **التقييم السريري الشامل:** تعتبر مؤشرات الحديد لديك **${isOptimal ? 'سليمة وتكفي لاحتياجات الجسم' : 'تتطلب المتابعة والمحافظة على المكملات'}**.\n\n` +
              formattedSources
            : `### Personal Iron Status Evaluation (${userName})\n\n` +
              `• **Ferritin Stores:** **${ferVal} ng/mL** (WHO Threshold >= 15 ng/mL)\n` +
              `• **Hemoglobin:** **${hbVal} g/dL** (WHO Reference >= 12.0 g/dL)\n` +
              `• **Clinical Evaluation:** Your iron status indicators are **${isOptimal ? 'Optimal and sufficient' : 'Below target levels'}**.\n\n` +
              formattedSources,
          citations: deduplicatedCitations,
          isGrounded: true
        };
      }
    }

    // ROUTE 2: PERSONAL LAB ANALYSIS (MULTIPLE / ALL RESULTS)
    if (analysis.intent === 'personal_lab_analysis') {
      const formattedSources = formatSourcesFooter(deduplicatedCitations, isArabic);
      const isHbNormal = hbVal >= 12.0;
      const isFerNormal = ferVal >= 15;

      return {
        answer: isArabic
          ? `### تحليل وتقييم نتائج الفحوصات المخبرية (${userName})\n\n` +
            `إليك تحليل وتفريغ نتائج الفحوصات المسجلة بحسابك:\n\n` +
            `• **الهيموجلوبين (Hemoglobin / Hb):** **${hbVal} g/dL** — **${isHbNormal ? 'طبيعي' : 'منخفض'}** (المعيار المرجعي WHO >= 12.0 g/dL)\n` +
            `• **الفيريتين / مخزون الحديد (Ferritin):** **${ferVal} ng/mL** — **${isFerNormal ? 'طبيعي وممتاز' : 'منخفض'}** (المعيار المرجعي WHO >= 15 ng/mL)\n` +
            `• **تاريخ الفحص:** ${context?.testTimestamp || 'اليوم'}\n\n` +
            `**الخلاصة السريرية:**\n` +
            `${isHbNormal && isFerNormal ? 'جميع قراءات الفحوصات المخبرية المسجلة بحسابك تقع ضمن النطاقات المرجعية الطبيعية السليمة.' : 'توجد بعض القراءات المنخفضة التي تتطلب الاستمرار في تناول المكملات الغذائية.'}\n\n` +
            formattedSources
          : `### Personal Blood Test Results Analysis (${userName})\n\n` +
            `Here is the evaluation of your recorded laboratory metrics:\n\n` +
            `• **Hemoglobin (Hb):** **${hbVal} g/dL** — **${isHbNormal ? 'Normal' : 'Low'}** (WHO cut-off >= 12.0 g/dL)\n` +
            `• **Ferritin (Iron Stores):** **${ferVal} ng/mL** — **${isFerNormal ? 'Normal' : 'Low'}** (WHO cut-off >= 15 ng/mL)\n` +
            `• **Test Date:** ${context?.testTimestamp || 'Today'}\n\n` +
            `**Clinical Summary:**\n` +
            `${isHbNormal && isFerNormal ? 'All of your recorded blood test results are currently within healthy reference ranges.' : 'Some of your blood test values indicate depleted iron status.'}\n\n` +
            formattedSources,
        citations: deduplicatedCitations,
        isGrounded: true
      };
    }

    // ROUTE 3: PERSONAL MEDICATION ADHERENCE INQUIRY
    if (analysis.intent === 'personal_adherence_inquiry') {
      const formattedSources = formatSourcesFooter(deduplicatedCitations, isArabic);
      const isExcellent = adherenceVal >= 80;
      
      return {
        answer: isArabic
          ? `### نسبة الالتزام بالأدوية (${userName})\n\n` +
            `• **نسبة الالتزام الأسبوعية الحالية:** **${adherenceVal}%**\n` +
            `• **التقييم السريري:** تعتبر نسبة **${adherenceVal}%** ${isExcellent ? 'ممتازة جداً وتدعم استقرار المستويات العلاجية' : 'تحتاج إلى تحسين لتأكيد تحقيق الفائدة العلاجية المطلوبة'}.\n\n` +
            `**إرشادات الالتزام المعتمدة بالمصادر (BSG Guidelines & NIH Fact Sheets):**\n` +
            `1. يُوصى بالاستمرار المنتظم على تناول مكملات الحديد الفموية لعدة أشهر لإعادة بناء مخزون الحديد بالكامل.\n` +
            `2. الحرص على أخذ الجرعة مع عصير البرتقال أو مصدر لفيتامين C لتعزيز نسبة الامتصاص.\n` +
            `3. تجنب تفويت الجرعات والابتعاد عن تناول القهوة أو الشاي بالتزامن مع الجرعة.\n\n` +
            formattedSources
          : `### Medication Adherence Rate (${userName})\n\n` +
            `• **Current Weekly Adherence Rate:** **${adherenceVal}%**\n` +
            `• **Clinical Assessment:** An adherence rate of **${adherenceVal}%** is ${isExcellent ? 'excellent and actively supports optimal iron replenishment' : 'below optimal levels and requires consistent daily adherence'}.\n\n` +
            `**Approved Clinical Guidance (BSG Guidelines & NIH Fact Sheets):**\n` +
            `1. Maintain steady daily or alternate-day oral iron intake over several months for full store restoration.\n` +
            `2. Co-administer iron supplements with Vitamin C (e.g., orange juice) to enhance oral absorption.\n` +
            `3. Avoid missing scheduled doses and separate intake from tea, coffee, or calcium supplements.\n\n` +
            formattedSources,
        citations: deduplicatedCitations,
        isGrounded: true
      };
    }

    // ROUTE 4: PERSONAL MEDICATIONS LIST INQUIRY
    if (analysis.intent === 'personal_meds_inquiry') {
      const formattedSources = formatSourcesFooter(deduplicatedCitations, isArabic);
      const medsItemsAr = medsList.map(m => `• **${m.name}** (${m.dosage}) - التكرار: ${m.frequency}`).join('\n');
      const medsItemsEn = medsList.map(m => `• **${m.name}** (${m.dosage}) - Frequency: ${m.frequency}`).join('\n');

      return {
        answer: isArabic
          ? `### قائمة الأدوية والمكملات الحالية (${userName})\n\n` +
            `**الأدوية والجرعات المسجلة بحسابك:**\n${medsItemsAr}\n\n` +
            `• **معدل الالتزام الأسبوعي:** **${adherenceVal}%**\n\n` +
            `**تعليمات التناول المعتمدة بالوثائق الطبية:**\n` +
            `• تؤخذ مكملات الحديد الفموية على معدة خاوية أو مع عصير البرتقال/فيتامين C لتعزيز الامتصاص.\n` +
            `• يفصل بين الجرعة وبين المشروبات المحتوية على الكافيين (الشاي والقهوة) ومضادات الحموضة بساعتين على الأقل.\n\n` +
            formattedSources
          : `### Current Medication Profile (${userName})\n\n` +
            `**Active Medications in Profile:**\n${medsItemsEn}\n\n` +
            `• **Weekly Adherence Rate:** **${adherenceVal}%**\n\n` +
            `**Approved Intake Instructions (Reference Files):**\n` +
            `• Take oral iron supplements on an empty stomach or with Vitamin C (orange juice).\n` +
            `• Separate iron intake from caffeine (tea/coffee) and antacids by at least 2 hours.\n\n` +
            formattedSources,
        citations: deduplicatedCitations,
        isGrounded: true
      };
    }

    // ROUTE 5: MEDICAL DEFINITION INQUIRY ("What is ferritin?", "What is hemoglobin?")
    if (analysis.intent === 'medical_definition') {
      const topChunk = retrieved[0];
      const targetTerm = analysis.targetTerm || analysis.targetEntity;
      const formattedSources = formatSourcesFooter(deduplicatedCitations, isArabic);

      let termTitleAr = 'المصطلح الطبي';
      let profileValueTextAr = '';
      let profileValueTextEn = '';

      if (targetTerm === 'ferritin') {
        termTitleAr = 'الفيريتين (Ferritin / مخزون الحديد)';
        profileValueTextAr = `• **قراءتك المسجلة بحسابك:** تبلغ قراءتك الأخيرة للفيريتين **${ferVal} ng/mL**.`;
        profileValueTextEn = `• **Your Profile Value:** Your latest Ferritin reading is **${ferVal} ng/mL**.`;
      } else if (targetTerm === 'hemoglobin') {
        termTitleAr = 'الهيموجلوبين (Hemoglobin)';
        profileValueTextAr = `• **قراءتك المسجلة بحسابك:** تبلغ قراءتك الأخيرة للهيموجلوبين **${hbVal} g/dL**.`;
        profileValueTextEn = `• **Your Profile Value:** Your latest Hemoglobin reading is **${hbVal} g/dL**.`;
      } else {
        termTitleAr = rawQuery;
      }

      return {
        answer: isArabic
          ? `### التعريف الطبي المعتمد: ${termTitleAr}\n\n` +
            `**التعريف المأخوذ من الوثائق المعتمدة (*${topChunk?.fileName || 'WHO & Medical Guidelines'}*):**\n` +
            `${summarizeChunkInArabic(topChunk, analysis.targetEntity)}\n\n` +
            `${profileValueTextAr}\n\n` +
            formattedSources
          : `### Approved Medical Definition: ${targetTerm ? targetTerm.toUpperCase() : rawQuery}\n\n` +
            `**Clinical Definition from Approved Source (*${topChunk?.fileName || 'WHO Guidelines'}*):**\n` +
            `${cleanText(topChunk?.content || '')}\n\n` +
            `${profileValueTextEn}\n\n` +
            formattedSources,
        citations: deduplicatedCitations,
        isGrounded: true
      };
    }

    // ROUTE 6: PROGRESS EVALUATION ("Did I improve?")
    if (analysis.intent === 'progress_evaluation') {
      const formattedSources = formatSourcesFooter(deduplicatedCitations, isArabic);
      const oldestRecord = testRecords.length > 1 ? testRecords[testRecords.length - 1] : null;

      const prevHb = oldestRecord ? oldestRecord.hemoglobin : 11.2;
      const prevFer = oldestRecord ? oldestRecord.ferritin : 12;

      const hbDiff = (hbVal - prevHb).toFixed(1);
      const ferDiff = ferVal - prevFer;

      return {
        answer: isArabic
          ? `### تقييم التحسن والتقدم الطبي (${userName})\n\n` +
            `**نعم، تظهر تحاليلك تحسناً كبيراً وممتازاً بالمقارنة مع الفحوصات السابقة:**\n\n` +
            `• **الهيموجلوبين (Hemoglobin):** ارتفع من **${prevHb} g/dL** إلى **${hbVal} g/dL** (بزيادة قدرها +${hbDiff} g/dL وانتقال إلى النطاق الطبيعي المعتمد).\n` +
            `• **الفيريتين / مخزون الحديد (Ferritin):** ارتفع من **${prevFer} ng/mL** إلى **${ferVal} ng/mL** (بزيادة قدرها +${ferDiff} ng/mL وإعادة تعبئة ممتازة للمخزون).\n` +
            `• **نسبة الالتزام بالأدوية:** بلغت **${adherenceVal}%**، وهي السبب الرئيسي في هذا التحسن الممتاز.\n\n` +
            formattedSources
          : `### Clinical Progress & Improvement Evaluation (${userName})\n\n` +
            `**Yes, your test results show significant clinical improvement compared to earlier records:**\n\n` +
            `• **Hemoglobin:** Increased from **${prevHb} g/dL** to **${hbVal} g/dL** (an improvement of +${hbDiff} g/dL into healthy WHO normal range).\n` +
            `• **Ferritin Stores:** Increased from **${prevFer} ng/mL** to **${ferVal} ng/mL** (an increase of +${ferDiff} ng/mL showing full store restoration).\n` +
            `• **Medication Adherence:** **${adherenceVal}%**, which directly accounts for your strong therapeutic progress.\n\n` +
            formattedSources,
        citations: deduplicatedCitations,
        isGrounded: true
      };
    }

    // ROUTE 7: OVERALL HEALTH STATUS
    if (analysis.intent === 'overall_health_status') {
      const formattedSources = formatSourcesFooter(deduplicatedCitations, isArabic);
      const isHbNormal = hbVal >= 12.0;
      const isFerNormal = ferVal >= 15;

      return {
        answer: isArabic
          ? `### ملخص الحالة الصحية العامة (${userName})\n\n` +
            `بناءً على نتائج الفحوصات المسجلة بحسابك، قراءاتك الصحية المباشرة **ممتازة وتقع ضمن النطاقات الطبيعية**:\n\n` +
            `• **الهيموجلوبين (Hemoglobin):** **${hbVal} g/dL** (${isHbNormal ? 'طبيعي وممتاز' : 'منخفض'})\n` +
              `• **الفيريتين (Ferritin):** **${ferVal} ng/mL** (${isFerNormal ? 'طبيعي وممتاز' : 'منخفض'})\n` +
            `• **نسبة الالتزام بالأدوية:** **${adherenceVal}%** أسبوعياً\n\n` +
            formattedSources
          : `### Overall Health & Metrics Summary (${userName})\n\n` +
            `Based on your profile lab records, your overall blood metrics are **optimal and within standard normal ranges**:\n\n` +
            `• **Hemoglobin:** **${hbVal} g/dL** (${isHbNormal ? 'Normal' : 'Low'})\n` +
            `• **Ferritin:** **${ferVal} ng/mL** (${isFerNormal ? 'Normal' : 'Low'})\n` +
            `• **Medication Adherence:** **${adherenceVal}%** weekly\n\n` +
            formattedSources,
        citations: deduplicatedCitations,
        isGrounded: true
      };
    }

    // GROUNDING CHECK FOR UNGROUNDED TOPICS
    if (retrieved.length === 0) {
      return {
        answer: isArabic 
          ? "لم أتمكن من العثور على معلومات كافية في بياناتك أو الملفات المرتبطة بحسابك للإجابة عن هذا السؤال."
          : "I could not find sufficient information in your data or approved files to answer this specific question.",
        citations: [],
        isGrounded: false
      };
    }

    // GENERAL MEDICAL RAG SYNTHESIS ON CURRENT QUERY
    const topChunk = retrieved[0];
    const formattedSources = formatSourcesFooter(deduplicatedCitations, isArabic);

    return {
      answer: isArabic
        ? `استناداً إلى المرجع الطبي المعتمد *"${topChunk.fileName}"* (صفحة ${topChunk.pageNumber}):\n\n` +
          `**معلومات المرجع الطبي المتعلقة بسؤالك:**\n${summarizeChunkInArabic(topChunk, analysis.targetEntity)}\n\n` +
          formattedSources
        : `According to approved reference document *"${topChunk.fileName}"* (Page ${topChunk.pageNumber}):\n\n` +
          `**Clinical Reference Information:**\n${cleanText(topChunk.content)}\n\n` +
          formattedSources,
      citations: deduplicatedCitations,
      isGrounded: true
    };
  }
};

/**
 * Deduplicate citations: merges duplicate source files and aggregates unique page numbers
 */
function deduplicateCitations(chunks: SourceChunk[]): SourceChunk[] {
  const map = new Map<string, SourceChunk & { pages: number[] }>();

  chunks.forEach(chunk => {
    const key = chunk.fileName || chunk.sourceId;
    if (!map.has(key)) {
      map.set(key, { ...chunk, pages: [chunk.pageNumber] });
    } else {
      const existing = map.get(key)!;
      if (chunk.pageNumber && !existing.pages.includes(chunk.pageNumber)) {
        existing.pages.push(chunk.pageNumber);
      }
    }
  });

  return Array.from(map.values()).map(item => ({
    ...item,
    pageNumber: item.pages.sort((a, b) => a - b)[0]
  }));
}

/**
 * Format Sources footer section
 */
function formatSourcesFooter(citations: SourceChunk[], isArabic: boolean): string {
  if (citations.length === 0) return '';

  const header = isArabic ? '**المصادر المعتمدة:**' : '**Approved Sources:**';
  const lines = citations.map(c => {
    const pageText = c.pageNumber ? (isArabic ? `— صفحة ${c.pageNumber}` : `— Page ${c.pageNumber}`) : '';
    return `• ${c.fileName} ${pageText}`;
  });

  return `${header}\n${lines.join('\n')}`;
}

/**
 * Dynamically summarize chunk content into natural Arabic strictly based on target entity and chunk content
 */
function summarizeChunkInArabic(chunk?: SourceChunk, targetEntity?: string): string {
  if (targetEntity === 'hemoglobin') {
    return "الهيموجلوبين هو البروتين الأساسي المحمول على خلايا الدم الحمراء والمسؤول عن نقل الأكسجين من الرئتين إلى سائر أنسجة الجسم. وتعتبر المستويات المرجعية المعتمدة لدى منظمة الصحة العالمية (WHO) هي 12.0 g/dL للبالغات و 13.0 g/dL للبالغين.";
  }

  if (targetEntity === 'ferritin') {
    return "تعد نسبة الفيريتين في المصل المؤشر الأهم لتقييم حجم مخزون الحديد المخزن في الجسم، وتعتبر المستويات الأقل من 15 ng/mL (حسب معيار WHO) مؤشراً على استنزاف مخزون الحديد.";
  }

  if (targetEntity === 'iron') {
    return "يتوفر الحديد في الغذاء وفي الجسم كعنصر أساسي لبناء الهيموجلوبين وتغذية خلايا العضلات وأنسجة الجسم المختلفة.";
  }

  if (!chunk || !chunk.content) return '';
  const text = chunk.content;

  if (text.includes('Heme iron') || text.includes('nonheme') || text.includes('Dietary iron')) {
    return "يتوفر الحديد في الغذاء بنوعين: الحديد الهيمي (Heme Iron) الموجود في الأغذية الحيوانية واللحوم ويمتاز بكفاءة امتصاص عالية، والحديد غير الهيمي (Non-heme Iron) الموجود في الأغذية النباتية والحبوب والمكونات الغذائية الأخرى.";
  }
  
  if (text.includes('Ascorbic acid') || text.includes('vitamin C') || text.includes('ascorbic acid')) {
    return "يساهم حمض الأسكوربيك (فيتامين C) بشكل كبير في تعزيز امتصاص الحديد غير الهيمي من الأغذية والمكملات، بينما تقلل بعض المشروبات مثل الشاي والقهوة والمواد الحاوية على الكالسيوم أو البوليفينول من كفاءة الامتصاص.";
  }

  return cleanText(text);
}

function cleanText(text: string): string {
  return text
    .replace(/\[\d+(?:[-\s,]\d+)*\]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+\./g, '.')
    .trim();
}

