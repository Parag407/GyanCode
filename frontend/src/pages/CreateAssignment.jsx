import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { FilePlus, CheckCircle2, AlertCircle, ChevronLeft, Code2, Trophy, Lightbulb, Loader2, Eye, EyeOff, CalendarClock, Tag, Plus, Trash2, Lock, Unlock, Rocket, Save } from 'lucide-react';
import Editor from '@monaco-editor/react';

export default function CreateAssignment() {
  const [form, setForm] = useState({
    title: '', description: '', language: 'python',
    proficiency_level: 'Beginner', points: 10,
    expected_input: '', expected_output: '', deadline: '', category: '',
    starter_code: '', is_published: true
  });
  const [testCases, setTestCases] = useState([{ input: '', output: '', is_hidden: false }]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const addTestCase = () => setTestCases([...testCases, { input: '', output: '', is_hidden: false }]);
  const removeTestCase = (index) => setTestCases(testCases.filter((_, i) => i !== index));
  const updateTestCase = (index, field, value) => {
    const newCases = [...testCases];
    newCases[index][field] = value;
    setTestCases(newCases);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required.'); return; }
    if (!testCases[0]?.output?.trim()) { setError('Expected output is required for the first test case.'); return; }
    setLoading(true);
    setError('');

    const { data: { session } } = await supabase.auth.getSession();
    
    // Use first test case as legacy fallback values for schema compatibility
    const finalForm = {
      ...form,
      expected_input: testCases[0]?.input || '',
      expected_output: testCases[0]?.output || '',
      test_cases: testCases,
      starter_code: form.starter_code,
      is_published: form.is_published
    };

    const res = await fetch(`${import.meta.env.VITE_API_URL}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify(finalForm)
    });

    if (res.ok) {
      setSuccess(true);
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to create assignment.');
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in-up space-y-6">
        <div className="w-20 h-20 bg-emerald-500/15 rounded-3xl flex items-center justify-center">
          <CheckCircle2 size={40} className="text-emerald-400" />
        </div>
        <h2 className="text-2xl font-black tracking-tight">Assignment Created!</h2>
        <p className="text-gray-400 text-sm max-w-sm text-center">Your assignment is now live and visible to students on their dashboard.</p>
        <div className="flex gap-3">
          <button onClick={() => { setSuccess(false); setForm({ title: '', description: '', language: 'python', proficiency_level: 'Beginner', points: 10, expected_input: '', expected_output: '', deadline: '', category: '', starter_code: '', is_published: true }); setTestCases([{ input: '', output: '', is_hidden: false }]); }}
            className="px-4 sm:px-6 py-3 rounded-xl font-bold text-sm border border-white/10 text-gray-400 hover:bg-white/5 transition-all flex items-center gap-2">
            <FilePlus size={15} /> Create Another
          </button>
          <Link to="/educator/dashboard" className="btn-primary text-white px-4 sm:px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2">
            View Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm px-3 py-2 rounded-xl hover:bg-white/5">
          <ChevronLeft size={16} /> Back
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Create Assignment</h1>
          <p className="text-gray-500 text-xs mt-0.5">Design a coding challenge for your students</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 animate-fade-in">
          <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">
          <div className="glass-card rounded-2xl p-4 sm:p-6 space-y-5">
            <h3 className="font-bold text-sm flex items-center gap-2"><Code2 size={15} className="text-primary-light" /> Assignment Details</h3>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Title *</label>
              <input name="title" value={form.title} onChange={handleChange} required
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 focus:bg-white/[0.07] transition-all"
                placeholder="e.g., Fibonacci Sequence Generator" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-600 resize-none focus:bg-white/[0.07] transition-all"
                placeholder="Describe the problem, constraints, and what the student should accomplish..." />
              <p className="text-[10px] text-gray-600">Tip: Clear descriptions help students understand the problem faster.</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Language</label>
                <select name="language" value={form.language} onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white appearance-none cursor-pointer focus:bg-white/[0.07] transition-all">
                  {['python', 'javascript', 'c', 'cpp', 'java'].map(l => <option key={l} value={l} className="bg-card">{l}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Difficulty</label>
                <select name="proficiency_level" value={form.proficiency_level} onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white appearance-none cursor-pointer focus:bg-white/[0.07] transition-all">
                  {['Beginner', 'Intermediate', 'Advanced'].map(l => <option key={l} value={l} className="bg-card">{l}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1"><Trophy size={10} className="text-amber-400" /> Points</label>
                <input name="points" type="number" min="1" max="100" value={form.points} onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:bg-white/[0.07] transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1"><CalendarClock size={10} className="text-blue-400" /> Deadline</label>
                <input name="deadline" type="datetime-local" value={form.deadline} onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:bg-white/[0.07] transition-all" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1"><Tag size={10} className="text-violet-400" /> Category</label>
              <select name="category" value={form.category} onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white appearance-none cursor-pointer focus:bg-white/[0.07] transition-all">
                <option value="" className="bg-card">None</option>
                {['Arrays', 'Strings', 'Loops', 'Functions', 'OOP', 'Recursion', 'Sorting', 'Searching', 'Data Structures', 'Math', 'File I/O', 'Other'].map(c => <option key={c} value={c} className="bg-card">{c}</option>)}
              </select>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1"><Code2 size={10} className="text-emerald-400" /> Starter Code (Optional)</label>
                <div className="flex bg-white/5 p-1 rounded-lg">
                  <button type="button" onClick={() => setForm({...form, is_published: true})}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold flex items-center gap-1.5 transition-all ${form.is_published ? 'bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10' : 'text-gray-500 hover:text-gray-300'}`}>
                    <Rocket size={10} /> Published
                  </button>
                  <button type="button" onClick={() => setForm({...form, is_published: false})}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold flex items-center gap-1.5 transition-all ${!form.is_published ? 'bg-amber-500/20 text-amber-400 shadow-lg shadow-amber-500/10' : 'text-gray-500 hover:text-gray-300'}`}>
                    <Save size={10} /> Draft
                  </button>
                </div>
              </div>
              <div className="rounded-xl overflow-hidden border border-white/10 h-64">
                <Editor
                  height="100%"
                  defaultLanguage={form.language}
                  theme="vs-dark"
                  value={form.starter_code}
                  onChange={(val) => setForm({...form, starter_code: val})}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 12,
                    padding: { top: 10 },
                    scrollBeyondLastLine: false,
                    lineNumbers: 'on',
                    renderLineHighlight: 'all',
                    scrollbar: { vertical: 'hidden' }
                  }}
                />
              </div>
              <p className="text-[10px] text-gray-600 italic">This code will be pre-loaded in the student's editor when they start the assignment.</p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 sm:p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2"><Lightbulb size={15} className="text-amber-400" /> Test Cases</h3>
              <button type="button" onClick={addTestCase}
                className="text-primary-light hover:text-primary transition-colors text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10">
                <Plus size={14} /> Add Test Case
              </button>
            </div>
            
            <div className="space-y-4">
              {testCases.map((tc, index) => (
                <div key={index} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-4 relative group/tc">
                  {testCases.length > 1 && (
                    <button type="button" onClick={() => removeTestCase(index)}
                      className="absolute top-4 right-4 text-gray-600 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-gray-600 bg-white/5 px-2 py-0.5 rounded uppercase">Case #{index + 1}</span>
                    <button type="button" onClick={() => updateTestCase(index, 'is_hidden', !tc.is_hidden)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 transition-all ${tc.is_hidden ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'}`}>
                      {tc.is_hidden ? <><Lock size={10} /> Hidden</> : <><Unlock size={10} /> Public</>}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Input (stdin)</label>
                      <textarea value={tc.input} onChange={(e) => updateTestCase(index, 'input', e.target.value)} rows={2}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white placeholder-gray-600 resize-none font-mono text-xs focus:bg-white/[0.07] transition-all"
                        placeholder="e.g., 5" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Expected Output *</label>
                      <textarea value={tc.output} onChange={(e) => updateTestCase(index, 'output', e.target.value)} rows={2} required
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white placeholder-gray-600 resize-none font-mono text-xs focus:bg-white/[0.07] transition-all"
                        placeholder="e.g., 120" />
                    </div>
                  </div>
                  {index === 0 && <p className="text-[9px] text-gray-600 italic">Note: The first test case is used for the student's initial preview and hints.</p>}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-500">Hidden test cases are used for submission grading but aren't visible to students in the workspace.</p>
          </div>

          <div className="flex gap-2 sm:gap-3">
            <button type="button" onClick={() => setShowPreview(!showPreview)}
              className="px-4 sm:px-5 py-3 rounded-xl font-bold text-sm border border-white/10 text-gray-400 hover:bg-white/5 transition-all flex items-center justify-center gap-2">
              {showPreview ? <EyeOff size={15} /> : <Eye size={15} />}
              <span className="hidden sm:inline">{showPreview ? 'Hide Preview' : 'Preview'}</span>
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 btn-primary text-white py-3 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
              {loading ? <><Loader2 size={15} className="animate-spin" /> <span className="hidden sm:inline">Creating...</span></> : <><FilePlus size={15} /> <span className="hidden sm:inline">Create Assignment</span></>}
            </button>
          </div>
        </form>

        {/* Tips Sidebar */}
        <div className="space-y-5">
          <div className="glass-card rounded-2xl p-4 sm:p-6 space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2"><Lightbulb size={15} className="text-amber-400" /> Tips</h3>
            <ul className="space-y-3 text-xs text-gray-400 leading-relaxed">
              <li className="flex gap-2"><span className="text-emerald-400 font-bold">•</span> Write clear, unambiguous problem descriptions</li>
              <li className="flex gap-2"><span className="text-emerald-400 font-bold">•</span> Include sample input/output in the description</li>
              <li className="flex gap-2"><span className="text-emerald-400 font-bold">•</span> Set appropriate point values (5-20 for Easy, 20-50 for Medium, 50-100 for Hard)</li>
              <li className="flex gap-2"><span className="text-emerald-400 font-bold">•</span> Test the expected output yourself before publishing</li>
              <li className="flex gap-2"><span className="text-emerald-400 font-bold">•</span> Expected output must match exactly (case-sensitive, whitespace-sensitive)</li>
            </ul>
          </div>

          {/* Live Preview Card */}
          {showPreview && form.title && (
            <div className="glass-card rounded-2xl p-4 sm:p-6 space-y-3 border-primary/20 animate-fade-in">
              <p className="text-[10px] font-semibold text-primary-light uppercase tracking-wider">Preview</p>
              <div className="flex items-start justify-between">
                <div className="bg-gradient-to-br from-primary/15 to-accent/5 w-10 h-10 rounded-xl flex items-center justify-center">
                  <Code2 size={18} className="text-primary-light" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                  form.proficiency_level === 'Beginner' ? 'bg-emerald-500/10 text-emerald-400' :
                  form.proficiency_level === 'Intermediate' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                }`}>{form.proficiency_level}</span>
              </div>
              <h4 className="font-bold text-white text-sm">{form.title}</h4>
              <p className="text-gray-500 text-xs line-clamp-2">{form.description || 'No description'}</p>
              <div className="flex gap-2">
                <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded">{form.language}</span>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded">{form.points} pts</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
