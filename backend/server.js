const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase configuration. Check your .env file.");
}

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const { authenticate, authorize } = require('./middleware/auth');
const requireAdmin = authorize(['Admin']);
const { generateHint, simulateExecutionAI, verifySubmissionAI, runAITask } = require('./utils/ai');

// CORS configuration - Allow Vercel frontend and local development
const allowedOrigins = [
    'https://gyan-code.vercel.app',
    'http://localhost:5173',
    'http://localhost:5174'
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps)
        if (!origin) return callback(null, true);
        
        // Allow local development and any vercel deployment
        const isVercel = origin.endsWith('.vercel.app');
        const isLocal = origin.startsWith('http://localhost:');
        
        if (isVercel || isLocal || origin === 'https://gyan-code.vercel.app') {
            return callback(null, true);
        } else {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
    },
    credentials: true
}));
app.use(bodyParser.json());

// ───────────────────────── HEALTH ─────────────────────────
app.get('/health', (req, res) => {
    res.json({ status: 'up', timestamp: new Date() });
});

// ───────────────────────── AUTH ─────────────────────────
app.post('/register', async (req, res) => {
    const { name, email, password, role, academic_year, department } = req.body;

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email, password, email_confirm: true,
    });

    if (authError) return res.status(400).json({ error: authError.message });

    const { error: profileError } = await supabaseAdmin.from('users').insert([{
        id: authData.user.id, name, email, role,
        academic_year: academic_year || null,
        department: department || null,
    }]);

    if (profileError) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return res.status(400).json({ error: profileError.message });
    }

    res.json({ message: 'Registration successful', userId: authData.user.id });
});

app.post('/change-password', authenticate, async (req, res) => {
    const { newPassword } = req.body;
    const { error } = await supabaseAdmin.auth.admin.updateUserById(req.user.id, {
        password: newPassword
    });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Password updated successfully' });
});

