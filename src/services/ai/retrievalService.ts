import sources from '../../assets/sources.json';

export interface SourceChunk {
  sourceId: string;
  fileName: string;
  pageNumber: number;
  section: string;
  content: string;
  score?: number;
}

export type MedicalEntity = 
  | 'hemoglobin'
  | 'ferritin'
  | 'iron'
  | 'anemia'
  | 'medication_adherence'
  | 'medications_list'
  | 'all_relevant_labs'
  | 'treatment_dosing'
  | 'symptom'
  | 'none';

export type QueryIntent = 
  | 'personal_health_trend_analysis'
  | 'personal_lab_interpretation'
  | 'personal_lab_analysis'
  | 'personal_adherence_inquiry'
  | 'personal_meds_inquiry'
  | 'medical_definition'
  | 'treatment_inquiry'
  | 'progress_evaluation'
  | 'overall_health_status'
  | 'symptom_inquiry'
  | 'general_medical_rag';

export interface QueryAnalysis {
  originalQuery: string;
  normalizedQuery: string;
  rewrittenQuery: string;
  intent: QueryIntent;
  targetEntity: MedicalEntity;
  targetTerm?: string;
  requiresPersonalData: boolean;
  requiresTimeSeries: boolean;
  requiresMultipleResults: boolean;
  detectedTopics: string[];
  numericalValues: number[];
  detectedDescriptors: string[];
  expandedTerms: string[];
  isPromptInjection: boolean;
}

// Medical Synonym & Term Map
const SYNONYM_MAP: { [key: string]: string[] } = {
  // Hemoglobin
  'هيموجلوبين': ['hemoglobin', 'haemoglobin', 'hb', 'hgb', 'erythrocyte', 'red blood cell'],
  'هيموغلوبين': ['hemoglobin', 'haemoglobin', 'hb', 'hgb', 'erythrocyte', 'red blood cell'],
  'الهيموجلوبين': ['hemoglobin', 'haemoglobin', 'hb', 'hgb', 'erythrocyte'],
  'الهيموغلوبين': ['hemoglobin', 'haemoglobin', 'hb', 'hgb', 'erythrocyte'],
  'hb': ['hemoglobin', 'haemoglobin', 'hb', 'hgb'],
  'hgb': ['hemoglobin', 'haemoglobin', 'hb', 'hgb'],
  'hemoglobin': ['hemoglobin', 'haemoglobin', 'hb', 'hgb'],
  'haemoglobin': ['hemoglobin', 'haemoglobin', 'hb', 'hgb'],

  // Ferritin / Iron Stores
  'فيريتين': ['ferritin', 'iron stores', 'serum ferritin', 'stored iron'],
  'الفيريتين': ['ferritin', 'iron stores', 'serum ferritin', 'stored iron'],
  'مخزون': ['ferritin', 'iron stores', 'serum ferritin', 'stored iron'],
  'المخزون': ['ferritin', 'iron stores', 'serum ferritin', 'stored iron'],
  'ferritin': ['ferritin', 'iron stores', 'serum ferritin'],

  // Iron & Supplements
  'حديد': ['iron', 'elemental iron', 'dietary iron', 'ferrous', 'oral iron'],
  'الحديد': ['iron', 'elemental iron', 'dietary iron', 'ferrous', 'oral iron'],
  'مكمل': ['iron supplement', 'supplement', 'ferrous sulfate', 'oral iron'],
  'مكملات': ['supplements', 'iron supplements', 'oral iron', 'therapy'],
  'حبوب': ['supplement', 'tablets', 'oral iron', 'dosing'],
  'iron': ['iron', 'elemental iron', 'dietary iron', 'ferrous'],

  // Medications
  'دواء': ['medication', 'drug', 'oral iron', 'treatment'],
  'ادوية': ['medications', 'treatment', 'oral iron', 'dosing schedule'],
  'أدوية': ['medications', 'treatment', 'oral iron', 'dosing schedule'],
  'الأدوية': ['medications', 'treatment', 'oral iron', 'dosing schedule'],
  'ادويتي': ['medications', 'my medications', 'treatment', 'oral iron'],
  'أدويتي': ['medications', 'my medications', 'treatment', 'oral iron'],
  'علاجاتي': ['medications', 'my medications', 'treatment'],
  'مكملاتي': ['supplements', 'my supplements', 'oral iron'],
  'medication': ['medications', 'treatment'],
  'medications': ['medications', 'treatment'],
  'meds': ['medications', 'treatment'],

  // Adherence
  'التزام': ['adherence', 'compliance', 'taking', 'schedule'],
  'الالتزام': ['adherence', 'compliance', 'taking', 'schedule'],
  'التزامي': ['adherence', 'compliance', 'taking'],
  'ملتزم': ['adherence', 'compliance', 'consistent'],
  'نسبة': ['percentage', 'rate', 'adherence', 'level'],
  'adherence': ['adherence', 'compliance'],
  'compliance': ['adherence', 'compliance'],

  // Tests & Results
  'تحليل': ['test', 'cbc', 'laboratory', 'assessment', 'measurement'],
  'تحليلي': ['test', 'cbc', 'laboratory', 'assessment', 'result'],
  'تحاليلي': ['test', 'laboratory', 'results'],
  'فحص': ['test', 'assay', 'measurement', 'assessment'],
  'فحصي': ['test', 'result', 'measurement'],
  'فحوصاتي': ['test', 'results', 'measurements'],
  'مؤشرات': ['indicators', 'metrics', 'markers'],
  'مؤشراتي': ['indicators', 'metrics', 'markers', 'my indicators'],
  'نتيجة': ['result', 'reading', 'level', 'outcome'],

  // Anemia
  'فقر دم': ['anemia', 'anaemia', 'iron deficiency'],
  'أنيميا': ['anemia', 'anaemia', 'iron deficiency'],
  'انيميا': ['anemia', 'anaemia', 'iron deficiency'],
  'anemia': ['anemia', 'anaemia', 'iron deficiency'],

  // Descriptors
  'منخفض': ['low', 'deficiency', 'depleted', 'below'],
  'نازل': ['low', 'deficiency', 'depleted', 'below'],
  'مرتفع': ['high', 'elevated', 'overload', 'above'],
  'طبيعي': ['normal', 'reference range', 'threshold', 'optimal']
};

