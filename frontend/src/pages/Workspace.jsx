import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Editor from '@monaco-editor/react';
import { 
  Play, Send, ChevronLeft, Terminal, HelpCircle,
  AlertCircle, CheckCircle2, Loader2, Code2, Trophy,
  Timer, RotateCcw, Copy, Check, Lightbulb, ArrowRight,
  CalendarClock, Hash, Sparkles, Star
} from 'lucide-react';

export default function Workspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [running, setRunning] = useState(false);
  const [hint, setHint] = useState(null);
  const [status, setStatus] = useState('idle');
  const [timer, setTimer] = useState(0);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('output');
  const [customInput, setCustomInput] = useState('');
  const [fontSize, setFontSize] = useState(14);
  const [attemptCount, setAttemptCount] = useState(0);
  const [alreadySolved, setAlreadySolved] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [pastSubmissions, setPastSubmissions] = useState([]);
  const [nextAssignmentId, setNextAssignmentId] = useState(null);
  const [isMounted, setIsMounted] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    const fetchAssignment = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/assignments/${id}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (isMounted) {
        if (data) {
          setAssignment(data);
          const defaults = {
            python: `# ${data.title}\n# ${data.description || 'Write your solution below'}\n\n`,
            javascript: `// ${data.title}\n// ${data.description || 'Write your solution below'}\n\n`,
            cpp: `// ${data.title}\n#include <iostream>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}`,
            c: `// ${data.title}\n#include <stdio.h>\n\nint main() {\n    \n    return 0;\n}`,
            java: `// ${data.title}\npublic class Main {\n    public static void main(String[] args) {\n        \n    }\n}`
          };
          if (data.starter_code) {
            setCode(data.starter_code);
          } else {
            setCode(defaults[data.language.toLowerCase()] || '');
          }

          // Fetch previous attempts
          const { data: { session: s2 } } = await supabase.auth.getSession();
          const subRes = await fetch(import.meta.env.VITE_API_URL + '/submissions', {
            headers: { 'Authorization': `Bearer ${s2.access_token}` }
          });
          const subs = await subRes.json();
          if (Array.isArray(subs)) {
            const mySubs = subs.filter(s => s.assignment_id === id);
            setAttemptCount(mySubs.length);
            setAlreadySolved(mySubs.some(s => s.status === 'Success'));
            setPastSubmissions(mySubs.sort((a,b) => new Date(b.submitted_at) - new Date(a.submitted_at)));
          }

          // Find next assignment
          const allRes = await fetch(import.meta.env.VITE_API_URL + '/assignments', {
            headers: { 'Authorization': `Bearer ${s2.access_token}` }
          });
          const allAssigns = await allRes.json();
          if (Array.isArray(allAssigns)) {
             const currentIndex = allAssigns.findIndex(a => a.id === id);
             if (currentIndex !== -1 && currentIndex < allAssigns.length - 1) {
               setNextAssignmentId(allAssigns[currentIndex + 1].id);
             }
          }
        }
        setLoading(false);
      }
    };
    fetchAssignment();

    // Start timer
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [id]);

  const formatTime = (s) => {
    const mins = Math.floor(s / 60).toString().padStart(2, '0');
    const secs = (s % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          handleSubmit();
        } else {
          handleRun();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, assignment, running, submitting]);

  const handleRun = async () => {
    setRunning(true);
    setStatus('running');
    setOutput('Executing code...');
    setTestResults([]);
    setActiveTab('output');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setOutput('Session expired. Please log in again.');
        setStatus('error');
        return;
      }
      const response = await fetch(import.meta.env.VITE_API_URL + '/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ code, language: assignment.language, input: customInput, assignment_id: id })
      });
      const data = await response.json();
      if (data.multi) {
        setTestResults(data.results);
        const allPassed = data.results.every(r => r.passed);
        setStatus(allPassed ? 'idle' : 'error');
        setOutput(allPassed ? 'All public test cases passed!' : 'Some test cases failed.');
      } else {
        setOutput(data.output || data.error);
        setStatus(data.error ? 'error' : 'idle');
      }
    } catch {
      setOutput('Failed to connect to execution engine.');
      setStatus('error');
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setStatus('running');
    setHint(null);
    setTestResults([]);
    setActiveTab('output');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setOutput('Session expired. Please log in again.');
        setStatus('error');
        return;
      }
      const response = await fetch(import.meta.env.VITE_API_URL + '/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ assignment_id: id, code })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        setOutput(errData.error || `Server error (${response.status}). Please try again.`);
        setStatus('error');
        return;
      }
      const data = await response.json();
      if (data.expired) {
        setOutput('This assignment is past its deadline.');
        setStatus('error');
      } else {
        setTestResults(data.results || []);
        if (data.status === 'Success') {
          setOutput('Success! All test cases passed.');
          setStatus('success');
          setPointsAwarded(data.points_awarded || 0);
          setAttemptCount(data.attempt || attemptCount + 1);
          setAlreadySolved(true);
          clearInterval(timerRef.current);
          if (!alreadySolved) setShowCelebration(true);
        } else {
          setOutput(data.error || 'One or more test cases failed.');
          setStatus('error');
          setAttemptCount(data.attempt || attemptCount + 1);
          if (data.hint) { setHint(data.hint); setActiveTab('hint'); }
        }
        
        // Refresh history
        const { data: { session: s3 } } = await supabase.auth.getSession();
        const subRes = await fetch(import.meta.env.VITE_API_URL + '/submissions', {
          headers: { 'Authorization': `Bearer ${s3.access_token}` }
        });
        const subs = await subRes.json();
        if (Array.isArray(subs)) {
          setPastSubmissions(subs.filter(s => s.assignment_id === id).sort((a,b) => new Date(b.submitted_at) - new Date(a.submitted_at)));
        }
      }
    } catch {
      setOutput('Submission failed. Please check your connection and try again.');
      setStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    if (confirm('Reset your code? This cannot be undone.')) {
      setCode('');
      setOutput('');
      setHint(null);
      setStatus('idle');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div></div>;

  return (
    <div className="min-h-[calc(100vh-80px)] lg:h-[calc(100vh-80px)] flex flex-col gap-3 animate-fade-in mb-8 lg:mb-0">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm px-3 py-2 rounded-xl hover:bg-white/5">
            <ChevronLeft size={16} /> Back
          </button>
          <div className="hidden sm:block border-l border-white/10 pl-4">
            <h2 className="text-sm font-bold truncate max-w-xs">{assignment?.title}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-semibold bg-white/5 text-gray-400 px-2 py-0.5 rounded">{assignment?.language}</span>
              <span className="text-[10px] font-semibold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded flex items-center gap-0.5">
                <Trophy size={8} /> {assignment?.points} pts
              </span>
              {assignment?.proficiency_level && (
                <span className="text-[10px] font-semibold bg-primary/10 text-primary-light px-2 py-0.5 rounded uppercase">{assignment.proficiency_level}</span>
              )}
              {assignment?.category && (
                <span className="text-[10px] font-semibold bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded uppercase">{assignment.category}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Attempt Count */}
          {attemptCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-white/5 px-3 py-2 rounded-lg">
              <Hash size={12} /> Attempt #{attemptCount + 1}
            </span>
          )}
          {/* Timer */}
          <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-white/5 px-3 py-2 rounded-lg font-mono">
            <Timer size={13} /> {formatTime(timer)}
          </span>
          {/* Font Size */}
          <select value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))}
            className="bg-white/5 border border-white/10 rounded-lg py-2 px-2 text-[11px] text-gray-400 appearance-none cursor-pointer">
            {[12, 13, 14, 15, 16, 18].map(s => <option key={s} value={s} className="bg-card">{s}px</option>)}
          </select>
          <button onClick={handleCopy} className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all" title="Copy code">
            {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
          </button>
          <button onClick={handleReset} className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all" title="Reset code">
            <RotateCcw size={15} />
          </button>
          <button onClick={handleRun} disabled={running}
            className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 sm:px-4 py-2 rounded-xl text-sm font-bold hover:bg-white/10 transition-all disabled:opacity-50">
            {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
            <span className="hidden sm:inline">{running ? 'Running...' : 'Run'}</span>
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="btn-primary flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all">
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            <span className="hidden sm:inline">{submitting ? 'Submitting...' : 'Submit'}</span>
          </button>
        </div>
      </div>

      {/* workspace grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 overflow-visible lg:overflow-hidden">
        {/* Left: Problem + Editor */}
        <div className="flex flex-col gap-3 overflow-visible lg:overflow-hidden">
          {/* Problem Description (collapsible) */}
          <details className="glass-card rounded-2xl overflow-hidden shrink-0" open>
            <summary className="p-4 cursor-pointer flex items-center gap-2 text-sm font-bold hover:bg-white/[0.02] transition-colors">
              <Code2 size={16} className="text-primary-light" /> Problem Description
              <span className="ml-auto text-[11px] font-bold bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                <Trophy size={10} /> {assignment?.points} pts
              </span>
            </summary>
            <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-3">
              <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">{assignment?.description || 'Solve this challenge.'}</p>
              
              {assignment?.test_cases?.filter(tc => !tc.is_hidden).length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Public Test Cases</p>
                  <div className="space-y-2">
                    {assignment.test_cases.filter(tc => !tc.is_hidden).map((tc, idx) => (
                      <div key={idx} className="bg-white/[0.03] rounded-xl border border-white/5 overflow-hidden">
                        <div className="grid grid-cols-2 text-[10px] uppercase font-bold text-gray-500 border-b border-white/5">
                          <div className="p-2 border-r border-white/5">Input</div>
                          <div className="p-2">Expected</div>
                        </div>
                        <div className="grid grid-cols-2 font-mono text-xs">
                          <div className="p-3 bg-black/20 border-r border-white/5 text-gray-300 whitespace-pre-wrap">{tc.input || '(none)'}</div>
                          <div className="p-3 bg-emerald-500/5 text-emerald-400 whitespace-pre-wrap">{tc.output}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </details>

          {/* Editor */}
          <div className="flex-1 min-h-[400px] lg:min-h-0 rounded-2xl border border-white/[0.06] overflow-hidden bg-[#1e1e1e] shadow-xl shadow-black/20">
            <Editor
              height="100%"
              theme="vs-dark"
              language={assignment?.language.toLowerCase() === 'cpp' ? 'cpp' : assignment?.language.toLowerCase()}
              value={code}
              onChange={(value) => setCode(value)}
              options={{
                fontSize, fontFamily: "'JetBrains Mono', monospace",
                minimap: { enabled: false }, scrollBeyondLastLine: false,
                padding: { top: 16 }, smoothScrolling: true,
                cursorSmoothCaretAnimation: 'on',
                bracketPairColorization: { enabled: true },
                wordWrap: 'on',
              }}
            />
          </div>
        </div>

        {/* Right: Tabs (Output / Custom Input / Hint) */}
        <div className="flex flex-col gap-3 overflow-visible lg:overflow-hidden mt-4 lg:mt-0">
          {/* Tab Headers */}
          <div className="flex flex-wrap gap-1 bg-white/[0.03] p-1 rounded-xl w-fit shrink-0">
            {[
              { key: 'output', label: 'Output', icon: <Terminal size={13} /> },
              { key: 'input', label: 'Custom Input', icon: <Code2 size={13} /> },
              { key: 'history', label: 'History', icon: <CalendarClock size={13} /> },
              ...(hint ? [{ key: 'hint', label: 'AI Hint', icon: <Lightbulb size={13} /> }] : []),
            ].map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === t.key ? 'bg-primary/20 text-primary-light' : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 min-h-[400px] lg:min-h-0 glass-card rounded-2xl flex flex-col overflow-hidden">
            {activeTab === 'output' && (
              <>
                <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between shrink-0">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal size={14} /> Console & Test Results
                  </span>
                  {status !== 'idle' && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      status === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                      status === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-gray-500'
                    }`}>
                      {status === 'success' ? 'ALL PASSED' : status === 'error' ? 'FAILED' : 'RUNNING'}
                    </span>
                  )}
                </div>
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 p-5 font-mono text-sm overflow-y-auto whitespace-pre-wrap text-gray-300 leading-relaxed bg-black/10">
                    {output || <span className="text-gray-600 italic">Click "Run" to test with public cases or "Submit" for final evaluation...</span>}
                  </div>
                  
                  {testResults.length > 0 && (
                    <div className="h-1/2 border-t border-white/10 bg-white/[0.02] flex flex-col overflow-hidden">
                      <div className="px-5 py-2 border-b border-white/5 bg-black/20 flex items-center justify-between shrink-0">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Test Suite Breakdown</span>
                        <div className="flex gap-2">
                          <span className="text-[10px] text-emerald-400 font-bold">{testResults.filter(r => r.passed).length} Passed</span>
                          <span className="text-[10px] text-red-400 font-bold">{testResults.filter(r => !r.passed).length} Failed</span>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {testResults.map((res, i) => (
                          <div key={i} className={`rounded-xl border p-3 space-y-2 transition-all ${res.passed ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-red-500/5 border-red-500/10'}`}>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-gray-500 uppercase">Case #{i + 1} {res.is_hidden && <span className="ml-1 text-[#f59e0b]">(Hidden)</span>}</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${res.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                {res.passed ? 'PASSED' : 'FAILED'}
                              </span>
                            </div>
                            {!res.is_hidden || !res.passed ? (
                              <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                                <div className="space-y-1">
                                  <p className="text-gray-600 uppercase font-bold tracking-widest">Input</p>
                                  <p className="text-gray-400 truncate">{res.input || '(none)'}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-gray-600 uppercase font-bold tracking-widest">Expected</p>
                                  <p className="text-emerald-500/70 truncate">{res.expected}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-gray-600 uppercase font-bold tracking-widest">Actual</p>
                                  <p className={`truncate ${res.passed ? 'text-gray-400' : 'text-red-400'}`}>{res.output}</p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-[10px] text-gray-500 italic">Details hidden for security.</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'input' && (
              <div className="p-5 flex-1 flex flex-col">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Custom Standard Input</p>
                <textarea value={customInput} onChange={(e) => setCustomInput(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-mono text-white placeholder-gray-600 resize-none focus:bg-white/[0.07] transition-all"
                  placeholder="Enter your test input here (used when you click Run)..." />
                <p className="text-[11px] text-gray-600 mt-2">This input is used for "Run" only. Submit always uses the assignment's expected input.</p>
              </div>
            )}

            {activeTab === 'hint' && hint && (
              <div className="p-5 flex-1 overflow-y-auto">
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-5 flex gap-3">
                  <Lightbulb size={20} className="text-primary-light shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-primary-light mb-2">AI Feedback</p>
                    <p className="text-sm text-gray-300 leading-relaxed">{hint}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Feedback Panel */}
          <div className={`p-5 rounded-2xl border transition-all duration-500 shrink-0 ${
            status === 'success' ? 'bg-emerald-500/[0.08] border-emerald-500/25 shadow-lg shadow-emerald-500/5' :
            status === 'error' ? 'bg-red-500/[0.06] border-red-500/20' : 'glass-card'
          }`}>
            <h3 className="font-bold flex items-center gap-2 mb-2 text-sm">
              {status === 'success' ? (
                <><CheckCircle2 className="text-emerald-400" size={18} /> <span className="text-emerald-300">Passed! 🎉</span></>
              ) : status === 'error' ? (
                <><AlertCircle className="text-red-400" size={18} /> <span className="text-red-300">Not quite right</span></>
              ) : (
                <><HelpCircle className="text-primary-light" size={18} /> <span className="text-gray-300">Expected Output</span></>
              )}
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              {status === 'success'
                ? <span>Great job! You earned <b className="text-amber-400">{assignment.points} points</b>. <button onClick={() => navigate('/student/dashboard')} className="text-primary-light hover:underline inline-flex items-center gap-1 ml-1">Next challenge <ArrowRight size={12} /></button></span>
                : status === 'error' && hint
                ? <span>Check the <button onClick={() => setActiveTab('hint')} className="text-primary-light hover:underline font-medium">AI Hint</button> tab for guidance.</span>
                : <code className="text-xs bg-white/5 px-2 py-1 rounded-lg font-mono">{assignment?.expected_output}</code>
              }
            </p>
            {activeTab === 'history' && (
              <div className="space-y-3 h-full overflow-y-auto pr-2 custom-scrollbar">
                {pastSubmissions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                    <CalendarClock size={40} strokeWidth={1} />
                    <p className="text-xs font-bold mt-2 uppercase tracking-widest">No previous attempts</p>
                  </div>
                ) : (
                  pastSubmissions.map((sub, i) => (
                    <div key={sub.id} className="bg-white/[0.03] border border-white/10 rounded-xl p-4 hover:bg-white/5 transition-all group">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${sub.status === 'Success' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          <span className="text-xs font-black uppercase tracking-wider">{sub.status}</span>
                          <span className="text-[10px] text-gray-500 font-bold">• {new Date(sub.submitted_at).toLocaleString()}</span>
                        </div>
                        <button onClick={() => { setCode(sub.code); setActiveTab('output'); setOutput('Restored version from ' + new Date(sub.submitted_at).toLocaleTimeString()); }}
                          className="text-[10px] font-bold text-primary-light hover:text-white uppercase tracking-widest bg-primary/10 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all">
                          Restore Code
                        </button>
                      </div>
                      <pre className="text-[10px] font-mono text-gray-500 line-clamp-2 bg-black/20 p-2 rounded-lg italic">
                        {sub.code.substring(0, 100)}...
                      </pre>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🎉 Enhanced Celebration Modal */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in" onClick={() => setShowCelebration(false)} />
          
          {/* Advanced CSS Confetti */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(40)].map((_, i) => (
              <div key={i} className="absolute animate-float-up" style={{
                left: `${Math.random() * 100}%`,
                bottom: `-10%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
                fontSize: `${16 + Math.random() * 20}px`,
                opacity: 0.6
              }}>
                {['🎉', '🎊', '⭐', '🏆', '✨', '💎', '🌟', '🎯', '🔥'][i % 9]}
              </div>
            ))}
          </div>

          <div className="relative glass-card rounded-[2rem] p-4 sm:p-8 md:p-12 max-w-md w-full text-center space-y-8 animate-fade-in-up border-primary/30 shadow-2xl shadow-primary/20" 
               onClick={e => e.stopPropagation()}>
            
            <div className="relative mx-auto w-24 h-24">
              <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-2xl animate-pulse" />
              <div className="relative bg-gradient-to-br from-primary to-accent rounded-3xl h-full flex items-center justify-center shadow-xl shadow-primary/40 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                <Trophy size={48} className="text-white" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Challenge Complete!</h2>
              <p className="text-gray-400 font-medium">Extraordinary work! You've successfully conquered this challenge.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                 <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Time taken</p>
                 <p className="text-xl font-black text-white flex items-center justify-center gap-2">
                   <Timer size={18} className="text-primary-light" /> {formatTime(timer)}
                 </p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                 <p className="text-[10px] text-amber-500/70 font-bold uppercase tracking-widest mb-1">Points earned</p>
                 <p className="text-xl font-black text-amber-400 flex items-center justify-center gap-2">
                   <Star size={18} fill="currentColor" /> +{pointsAwarded}
                 </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => setShowCelebration(false)}
                className="flex-1 px-4 sm:px-6 py-4 rounded-2xl text-sm font-bold bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10 transition-all">
                Review Solution
              </button>
              {nextAssignmentId ? (
                <button onClick={() => navigate(`/student/workspace/${nextAssignmentId}`)}
                  className="flex-1 btn-primary px-4 sm:px-6 py-4 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all">
                  Next Challenge <ArrowRight size={16} />
                </button>
              ) : (
                <button onClick={() => navigate('/student/dashboard')}
                  className="flex-1 btn-primary px-4 sm:px-6 py-4 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 shadow-xl shadow-primary/30 transition-all">
                  Dashboard <Sparkles size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
