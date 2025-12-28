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

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req, res, next) => {
    res.setHeader("X-XSS-Protection", "0");
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
    :root {
        --bg-primary: #0a0a0c; --bg-secondary: #16161a; --border-color: #2d2d35;
        --text-main: #ffffff; --accent: #00ffc8; --highlight: #00ffc820;
    }
    body { background: var(--bg-primary); color: var(--text-main); font-family: 'Space Grotesk', sans-serif; direction: rtl; margin: 0; }
    
    .navbar { background: var(--bg-secondary); border-bottom: 1px solid var(--border-color); sticky; top: 0; z-index: 1050; }
    
    .sidebar { 
        background: var(--bg-secondary); border-left: 1px solid var(--border-color); 
        min-height: calc(100vh - 56px); padding: 20px; position: sticky; top: 56px;
    }

    /* تحسين التجاوب للموبايل */
    @media (max-width: 768px) {
        .sidebar { min-height: auto; border-left: none; border-bottom: 1px solid var(--border-color); position: relative; top: 0; display: flex !important; flex-direction: row !important; overflow-x: auto; white-space: nowrap; padding: 10px; }
        .nav-link { margin-bottom: 0 !important; margin-left: 10px; padding: 8px 15px !important; }
        .nav-link span { display: none; } /* إخفاء النص في الموبايل والاعتماد على الأيقونات */
    }

    .nav-link { color: #94a3b8; padding: 12px; border-radius: 8px; margin-bottom: 5px; transition: 0.3s; display: flex; align-items: center; text-decoration: none; font-size: 0.95rem; }
    .nav-link:hover, .nav-link.active { background: var(--highlight); color: var(--accent); }
    .nav-link i { margin-left: 10px; font-size: 1.1rem; }
    
    .card { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 12px; }
    .code-box { background: #000; padding: 15px; border-radius: 10px; font-family: 'Share Tech Mono'; color: var(--accent); border: 1px solid var(--border-color); overflow-x: auto; }
    .accent { color: var(--accent) !important; }
    .btn-primary { background: var(--accent); border: none; color: #000; font-weight: bold; }
    .table-responsive { border-radius: 8px; overflow: hidden; }
    
    .toastify { background: #16161a !important; border: 1px solid var(--accent) !important; color: var(--accent) !important; box-shadow: 0 0 15px rgba(0,255,200,0.2); border-radius: 8px !important; }
</style>

<script>
    function showStatus(msg, type='success') {
        Toastify({
            text: msg, duration: 4000, gravity: "top", position: "right",
            style: { background: type === 'error' ? '#441111' : '#16161a', border: '1px solid ' + (type === 'error' ? '#ff4444' : '#00ffc8') }
        }).showToast();
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
    res.send(`
        <html>
        <head>${THEME}<title>IT Gate | ${title}</title></head>
        <body>
            <nav class="navbar navbar-expand px-3">
                <div class="container-fluid">
                    <span class="navbar-brand fw-bold accent"><i class="fas fa-shield-virus"></i> IT GATE LABS</span>
                    ${user ? `<div class="ms-auto"><a href="/logout" class="btn btn-sm btn-outline-danger px-3">EXIT</a></div>` : ''}
                </div>
            </nav>
            <div class="container-fluid">
                <div class="row">
                    <div class="col-md-3 col-lg-2 p-0">
                        <div class="sidebar d-flex flex-column">
                            <a href="/dashboard" class="nav-link"><i class="fas fa-th-large"></i> <span>Dashboard</span></a>
                            <a href="/search" class="nav-link"><i class="fas fa-search"></i> <span>L1: Search XSS</span></a>
                            <a href="/guestbook" class="nav-link"><i class="fas fa-pen-nib"></i> <span>L2: Stored XSS</span></a>
                            <a href="/network" class="nav-link"><i class="fas fa-network-wired"></i> <span>L3: RCE Inject</span></a>
                            <a href="/logout-page" class="nav-link"><i class="fas fa-door-open"></i> <span>L4: Redirect</span></a>
                            <a href="/settings" class="nav-link"><i class="fas fa-user-cog"></i> <span>L5&6: Prototype</span></a>
                            <hr class="border-secondary my-2">
                            <a href="/admin/database/dump" class="nav-link text-danger"><i class="fas fa-database"></i> <span>DB Exfiltration</span></a>
                        </div>
                    </div>
                    <div class="col-md-9 col-lg-10 p-3 p-md-5">
                        <div class="card p-4 shadow-lg border-0">${content}</div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
};


app.get('/', (req, res) => res.redirect('/login'));

app.get('/login', (req, res) => {
    res.send(`${THEME} <body class="d-flex align-items-center justify-content-center bg-black" style="height:100vh;">
        <div class="card p-4 p-md-5 shadow-lg" style="width:100%; max-width:400px; border-bottom: 4px solid var(--accent);">
            <h2 class="text-center mb-4 accent fw-bold">OPERATIVE LOGIN</h2>
            <form action="/login" method="POST">
                <div class="mb-3"><input name="user" class="form-control text-white" style="background:#000" placeholder="Username"></div>
                <div class="mb-4"><input name="pass" type="password" class="form-control text-white" style="background:#000" placeholder="Password"></div>
                <button class="btn btn-primary w-100 py-2">AUTHORIZE</button>
            </form>
            <p class="mt-4 text-center small text-white">New Agent? <a href="/register" class="accent">Initial Registration</a></p>
        </div>
    </body>`);
});

app.post('/login', async (req, res) => {
    const found = await User.findOne({ username: req.body.user, password: req.body.pass });
    if (found) {
        res.cookie('session', JSON.stringify(found));
        res.redirect('/dashboard?msg=Login Successful');
    } else res.redirect('/login?err=Unauthorized Access');
});

app.get('/register', (req, res) => {
    res.send(`${THEME} <body class="d-flex align-items-center justify-content-center bg-black" style="height:100vh;">
        <div class="card p-4 p-md-5 shadow-lg" style="width:100%; max-width:400px; border-bottom: 4px solid var(--accent);">
            <h2 class="text-center mb-4 text-white fw-bold">AGENT SIGNUP</h2>
            <form action="/register" method="POST">
                <input name="user" class="form-control mb-3 text-white" style="background:#000" placeholder="Choose Username" required>
                <input name="pass" type="password" class="form-control mb-4 text-white" style="background:#000" placeholder="Set Password" required>
                <button class="btn btn-primary w-100 py-2">REGISTER</button>
            </form>
        </div>
    </body>`);
});

app.post('/register', async (req, res) => {
    try {
        await new User({ username: req.body.user, password: req.body.pass }).save();
        res.redirect('/login?msg=Account Created');
    } catch (e) { res.redirect('/register?err=Username Already Exists'); }
});

app.get('/dashboard', (req, res) => {
    if (!req.cookies.session) return res.redirect('/login');
    const user = JSON.parse(req.cookies.session);
    const isAdmin = user.isAdmin || globalConfig.isAdmin;
    render(res, "Dashboard", `
        <h2 class="fw-bold mb-4">Welcome, <span class="accent">${user.username}</span></h2>
        <div class="row g-3">
            <div class="col-sm-6">
                <div class="card p-4 text-center border-secondary shadow-sm">
                    <small class="text-white d-block mb-1">PRIVILEGE LEVEL</small>
                    <h4 class="${isAdmin ? 'text-danger' : 'text-info'} fw-bold mb-0">${isAdmin ? 'SYSTEM ROOT' : 'STUDENT AGENT'}</h4>
                </div>
            </div>
            <div class="col-sm-6">
                <div class="card p-4 text-center border-secondary shadow-sm">
                    <small class="text-white d-block mb-1">NETWORK STATUS</small>
                    <h4 class="accent fw-bold mb-0">ENCRYPTED</h4>
                </div>
            </div>
        </div>
        ${isAdmin ? `
            <div class="p-4 mt-4 border border-success rounded text-center" style="background: rgba(0,255,200,0.05);">
                <h4 class="accent fw-bold"><i class="fas fa-trophy me-2"></i> CHALLENGE MASTERED</h4>
                <div class="code-box mt-3 fs-5">FLAG{MASTER_OF_RESPONSIVE_EXPLOITS_2025}</div>
            </div>
        ` : `<div class="p-4 mt-4 border border-secondary rounded text-center text-white fw-bold">Access targets from the menu to elevate permissions.</div>`}
    `);
});

app.get('/search', (req, res) => {
    const q = req.query.q || "";
    render(res, "L1: XSS", `
        <h3 class="accent mb-3"><i class="fas fa-search me-2"></i> Level 1: Reflected XSS</h3>
        <p class="text-white fw-bold mb-4">TARGET: Use the search query to execute a script. (e.g. &lt;script&gt;showStatus('Hacked')&lt;/script&gt;)</p>
        <form action="/search" class="input-group">
            <input name="q" class="form-control text-white" style="background:#000" placeholder="Search archives..." value="${q}">
            <button class="btn btn-primary">SCAN</button>
        </form>
        ${q ? `<div class="code-box mt-4">Scan Results for: ${q}</div>` : ''}
    `);
});

app.get('/guestbook', (req, res) => {
    if (req.query.msg) guestbookPosts.push(req.query.msg);
    render(res, "L2: Stored XSS", `
        <h3 class="accent mb-3"><i class="fas fa-pen-nib me-2"></i> Level 2: Stored XSS</h3>
        <p class="text-white fw-bold mb-4">TARGET: Inject a persistent payload into the system logs.</p>
        <form class="mb-4">
            <textarea name="msg" class="form-control mb-3 text-white" style="background:#000" rows="3" placeholder="Enter log entry..."></textarea>
            <button class="btn btn-primary px-4">COMMIT LOG</button>
        </form>
        <div class="code-box">
            <ul class="list-unstyled mb-0">${guestbookPosts.map(p => `<li class="border-bottom border-secondary py-2">> ${p}</li>`).join('')}</ul>
        </div>
    `);
});

app.get('/network', (req, res) => {
    const host = req.query.host || "";
    if (host) {
        exec(`ping -c 1 ${host}`, (err, stdout, stderr) => {
            render(res, "L3: RCE", `<h3 class="text-white mb-3">Ping Results:</h3><pre class="code-box fs-6">${stdout || stderr}</pre>`);
        });
    } else {
        render(res, "L3: RCE", `
            <h3 class="accent mb-3"><i class="fas fa-network-wired me-2"></i> Level 3: RCE Injection</h3>
            <p class="text-white fw-bold mb-4">TARGET: Escape the ping command to list files. (e.g. ; ls -la)</p>
            <form><input name="host" class="form-control mb-3 text-white" style="background:#000" placeholder="127.0.0.1"><button class="btn btn-primary w-100">EXECUTE PING</button></form>
        `);
    }
});

app.get('/logout-page', (req, res) => {
    render(res, "L4: Redirect", `
        <h3 class="accent mb-3"><i class="fas fa-door-open me-2"></i> Level 4: Open Redirect</h3>
        <p class="text-white fw-bold mb-4">TARGET: Manipulate the exit URL to redirect victims. (e.g. ?url=https://evil.com)</p>
        <div class="text-center py-5"><a href="/redirect?url=/login" class="btn btn-outline-danger px-5 py-2 fw-bold">SECURE EXIT</a></div>
    `);
});

app.get('/redirect', (req, res) => res.redirect(req.query.url));

app.get('/settings', (req, res) => {
    render(res, "L5/6: Prototype", `
        <h3 class="accent mb-3"><i class="fas fa-user-cog me-2"></i> Level 5 & 6: Prototype Pollution</h3>
        <p class="text-white fw-bold mb-4">TARGET: Poison the global object to grant yourself Admin rights.</p>
        <form action="/settings" method="POST">
            <textarea name="json" class="form-control mb-3 text-white" style="background:#000" rows="6" placeholder='{"theme": "dark"}'></textarea>
            <button class="btn btn-primary w-100">UPDATE GLOBAL CONFIG</button>
        </form>
    `);
});

app.post('/settings', (req, res) => {
    try {
        const data = JSON.parse(req.body.json);
        for (let key in data) { globalConfig[key] = data[key]; }
        res.redirect('/dashboard?msg=Prototype Poisoning Successful!');
    } catch (e) { res.redirect('/settings?err=Invalid JSON Structure'); }
});

app.get('/admin/database/dump', async (req, res) => {
    const user = req.cookies.session ? JSON.parse(req.cookies.session) : {};
    if (user.isAdmin || globalConfig.isAdmin) {
        const all = await User.find({});
        let rows = all.map(u => `<tr><td>${u.username}</td><td class="accent">${u.password}</td><td>${u.isAdmin}</td></tr>`).join('');
        render(res, "DB Dump", `
            <h3 class="text-danger fw-bold mb-4"><i class="fas fa-skull-crossbones me-2"></i> DATABASE EXFILTRATION</h3>
            <div class="table-responsive">
                <table class="table table-dark table-hover border-secondary">
                    <thead><tr><th>Agent</th><th>Password</th><th>Root?</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `);
    } else {
        render(res, "Access Denied", `<div class="text-center py-5"><h1 class="text-danger fw-bold">403</h1><h3 class="text-white">ACCESS DENIED</h3><p class="text-white">Insufficient privilege level to view database.</p></div>`);
    }
});

app.get('/logout', (req, res) => { res.clearCookie('session'); res.redirect('/login?msg=Session Terminated'); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Responsive Lab live on port ${PORT}`));