const INJECTION_PATTERNS = [
  'تجاهل الملفات', 'تجاهل المصادر', 'استخدم المعرفة العامة', 'ابحث في الانترنت', 'ابحث في النت', 
  'اجب من عندك', 'لا تلتزم بالملفات', 'ignore files', 'ignore sources', 'use general knowledge', 
  'search the internet', 'override instructions', 'forget constraints', 'ignore system'
];

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'to', 'of', 'in', 'on', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'from', 'up', 'down', 'out',
  'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where',
  'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can',
  'will', 'just', 'should', 'now', 'what', 'does', 'my', 'me', 'we', 'our', 'you', 'your',
  'من', 'في', 'عن', 'على', 'إلى', 'مع', 'هذا', 'هذه', 'ما', 'ماذا', 'هل', 'كيف', 'كان', 'يكون',
  'وش', 'شنو', 'ايish', 'ايش', 'ليش', 'ليه', 'عندي', 'لي', 'عندي؟', 'وشيعني', 'يعني'
]);

/**
 * Stage 1: Explicit Pre-Retrieval Medical Entity Extraction & Personal Context Matching
 */
export function extractMedicalEntity(query: string): {
  targetEntity: MedicalEntity;
  requiresPersonalData: boolean;
  requiresTimeSeries: boolean;
  requiresMultipleResults: boolean;
} {
  const rawTrimmed = query.trim();
  const rawLower = rawTrimmed.toLowerCase();
  const norm = normalizeText(rawTrimmed);

  // Check personal & trend markers
  const personalMarkers = [
    'لدي', 'عندي', 'لي', 'حسابي', 'تحليلي', 'فحصي', 'قراءتي', 'نتيجتي', 'ادويتي', 'أدويتي', 'التزامي', 
    'مؤشراتي', 'تحاليلي', 'فحوصاتي', 'نتائجي', 'وضعك', 'حالتك', 'تطوري', 'تطورت', 'تغيرت',
    'my', 'i', 'me', 'mine', 'is my', 'how is my', 'what is my', "what's my"
  ];

  const trendMarkers = [
    'التقدم والتطور', 'تطور مؤشراتي', 'تطور تحاليلي', 'تطور الهيموجلوبين', 'تطور الفيريتين',
    'تطورت تحاليلي', 'وش تحسن عندي', 'وش تغير', 'سابقا والحين', 'سابقاً والحين', 'مؤخرا', 'مؤخراً', 
    'تطور', 'تطوري', 'تقدمي', 'التقدم', 'التطور', 'اعرض لي تطور', 'كيف كانت نتائجي', 'تحسنت تحاليلي',
    'progress', 'trend', 'improved', 'better', 'changed', 'historical', 'recent progress'
  ];

  const hasTrendPhrase = trendMarkers.some(m => rawLower.includes(m) || norm.includes(m));
  const requiresPersonalData = personalMarkers.some(m => rawLower.includes(m) || norm.includes(m)) || hasTrendPhrase;
  const requiresTimeSeries = hasTrendPhrase;

  const multiResultMarkers = [
    'وش عندي منخفض', 'شنو المنخفض', 'وش المنخفض', 'نتائج التحاليل', 'فحوصاتي', 'تحاليلي', 'مؤشراتي',
    'blood tests', 'blood test', 'lab tests', 'test results', "what's low", 'what is low', 'are my blood'
  ];
  const requiresMultipleResults = multiResultMarkers.some(m => rawLower.includes(m) || norm.includes(m));

  // 1. Hemoglobin matchers
  const hasHb = 
    rawLower.includes('hemoglobin') || rawLower.includes('haemoglobin') || 
    /\bhb\b/i.test(rawLower) || /\bhgb\b/i.test(rawLower) || 
    norm.includes('هيموجلوبين') || norm.includes('هيموغلوبين');

  // 2. Ferritin matchers
  const hasFerritin = 
    rawLower.includes('ferritin') || norm.includes('فيريتين') || 
    norm.includes('مخزون') || rawLower.includes('iron stores');

  // 3. Iron matchers
  const hasIron = 
    (rawLower.includes('iron') && !rawLower.includes('iron deficiency') && !rawLower.includes('iron stores') && !rawLower.includes('ferritin')) || 
    (norm.includes('حديد') && !norm.includes('مخزون') && !norm.includes('نقص'));

  // 4. Adherence matchers
  const hasAdherence = 
    rawLower.includes('adherence') || rawLower.includes('compliance') || 
    norm.includes('التزام') || norm.includes('ملتزم');

  // 5. Medications matchers
  const hasMeds = 
    rawLower.includes('medication') || rawLower.includes('meds') || 
    norm.includes('ادويتي') || norm.includes('علاجاتي') || norm.includes('مكملاتي');

  let targetEntity: MedicalEntity = 'none';

  if (hasHb) {
    targetEntity = 'hemoglobin';
  } else if (hasFerritin) {
    targetEntity = 'ferritin';
  } else if (hasIron) {
    targetEntity = 'iron';
  } else if (hasAdherence) {
    targetEntity = 'medication_adherence';
  } else if (hasMeds) {
    targetEntity = 'medications_list';
  } else if (requiresMultipleResults || hasTrendPhrase) {
    targetEntity = 'all_relevant_labs';
  }

  return { targetEntity, requiresPersonalData, requiresTimeSeries, requiresMultipleResults };
}

