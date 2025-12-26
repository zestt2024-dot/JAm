const express = require('express');
const { exec } = require('child_process');
const app = express();

app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    res.cookie('session_id', 'FLAG{JS_COOKIE_MONSTER_2025}', { httpOnly: false });
    next();
});

let comments = [{ user: "Admin", text: " ♥︎ Dear Enginners " }];
let config = { isAdmin: false }; 

const headerStyle = `
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background-color: #0d1117; color: #c9d1d9; font-family: 'Segoe UI', sans-serif; direction: rtl; }
        .card { background-color: #161b22; border: 1px solid #30363d; border-radius: 12px; transition: 0.3s; }
        .card:hover { border-color: #58a6ff; transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.5); }
        .btn-primary { background-color: #238636; border: none; }
        .btn-danger { background-color: #da3633; border: none; }
        .nav-link { color: #58a6ff !important; }
        .flag-box { background: #000; border-left: 4px solid #3fb950; padding: 15px; border-radius: 8px; font-family: monospace; color: #3fb950; text-align: left; direction: ltr; }
        h1, h2, h3 { color: #f0f6fc; }
        .badge-new { background-color: #1f6feb; color: white; font-size: 0.7rem; }
    </style>
`;

app.get('/', (req, res) => {
    res.send(`
        ${headerStyle}
        <div class="container py-5 text-center">
            <h1 class="display-4 mb-3">🛡️ JS-PENTEST It Gate Academy</h1>
            <p class="text-secondary mb-5">Eng Ahmed Gamal Lap ♥︎</p>
            <div class="row g-4 text-start">
                <div class="col-md-4"><a href="/search?q=Guest" class="text-decoration-none"><div class="card p-4"><h3>Level 1</h3><p class="text-secondary">Reflected XSS</p><span class="badge bg-success w-50">SOP Bypass</span></div></a></div>
                <div class="col-md-4"><a href="/guestbook" class="text-decoration-none"><div class="card p-4"><h3>Level 2</h3><p class="text-secondary">Stored XSS</p><span class="badge bg-warning text-dark w-50">Database Injection</span></div></a></div>
                <div class="col-md-4"><a href="/ping" class="text-decoration-none"><div class="card p-4"><h3>Level 3</h3><p class="text-secondary">RCE</p><span class="badge bg-danger w-50">System Takeover</span></div></a></div>
                <div class="col-md-4"><a href="/logout-page" class="text-decoration-none"><div class="card p-4 border-info"><h3>Level 4 <span class="badge badge-new">جديد</span></h3><p class="text-secondary">Open Redirect</p><span class="badge bg-info text-dark w-50">Phishing</span></div></a></div>
                <div class="col-md-4"><a href="/profile?user=Guest" class="text-decoration-none"><div class="card p-4 border-info"><h3>Level 5 <span class="badge badge-new">جديد</span></h3><p class="text-secondary">Cookie Hijacking</p><span class="badge bg-info text-dark w-50">Account Takeover</span></div></a></div>
                <div class="col-md-4"><a href="/admin-panel" class="text-decoration-none"><div class="card p-4 border-danger text-danger"><h3>Level 6 <span class="badge badge-new">جديد</span></h3><p class="text-secondary">Proto-Pollution</p><span class="badge bg-danger w-50 text-white">Critical</span></div></a></div>
            </div>
        </div>
    `);
});

app.get('/ping', (req, res) => {
    const host = req.query.host || "";
    if (host) {
        exec(`ping -c 1 ${host}`, (err, stdout) => { renderPage(res, "Network Diagnostics", "أدخل الـ IP للاختبار:", stdout || err, true); });
    } else { renderPage(res, "Network Diagnostics", "أدخل الـ IP للاختبار:", "في انتظار الأوامر..."); }
});

app.get('/logout-page', (req, res) => {
    res.send(`${headerStyle}<div class="container py-5 text-center"><div class="card p-5 border-info mx-auto" style="max-width: 500px;"><h2>تسجيل الخروج</h2><p>هل أنت متأكد؟ سيتم توجيهك بعد الإغلاق.</p><a href="/redirect?url=/" class="btn btn-danger w-100 mt-3">تأكيد وتوجيه</a></div></div>`);
});
app.get('/redirect', (req, res) => { res.redirect(req.query.url); });

app.get('/profile', (req, res) => {
    const user = req.query.user || "Guest";
    res.send(`${headerStyle}<div class="container py-5"><div class="card p-5 border-info"><h2>User Profile: <span id="u"></span></h2><p>بيانات الجلسة مشفرة في المتصفح.</p><script>document.getElementById('u').innerHTML = "${user}";</script></div></div>`);
});

app.get('/admin-panel', (req, res) => {
    try {
        const data = JSON.parse(req.query.data || '{}');
        for(let key in data) { config[key] = data[key]; }
    } catch(e) {}
    
    let content = config.isAdmin 
        ? `<div class="alert alert-success"><h1>🏆 FLAG{PROTO_POLLUTION_MASTER}</h1><p>لقد تلاعبت بأساسات اللغة لتصبح Admin!</p></div>`
        : `<div class="alert alert-danger"><h3>خطأ: ليس لديك صلاحيات Admin</h3><p>حاول التلاعب بـ <code>__proto__</code> لتخطي الحماية.</p></div>`;
    
    res.send(`${headerStyle}<div class="container py-5"><div class="card p-5 border-danger">${content}</div></div>`);
});

function renderPage(res, title, desc, result, isCode = false) {
    res.send(`${headerStyle}<div class="container py-5"><a href="/" class="btn btn-outline-secondary mb-4"> < العودة</a><div class="card p-5"><h2>${title}</h2><p class="text-secondary">${desc}</p><form class="my-4"><div class="input-group"><input name="host" class="form-control bg-dark text-white border-secondary"><button class="btn btn-primary">تنفيذ</button></div></form><div class="flag-box">${result}</div></div></div>`);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Professional Lab running on port ${PORT}`));