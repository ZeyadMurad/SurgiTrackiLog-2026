import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Sparkles, Send, ShieldAlert, BookOpen, Languages, FileText, Zap } from 'lucide-react';
import { SupportedLanguage } from '../types';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: SupportedLanguage;
}

interface AiStatus {
  provider: 'gemini' | 'pollinations-free';
  geminiActive: boolean;
  fastModel: string;
  proModel: string;
  message?: string;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ isOpen, onClose, language }) => {
  const [promptText, setPromptText] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; timestamp: string }>>([
    {
      sender: 'ai',
      text: language === 'ar'
        ? 'مرحباً دكتور. أنا المساعد الجراحي الذكي من SurgiTrack. يمكنني مساعدتك في المصطلحات الجراحية الدقيقة، والصياغة الأكاديمية بالإنجليزية والألمانية، وتنسيق القوالب الطبية العامة. يُرجى عدم إدخال أي بيانات للمرضى.'
        : language === 'de'
        ? 'Willkommen, Herr Kollege. Ich bin Ihr chirurgischer KI-Assistent für Fachterminologie (WBO), akademisches Englisch/Deutsch und neutrale Dokumentationsvorlagen. Bitte geben Sie keine Patientendaten ein.'
        : 'Welcome, Doctor. I am your SurgiTrack Surgical Education & Terminology Assistant. I can assist with international surgical phrasing, German medical terminology (Weiterbildungsordnung), and blank documentation structures. Please do not input identifying patient data.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'Terminology' | 'German WBO' | 'Grammar' | 'Template'>('Terminology');
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Fetch AI provider status when modal opens (lightweight, no auth)
  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/ai-status')
      .then(r => r.json())
      .then(d => setAiStatus(d))
      .catch(() => setAiStatus(null));
  }, [isOpen]);

  // Auto-scroll to bottom on new messages / streaming tokens
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  if (!isOpen) return null;

  const quickPrompts = [
    { label: 'German WBO Phrasing', text: 'How do I document "vascular clamp application and arteriotomy under direct supervision" according to German hospital Weiterbildungsordnung?' },
    { label: 'Operative Summary Phrasing', text: 'Provide formal academic surgical phrasing for documenting uneventful revascularization and palpable distal pulses.' },
    { label: 'Blank Laparotomy Template', text: 'Provide a structured blank operative report template for exploratory laparotomy.' },
    { label: 'Refine Clinical English', text: 'Refine the grammar of: "Patient was discharged with no wound complication and patent bypass graft."' },
  ];

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || promptText;
    if (!text.trim() || loading) return;

    const userMsg = {
      sender: 'user' as const,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg, {
      sender: 'ai' as const,
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
    setPromptText('');
    setLoading(true);

    // AbortController for graceful cancellation if user closes modal mid-stream
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/gemini/assistant/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          contextType: activeCategory,
          language,
        }),
        signal: controller.signal,
      });

      if (!res.body) {
        // Fallback to non-streaming endpoint
        const fb = await fetch('/api/gemini/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, contextType: activeCategory, language }),
        });
        const fbData = await fb.json();
        if (!fb.ok) throw new Error(fbData.error || 'Server error');
        setMessages(prev => {
          const next = [...prev];
          next[next.length - 1] = { ...next[next.length - 1], text: fbData.reply };
          return next;
        });
        return;
      }

      // Server-Sent Events parser
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let acc = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE messages are separated by \n\n
        const events = buffer.split('\n\n');
        buffer = events.pop() || ''; // keep partial remainder

        for (const evtRaw of events) {
          const lines = evtRaw.split('\n');
          let evtType = '';
          let evtData = '';
          for (const ln of lines) {
            if (ln.startsWith('event:')) evtType = ln.slice(6).trim();
            else if (ln.startsWith('data:')) evtData += ln.slice(5).trim();
          }
          if (!evtData) continue;
          try {
            const parsed = JSON.parse(evtData);
            if (evtType === 'token' && parsed.text) {
              acc += parsed.text;
              setMessages(prev => {
                const next = [...prev];
                next[next.length - 1] = { ...next[next.length - 1], text: acc };
                return next;
              });
            } else if (evtType === 'error') {
              throw new Error(parsed.message || 'AI streaming error');
            }
            // 'meta' and 'done' events are informational — could be used to show
            // provider/model badges per message if desired.
          } catch {
            /* ignore malformed chunk */
          }
        }
      }

      if (!acc) {
        setMessages(prev => {
          const next = [...prev];
          next[next.length - 1] = {
            ...next[next.length - 1],
            text: '(empty response — please try again)',
          };
          return next;
        });
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = {
          ...next[next.length - 1],
          text: `Error: ${err.message}. Please check your connection or try again.`,
        };
        return next;
      });
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const geminiBadgeLabel = aiStatus?.geminiActive
    ? (aiStatus.fastModel?.startsWith('gemini-4') ? 'Gemini 4' : aiStatus.fastModel?.startsWith('gemini-3') ? `Gemini ${aiStatus.fastModel.split('-')[1] || '3'}` : 'Gemini')
    : 'Free Tier';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl flex flex-col h-[640px] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-[#101C32] text-white px-5 py-4 flex items-center justify-between border-b border-teal-500/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight flex items-center gap-2">
                SurgiTrack AI Medical Assistant
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase flex items-center gap-1 ${
                    aiStatus?.geminiActive
                      ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40'
                      : 'bg-amber-500/30 text-amber-200 border border-amber-400/40'
                  }`}
                  title={aiStatus?.message}
                >
                  {aiStatus?.geminiActive && <Zap size={9} />}
                  {geminiBadgeLabel}
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Surgical Terminology, German WBO Equivalencies & Professional Phrasing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Privacy Guard Notice (Section 17 requirement) */}
        <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2 flex items-start gap-2 text-[11px] text-amber-900 leading-snug">
          <ShieldAlert size={14} className="text-amber-700 shrink-0 mt-0.5" />
          <span>
            <strong>Strict Medical Privacy Policy:</strong> Do not transmit patient names, identification numbers, or identifiable medical photos. This assistant is strictly for general terminology, template structures, and professional grammar.
          </span>
        </div>

        {/* Quick Topics */}
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-200 overflow-x-auto text-xs">
          <span className="text-slate-400 font-medium text-[11px] shrink-0">Focus:</span>
          {(['Terminology', 'German WBO', 'Grammar', 'Template'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                activeCategory === cat
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Messages Body */}
        <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F8FAFC]">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed shadow-xs ${
                  m.sender === 'user'
                    ? 'bg-[#101C32] text-white rounded-br-xs'
                    : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                }`}
              >
                {m.text}
                {loading && m.sender === 'ai' && idx === messages.length - 1 && (
                  <span className="inline-block w-2 h-4 ml-1 bg-teal-500 animate-pulse align-middle" />
                )}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1">{m.timestamp}</span>
            </div>
          ))}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q.text)}
              className="text-[11px] bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap transition cursor-pointer"
            >
              + {q.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask surgical terminology, WBO German equivalents, or template questions..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !promptText.trim()}
            className="bg-[#0D9488] hover:bg-teal-700 disabled:opacity-40 text-white p-2.5 rounded-xl transition shadow-xs flex items-center justify-center cursor-pointer"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