export const retrievalService = {
  analyzeQuery(query: string, _historyContext = ''): QueryAnalysis {
    const rawTrimmed = query.trim();
    const rawLower = rawTrimmed.toLowerCase();
    const normalizedCurrent = normalizeText(rawTrimmed);

    const isPromptInjection = INJECTION_PATTERNS.some(p => rawLower.includes(p));
    const numMatches = query.match(/\b\d+(\.\d+)?\b/g);
    const numericalValues = numMatches ? numMatches.map(Number) : [];

    const { targetEntity, requiresPersonalData, requiresTimeSeries, requiresMultipleResults } = extractMedicalEntity(rawTrimmed);

    const tokens = normalizedCurrent
      .split(/\s+/)
      .map(w => w.trim())
      .filter(w => w.length > 1 && !STOP_WORDS.has(w));

    const detectedTopics: string[] = [];
    const detectedDescriptors: string[] = [];
    const expandedTermsSet = new Set<string>();

    tokens.forEach(token => {
      expandedTermsSet.add(token);
      if (SYNONYM_MAP[token]) {
        SYNONYM_MAP[token].forEach(syn => expandedTermsSet.add(syn));
      }
      if (['hemoglobin', 'haemoglobin', 'hb', 'hgb', 'هيموجلوبين', 'هيموغلوبين'].includes(token)) {
        detectedTopics.push('hemoglobin');
      } else if (['ferritin', 'فيريتين', 'مخزون'].includes(token)) {
        detectedTopics.push('ferritin');
      } else if (['iron', 'حديد', 'مكمل', 'حبوب'].includes(token)) {
        detectedTopics.push('iron');
      } else if (['anemia', 'أنيميا', 'انيميا', 'فقر'].includes(token)) {
        detectedTopics.push('anemia');
      }

      if (['low', 'high', 'normal', 'منخفض', 'نازل', 'مرتفع', 'طبيعي'].includes(token)) {
        detectedDescriptors.push(token);
      }
    });

    let intent: QueryIntent = 'general_medical_rag';
    let targetTerm: string | undefined = undefined;
    let rewrittenQuery = rawTrimmed;

    // Stage 2: Intent Classification
    if (requiresTimeSeries) {
      intent = 'personal_health_trend_analysis';
      rewrittenQuery = `Analyze personal historical lab records time-series trend for ${targetEntity}`;
      expandedTermsSet.add('trend');
      expandedTermsSet.add('progress');
    } else if (requiresPersonalData && (targetEntity === 'hemoglobin' || targetEntity === 'ferritin' || targetEntity === 'iron')) {
      intent = 'personal_lab_interpretation';
      rewrittenQuery = `Evaluate personal patient ${targetEntity.toUpperCase()} laboratory result and WHO reference standards`;
      expandedTermsSet.add(targetEntity);
    } else if (
      rawLower.startsWith('what is') || rawLower.startsWith('what does') || rawLower.includes('meaning of') ||
      rawLower.includes('define') || rawLower.includes('معنى') || rawLower.includes('تعريف') || 
      rawLower.startsWith('عرف') || rawLower.startsWith('ما هو') || rawLower.startsWith('ما هي') || rawLower.startsWith('وش يعني') ||
      rawLower.includes('ماذا يعني')
    ) {
      intent = 'medical_definition';
      if (targetEntity === 'ferritin') targetTerm = 'ferritin';
      else if (targetEntity === 'hemoglobin') targetTerm = 'hemoglobin';
      else if (targetEntity === 'iron') targetTerm = 'iron';
      else if (rawLower.includes('anemia') || rawLower.includes('أنيميا') || rawLower.includes('فقر دم')) targetTerm = 'anemia';

      rewrittenQuery = `Define clinical medical term: ${targetTerm || targetEntity || rawTrimmed}`;
    } else if (requiresPersonalData && (targetEntity === 'all_relevant_labs' || requiresMultipleResults)) {
      intent = 'personal_lab_analysis';
      rewrittenQuery = 'Analyze all available patient laboratory test results to evaluate normal or low metrics';
      expandedTermsSet.add('hemoglobin');
      expandedTermsSet.add('ferritin');
      expandedTermsSet.add('laboratory');
    } else if (targetEntity === 'medication_adherence') {
      intent = 'personal_adherence_inquiry';
      rewrittenQuery = 'Evaluate patient medication adherence rate and compliance guidance';
      expandedTermsSet.add('adherence');
      expandedTermsSet.add('compliance');
      expandedTermsSet.add('oral iron');
    } else if (targetEntity === 'medications_list') {
      intent = 'personal_meds_inquiry';
      rewrittenQuery = 'Retrieve current patient active medications, dosages, and intake instructions';
      expandedTermsSet.add('medication');
      expandedTermsSet.add('dosing');
    } else if (
      rawLower.includes('تحسنت') || rawLower.includes('تطوري') || rawLower.includes('تقدمي') || 
      rawLower.includes('هل تحسنت') || rawLower.includes('improved') || rawLower.includes('better') || rawLower.includes('progress')
    ) {
      intent = 'progress_evaluation';
      rewrittenQuery = 'Compare recent test measurements with historical baseline to evaluate health progress';
      expandedTermsSet.add('progress');
      expandedTermsSet.add('improvement');
    } else if (
      rawLower.includes('وضع الدم') || rawLower.includes('وضع الحديد') || rawLower.includes('وش وضعي') || 
      rawLower.includes('كيف حالتي') || rawLower.includes('overall health') || rawLower.includes('my status')
    ) {
      intent = 'overall_health_status';
      rewrittenQuery = 'Retrieve overall patient blood health status, lab metrics, and adherence summary';
    } else if (
      rawLower.includes('جدول') || rawLower.includes('طريقة أخذ') || rawLower.includes('طريقة تناول') || 
      rawLower.includes('متى أخذ') || rawLower.includes('جرعة') || rawLower.includes('dosing') || rawLower.includes('how to take')
    ) {
      intent = 'treatment_inquiry';
      rewrittenQuery = 'Retrieve clinical instructions for oral iron supplement dosing schedule and absorption';
      expandedTermsSet.add('dosing');
      expandedTermsSet.add('oral iron');
    } else if (tokens.some(t => ['اعراض', 'أعراض', 'شعور', 'تعب', 'دوار', 'symptoms', 'signs', 'fatigue'].includes(t))) {
      intent = 'symptom_inquiry';
      rewrittenQuery = 'Retrieve clinical symptoms associated with iron deficiency anemia';
      expandedTermsSet.add('symptoms');
      expandedTermsSet.add('anemia');
    }

    return {
      originalQuery: query,
      normalizedQuery: normalizedCurrent,
      rewrittenQuery,
      intent,
      targetEntity,
      targetTerm,
      requiresPersonalData,
      requiresTimeSeries,
      requiresMultipleResults,
      detectedTopics: Array.from(new Set(detectedTopics)),
      numericalValues,
      detectedDescriptors: Array.from(new Set(detectedDescriptors)),
      expandedTerms: Array.from(expandedTermsSet),
      isPromptInjection
    };
  },

  search(query: string, limit = 5, historyContext = ''): SourceChunk[] {
    if (!query || typeof query !== 'string' || !query.trim()) return [];

    const analysis = this.analyzeQuery(query, historyContext);

    if (analysis.isPromptInjection) {
      console.warn('[Security Guardrail] Prompt injection attempt detected. File-Only policy enforced.');
      return [];
    }

    const searchTerms = analysis.expandedTerms;
    if (searchTerms.length === 0) return [];

    const scoredChunks: SourceChunk[] = (sources as SourceChunk[]).map(chunk => {
      let score = 0;
      const contentLower = chunk.content.toLowerCase();
      const sectionLower = chunk.section.toLowerCase();
      const fileLower = chunk.fileName.toLowerCase();

      // METADATA & ENTITY FILTERING BEFORE SEMANTIC SEARCH
      if (analysis.targetEntity === 'hemoglobin') {
        const isHbChunk = contentLower.includes('hemoglobin') || contentLower.includes('haemoglobin') || contentLower.includes('hb');
        const isPureFerritinSection = sectionLower.includes('ferritin') && !sectionLower.includes('hemoglobin');

        if (!isHbChunk || isPureFerritinSection) {
          score -= 500;
        } else {
          score += 100;
        }
      } else if (analysis.targetEntity === 'ferritin') {
        const isFerChunk = contentLower.includes('ferritin') || sectionLower.includes('ferritin');
        const isPureHbSection = (sectionLower.includes('hemoglobin') || sectionLower.includes('hb')) && !sectionLower.includes('ferritin');

        if (!isFerChunk || isPureHbSection) {
          score -= 500;
        } else {
          score += 100;
        }
      }

      // Term frequency matching
      searchTerms.forEach(term => {
        if (!term || term.length < 2) return;
        const regex = new RegExp(escapeRegExp(term), 'gi');

        const contentMatches = (contentLower.match(regex) || []).length;
        score += contentMatches * 2.5;

        if (sectionLower.includes(term)) {
          score += 12;
        }

        if (fileLower.includes(term)) {
          score += 8;
        }
      });

      // Target term boost for medical definition queries
      if (analysis.targetTerm) {
        const target = analysis.targetTerm;
        if (contentLower.includes(target)) score += 25;
        if (sectionLower.includes(target)) score += 35;
      }

      return {
        ...chunk,
        score
      };
    });

    const reranked = scoredChunks
      .filter(c => (c.score || 0) > 5)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, limit);

    return reranked;
  }
};

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F]/g, '') // remove tashkeel
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^\w\s\u0600-\u06FF]/g, ' ');
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
