const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
};

const authorize = (roles = []) => {
    const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    return async (req, res, next) => {
        const { data: profile, error } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('id', req.user.id)
            .single();

        if (error || !profile || !roles.includes(profile.role)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }

        req.user.role = profile.role;
        next();
    };
};

module.exports = { authenticate, authorize };
