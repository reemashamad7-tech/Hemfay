import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { aiService, AiResponse } from '../services/ai/aiService';
import { SourceChunk } from '../services/ai/retrievalService';
import { HemfayLogo } from '../components/HemafyLogo';
import { 
  Send, 
  BookOpen, 
  AlertCircle, 
  Info,
  X,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AiScreen: React.FC = () => {
  const { user, medications, chatMessages, addChatMessage, testRecords, getWeeklyAdherence, t, language } = useStore();
  
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedSource, setSelectedSource] = useState<SourceChunk | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = language === 'ar' ? [
    "ماذا يعني مستوى الهيموجلوبين لدي؟",
    "اشرح لي نتيجة الفيريتين ومخزون الحديد.",
    "عرض التقدم والتطور الأخير لمؤشراتي.",
    "متى موعد الفحص القادم؟",
    "كيف هي نسبة الالتزام بالأدوية؟"
  ] : [
    "What does my hemoglobin level mean?",
    "Explain my ferritin result.",
    "Show me my recent progress.",
    "When is my next test?",
    "How is my medication adherence?"
  ];

  // Auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    addChatMessage('user', text);
    setInputValue('');
    setIsTyping(true);

    // Get current patient context for Patient-Centric RAG
    const latestRecord = testRecords[0];
    const context = {
      userName: user?.name || 'Reemas Hamad',
      hemoglobin: latestRecord?.hemoglobin ?? 14.2,
      ferritin: latestRecord?.ferritin ?? 85,
      testTimestamp: latestRecord?.timestamp || 'Today',
      adherence: getWeeklyAdherence(),
      medications: medications.map(m => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        takenToday: Object.values(m.takenDays || {}).some(Boolean)
      })),
      testHistory: testRecords.map(r => ({
        hemoglobin: r.hemoglobin,
        ferritin: r.ferritin,
        timestamp: r.timestamp
      }))
    };

    try {
      const response: AiResponse = await aiService.ask(text, context, chatMessages);
      addChatMessage('assistant', response.answer, response.citations);
    } catch {
      addChatMessage('assistant', language === 'ar' ? 'واجهت خطأ أثناء معالجة طلبك، يرجى المحاولة مرة أخرى.' : "I encountered an error trying to process your request. Please try again.");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-180px)] md:h-[calc(100dvh-140px)] lg:h-[calc(100dvh-120px)] max-w-3xl mx-auto space-y-4">
      {/* AI Notice Header */}
      <div className="bg-[#FCF4F6] border border-burgundy-soft/40 rounded-primary p-3 flex items-start gap-2.5 shrink-0">
        <Info className="text-burgundy shrink-0 mt-0.5" size={15} />
        <div className="text-[10px] text-text-secondary leading-relaxed">
          <span className="font-bold text-burgundy">{t('groundedAnsweringTitle')}</span> {t('groundedAnsweringDesc')}
        </div>
      </div>

      {/* Messages Thread Container */}
      <div className="flex-1 bg-white border border-burgundy-soft/20 rounded-primary p-4 overflow-y-auto space-y-4 shadow-sm min-h-0">
        <AnimatePresence initial={false}>
          {chatMessages.map((msg) => {
            const isAI = msg.sender === 'assistant';
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 ${isAI ? 'justify-start' : 'justify-end'}`}
              >
                {/* AI Avatar */}
                {isAI && (
                  <div className="w-8 h-8 rounded-full bg-burgundy-light flex items-center justify-center shrink-0 border border-burgundy-soft/10">
                    <HemfayLogo iconOnly size="custom" customSize={20} />
                  </div>
                )}

                {/* Message bubble */}
                <div className="flex flex-col max-w-[80%] space-y-1">
                  <div className={`p-3.5 rounded-primary text-xs leading-relaxed ${
                    isAI 
                      ? 'bg-[#FAFAFA] border border-burgundy-soft/20 text-text-primary ltr:rounded-tl-none rtl:rounded-tr-none' 
                      : 'bg-burgundy text-white ltr:rounded-tr-none rtl:rounded-tl-none'
                  }`}>
                    {/* Render message formatting */}
                    <div className="whitespace-pre-line space-y-1 break-words">
                      {msg.text}
                    </div>
                  </div>

                  {/* Render page citations if available */}
                  {isAI && msg.citations && msg.citations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[9px] font-bold text-text-muted flex items-center gap-1 mt-1 ltr:mr-1 rtl:ml-1">
                        <BookOpen size={10} /> {t('sources')}
                      </span>
                      {msg.citations.map((cite, index) => (
                        <button
                          key={`${cite.sourceId}-${index}`}
                          onClick={() => setSelectedSource(cite)}
                          className="text-[9px] font-bold bg-burgundy-light/60 hover:bg-burgundy-soft text-burgundy px-2 py-0.5 rounded-full border border-burgundy-soft/20 transition-all flex items-center gap-1 cursor-pointer max-w-[150px] sm:max-w-none"
                        >
                          <FileText size={8} className="shrink-0" />
                          <span className="truncate">{t('page')} {cite.pageNumber} ({cite.fileName.split(' ')[0]})</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="text-[8px] font-semibold text-text-muted self-end mt-0.5">
                    {msg.timestamp}
                  </span>
                </div>

                {/* User initials bubble */}
                {!isAI && (
                  <div className="w-8 h-8 rounded-full bg-burgundy text-white font-bold text-xs flex items-center justify-center shrink-0">
                    U
                  </div>
                )}
              </motion.div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3 justify-start"
            >
              <div className="w-8 h-8 rounded-full bg-burgundy-light flex items-center justify-center shrink-0 border border-burgundy-soft/10 animate-pulse">
                <HemafyLogo iconOnly size="custom" customSize={20} />
              </div>
              <div className="bg-[#FAFAFA] border border-burgundy-soft/20 p-4 rounded-primary ltr:rounded-tl-none rtl:rounded-tr-none flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-burgundy/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-burgundy/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-burgundy/60 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts list (render only if chat is at initial state) */}
      {chatMessages.length === 1 && !isTyping && (
        <div className="flex flex-wrap gap-2 py-1 overflow-x-auto shrink-0 justify-center">
          {suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="text-[10px] font-bold text-burgundy bg-burgundy-light/60 hover:bg-burgundy-soft border border-burgundy-soft/40 px-3.5 py-2 rounded-full transition-all cursor-pointer shadow-sm text-center"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Form Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputValue);
        }}
        className="flex gap-2.5 items-center bg-white border border-burgundy-soft/40 p-2.5 rounded-primary shadow-sm shrink-0"
      >
        <input
          type="text"
          placeholder={t('askQuestionPlaceholder')}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isTyping}
          className="flex-1 text-xs py-2 px-3 border border-transparent rounded-primary transition-all disabled:opacity-50 bg-[#FAFAFA]"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isTyping}
          className="p-3 bg-burgundy hover:bg-burgundy-dark text-white rounded-primary transition-colors disabled:opacity-50 disabled:bg-burgundy-soft shrink-0 cursor-pointer flex items-center justify-center"
        >
          <Send size={14} className="rtl:rotate-180" />
        </button>
      </form>

      {/* --- SOURCE DIALOG / MODAL (View Sources details) --- */}
      <AnimatePresence>
        {selectedSource && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-primary max-w-lg w-full max-h-[90vh] flex flex-col border border-burgundy-soft shadow-xl text-start"
            >
              {/* Dialog Header */}
              <div className="flex justify-between items-start border-b border-burgundy-soft/20 p-5 shrink-0">
                <div className="flex items-center gap-2">
                  <BookOpen className="text-burgundy shrink-0" size={18} />
                  <h3 className="text-xs font-black text-text-primary uppercase tracking-wider">{t('sourceGroundingEvidence')}</h3>
                </div>
                <button
                  onClick={() => setSelectedSource(null)}
                  className="p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-burgundy-light transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                {/* Source Details metadata */}
                <div className="grid grid-cols-2 gap-3 text-[11px] bg-burgundy-light/20 border border-burgundy-soft/10 p-3 rounded-primary">
                  <div>
                    <p className="font-bold text-burgundy">{t('documentTitle')}</p>
                    <p className="text-text-secondary mt-0.5 truncate" title={selectedSource.fileName}>{selectedSource.fileName}</p>
                  </div>
                  <div>
                    <p className="font-bold text-burgundy">{t('location')}</p>
                    <p className="text-text-secondary mt-0.5">{t('page')} {selectedSource.pageNumber}, {t('section')}: {selectedSource.section}</p>
                  </div>
                </div>

                {/* Source Excerpt */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{t('verbatimExcerpt')}</p>
                  <div className="bg-[#FAFAFA] border border-burgundy-soft/20 p-4 rounded-primary text-[11px] text-text-secondary leading-relaxed max-h-48 overflow-y-auto font-sans italic">
                    "{selectedSource.content}"
                  </div>
                </div>
              </div>

              {/* Verification disclaimer (Footer) */}
              <div className="p-5 border-t border-burgundy-soft/10 bg-[#FAFAFA] rounded-b-primary shrink-0 flex items-center gap-2 text-[9px] text-text-muted">
                <AlertCircle size={14} className="text-burgundy shrink-0" />
                <span>{t('verifiedCitation')}</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default AiScreen;
