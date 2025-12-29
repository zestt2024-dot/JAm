const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const { exec } = require('child_process');
const app = express();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://zestt2024_db_user:IqjjmkpYTVPj1hGB@cluster0.vivqph6.mongodb.net/?appName=Cluster0";
mongoose.connect(MONGO_URI).then(() => console.log("✅ Database Connected")).catch(err => console.error(err));

const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false }
}));

let globalConfig = { theme: 'dark', lab_status: 'online' };
let guestbookPosts = [];

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const escapeHTML = (str) => {
    if (!str) return "";
    return str.replace(/[&<>"']/g, (m) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
};

app.use((req, res, next) => {
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Content-Security-Policy", "default-src * 'unsafe-inline' 'unsafe-eval';");
    next();
});

const THEME = `
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&family=Share+Tech+Mono&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
<link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css">
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/toastify-js"></script>
<style>
    :root { --bg-primary: #0a0a0c; --bg-secondary: #16161a; --border-color: #2d2d35; --text-main: #ffffff; --accent: #00ffc8; --highlight: #00ffc820; }
    body { background: var(--bg-primary); color: var(--text-main); font-family: 'Space Grotesk', sans-serif; direction: rtl; margin: 0; }
    .navbar { background: var(--bg-secondary); border-bottom: 1px solid var(--border-color); position: sticky; top: 0; z-index: 1050; }
    .sidebar { background: var(--bg-secondary); border-left: 1px solid var(--border-color); min-height: calc(100vh - 56px); padding: 20px; position: sticky; top: 56px; }
    @media (max-width: 768px) { .sidebar { min-height: auto; border-left: none; border-bottom: 1px solid var(--border-color); position: relative; top: 0; display: flex !important; flex-direction: row !important; overflow-x: auto; padding: 10px; } .nav-link span { display: none; } }
    .nav-link { color: #94a3b8; padding: 12px; border-radius: 8px; margin-bottom: 5px; transition: 0.3s; display: flex; align-items: center; text-decoration: none; }
    .nav-link:hover, .nav-link.active { background: var(--highlight); color: var(--accent); }
    .card { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 12px; }
    .code-box { background: #000; padding: 15px; border-radius: 10px; font-family: 'Share Tech Mono'; color: var(--accent); border: 1px solid var(--border-color); overflow-x: auto; }
    .accent { color: var(--accent) !important; }
    .btn-primary { background: var(--accent); border: none; color: #000; font-weight: bold; }
</style>
<script>
    function showStatus(msg, type='success') {
        Toastify({ text: msg, duration: 4000, style: { background: type === 'error' ? '#441111' : '#16161a', border: '1px solid ' + (type === 'error' ? '#ff4444' : '#00ffc8') } }).showToast();
    }
    window.onload = () => {
        const p = new URLSearchParams(window.location.search);
        if(p.has('msg')) showStatus(p.get('msg'));
        if(p.has('err')) showStatus(p.get('err'), 'error');
    };
</script>
`;

const render = (res, title, content) => {
    const user = res.req.cookies.session ? JSON.parse(res.req.cookies.session) : null;
    res.send(`<html><head>${THEME}<title>IT Gate | ${title}</title></head><body>
            <nav class="navbar navbar-expand px-3"><div class="container-fluid"><span class="navbar-brand fw-bold accent"><i class="fas fa-shield-virus"></i> IT GATE LABS</span>
            ${user ? `<div class="ms-auto"><a href="/logout" class="btn btn-sm btn-outline-danger px-3">EXIT</a></div>` : ''}</div></nav>
            <div class="container-fluid"><div class="row">
            <div class="col-md-3 col-lg-2 p-0"><div class="sidebar d-flex flex-column">
                <a href="/dashboard" class="nav-link"><i class="fas fa-th-large"></i> <span>Dashboard</span></a>
                <a href="/search" class="nav-link"><i class="fas fa-search"></i> <span>L1: Search</span></a>
                <a href="/guestbook" class="nav-link"><i class="fas fa-pen-nib"></i> <span>L2: Guestbook</span></a>
                <a href="/network" class="nav-link"><i class="fas fa-network-wired"></i> <span>L3: Network</span></a>
                <a href="/logout-page" class="nav-link"><i class="fas fa-door-open"></i> <span>L4: Exit Gate</span></a>
                <a href="/settings" class="nav-link"><i class="fas fa-user-cog"></i> <span>L5: Config</span></a>
                <hr class="border-secondary my-2">
                <a href="/admin/database/dump" class="nav-link text-danger"><i class="fas fa-database"></i> <span>Database</span></a>
            </div></div>
            <div class="col-md-9 col-lg-10 p-3 p-md-5"><div class="card p-4 shadow-lg border-0">${content}</div></div>
            </div></div></body></html>`);
};


app.get('/', (req, res) => res.redirect('/login'));

app.get('/login', (req, res) => {
    res.send(`${THEME} <body class="d-flex align-items-center justify-content-center bg-black" style="height:100vh;">
        <div class="card p-4 p-md-5 shadow-lg" style="width:100%; max-width:400px; border-bottom: 4px solid var(--accent);">
            <h2 class="text-center mb-4 accent fw-bold">OPERATIVE LOGIN</h2>
            <form action="/login" method="POST">
                <div class="mb-3"><input name="user" class="form-control text-white" style="background:#000" placeholder="Username" required></div>
                <div class="mb-4"><input name="pass" type="password" class="form-control text-white" style="background:#000" placeholder="Password" required></div>
                <button class="btn btn-primary w-100 py-2">AUTHORIZE</button>
            </form>
            <p class="mt-4 text-center small text-white">New Agent? <a href="/register" class="accent">Register Here</a></p>
        </div>
    </body>`);
});

app.post('/login', async (req, res) => {
    try {
        const found = await User.findOne({ username: req.body.user, password: req.body.pass });
        if (found) {
            res.cookie('session', JSON.stringify(found));
            res.redirect('/dashboard?msg=Authentication Successful');
        } else res.redirect('/login?err=Unauthorized');
    } catch (e) { res.redirect('/login?err=Login Error'); }
});

app.get('/register', (req, res) => {
    res.send(`${THEME} <body class="d-flex align-items-center justify-content-center bg-black" style="height:100vh;">
        <div class="card p-4 shadow-lg" style="max-width:400px; width:100%;">
            <h2 class="text-center accent fw-bold mb-4">AGENT SIGNUP</h2>
            <form action="/register" method="POST">
                <input name="user" class="form-control mb-3 text-white" style="background:#000" placeholder="Choose Username" required>
                <input name="pass" type="password" class="form-control mb-4 text-white" style="background:#000" placeholder="Set Password" required>
                <button class="btn btn-primary w-100">CREATE ACCOUNT</button>
            </form>
            <p class="mt-3 text-center"><a href="/login" class="text-white small">Back to Login</a></p>
        </div>
    </body>`);
});

app.post('/register', async (req, res) => {
    try {
        const exists = await User.findOne({ username: req.body.user });
        if (exists) return res.redirect('/register?err=Username Taken');
        await new User({ username: req.body.user, password: req.body.pass, isAdmin: false }).save();
        res.redirect('/login?msg=Account Created Successfully');
    } catch (e) { res.redirect('/register?err=Registration Failed'); }
});


app.get('/search', (req, res) => {
    const q = escapeHTML(req.query.q || "");
    render(res, "Search", `<h3 class="accent mb-3">L1: Secure Search</h3><form action="/search" class="input-group"><input name="q" class="form-control text-white" style="background:#000" value="${q}"><button class="btn btn-primary">SCAN</button></form><div class="code-box mt-4">Safe Result: ${q}</div>`);
});

app.get('/guestbook', (req, res) => {
    if (req.query.msg) guestbookPosts.push(escapeHTML(req.query.msg));
    render(res, "Guestbook", `<h3 class="accent mb-3">L2: Secure Logs</h3><form><textarea name="msg" class="form-control mb-3 text-white" style="background:#000" placeholder="New Log..."></textarea><button class="btn btn-primary">COMMIT</button></form><div class="code-box mt-3">${guestbookPosts.map(p => `<div>> ${p}</div>`).join('')}</div>`);
});

app.get('/network', (req, res) => {
    const host = req.query.host || "";
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (host && ipRegex.test(host)) {
        exec(`ping -c 1 ${host}`, (err, stdout) => render(res, "Network", `<pre class="code-box">${stdout}</pre>`));
    } else render(res, "Network", `<h3 class="accent mb-3">L3: Network Ping</h3><form><input name="host" class="form-control mb-3 text-white" style="background:#000" placeholder="127.0.0.1"><button class="btn btn-primary w-100">EXECUTE</button></form>`);
});

app.get('/logout-page', (req, res) => render(res, "Exit", `<div class="text-center py-5"><a href="/redirect?url=/login" class="btn btn-outline-danger px-5">SECURE LOGOUT</a></div>`));

app.get('/redirect', (req, res) => {
    const url = req.query.url;
    if (url && url.startsWith('/')) res.redirect(url);
    else res.status(403).send("Forbidden: External redirection is disabled.");
});

app.post('/settings', (req, res) => {
    try {
        const data = JSON.parse(req.body.json);
        for (let key in data) { if (key === '__proto__' || key === 'constructor') continue; globalConfig[key] = data[key]; }
        res.redirect('/dashboard?msg=Config Updated');
    } catch (e) { res.redirect('/settings?err=Invalid JSON'); }
});

app.get('/settings', (req, res) => render(res, "Settings", `<h3 class="accent mb-3">L5: System Config</h3><form action="/settings" method="POST"><textarea name="json" class="form-control mb-3 text-white" style="background:#000" rows="5">{"theme":"dark"}</textarea><button class="btn btn-primary w-100">SAVE CONFIG</button></form>`));

app.get('/dashboard', (req, res) => {
    if (!req.cookies.session) return res.redirect('/login');
    const user = JSON.parse(req.cookies.session);
    const isAdmin = user.isAdmin || globalConfig.isAdmin;
    render(res, "Dashboard", `<h2 class="fw-bold">Welcome, <span class="accent">${user.username}</span></h2><div class="card p-4 mt-3 text-center border-secondary shadow-sm"><small class="text-white d-block mb-1">PRIVILEGE LEVEL</small><h4 class="${isAdmin ? 'text-danger' : 'accent'} fw-bold mb-0">${isAdmin ? 'SYSTEM ROOT' : 'STUDENT AGENT'}</h4></div>`);
});

app.get('/admin/database/dump', async (req, res) => {
    const user = req.cookies.session ? JSON.parse(req.cookies.session) : {};
    if (user.isAdmin || globalConfig.isAdmin) {
        const all = await User.find({}, { password: 1, username: 1, isAdmin: 1 });
        render(res, "Database", `<h3 class="text-danger mb-4">EXFILTRATED DATA</h3><pre class="code-box">${JSON.stringify(all, null, 2)}</pre>`);
    } else render(res, "Denied", `<div class="text-center py-5"><h1 class="text-danger">403</h1><p>Access Denied: Admin Rights Required</p></div>`);
});

app.get('/logout', (req, res) => { res.clearCookie('session'); res.redirect('/login'); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Secured Lab with Hidden NoSQL live on ${PORT}`));