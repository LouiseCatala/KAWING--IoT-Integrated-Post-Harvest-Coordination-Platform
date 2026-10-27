import { useLiveRevision } from '../lib/useLiveRevision';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Loader2, Send, Volume2, X } from 'lucide-react';
import grainyIdle from '../assets/images/grainy-idle.png';
import grainyTalking from '../assets/images/grainy-talking.png';
import grainyEnthusiastic from '../assets/images/grainy-enthusiastic.png';
import grainyThinking from '../assets/images/grainy-thinking.png';
import { buildGrainySystemPrompt } from '../lib/grainyKnowledge';
import { answerGrainyLocally } from '../lib/grainyHelp';
import { UserAccount } from '../types';
import { FAQ_DATA, FaqItem } from '../data/faqs';
import { useApp } from '../context/AppContext';
import { GRAINY_PEEK_DURATION, GRAINY_PEEK_GREETING, startGrainyPeeking } from '../lib/grainyPeeking';

type GrainyStage = 'hidden' | 'peeking' | 'open';
type GrainyMessage = { id: string; sender: 'user' | 'grainy'; text: string; audioUrl?: string; source?: 'faq' | 'ai' | 'local' };

const cleanAiReply = (answer: string) => answer
  .replace(/```[\s\S]*?```/g, block => block.replace(/```[^\n]*\n?/g, '').replace(/```/g, ''))
  .replace(/^#{1,6}\s+/gm, '')
  .replace(/\*\*(.*?)\*\*/g, '$1')
  .replace(/__(.*?)__/g, '$1')
  .replace(/^\s*[-*]\s+/gm, '• ')
  .replace(/\*(.*?)\*/g, '$1')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

export default function GrainyAssistant({ user }: { user: UserAccount }) {
  const { lang, grainyScreen } = useApp();
  const liveRevision = useLiveRevision('faqs');
  const [stage, setStage] = useState<GrainyStage>('hidden');
  const [peekText, setPeekText] = useState('');
  const reducedMotion = useReducedMotion();
  const chatIsOpen = stage === 'open';
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const welcomeText = 'Hi, I’m Grainy, your KAWING AI assistant. How can I help you today?';
  const welcomeAudioUrl = '/audio/grainy-introduction.mp3';
  const [messages, setMessages] = useState<GrainyMessage[]>([]);
  const [faqItems, setFaqItems] = useState<FaqItem[]>(FAQ_DATA);
  const explanationTimer = useRef<number | null>(null);
  useEffect(() => { let cancelled = false;
    fetch('/api/faqs').then(async response => {
      if (!response.ok) return;
      const result = await response.json(); if (cancelled) return;
      if (Array.isArray(result.faqs) && result.faqs.length > 0) setFaqItems(result.faqs);
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [liveRevision]);
  const fishAudioContext = useRef<AudioContext | null>(null);
  const fishAudioSource = useRef<AudioBufferSourceNode | null>(null);
  const fishAudioUrls = useRef<Set<string>>(new Set());
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatIsOpen) return;
    return startGrainyPeeking(() => setStage('peeking'));
  }, [chatIsOpen]);

  useEffect(() => {
    if (stage !== 'peeking') {
      setPeekText('');
      return;
    }
    let characterCount = 0;
    setPeekText(reducedMotion ? GRAINY_PEEK_GREETING : '');
    const typing = reducedMotion ? undefined : window.setInterval(() => {
      characterCount += 1;
      setPeekText(GRAINY_PEEK_GREETING.slice(0, characterCount));
      if (characterCount >= GRAINY_PEEK_GREETING.length) window.clearInterval(typing);
    }, 45);
    const hide = window.setTimeout(() => setStage(current => current === 'peeking' ? 'hidden' : current), GRAINY_PEEK_DURATION);
    return () => {
      window.clearInterval(typing);
      window.clearTimeout(hide);
    };
  }, [stage, reducedMotion]);

  useEffect(() => {
    if (stage !== 'open') return;
    window.requestAnimationFrame(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }, [messages, loading, stage]);

  useEffect(() => () => {
    if (explanationTimer.current !== null) window.clearTimeout(explanationTimer.current);
    fishAudioSource.current?.stop();
    void fishAudioContext.current?.close();
    fishAudioUrls.current.forEach(url => URL.revokeObjectURL(url));
  }, []);

  const unlockFishAudio = () => {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    const context = fishAudioContext.current ?? new AudioContextClass();
    fishAudioContext.current = context;
    if (context.state === 'suspended') void context.resume();
    return context;
  };

  const generateFishSpeech = async (text: string) => {
    const response = await fetch('/api/grainy/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email: user.email, text }),
    });
    if (!response.ok) {
      let message = 'Fish Audio is unavailable';
      try {
        const payload = await response.json() as { error?: string };
        if (payload.error) message = payload.error;
      } catch {
        // Keep the generic error when the server did not return JSON.
      }
      throw new Error(message);
    }
    const audio = await response.blob();
    if (!audio.type.startsWith('audio/')) throw new Error('Fish Audio returned an invalid response');
    const audioUrl = URL.createObjectURL(audio);
    fishAudioUrls.current.add(audioUrl);
    return audioUrl;
  };

  const playFishAudio = async (audioUrl: string) => {
    const context = unlockFishAudio();
    if (!context) throw new Error('Audio playback is not supported in this browser.');
    if (context.state === 'suspended') await context.resume();
    const encodedAudio = await fetch(audioUrl).then(response => response.arrayBuffer());
    const decodedAudio = await context.decodeAudioData(encodedAudio.slice(0));
    fishAudioSource.current?.stop();
    const source = context.createBufferSource();
    fishAudioSource.current = source;
    source.buffer = decodedAudio;
    source.connect(context.destination);
    source.onended = () => {
      setIsExplaining(false);
      if (fishAudioSource.current === source) fishAudioSource.current = null;
    };
    setIsExplaining(true);
    source.start(0);
  };

  const retryVoice = async (messageId: string, text: string) => {
    unlockFishAudio();
    try {
      const audioUrl = await generateFishSpeech(text);
      setMessages(previous => previous.map(message => message.id === messageId ? { ...message, audioUrl } : message));
      await playFishAudio(audioUrl);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Grainy voice is temporarily unavailable. Please try again.');
    }
  };

  const reveal = () => {
    if (stage !== 'peeking') return;
    unlockFishAudio();
    setStage('open');
    const existingWelcome = messages.find(message => message.id === 'welcome');
    if (existingWelcome?.audioUrl) {
      void playFishAudio(existingWelcome.audioUrl);
      return;
    }
    setMessages(previous => [{ id: 'welcome', sender: 'grainy', text: welcomeText, audioUrl: welcomeAudioUrl }, ...previous.filter(message => message.id !== 'welcome')]);
    window.requestAnimationFrame(() => void playFishAudio(welcomeAudioUrl));
  };

  const close = () => {
    if (explanationTimer.current !== null) window.clearTimeout(explanationTimer.current);
    explanationTimer.current = null;
    fishAudioSource.current?.stop();
    fishAudioSource.current = null;
    setIsExplaining(false);
    setStage('hidden');
  };

  const askAi = async (question: string) => {
    if (!question || loading) return;
    unlockFishAudio();
    if (explanationTimer.current !== null) window.clearTimeout(explanationTimer.current);
    explanationTimer.current = null;
    setIsExplaining(false);
    setMessages(previous => [...previous, { id: `u-${Date.now()}`, sender: 'user', text: question }]);
    setPrompt('');
    setLoading(true);
    let reply = '';
    let fallbackReason = lang === 'en' ? 'The AI connection could not be verified. Showing saved help.' : 'Hindi ma-verify ang AI connection. Naka-save na tulong ang ipinapakita.';
    let selectedModel: 'gemini-3.1-flash-lite' | 'gpt-5-nano' | 'local' = 'local';
    try {
      const usageResponse = await fetch('/api/grainy/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      if (usageResponse.ok) {
        const usage = await usageResponse.json() as { model?: string };
        if (usage.model === 'gemini-3.1-flash-lite' || usage.model === 'gpt-5-nano' || usage.model === 'local') {
          selectedModel = usage.model;
          if (usage.model === 'local') fallbackReason = lang === 'en' ? 'Your daily AI allowance has been reached. Showing saved help.' : 'Naabot na ang daily AI allowance. Naka-save na tulong ang ipinapakita.';
        }
      }
    } catch {
      // Keep local help available when verification or daily routing is unavailable.
    }
    try {
      if (selectedModel === 'local') throw new Error('Daily AI limit reached');
      fallbackReason = lang === 'en' ? 'The AI provider is unavailable or needs authorization. Showing saved help.' : 'Hindi available o kailangan ng authorization ang AI provider. Naka-save na tulong ang ipinapakita.';
      if (!window.puter?.ai?.chat) throw new Error('Puter.js is unavailable');
      const conversation = [
        {
          role: 'system',
          content: buildGrainySystemPrompt(user, lang, faqItems, messages.slice(-4).filter(message => message.sender === 'user').map(message => message.text).concat(question).join(' '), grainyScreen),
        },
        ...messages.filter(message => message.id !== 'welcome' && message.source !== 'local').slice(-16).map(message => ({
          role: message.sender === 'grainy' ? 'assistant' : 'user',
          content: message.text,
        })),
        { role: 'user', content: question },
      ];
      const response = await window.puter.ai.chat(conversation, {
        model: selectedModel,
        temperature: 0.2,
        max_tokens: 1000,
      }) as { message?: { content?: unknown }; text?: unknown } | string;
      const content = typeof response === 'string' ? response : response?.message?.content ?? response?.text;
      reply = typeof content === 'string'
        ? content
        : Array.isArray(content)
          ? content.map(part => typeof part === 'string' ? part : (part as { text?: string })?.text || '').join('').trim()
          : '';
    } catch {
      // Keep product help available without representing it as an AI-generated answer.
    }
    const usedLocalHelp = !reply.trim();
    const finalReply = cleanAiReply(reply.trim() || `${fallbackReason}\n\n${answerGrainyLocally(question, user, lang, faqItems)}`);
    let audioUrl: string | undefined;
    try {
      audioUrl = await generateFishSpeech(finalReply);
    } catch {
      // The permanently free browser voice remains available when Fish Audio is unavailable.
    }
    setMessages(previous => [...previous, { id: `g-${Date.now()}`, sender: 'grainy', text: finalReply, audioUrl, source: usedLocalHelp ? 'local' : 'ai' }]);
    setLoading(false);
    if (audioUrl) window.requestAnimationFrame(() => void playFishAudio(audioUrl));
  };

  const send = (event: FormEvent) => {
    event.preventDefault();
    const question = prompt.trim();
    if (!question || loading) return;
    void askAi(question);
  };

  const answerFaq = (faq: FaqItem) => {
    const question = lang === 'en' ? faq.questionEn : faq.questionTl;
    const answer = lang === 'en' ? faq.answerEn : faq.answerTl;
    setMessages(previous => [
      ...previous,
      { id: `faq-u-${faq.id}-${Date.now()}`, sender: 'user', text: question },
      { id: `faq-g-${faq.id}-${Date.now()}`, sender: 'grainy', text: answer, source: 'faq' },
    ]);
  };

  const isPeeking = stage === 'peeking';
  const panelOpen = stage === 'open';
  const isTalking = stage === 'open';
  const activeGrainyImage = loading ? grainyThinking : isExplaining ? grainyEnthusiastic : grainyTalking;
  const activeGrainyName = loading ? 'thinking' : isExplaining ? 'enthusiastic' : 'talking';
  const activeGrainyAlt = loading
    ? 'Grainy thinking about the question'
    : isExplaining
      ? 'Grainy enthusiastically explaining'
      : 'Grainy talking';
  const activeGrainySize = loading ? 'right-[22%] w-[56%]' : isExplaining ? 'right-[19.5%] w-[61%]' : 'right-0 w-full';


  return (
    <div className="pointer-events-none fixed inset-0 z-[90]" aria-live="polite">
      <AnimatePresence>
        {isPeeking && (
          <motion.button
            key="grainy-peek-greeting"
            type="button"
            onClick={reveal}
            aria-label={`${GRAINY_PEEK_GREETING} Open Grainy assistant`}
            aria-live="off"
            initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-auto absolute bottom-[175px] right-4 z-20 w-[255px] max-w-[calc(100vw-2rem)] rounded-2xl rounded-br-sm border border-emerald-200 bg-white px-6 py-5 text-left text-base font-semibold leading-7 text-emerald-950 shadow-lg cursor-pointer hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-500 dark:border-emerald-700 dark:bg-slate-900 dark:text-emerald-100 dark:hover:bg-slate-800 sm:bottom-[245px] sm:right-10"
          >
            <span className="block min-h-14" aria-hidden="true">
              {peekText}
              {peekText.length < GRAINY_PEEK_GREETING.length && <span className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 bg-emerald-600 dark:bg-emerald-300" />}
            </span>
          </motion.button>
        )}
        {panelOpen && (
          <motion.section
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.97 }}
            className="pointer-events-auto absolute bottom-[180px] right-3 z-20 max-h-[calc(100dvh-195px)] w-[calc(100vw-1.5rem)] max-w-sm overflow-hidden rounded-2xl md:rounded-3xl border border-emerald-700/30 bg-[#fffdf4] shadow-2xl sm:bottom-[310px] sm:right-6"
          >
            <header className="flex items-center justify-between bg-gradient-to-r from-emerald-800 to-emerald-600 px-4 py-3 md:px-5 md:py-4 text-white">
              <div><h2 className="font-extrabold">Grainy KAWING Assistant</h2><p className="text-xs text-emerald-100">Your friendly post-harvest guide</p></div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={close} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20" aria-label="Close Grainy assistant"><X className="h-4 w-4" /></button>
              </div>
            </header>
            <>
                <div className="max-h-52 space-y-3 overflow-y-auto p-4">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-amber-800">{lang === 'en' ? 'Quick KAWING questions' : 'Mabilis na tanong tungkol sa KAWING'}</p>
                    <div className="space-y-1.5">
                      {faqItems.map(faq => (
                        <button key={faq.id} type="button" onClick={() => answerFaq(faq)} className="block w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-left text-xs font-bold leading-4 text-slate-700 transition-colors hover:border-emerald-400 hover:bg-emerald-50">
                          {lang === 'en' ? faq.questionEn : faq.questionTl}
                        </button>
                      ))}
                    </div>
                  </div>
                  {messages.map(message => <div key={message.id} className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.sender === 'user' ? 'ml-auto rounded-br-md bg-emerald-600 text-white' : 'rounded-bl-md border border-emerald-100 bg-white text-slate-700'}`}>
                    {message.sender === 'grainy' && <div className="mb-1 text-[9px] font-black uppercase tracking-wider text-emerald-700">{message.source === 'local' ? 'KAWING Help ? AI unavailable' : message.source === 'faq' ? 'KAWING Help' : 'Grainy AI'}</div>}
                    <div>{message.text}</div>
                    {message.sender === 'grainy' && message.source !== 'faq' && (
                      <button type="button" onClick={() => message.audioUrl ? void playFishAudio(message.audioUrl) : void retryVoice(message.id, message.text)} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100" aria-label={message.audioUrl ? "Replay Grainy's answer" : "Retry Grainy's voice"}>
                        <Volume2 className="h-3.5 w-3.5" /> {message.audioUrl ? 'Replay audio' : 'Retry voice'}
                      </button>
                    )}
                  </div>)}
                  {loading && <div className="flex w-fit items-center gap-2 rounded-2xl bg-white px-4 py-3 text-xs text-emerald-700"><Loader2 className="h-4 w-4 animate-spin" />Grainy is preparing the answer…</div>}
                  <div ref={chatEndRef} aria-hidden="true" />
                </div>
                <form onSubmit={send} className="flex gap-2 border-t border-emerald-100 bg-white p-3">
                  <input value={prompt} onChange={event => setPrompt(event.target.value)} placeholder={lang === 'en' ? 'Type a custom question…' : 'I-type ang iyong tanong…'} className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 caret-emerald-600 outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                  <button type="submit" disabled={!prompt.trim() || loading} className="rounded-xl bg-emerald-600 p-3 text-white disabled:opacity-40" aria-label="Send question"><Send className="h-4 w-4" /></button>
                </form>
              </>
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence>
      {stage !== 'hidden' && <motion.div
        key="grainy-character"
        initial={{ opacity: 0, x: reducedMotion ? 0 : 80 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: reducedMotion ? 0 : 80 }}
        transition={{ duration: reducedMotion ? 0 : 0.35 }}
        className={`absolute z-10 overflow-visible ${isPeeking ? '-bottom-[1px] -right-[89px] h-[201px] w-[270px] sm:-right-[93px] sm:h-[290px] sm:w-[390px]' : 'bottom-1 right-2 h-[275px] w-[270px] sm:-right-19 sm:h-[425px] sm:w-[415px]'} transition-[width,height,bottom,right] duration-300`}
      >
        {isPeeking && (
          <motion.button
            type="button"
            onClick={reveal}
            aria-label="Open Grainy KAWING Assistant"
            style={{ clipPath: 'polygon(51% 4%, 73% 4%, 73% 96%, 61% 96%, 60% 83%, 48% 80%, 48% 73%, 43% 68%, 48% 62%, 47% 49%, 42% 40%, 49% 25%)' }}
            className="pointer-events-auto absolute inset-0 z-10 cursor-pointer"
          />
        )}
        {isTalking ? (
          <motion.img
            key={`grainy-${activeGrainyName}`}
            src={activeGrainyImage}
            alt={activeGrainyAlt}
            className={`absolute bottom-0 h-auto object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.28)] ${activeGrainySize}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
            transition={{ duration: 0.25 }}
          />
        ) : (
          <motion.img
            key="grainy-resting"
            src={grainyIdle}
            alt="Grainy peeking from the corner"
            aria-label="Grainy, the KAWING agricultural assistant"
            className="pointer-events-none absolute bottom-0 right-0 h-auto w-[270px] max-w-none object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.28)] sm:w-[390px]"
            animate={{ y: 0, x: 0, rotate: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.35 }}
          />
        )}
      </motion.div>}
      </AnimatePresence>
    </div>
  );
}
