import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Bot, Send, User, Sparkles, Code2, Loader2, Trash2, ArrowLeft, Lightbulb } from 'lucide-react';

const STORAGE_KEY = 'gyanbot_chat_history';
const MAX_CHARS = 500;

const STARTER_PROMPTS = [
  { icon: '🐛', label: 'Debug my code', prompt: 'Help me debug this code. What might be causing an issue?' },
  { icon: '💡', label: 'Explain a concept', prompt: 'Can you explain recursion with a simple example?' },
  { icon: '⚡', label: 'Optimize code', prompt: 'How can I make my code more efficient and faster?' },
  { icon: '📚', label: 'Best practices', prompt: 'What are the best practices for writing clean, readable code?' },
  { icon: '🔄', label: 'Compare approaches', prompt: 'What is the difference between a stack and a queue?' },
  { icon: '🎯', label: 'Practice problem', prompt: 'Give me a beginner-level coding challenge to practice with.' },
];

const INITIAL_MESSAGE = { role: 'bot', text: "Hey there! 👋 I'm **GyanBot**, your AI coding tutor powered by Google Gemini.\n\nAsk me anything about programming — concepts, debugging help, code explanations, or best practices!" };

export default function AiTutor() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [INITIAL_MESSAGE];
    } catch { return [INITIAL_MESSAGE]; }
  });
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Persist chat to localStorage whenever messages change
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch {}
  }, [messages]);

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (overrideText) => {
    const userMsg = (overrideText || input).trim();
    if (!userMsg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted.current) return;
      const response = await fetch(import.meta.env.VITE_API_URL + '/ai-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ message: userMsg, language }),
      });
      if (!isMounted.current) return;
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'bot', text: data.reply }]);
    } catch {
      if (isMounted.current) {
        setMessages(prev => [...prev, { role: 'bot', text: "Sorry, I couldn't connect. Please try again! 🤖" }]);
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const clearChat = () => {
    setMessages([INITIAL_MESSAGE]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  const formatMessage = (text) => {
    return text
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        return `<div class="relative group my-4"><button type="button" class="copy-btn absolute top-2 right-2 p-1.5 rounded-lg bg-white/10 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20 text-gray-400 hover:text-white" title="Copy code"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button><pre class="bg-black/40 rounded-xl p-4 text-sm font-mono overflow-x-auto text-emerald-300"><code>${code}</code></pre></div>`;
      })
      .replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono text-primary-light">$1</code>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  const handleMessageClick = (e) => {
    const btn = e.target.closest('.copy-btn');
    if (!btn) return;
    const pre = btn.nextElementSibling;
    if (!pre) return;
    
    // innerText properly converts <br/> back to newlines for copying
    const textToCopy = pre.innerText;
    
    const copyIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
    const checkIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

    const doCopy = (text) => {
      if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(text);
      } else {
          const textArea = document.createElement("textarea");
          textArea.value = text;
          textArea.style.position = "absolute";
          textArea.style.left = "-999999px";
          document.body.appendChild(textArea);
          textArea.select();
          try { document.execCommand('copy'); } catch (error) { console.error(error); }
          textArea.remove();
      }
    };
    
    doCopy(textToCopy);
    btn.innerHTML = checkIcon;
    setTimeout(() => { btn.innerHTML = copyIcon; }, 2000);
  };

  const hasOnlyInitial = messages.length === 1;

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-2 mb-4 gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)}
            className="p-2.5 hover:bg-white/5 rounded-xl text-gray-500 hover:text-white transition-all flex items-center gap-2 text-xs font-bold">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black flex items-center gap-2">
                GyanBot <Sparkles size={16} className="text-amber-400" />
              </h1>
              <p className="text-xs text-gray-500">AI Coding Tutor • Powered by Gemini</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select value={language} onChange={(e) => setLanguage(e.target.value)}
            className="flex-1 sm:flex-none bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm text-white appearance-none cursor-pointer focus:bg-white/[0.07] transition-all">
            <option value="" className="bg-card">Any Language</option>
            {['Python', 'JavaScript', 'C', 'C++', 'Java', 'HTML/CSS', 'SQL'].map(l => (
              <option key={l} value={l} className="bg-card">{l}</option>
            ))}
          </select>
          <button onClick={clearChat}
            className="p-2 hover:bg-white/5 rounded-xl text-gray-500 hover:text-red-400 transition-all" title="Clear chat">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''} animate-fade-in`}>
            {msg.role === 'bot' && (
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shrink-0 mt-1">
                <Bot size={16} className="text-white" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-primary/20 border border-primary/30 text-white'
                : 'glass-card'
            }`} onClick={handleMessageClick}>
              <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }} />
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center shrink-0 mt-1">
                <User size={16} className="text-gray-400" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shrink-0">
              <Bot size={16} className="text-white" />
            </div>
            <div className="glass-card rounded-2xl px-5 py-4 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-primary-light" />
              <span className="text-sm text-gray-400">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Starter Prompts – shown only on fresh chat */}
      {hasOnlyInitial && !loading && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mb-2">
            <Lightbulb size={12} className="text-amber-400" /> Try asking…
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {STARTER_PROMPTS.map((sp, i) => (
              <button key={i} onClick={() => handleSend(sp.prompt)}
                className="glass-card rounded-xl p-3 text-left hover:bg-white/[0.06] transition-all group border border-white/5 hover:border-primary/20">
                <span className="text-lg">{sp.icon}</span>
                <p className="text-xs font-semibold text-gray-400 group-hover:text-white transition-colors mt-1">{sp.label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="glass-card rounded-2xl p-3 flex items-end gap-3 mt-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask me anything about coding..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm placeholder-gray-600 resize-none focus:bg-white/[0.07] transition-all max-h-32"
            style={{ height: 'auto', minHeight: '44px' }}
            onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
          />
          {input.length > 0 && (
            <span className={`absolute bottom-2 right-3 text-[10px] font-bold ${input.length >= MAX_CHARS * 0.9 ? 'text-red-400' : 'text-gray-600'}`}>
              {input.length}/{MAX_CHARS}
            </span>
          )}
        </div>
        <button onClick={() => handleSend()} disabled={loading || !input.trim()}
          className="btn-primary p-3 rounded-xl text-white disabled:opacity-50 transition-all shrink-0">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
