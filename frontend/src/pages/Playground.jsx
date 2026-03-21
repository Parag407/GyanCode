import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Play, Loader2, Terminal, Code2, RotateCcw, Copy, Check, ArrowLeft, BookOpen, ChevronDown, ChevronUp, Trophy, Tag, Send, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const LANG_MAP = {
  Python: 'python',
  JavaScript: 'javascript',
  Java: 'java',
  C: 'c',
  'C++': 'cpp',
};

const LANGUAGES = [
  { value: 'python',     label: 'Python',     icon: '🐍', default: '# Python Playground\nprint("Hello, World!")' },
  { value: 'javascript', label: 'JavaScript', icon: '⚡', default: '// JavaScript Playground\nconsole.log("Hello, World!");' },
  { value: 'c',          label: 'C',          icon: '🔧', default: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!");\n    return 0;\n}' },
  { value: 'cpp',        label: 'C++',        icon: '⚙️', default: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!";\n    return 0;\n}' },
  { value: 'java',       label: 'Java',       icon: '☕', default: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}' },
];

const DIFF_COLOR = {
  Beginner:     'text-emerald-400 bg-emerald-500/10',
  Intermediate: 'text-amber-400 bg-amber-500/10',
  Advanced:     'text-red-400 bg-red-500/10',
};

export default function Playground() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(LANGUAGES[0].default);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [showProblem, setShowProblem] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    const problemId = searchParams.get('problem');
    if (problemId) {
      const fetchProblem = async () => {
        setLoading(true);
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;
          const res = await fetch(`${import.meta.env.VITE_API_URL}/assignments/${problemId}`, {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          });
          const data = await res.json();
          if (isMounted && data && !data.error) {
            setProblem(data);
            const langValue = LANG_MAP[data.language] || 'python';
            setLanguage(langValue);
            setCode(data.starter_code || LANGUAGES.find(l => l.value === langValue)?.default || '');
            setShowProblem(true);
          }
        } catch (err) {
          console.error("Failed to fetch problem:", err);
        } finally {
          if (isMounted) setLoading(false);
        }
      };
      fetchProblem();
    } else {
      setProblem(null);
    }
  }, [searchParams, isMounted]);

  // If no problem param, change language resets code
  const handleLanguageChange = (lang) => {
    if (searchParams.get('problem')) return; // Don't reset when a problem is being loaded or present
    setLanguage(lang);
    const langDef = LANGUAGES.find(l => l.value === lang);
    setCode(langDef?.default || '');
    setOutput('');
  };

  const handleReset = () => {
    if (problem) {
      setCode(problem.boilerplate || '');
    } else {
      setCode(LANGUAGES.find(l => l.value === language)?.default || '');
    }
    setOutput('');
  };

  const handleRun = async () => {
    setRunning(true);
    setOutput('Executing...');
    setTestResults([]);
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, input }),
      });
      const data = await response.json();
      setOutput(data.output || data.error || 'No output');
    } catch {
      setOutput('Error: Could not connect to execution server.');
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!problem) return;
    setSubmitting(true);
    setOutput('Checking against test cases...');
    setTestResults([]);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(import.meta.env.VITE_API_URL + '/execute', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ code, language, assignment_id: problem.id }),
      });
      const data = await response.json();
      if (data.multi) {
        setTestResults(data.results);
        const allPassed = data.results.every(r => r.passed);
        setOutput(allPassed ? '✅ All test cases passed!' : `❌ ${data.results.filter(r => !r.passed).length}/${data.results.length} test case(s) failed.`);
        if (allPassed) setShowCelebration(true);
      } else {
        setOutput(data.output || data.error || 'Execution failed.');
      }
    } catch {
      setOutput('Error: Could not connect to execution server.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] lg:h-[calc(100vh-80px)] flex flex-col gap-4 animate-fade-in mb-8 lg:mb-0">
      {/* Toolbar */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="p-2.5 hover:bg-white/5 rounded-xl text-gray-500 hover:text-white transition-all flex items-center gap-2 text-xs font-bold">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="flex items-center gap-2">
            <Code2 size={20} className="text-primary-light" />
            <h1 className="text-xl font-black">
              {problem ? problem.title : 'Code Playground'}
            </h1>
          </div>
          {!problem && (
            <span className="text-xs text-gray-500">— Free sandbox, no login required</span>
          )}
          {problem && (
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${DIFF_COLOR[problem.proficiency_level] || 'text-gray-400 bg-white/5'}`}>
                {problem.proficiency_level}
              </span>
              <span className="text-xs font-bold bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-lg flex items-center gap-1">
                <Trophy size={10} /> {problem.points} pts
              </span>
              {problem.category && (
                <span className="text-xs font-bold bg-white/5 text-gray-400 px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <Tag size={10} /> {problem.category}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 justify-start sm:justify-end mt-4 md:mt-0">
          {problem && (
            <button onClick={() => setShowProblem(v => !v)}
              className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-2 rounded-xl text-xs font-bold hover:bg-white/10 transition-all">
              <BookOpen size={14} />
              {showProblem ? 'Hide' : 'Show'} Problem
              {showProblem ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
          <button onClick={handleCopy}
            className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-2 rounded-xl text-xs font-bold hover:bg-white/10 transition-all">
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button onClick={handleReset}
            className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-2 rounded-xl text-xs font-bold hover:bg-white/10 transition-all">
            <RotateCcw size={14} /> Reset
          </button>
          <button onClick={() => setShowInput(!showInput)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${showInput ? 'bg-primary/10 border-primary/30 text-primary-light' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
            <Terminal size={14} /> Stdin
          </button>
          <button onClick={handleRun} disabled={running || submitting}
            className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 sm:px-5 py-2 rounded-xl text-sm font-bold hover:bg-white/10 transition-all disabled:opacity-50">
            {running ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
            <span className="hidden sm:inline">{running ? 'Running...' : 'Run'}</span>
          </button>
          <button onClick={handleSubmit} disabled={submitting || running || !problem}
            className="btn-primary flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
            title={!problem ? 'Load a problem to submit' : 'Submit against all test cases'}>
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            <span className="hidden sm:inline">{submitting ? 'Checking...' : 'Submit'}</span>
          </button>
        </div>
      </div>

      {/* Problem description panel (collapsible) */}
      {problem && showProblem && (
        <div className="glass-card rounded-2xl p-5 space-y-4 animate-fade-in border border-white/5">
          <p className="text-gray-300 leading-relaxed text-sm">{problem.description}</p>
          {problem.test_cases?.filter(tc => !tc.is_hidden).length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">Public Test Cases</p>
              <div className="grid gap-2">
                {problem.test_cases.filter(tc => !tc.is_hidden).map((tc, i) => (
                  <div key={i} className="grid grid-cols-2 gap-3 bg-black/20 rounded-xl p-3 text-xs font-mono">
                    <div>
                      <span className="text-[9px] font-bold text-gray-600 uppercase block mb-1">Input</span>
                      <span className="text-emerald-300">{tc.input || '(none)'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-600 uppercase block mb-1">Expected Output</span>
                      <span className="text-primary-light">{tc.output}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Language Tabs (hide when problem loaded — language is fixed) */}
      {!problem && (
        <div className="flex gap-1.5 bg-white/[0.03] p-1.5 rounded-xl w-fit">
          {LANGUAGES.map(l => (
            <button key={l.value} onClick={() => handleLanguageChange(l.value)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                language === l.value ? 'bg-primary/20 text-primary-light shadow-sm' : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}>
              <span>{l.icon}</span> {l.label}
            </button>
          ))}
        </div>
      )}

      {/* Language indicator when problem loaded */}
      {problem && (
        <div className="flex gap-1.5 bg-white/[0.03] p-1.5 rounded-xl w-fit">
          <div className="px-4 py-2 rounded-lg text-xs font-bold bg-primary/20 text-primary-light flex items-center gap-1.5">
            <span>{LANGUAGES.find(l => l.value === language)?.icon}</span>
            {LANGUAGES.find(l => l.value === language)?.label || problem.language}
          </div>
        </div>
      )}

      {/* Editor + Output */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden mb-8 lg:mb-0">
        <div className="flex flex-col gap-3 overflow-hidden">
          <div className="flex-1 min-h-[400px] lg:min-h-0 rounded-2xl border border-white/[0.06] overflow-hidden bg-[#1e1e1e] shadow-xl shadow-black/20">
            <Editor
              height="100%"
              theme="vs-dark"
              language={language === 'cpp' ? 'cpp' : language === 'c' ? 'c' : language}
              value={code}
              onChange={(v) => setCode(v)}
              options={{
                fontSize: 14, fontFamily: "'JetBrains Mono', monospace",
                minimap: { enabled: false }, scrollBeyondLastLine: false,
                padding: { top: 16 }, smoothScrolling: true,
                cursorSmoothCaretAnimation: 'on',
                bracketPairColorization: { enabled: true },
              }}
            />
          </div>
          {showInput && (
            <div className="glass-card rounded-xl p-4 animate-fade-in">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Terminal size={12} /> Standard Input
              </p>
              <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm font-mono text-white placeholder-gray-600 resize-none focus:bg-white/[0.07] transition-all"
                placeholder="Enter input values here..." />
            </div>
          )}
        </div>

        <div className="glass-card rounded-2xl flex flex-col overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Terminal size={14} /> Output
            </span>
            {output && output !== 'Executing...' && testResults.length === 0 && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                output.toLowerCase().includes('error') || output.startsWith('❌') ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
              }`}>
                {output.toLowerCase().includes('error') || output.startsWith('❌') ? 'FAILED' : 'SUCCESS'}
              </span>
            )}
          </div>
          <div className="flex-1 p-5 font-mono text-sm overflow-y-auto whitespace-pre-wrap text-gray-300 leading-relaxed space-y-3">
            {testResults.length > 0 ? (
              <div className="space-y-3">
                <p className={`text-sm font-bold ${output.startsWith('✅') ? 'text-emerald-400' : 'text-red-400'}`}>{output}</p>
                {testResults.map((r, i) => (
                  <div key={i} className={`rounded-xl border p-3 space-y-2 text-xs ${
                    r.passed ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'
                  }`}>
                    <div className={`flex items-center gap-1.5 font-bold ${ r.passed ? 'text-emerald-400' : 'text-red-400' }`}>
                      {r.passed ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      Test Case {i + 1} — {r.passed ? 'Passed' : 'Failed'}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div><p className="text-[9px] text-gray-600 uppercase font-bold mb-1">Input</p><p className="text-gray-300">{r.input || '(none)'}</p></div>
                      <div><p className="text-[9px] text-gray-600 uppercase font-bold mb-1">Expected</p><p className="text-emerald-300">{r.expected}</p></div>
                      <div><p className="text-[9px] text-gray-600 uppercase font-bold mb-1">Got</p><p className={r.passed ? 'text-emerald-300' : 'text-red-300'}>{r.actual}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              output || <span className="text-gray-600 italic">Click "Run" to execute or "Submit" to check against test cases...</span>
            )}
          </div>
        </div>
      </div>

      {/* 🎉 Celebration Modal */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in" onClick={() => setShowCelebration(false)} />
          
          {/* Confetti */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(30)].map((_, i) => (
              <div key={i} className="absolute animate-float-up" style={{
                left: `${Math.random() * 100}%`,
                bottom: `-10%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
                fontSize: `${16 + Math.random() * 20}px`,
                opacity: 0.6
              }}>
                {['🎉', '✨', '⭐', '🏆', '🌟'][i % 5]}
              </div>
            ))}
          </div>

          <div className="relative glass-card rounded-[2rem] p-4 sm:p-8 md:p-12 max-w-sm w-full text-center space-y-6 animate-fade-in-up border-primary/30 shadow-2xl shadow-primary/20" 
               onClick={e => e.stopPropagation()}>
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-primary/30 rotate-12">
              <Trophy size={40} className="text-white" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Problem Solved!</h2>
              <p className="text-gray-400 text-sm">Excellent work! You've passed all test cases for this problem.</p>
            </div>
            <button onClick={() => setShowCelebration(false)}
              className="w-full btn-primary px-4 sm:px-6 py-3 rounded-xl font-bold text-white shadow-lg shadow-primary/20 transition-all">
              Great, Continue!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