// ───────────────────────── PROFILE ─────────────────────────
app.get('/profile', authenticate, async (req, res) => {
    const { data, error } = await supabaseAdmin
        .from('users').select('*').eq('id', req.user.id).single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

app.put('/profile', authenticate, async (req, res) => {
    const { name, academic_year, department } = req.body;
    const { data, error } = await supabaseAdmin
        .from('users')
        .update({ name, academic_year, department })
        .eq('id', req.user.id)
        .select()
        .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

app.patch('/profile/settings', authenticate, async (req, res) => {
    const { certificate_settings } = req.body;
    const { data, error } = await supabaseAdmin
        .from('users')
        .update({ certificate_settings })
        .eq('id', req.user.id)
        .select()
        .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// ───────────────────────── ASSIGNMENTS ─────────────────────────
app.get('/assignments', authenticate, async (req, res) => {
    const { data: profile } = await supabaseAdmin.from('users').select('role').eq('id', req.user.id).single();
    let query = supabaseAdmin.from('assignments').select('*').order('created_at', { ascending: false });
    
    // Students only see published assignments
    if (profile?.role === 'Student') {
        query = query.eq('is_published', true);
    }

    const { data: assignments, error } = await query;
    if (error) return res.status(400).json({ error: error.message });

    // Enrich with submission counts per assignment
    const { data: submissions } = await supabaseAdmin.from('submissions').select('assignment_id, status');
    const enriched = (assignments || []).map(a => {
        const subs = (submissions || []).filter(s => s.assignment_id === a.id);
        return {
            ...a,
            submission_count: subs.length,
            success_count: subs.filter(s => s.status === 'Success').length,
            unique_students: new Set(subs.map(s => s.user_id)).size,
        };
    });
    res.json(enriched);
});

app.get('/assignments/:id', authenticate, async (req, res) => {
    const { data: assignment, error } = await supabaseAdmin
        .from('assignments').select('*').eq('id', req.params.id).single();
    if (error) return res.status(404).json({ error: 'Assignment not found' });
    
    const { data: submissions } = await supabaseAdmin
        .from('submissions')
        .select('status, user_id')
        .eq('assignment_id', req.params.id);

    const { data: userSubmissions } = await supabaseAdmin
        .from('submissions')
        .select('status')
        .eq('assignment_id', req.params.id)
        .eq('user_id', req.user.id)
        .order('submitted_at', { ascending: false });

    // NEW: Fetch test cases
    const { data: testCases } = await supabaseAdmin
        .from('test_cases')
        .select('*')
        .eq('assignment_id', req.params.id);

    const enriched = {
        ...assignment,
        test_cases: testCases || [],
        submission_count: submissions?.length || 0,
        success_count: submissions?.filter(s => s.status === 'Success').length || 0,
        unique_students: new Set(submissions?.map(s => s.user_id)).size || 0,
        user_status: userSubmissions?.[0]?.status || null,
        is_solved: userSubmissions?.some(s => s.status === 'Success') || false,
    };
    
    res.json(enriched);
});

app.post('/assignments', authenticate, async (req, res) => {
    const { title, description, language, proficiency_level, points, expected_input, expected_output, deadline, category, test_cases, starter_code, is_published } = req.body;
    const { data: assignment, error } = await supabaseAdmin.from('assignments').insert([{
        title, description, language, proficiency_level,
        points: parseInt(points), expected_input, expected_output,
        deadline: deadline || null, category: category || null,
        starter_code, is_published: is_published !== undefined ? is_published : true,
        created_by: req.user.id
    }]).select().single();
    
    if (error) return res.status(400).json({ error: error.message });

    if (test_cases && Array.isArray(test_cases) && test_cases.length > 0) {
        const tcData = test_cases.map(tc => ({
            assignment_id: assignment.id,
            input: tc.input,
            output: tc.output,
            is_hidden: !!tc.is_hidden
        }));
        await supabaseAdmin.from('test_cases').insert(tcData);
    }

    res.json(assignment);
});

app.put('/assignments/:id', authenticate, async (req, res) => {
    const { title, description, language, proficiency_level, points, expected_input, expected_output, deadline, category, test_cases, starter_code, is_published } = req.body;
    const { data: assignment, error } = await supabaseAdmin.from('assignments')
        .update({ 
            title, description, language, proficiency_level, 
            points: parseInt(points), expected_input, expected_output, 
            deadline: deadline || null, category: category || null,
            starter_code, is_published: is_published !== undefined ? is_published : true
        })
        .eq('id', req.params.id).eq('created_by', req.user.id)
        .select().single();
    
    if (error) return res.status(400).json({ error: error.message });

    if (test_cases && Array.isArray(test_cases)) {
        // Replace all test cases
        await supabaseAdmin.from('test_cases').delete().eq('assignment_id', req.params.id);
        if (test_cases.length > 0) {
            const tcData = test_cases.map(tc => ({
                assignment_id: req.params.id,
                input: tc.input,
                output: tc.output,
                is_hidden: !!tc.is_hidden
            }));
            await supabaseAdmin.from('test_cases').insert(tcData);
        }
    }

    res.json(assignment);
});

// Clone assignment
app.post('/assignments/:id/clone', authenticate, async (req, res) => {
    const { data: profile } = await supabaseAdmin.from('users').select('role').eq('id', req.user.id).single();
    if (profile?.role !== 'Educator' && profile?.role !== 'Admin') return res.status(403).json({ error: 'Forbidden' });

    // 1. Fetch original assignment
    const { data: original, error: fetchErr } = await supabaseAdmin.from('assignments').select('*').eq('id', req.params.id).single();
    if (fetchErr) return res.status(404).json({ error: 'Assignment not found' });

    // 2. Insert as new (prefix Title)
    const { data: cloned, error: cloneErr } = await supabaseAdmin.from('assignments').insert([{
        title: `${original.title} (Copy)`,
        description: original.description,
        language: original.language,
        proficiency_level: original.proficiency_level,
        points: original.points,
        category: original.category,
        starter_code: original.starter_code,
        is_published: false, // Default to draft for safety
        created_by: req.user.id
    }]).select().single();

    if (cloneErr) return res.status(400).json({ error: cloneErr.message });

    // 3. Clone test cases
    const { data: testCases } = await supabaseAdmin.from('test_cases').select('*').eq('assignment_id', original.id);
    if (testCases && testCases.length > 0) {
        const tcData = testCases.map(tc => ({
            assignment_id: cloned.id,
            input: tc.input,
            output: tc.output,
            is_hidden: tc.is_hidden
        }));
        await supabaseAdmin.from('test_cases').insert(tcData);
    }

    res.json(cloned);
});

// Export submissions to CSV
app.get('/assignments/:id/export', authenticate, async (req, res) => {
    const { data: profile } = await supabaseAdmin.from('users').select('role').eq('id', req.user.id).single();
    if (profile?.role !== 'Educator' && profile?.role !== 'Admin') return res.status(403).json({ error: 'Forbidden' });

    const { data: submissions, error } = await supabaseAdmin
        .from('submissions')
        .select('*, users(name, email, department)')
        .eq('assignment_id', req.params.id)
        .order('submitted_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });

    // Generate CSV
    let csv = 'Student,Email,Department,Status,Language,Submitted At\n';
    submissions.forEach(s => {
        csv += `"${s.users?.name}","${s.users?.email}","${s.users?.department}","${s.status}","${s.language}","${new Date(s.submitted_at).toLocaleString()}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=submissions_${req.params.id}.csv`);
    res.send(csv);
});

app.delete('/assignments/:id', authenticate, async (req, res) => {
    const { error } = await supabaseAdmin.from('assignments')
        .delete().eq('id', req.params.id).eq('created_by', req.user.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Assignment deleted' });
});

// ───────────────────────── CODE EXECUTION ─────────────────────────
app.post('/execute', async (req, res) => {
    const { language, code, input, assignment_id } = req.body;
    
    if (assignment_id) {
        // Run against all public test cases
        const { data: testCases } = await supabaseAdmin
            .from('test_cases').select('*').eq('assignment_id', assignment_id).eq('is_hidden', false);
        
        if (testCases && testCases.length > 0) {
            const results = [];
            for (const tc of testCases) {
                const res = await simulateExecutionAI(language, code, tc.input);
                results.push({
                    input: tc.input,
                    expected: tc.output,
                    output: res.output || res.error,
                    passed: res.output?.trim() === tc.output?.trim()
                });
            }
            return res.json({ multi: true, results });
        }
    }

    const result = await simulateExecutionAI(language, code, input);
    res.json(result);
});

// ───────────────────────── SUBMISSIONS ─────────────────────────
app.post('/submit', authenticate, async (req, res) => {
    const { assignment_id, code } = req.body;

    const { data: assignment } = await supabaseAdmin
        .from('assignments').select('*').eq('id', assignment_id).single();

    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    // Check deadline
    if (assignment.deadline && new Date(assignment.deadline) < new Date()) {
        return res.status(400).json({ error: 'This assignment is past its deadline.', expired: true });
    }

    // Check previous attempts for this user on this assignment
    const { data: prevSubs } = await supabaseAdmin.from('submissions')
        .select('id, status').eq('assignment_id', assignment_id).eq('user_id', req.user.id);
    const attemptNumber = (prevSubs?.length || 0) + 1;
    const alreadySolved = prevSubs?.some(s => s.status === 'Success') || false;

    const { data: testCases } = await supabaseAdmin
        .from('test_cases').select('*').eq('assignment_id', assignment_id);

    let status = 'Success';
    let failedCase = null;
    let results = [];

    if (testCases && testCases.length > 0) {
        const aiVerification = await verifySubmissionAI(assignment.language, code, testCases);
        
        if (aiVerification && aiVerification.results && aiVerification.results.length === testCases.length) {
            results = aiVerification.results.map((r, i) => {
                const tc = testCases[i];
                if (!r.passed && status !== 'Failed') {
                    status = 'Failed';
                    failedCase = { input: tc.input, expected: tc.output, output: r.output, is_hidden: tc.is_hidden };
                }
                return {
                    is_hidden: tc.is_hidden, 
                    passed: r.passed, 
                    input: tc.is_hidden ? '***' : r.input, 
                    expected: tc.is_hidden ? '***' : r.expected, 
                    output: tc.is_hidden ? '***' : r.output 
                };
            });
            
            if (status === 'Success' && !aiVerification.is_genuine) {
                status = 'Failed';
                failedCase = { is_hidden: false, expected: "Valid logical approach to solve the problem dynamically.", output: "Semantic Logic Check Failed: " + aiVerification.semantic_feedback };
            }
        } else {
            status = 'Failed';
            failedCase = { is_hidden: false, expected: "", output: "Failed to verify submission using AI. Please try again." };
        }
    } else {
        // Fallback to legacy single test case if no entries in test_cases table
        const result = await simulateExecutionAI(assignment.language, code, assignment.expected_input);
        if (result.output?.trim() !== assignment.expected_output?.trim()) {
            status = 'Failed';
            failedCase = { input: assignment.expected_input, expected: assignment.expected_output, output: result.output || result.error };
        }
    }

    let hint = null;
    if (status === 'Failed') {
        hint = await generateHint(code, failedCase.expected, failedCase.output);
    }

    if (status === 'Success' && !alreadySolved) {
        await supabaseAdmin.rpc('increment_points', {
            user_id: req.user.id, points_to_add: assignment.points
        });
    }

    const { data: sub } = await supabaseAdmin.from('submissions').insert([{
        assignment_id, user_id: req.user.id, code, status,
        language: assignment.language, last_hint: hint
    }]).select().single();

    // --- Automatic Certificate Reward System ---
    try {
        if (status === 'Success' && !alreadySolved) {
            const { data: stData } = await supabaseAdmin.from('platform_settings').select('*');
            const settings = {};
            (stData || []).forEach(s => { settings[s.key] = s.value; });

            if (settings.auto_cert_enabled) {
                const thresholdCount = parseInt(settings.auto_cert_threshold_count) || 5;
                
                // Check unique solved assignments count
                const { data: allUserSubs } = await supabaseAdmin
                    .from('submissions')
                    .select('assignment_id')
                    .eq('user_id', req.user.id)
                    .eq('status', 'Success');
                
                const uniqueSolved = new Set((allUserSubs || []).map(s => s.assignment_id)).size;

                if (uniqueSolved >= thresholdCount) {
                    const { data: existingCert } = await supabaseAdmin
                        .from('certificates')
                        .select('id')
                        .eq('awarded_to', req.user.id)
                        .eq('category', 'Milestone')
                        .limit(1);

                    if (!existingCert || existingCert.length === 0) {
                        await supabaseAdmin.from('certificates').insert([{
                            awarded_to: req.user.id,
                            issued_by: null, // Issued by System
                            title: `Achievement Milestone: ${thresholdCount} Solved`,
                            description: `Automatically awarded by GyanCode for successfully completing ${thresholdCount} unique coding assignments.`,
                            skills: 'Problem Solving, Persistence',
                            category: 'Milestone',
                            issued_on: new Date().toISOString()
                        }]);
                        console.log(`[Auto-Cert] Awarded milestone certificate to ${req.user.id}`);
                    }
                }
            }
        }
    } catch (err) {
        console.error('[Auto-Cert] Logic error:', err);
    }

    res.json({
        status, 
        results, // Detailed results for all cases (masked for hidden)
        error: failedCase ? (failedCase.is_hidden ? 'Hidden test case failed' : failedCase.output) : null,
        hint,
        attempt: attemptNumber, already_solved: alreadySolved,
        points_awarded: status === 'Success' && !alreadySolved ? assignment.points : 0,
        submission_id: sub?.id
    });
});

// Get submission history for current user
app.get('/submissions', authenticate, async (req, res) => {
    const { data, error } = await supabaseAdmin
        .from('submissions')
        .select('*, assignments(title, language, points)')
        .eq('user_id', req.user.id)
        .order('submitted_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// Get all submissions (educator)
app.get('/submissions/all', authenticate, async (req, res) => {
    const { data: profile } = await supabaseAdmin
        .from('users').select('role').eq('id', req.user.id).single();
    if (profile?.role !== 'Educator' && profile?.role !== 'Admin') return res.status(403).json({ error: 'Forbidden' });

    const { data, error } = await supabaseAdmin
        .from('submissions')
        .select('*, assignments(title, language, points), users(name, email, department)')
        .order('submitted_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// ───────────────────────── LEADERBOARD ─────────────────────────
app.get('/leaderboard', async (req, res) => {
    const { period } = req.query; // 'weekly' | 'monthly' | undefined = all-time

    // Get all students base info
    const { data: students, error } = await supabaseAdmin
        .from('users')
        .select('id, name, department, academic_year, total_points')
        .eq('role', 'Student')
        .order('total_points', { ascending: false })
        .limit(100);
    if (error) return res.status(400).json({ error: error.message });

    if (!period || period === 'alltime') {
        // Enrich with solved count
        const { data: subs } = await supabaseAdmin
            .from('submissions').select('user_id, assignment_id, status');
        const solvedMap = {};
        (subs || []).forEach(s => {
            if (s.status === 'Success') {
                if (!solvedMap[s.user_id]) solvedMap[s.user_id] = new Set();
                solvedMap[s.user_id].add(s.assignment_id);
            }
        });
        const { data: totalSubCount } = await supabaseAdmin.from('submissions').select('id', { count: 'exact', head: true });
        
        return res.json({
            leaders: (students || []).map(s => ({
                ...s,
                solved_count: solvedMap[s.id]?.size || 0
            })),
            totalSubmissions: totalSubCount || 0,
            totalStudents: students?.length || 0
        });
    }

    // Period-filtered: re-rank by points earned in window
    const now = new Date();
    const cutoff = new Date(now);
    if (period === 'weekly') cutoff.setDate(now.getDate() - 7);
    else if (period === 'monthly') cutoff.setDate(now.getDate() - 30);

    const { data: subs } = await supabaseAdmin
        .from('submissions')
        .select('user_id, assignment_id, status, submitted_at, assignments(points)')
        .gte('submitted_at', cutoff.toISOString());

    // Build period points per student
    const periodMap = {};
    const solvedMap = {};
    (subs || []).forEach(s => {
        if (!periodMap[s.user_id]) periodMap[s.user_id] = { points: 0, solved: new Set() };
        if (s.status === 'Success' && !periodMap[s.user_id].solved.has(s.assignment_id)) {
            periodMap[s.user_id].solved.add(s.assignment_id);
            periodMap[s.user_id].points += (s.assignments?.points || 0);
        }
    });

    const enriched = (students || [])
        .map(s => ({
            ...s,
            total_points: periodMap[s.id]?.points || 0,
            solved_count: periodMap[s.id]?.solved.size || 0
        }))
        .filter(s => s.total_points > 0)
        .sort((a, b) => b.total_points - a.total_points);

    const { count: studentCount } = await supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).eq('role', 'Student');
    const { count: totalSubCount } = await supabaseAdmin.from('submissions').select('id', { count: 'exact', head: true });

    res.json({
        leaders: enriched,
        totalSubmissions: totalSubCount || 0,
        totalStudents: studentCount || 0
    });
});


// ───────────────────────── STATS (for educator dashboard) ─────────────────────────
app.get('/stats', authenticate, async (req, res) => {
    const { data: profile } = await supabaseAdmin
        .from('users').select('role').eq('id', req.user.id).single();
    if (profile?.role !== 'Educator' && profile?.role !== 'Admin') return res.status(403).json({ error: 'Forbidden' });

    const { data: students } = await supabaseAdmin.from('users').select('*').eq('role', 'Student');
    const { data: submissions } = await supabaseAdmin
        .from('submissions')
        .select('*, users(name), assignments(title)')
        .order('submitted_at', { ascending: false })
        .limit(20);
    const { data: assignments } = await supabaseAdmin.from('assignments').select('*').eq('created_by', req.user.id);

    const { data: totalSubs } = await supabaseAdmin.from('submissions').select('status, submitted_at, user_id');

    // Active students today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const activeToday = new Set(
        (totalSubs || []).filter(s => new Date(s.submitted_at) >= todayStart).map(s => s.user_id)
    ).size;

    // Submissions per day last 7 days (for chart)
    const submissionsPerDay = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
        const next = new Date(d); next.setDate(next.getDate() + 1);
        const count = (totalSubs || []).filter(s => {
            if (!s.submitted_at) return false;
            const t = new Date(s.submitted_at);
            return t >= d && t < next;
        }).length;
        submissionsPerDay.push({ day: d.toLocaleDateString('en', { weekday: 'short' }), date: d.toISOString().split('T')[0], count });
    }

    // Compute unique solved and attempted counts per student
    const { data: allSubmissions } = await supabaseAdmin
        .from('submissions')
        .select('user_id, assignment_id, status');

    const solvedMap = {};
    const attemptedMap = {};

    (allSubmissions || []).forEach(s => {
        if (!attemptedMap[s.user_id]) attemptedMap[s.user_id] = new Set();
        attemptedMap[s.user_id].add(s.assignment_id);

        if (s.status === 'Success') {
            if (!solvedMap[s.user_id]) solvedMap[s.user_id] = new Set();
            solvedMap[s.user_id].add(s.assignment_id);
        }
    });

    const studentsWithStats = (students || []).map(s => ({
        ...s,
        solved_count: solvedMap[s.id]?.size || 0,
        attempted_count: attemptedMap[s.id]?.size || 0,
    }));

    res.json({
        studentCount: studentsWithStats.length,
        submissionCount: totalSubs?.length || 0,
        assignmentCount: assignments?.length || 0,
        successCount: totalSubs?.filter(s => s.status === 'Success').length || 0,
        failCount: totalSubs?.filter(s => s.status === 'Failed').length || 0,
        activeStudentsToday: activeToday,
        submissionsPerDay,
        students: studentsWithStats,
        submissions: submissions || [],
    });
});

// ───────────────────────── QUICK PUBLISH TOGGLE ─────────────────────────
app.patch('/assignments/:id/publish', authenticate, async (req, res) => {
    const { data: profile } = await supabaseAdmin.from('users').select('role').eq('id', req.user.id).single();
    if (profile?.role !== 'Educator' && profile?.role !== 'Admin') return res.status(403).json({ error: 'Forbidden' });
    const { is_published } = req.body;
    const { data, error } = await supabaseAdmin.from('assignments')
        .update({ is_published: !!is_published })
        .eq('id', req.params.id).eq('created_by', req.user.id)
        .select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// ───────────────────────── TEST CASES CRUD ─────────────────────────
app.get('/assignments/:id/test-cases', authenticate, async (req, res) => {
    const { data: profile } = await supabaseAdmin.from('users').select('role').eq('id', req.user.id).single();
    let query = supabaseAdmin.from('test_cases').select('*').eq('assignment_id', req.params.id);
    if (profile?.role !== 'Educator' && profile?.role !== 'Admin') query = query.eq('is_hidden', false);
    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

app.post('/test-cases', authenticate, async (req, res) => {
    const { data: profile } = await supabaseAdmin.from('users').select('role').eq('id', req.user.id).single();
    if (profile?.role !== 'Educator' && profile?.role !== 'Admin') return res.status(403).json({ error: 'Forbidden' });
    const { assignment_id, input, output, is_hidden } = req.body;
    const { data, error } = await supabaseAdmin.from('test_cases').insert([{ assignment_id, input, output, is_hidden: !!is_hidden }]).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

app.delete('/test-cases/:id', authenticate, async (req, res) => {
    const { data: profile } = await supabaseAdmin.from('users').select('role').eq('id', req.user.id).single();
    if (profile?.role !== 'Educator' && profile?.role !== 'Admin') return res.status(403).json({ error: 'Forbidden' });
    const { error } = await supabaseAdmin.from('test_cases').delete().eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
});

// ───────────────────────── SUBMISSION COMMENTS ─────────────────────────
app.get('/submissions/:id/comments', authenticate, async (req, res) => {
    const { data, error } = await supabaseAdmin
        .from('submission_comments')
        .select('*, author:users(name, role)')
        .eq('submission_id', req.params.id)
        .order('created_at', { ascending: true });
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

app.post('/submissions/:id/comments', authenticate, async (req, res) => {
    const { data: profile } = await supabaseAdmin.from('users').select('role').eq('id', req.user.id).single();
    if (profile?.role !== 'Educator' && profile?.role !== 'Admin') return res.status(403).json({ error: 'Forbidden' });
    const { body } = req.body;
    const { data, error } = await supabaseAdmin.from('submission_comments').insert([{
        submission_id: req.params.id,
        author_id: req.user.id,
        body
    }]).select('*, author:users(name, role)').single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// ───────────────────────── AI TUTOR ─────────────────────────
app.post('/ai-tutor', authenticate, async (req, res) => {
    const { message, language } = req.body;
    try {
        const prompt = `You are GyanBot, a friendly and expert coding tutor on the GyanCode learning platform. 
A student is asking for help${language ? ` with ${language}` : ''}.

Student's question: "${message}"

Rules:
- Be concise but thorough (max 300 words)
- Use code examples when helpful, wrapped in markdown code blocks
- Be encouraging and supportive
- If asked to solve homework directly, guide them toward the solution instead
- Use simple language suitable for students`;

        const reply = await runAITask(prompt);
        res.json({ reply });
    } catch (error) {
        console.error("AI Tutor Error:", error);
        res.json({ reply: "I'm having trouble connecting right now. Please try again in a moment! 🤖" });
    }
});

// ───────────────────────── EDUCATOR: ASSIGNMENT DETAIL WITH SUBMISSIONS ─────────────────────────
app.get('/assignments/:id/submissions', authenticate, async (req, res) => {
    const { data: profile } = await supabaseAdmin
        .from('users').select('role').eq('id', req.user.id).single();
    if (profile?.role !== 'Educator' && profile?.role !== 'Admin') return res.status(403).json({ error: 'Forbidden' });

    const { data: assignment } = await supabaseAdmin
        .from('assignments').select('*').eq('id', req.params.id).single();
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    const { data: submissions } = await supabaseAdmin
        .from('submissions')
        .select('*, users(name, email, department)')
        .eq('assignment_id', req.params.id)
        .order('submitted_at', { ascending: false });

    res.json({ assignment, submissions: submissions || [] });
});

// ───────────────────────── STUDENT PROGRESS ─────────────────────────
app.get('/progress', authenticate, async (req, res) => {
    const { data: profile } = await supabaseAdmin
        .from('users').select('*').eq('id', req.user.id).single();

    const { data: submissions } = await supabaseAdmin
        .from('submissions')
        .select('*, assignments(title, language, points, proficiency_level)')
        .eq('user_id', req.user.id)
        .order('submitted_at', { ascending: true });

    const { data: certificates } = await supabaseAdmin
        .from('certificates')
        .select('*')
        .eq('awarded_to', req.user.id);

    const { data: allStudents } = await supabaseAdmin
        .from('users')
        .select('id, total_points')
        .eq('role', 'Student')
        .order('total_points', { ascending: false });

    // Calculate rank
    const rank = allStudents?.findIndex(s => s.id === req.user.id) + 1 || 0;

    // Calculate per-language stats
    const langStats = {};
    (submissions || []).forEach(s => {
        const lang = s.assignments?.language || 'Unknown';
        if (!langStats[lang]) langStats[lang] = { total: 0, success: 0 };
        langStats[lang].total++;
        if (s.status === 'Success') langStats[lang].success++;
    });

    // Weekly activity (last 7 days)
    const weeklyActivity = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0,0,0,0);
        const next = new Date(d);
        next.setDate(next.getDate() + 1);
        const count = (submissions || []).filter(s => {
            if (!s.submitted_at) return false;
            const t = new Date(s.submitted_at);
            return t >= d && t < next;
        }).length;
        weeklyActivity.push({ date: d.toISOString().split('T')[0], day: d.toLocaleDateString('en', { weekday: 'short' }), count });
    }

    const { data: allAssignments } = await supabaseAdmin
        .from('assignments').select('id').eq('is_published', true);

    const uniqueSolved = new Set((submissions || []).filter(s => s.status === 'Success').map(s => s.assignment_id));
    const uniqueAttempted = new Set((submissions || []).map(s => s.assignment_id));

    res.json({
        profile,
        rank,
        totalStudents: allStudents?.length || 0,
        totalSubmissions: submissions?.length || 0,
        successCount: submissions?.filter(s => s.status === 'Success').length || 0,
        failCount: submissions?.filter(s => s.status === 'Failed').length || 0,
        uniqueSolvedCount: uniqueSolved.size,
        uniqueAttemptedCount: uniqueAttempted.size,
        certificateCount: certificates?.length || 0,
        totalAssignments: allAssignments?.length || 0,
        langStats,
        weeklyActivity,
        recentSubmissions: (submissions || []).slice(-10).reverse(),
    });
});

// ───────────────────────── ANNOUNCEMENTS ─────────────────────────
app.get('/announcements', authenticate, async (req, res) => {
    const { data, error } = await supabaseAdmin
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
    if (error) return res.status(400).json({ error: error.message });

    // Enrich with poster name from public.users
    const announcements = data || [];
    const creatorIds = [...new Set(announcements.map(a => a.created_by).filter(Boolean))];
    let nameMap = {};
    if (creatorIds.length > 0) {
        const { data: users } = await supabaseAdmin
            .from('users').select('id, name').in('id', creatorIds);
        (users || []).forEach(u => { nameMap[u.id] = u.name; });
    }
    const enriched = announcements.map(a => ({
        ...a,
        users: { name: nameMap[a.created_by] || 'GyanCode Staff' }
    }));
    res.json(enriched);
});

app.post('/announcements', authenticate, async (req, res) => {
    const { data: profile } = await supabaseAdmin
        .from('users').select('role, name').eq('id', req.user.id).single();
    if (profile?.role !== 'Educator' && profile?.role !== 'Admin') return res.status(403).json({ error: 'Forbidden' });

    const { title, body } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Title is required.' });

    const { data, error } = await supabaseAdmin.from('announcements').insert([{
        title, body: body || null, created_by: req.user.id
    }]).select().single();
    if (error) return res.status(400).json({ error: error.message });

    // Return with users shape the frontend expects
    res.json({ ...data, users: { name: profile.name } });
});

app.delete('/announcements/:id', authenticate, async (req, res) => {
    const { data: profile } = await supabaseAdmin
        .from('users').select('role').eq('id', req.user.id).single();
    if (profile?.role !== 'Educator' && profile?.role !== 'Admin') return res.status(403).json({ error: 'Forbidden' });

    const { error } = await supabaseAdmin.from('announcements')
        .delete().eq('id', req.params.id).eq('created_by', req.user.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
});

// ───────────────────────── BOOKMARKS ─────────────────────────
app.get('/bookmarks', authenticate, async (req, res) => {
    const { data, error } = await supabaseAdmin
        .from('bookmarks').select('assignment_id').eq('user_id', req.user.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json((data || []).map(b => b.assignment_id));
});

app.post('/bookmarks', authenticate, async (req, res) => {
    const { assignment_id } = req.body;
    // Toggle: check if exists, delete if so, insert if not
    const { data: existing } = await supabaseAdmin
        .from('bookmarks').select('id').eq('user_id', req.user.id).eq('assignment_id', assignment_id).single();
    if (existing) {
        await supabaseAdmin.from('bookmarks').delete().eq('id', existing.id);
        res.json({ bookmarked: false });
    } else {
        await supabaseAdmin.from('bookmarks').insert([{ user_id: req.user.id, assignment_id }]);
        res.json({ bookmarked: true });
    }
});

// ───────────────────────── CHANGE PASSWORD ─────────────────────────
app.post('/change-password', authenticate, async (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    const { error } = await supabaseAdmin.auth.admin.updateUserById(req.user.id, { password: newPassword });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
});

// GET /students — list all students (Educator only)
app.get('/students', authenticate, async (req, res) => {
    const { data: profile } = await supabaseAdmin
        .from('users').select('role').eq('id', req.user.id).single();
    if (profile?.role !== 'Educator' && profile?.role !== 'Admin') {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, name, email, department, academic_year, total_points')
        .eq('role', 'Student')
        .order('name');

    if (error) return res.status(400).json({ error: error.message });
    res.json(data || []);
});

// ───────────────────────── EDUCATOR: STUDENT DETAIL ─────────────────────────
app.get('/students/:id', authenticate, async (req, res) => {
    const { data: profile } = await supabaseAdmin
        .from('users').select('role').eq('id', req.user.id).single();
    if (profile?.role !== 'Educator' && profile?.role !== 'Admin') return res.status(403).json({ error: 'Forbidden' });

    const { data: student } = await supabaseAdmin
        .from('users').select('*').eq('id', req.params.id).single();
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const { data: submissions } = await supabaseAdmin
        .from('submissions').select('*, assignments(title, language, points, proficiency_level)')
        .eq('user_id', req.params.id).order('submitted_at', { ascending: false });

    const { data: certificates } = await supabaseAdmin
        .from('certificates').select('*').eq('awarded_to', req.params.id);

    const { data: allStudents } = await supabaseAdmin
        .from('users').select('id, total_points').eq('role', 'Student')
        .order('total_points', { ascending: false });

    const rank = allStudents?.findIndex(s => s.id === req.params.id) + 1 || 0;

    const successCount = (submissions || []).filter(s => s.status === 'Success').length;
    const uniqueAssignments = new Set((submissions || []).filter(s => s.status === 'Success').map(s => s.assignment_id)).size;

    res.json({
        student,
        rank,
        totalStudents: allStudents?.length || 0,
        submissions: submissions || [],
        certificates: certificates || [],
        successCount,
        uniqueAssignmentsSolved: uniqueAssignments,
    });
});

// ───────────────────────── CERTIFICATES ─────────────────────────

// GET /certificates — role-aware list
app.get('/certificates', authenticate, async (req, res) => {
    const { data: profile } = await supabaseAdmin.from('users').select('role').eq('id', req.user.id).single();
    let query = supabaseAdmin
        .from('certificates')
        .select('*, users!certificates_issued_by_fkey(name, email), recipient:users!certificates_awarded_to_fkey(name, email, department)')
        .order('issued_on', { ascending: false });

    if (profile?.role === 'Student') {
        query = query.eq('awarded_to', req.user.id);
    } else if (profile?.role === 'Educator') {
        query = query.eq('issued_by', req.user.id);
    }
    // Admin sees all (no filter)

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json(data || []);
});

// GET /certificates/:id — single certificate (for public verification)
app.get('/certificates/:id', authenticate, async (req, res) => {
    const { data, error } = await supabaseAdmin
        .from('certificates')
        .select('*, users!certificates_issued_by_fkey(name, email), recipient:users!certificates_awarded_to_fkey(name, email, department)')
        .eq('id', req.params.id)
        .single();
    if (error) return res.status(404).json({ error: 'Certificate not found' });
    res.json(data);
});

// POST /certificates — issue new certificate (Educator only)
app.post('/certificates', authenticate, async (req, res) => {
    const { data: profile } = await supabaseAdmin.from('users').select('role').eq('id', req.user.id).single();
    if (!['Educator', 'Admin'].includes(profile?.role)) return res.status(403).json({ error: 'Only educators can issue certificates' });

    const { awarded_to, title, description, skills, category } = req.body;
    if (!awarded_to || !title) return res.status(400).json({ error: 'awarded_to and title are required' });

    // Verify recipient exists and is a student
    const { data: recipient } = await supabaseAdmin.from('users').select('id, name, role').eq('id', awarded_to).single();
    if (!recipient) return res.status(404).json({ error: 'Student not found' });

    const { data, error } = await supabaseAdmin.from('certificates').insert([{
        awarded_to,
        issued_by: req.user.id,
        title,
        description: description || null,
        skills: skills || null,
        category: category || null,
        issued_on: new Date().toISOString(),
    }]).select('*, users!certificates_issued_by_fkey(name, email), recipient:users!certificates_awarded_to_fkey(name, email, department)').single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// DELETE /certificates/:id — revoke (educator who issued it, or admin)
app.delete('/certificates/:id', authenticate, async (req, res) => {
    const { data: profile } = await supabaseAdmin.from('users').select('role').eq('id', req.user.id).single();
    const { data: cert } = await supabaseAdmin.from('certificates').select('issued_by').eq('id', req.params.id).single();
    if (!cert) return res.status(404).json({ error: 'Not found' });
    if (profile?.role !== 'Admin' && cert.issued_by !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const { error } = await supabaseAdmin.from('certificates').delete().eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Certificate revoked' });
});

// ───────────────────────── ADMIN ─────────────────────────
const requireAdmin = async (req, res, next) => {
    const { data: profile } = await supabaseAdmin.from('users').select('role').eq('id', req.user.id).single();
    if (profile?.role !== 'Admin') return res.status(403).json({ error: 'Admin access required' });
    next();
};

// GET /admin/stats — system-wide overview
app.get('/admin/stats', authenticate, requireAdmin, async (req, res) => {
    const [usersRes, assignRes, subRes] = await Promise.all([
        supabaseAdmin.from('users').select('id, role, created_at'),
        supabaseAdmin.from('assignments').select('id'),
        supabaseAdmin.from('submissions').select('id, status, submitted_at'),
    ]);
    const users = usersRes.data || [];
    const submissions = subRes.data || [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayCount = submissions.filter(s => new Date(s.submitted_at) >= today).length;
    const successCount = submissions.filter(s => s.status === 'Success').length;
    // submissions per day for last 7 days
    const perDay = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
        const next = new Date(d); next.setDate(next.getDate() + 1);
        perDay.push({
            day: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
            count: submissions.filter(s => { const t = new Date(s.submitted_at); return t >= d && t < next; }).length
        });
    }
    res.json({
        totalUsers: users.length,
        studentCount: users.filter(u => u.role === 'Student').length,
        educatorCount: users.filter(u => u.role === 'Educator').length,
        adminCount: users.filter(u => u.role === 'Admin').length,
        totalAssignments: assignRes.data?.length || 0,
        totalSubmissions: submissions.length,
        successCount,
        failCount: submissions.length - successCount,
        todaySubmissions: todayCount,
        submissionsPerDay: perDay,
    });
});

// GET /admin/users — list all users
app.get('/admin/users', authenticate, requireAdmin, async (req, res) => {
    const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, name, email, role, department, academic_year, total_points, created_at')
        .order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// PATCH /admin/users/:id/role — change a user's role
app.patch('/admin/users/:id/role', authenticate, requireAdmin, async (req, res) => {
    const { role } = req.body;
    if (!['Student', 'Educator', 'Admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    const { data, error } = await supabaseAdmin
        .from('users').update({ role }).eq('id', req.params.id).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// PATCH /admin/users/:id — update user profile (name, department, year, points)
app.patch('/admin/users/:id', authenticate, requireAdmin, async (req, res) => {
    const { name, department, academic_year, total_points } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (department !== undefined) updates.department = department;
    if (academic_year !== undefined) updates.academic_year = academic_year;
    if (total_points !== undefined) updates.total_points = parseInt(total_points);

    const { data, error } = await supabaseAdmin
        .from('users').update(updates).eq('id', req.params.id).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// POST /admin/users/:id/reset-password — explicitly reset a user's password
app.post('/admin/users/:id/reset-password', authenticate, requireAdmin, async (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    const { error } = await supabaseAdmin.auth.admin.updateUserById(req.params.id, { password: newPassword });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Password updated successfully' });
});

// DELETE /admin/users/:id — delete user from users table + auth
app.delete('/admin/users/:id', authenticate, requireAdmin, async (req, res) => {
    const uid = req.params.id;
    await supabaseAdmin.from('users').delete().eq('id', uid);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(uid);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'User deleted' });
});

// GET /admin/assignments — all assignments across all educators
app.get('/admin/assignments', authenticate, requireAdmin, async (req, res) => {
    const { data, error } = await supabaseAdmin
        .from('assignments')
        .select('*, users!assignments_created_by_fkey(name, email)')
        .order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json(data || []);
});

// DELETE /admin/assignments/:id
app.delete('/admin/assignments/:id', authenticate, requireAdmin, async (req, res) => {
    const { error } = await supabaseAdmin.from('assignments').delete().eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Deleted' });
});

// PATCH /admin/assignments/:id/publish
app.patch('/admin/assignments/:id/publish', authenticate, requireAdmin, async (req, res) => {
    const { is_published } = req.body;
    const { data, error } = await supabaseAdmin
        .from('assignments').update({ is_published }).eq('id', req.params.id).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// GET /admin/submissions — system-wide submissions
app.get('/admin/submissions', authenticate, requireAdmin, async (req, res) => {
    const { data, error } = await supabaseAdmin
        .from('submissions')
        .select('id, status, submitted_at, code, language, user_id, assignment_id, users(name, email), assignments(title)')
        .order('submitted_at', { ascending: false })
        .limit(200);
    if (error) return res.status(400).json({ error: error.message });
    res.json(data || []);
});

// GET /admin/certificates — system-wide certificates
app.get('/admin/certificates', authenticate, requireAdmin, async (req, res) => {
    const { data, error } = await supabaseAdmin
        .from('certificates')
        .select(`
            *,
            awarded_to_user:users!awarded_to(name, email),
            issued_by_user:users!issued_by(name, email)
        `)
        .order('issued_on', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json(data || []);
});

// DELETE /admin/certificates/:id — explicit forceful delete mapping
app.delete('/admin/certificates/:id', authenticate, requireAdmin, async (req, res) => {
    const { error } = await supabaseAdmin.from('certificates').delete().eq('id', req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Deleted certificate' });
});

// GET /admin/settings — fetch all platform-wide settings (Role-aware: educators/students can read)
app.get('/admin/settings', authenticate, async (req, res) => {
    const { data, error } = await supabaseAdmin.from('platform_settings').select('*');
    if (error) return res.status(400).json({ error: error.message });
    
    // Map array to object for easier consumption
    const settings = {};
    (data || []).forEach(s => { settings[s.key] = s.value; });
    
    // Provide defaults if table is empty or missing keys
    const defaults = {
        educator_create_assignments_enabled: true,
        educator_verify_certificates_enabled: true,
        educator_post_announcements_enabled: true,
        student_ai_tutor_enabled: true,
        student_leaderboard_visible: true,
        auto_cert_enabled: false,
        auto_cert_threshold_count: 5,
        auto_cert_threshold_streak: 7
    };
    
    res.json({ ...defaults, ...settings });
});

// PATCH /admin/settings — update platform-wide settings
app.patch('/admin/settings', authenticate, requireAdmin, async (req, res) => {
    try {
        const updates = req.body; 
        const promises = Object.entries(updates).map(([key, value]) => {
            return supabaseAdmin.from('platform_settings').upsert({ 
                key, 
                value, 
                updated_at: new Date().toISOString() 
            }, { onConflict: 'key' });
        });

        const results = await Promise.all(promises);
        const firstError = results.find(r => r.error);
        if (firstError) {
            console.error("Settings Update Error:", firstError.error);
            return res.status(400).json({ error: firstError.error.message });
        }
        
        res.json({ success: true });
    } catch (err) {
        console.error("Settings Patch Exception:", err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

