const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    res.cookie('session_id', 'FLAG{JS_COOKIE_MONSTER_2025}', { httpOnly: false });
    next();
});

let comments = [{ user: "Admin", text: "Dear Enginners" }];
let config = { isAdmin: false }; 

const headerStyle = `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { 
            background-color: #ffffff; 
            color: #1a1a1a; 
            font-family: 'Segoe UI', Tahoma, sans-serif; 
            direction: rtl; 
            padding-bottom: 50px;
        }
        .card { 
            background-color: #1a1a1a; 
            border: none; 
            border-radius: 20px; 
            transition: 0.3s; 
            color: #ffffff;
            height: 100%;
        }
        .card:hover { 
            transform: translateY(-10px); 
            box-shadow: 0 15px 30px rgba(0,0,0,0.3); 
        }
        .card h3 { color: #58a6ff; font-weight: bold; }
        .badge { font-size: 0.75rem; padding: 6px 15px; border-radius: 50px; }
        .btn-primary { background-color: #238636; border: none; padding: 10px 25px; }
        .btn-dark-custom { background-color: #1a1a1a; color: white; border-radius: 10px; }
        .flag-box { 
            background: #f1f3f5; 
            border-right: 5px solid #1a1a1a; 
            padding: 20px; 
            border-radius: 10px; 
            font-family: monospace; 
            color: #d63384; 
            text-align: left; 
            direction: ltr; 
        }
        pre { white-space: pre-wrap; word-wrap: break-word; }
        
        @media (max-width: 767.98px) {
            .col-mobile-100 {
                flex: 0 0 100%;
                max-width: 100%;
                margin-bottom: 20px;
            }
        }
    </style>
`;

app.get('/', (req, res) => {
    res.send(`
        ${headerStyle}
        <div class="container py-5">
            <header class="text-center mb-5">
                <h1 class="display-4 fw-bold">🛡️IT Gate Academy</h1>
                <p class="text-muted lead"> With Eng Ahmed Gamal  </p>
            </header>
            
            <div class="row g-4">
                <div class="col-md-4 col-mobile-100">
                    <a href="/search?q=Guest" class="text-decoration-none">
                        <div class="card p-4"><h3>Level 1</h3><p class="opacity-75">Reflected XSS</p><span class="badge bg-success w-50">Easy</span></div>
                    </a>
                </div>
                <div class="col-md-4 col-mobile-100">
                    <a href="/guestbook" class="text-decoration-none">
                        <div class="card p-4"><h3>Level 2</h3><p class="opacity-75">Stored XSS</p><span class="badge bg-warning text-dark w-50">Medium</span></div>
                    </a>
                </div>
                <div class="col-md-4 col-mobile-100">
                    <a href="/ping" class="text-decoration-none">
                        <div class="card p-4"><h3>Level 3</h3><p class="opacity-75">Command Injection</p><span class="badge bg-danger w-50">Critical</span></div>
                    </a>
                </div>
                <div class="col-md-4 col-mobile-100">
                    <a href="/logout-page" class="text-decoration-none">
                        <div class="card p-4 border border-info"><h3>Level 4</h3><p class="opacity-75">Open Redirect</p><span class="badge bg-info text-dark w-50">Phishing</span></div>
                    </a>
                </div>
                <div class="col-md-4 col-mobile-100">
                    <a href="/profile?user=Guest" class="text-decoration-none">
                        <div class="card p-4 border border-info"><h3>Level 5</h3><p class="opacity-75">Cookie Hijacking</p><span class="badge bg-info text-dark w-50">Session</span></div>
                    </a>
                </div>
                <div class="col-md-4 col-mobile-100">
                    <a href="/admin-panel" class="text-decoration-none">
                        <div class="card p-4 border border-danger"><h3>Level 6</h3><p class="opacity-75">Proto-Pollution</p><span class="badge bg-dark border w-50 text-white">Advanced</span></div>
                    </a>
                </div>
            </div>
        </div>
    `);
});

app.get('/search', (req, res) => {
    const q = req.query.q || "";
    renderInside(res, "نتائج البحث", `نتائج لـ: ${q}`, "ابحث عن أي شيء...");
});

app.get('/guestbook', (req, res) => {
    let list = comments.map(c => `<li><b>${c.user}:</b> ${c.text}</li>`).join('');
    renderInside(res, "سجل الزوار", `<ul>${list}</ul>`, "اترك بصمتك هنا...");
});

app.get('/ping', (req, res) => {
    const host = req.query.host;
    if (host) {
        exec(`ping -c 1 ${host}`, (err, stdout) => { renderInside(res, "Network Tool", `<pre>${stdout || err}</pre>`, "أدخل IP السيرفر..."); });
    } else {
        renderInside(res, "Network Tool", "بانتظار العنوان...", "أدخل IP السيرفر...");
    }
});

app.get('/logout-page', (req, res) => {
    res.send(`${headerStyle}<div class="container py-5 text-center"><div class="card p-5 mx-auto shadow" style="max-width: 500px;"><h3>سيتم تسجيل خروجك</h3><p class="text-light opacity-50">اضغط للتأكيد وسنقوم بتوجيهك.</p><a href="/redirect?url=/" class="btn btn-danger mt-3">خروج آمن</a></div></div>`);
});
app.get('/redirect', (req, res) => { res.redirect(req.query.url); });

app.get('/profile', (req, res) => {
    const user = req.query.user || "Guest";
    res.send(`${headerStyle}<div class="container py-5"><a href="/" class="btn btn-dark mb-4 px-4"> < العودة</a><div class="card p-5"><h2>Welcome, <span id="name-tag"></span></h2><p class="text-info mt-3">تنبيه: الكوكيز الخاصة بك معروضة لهذا المستخدم فقط.</p><script>document.getElementById('name-tag').innerHTML = "${user}";</script></div></div>`);
});

app.get('/admin-panel', (req, res) => {
    try { const data = JSON.parse(req.query.data || '{}'); for(let key in data) { config[key] = data[key]; } } catch(e) {}
    let result = config.isAdmin ? `<div class="bg-success p-3 rounded text-white">🏆 FLAG{PROTO_POLLUTION_GOD_MODE}</div>` : `<div class="bg-danger p-3 rounded text-white">Access Denied: Admin Only</div>`;
    renderInside(res, "لوحة التحكم", result, "أدخل بيانات JSON للتحديث...");
});

function renderInside(res, title, content, placeholder) {
    res.send(`${headerStyle}<div class="container py-5"><a href="/" class="btn btn-dark mb-4 px-4"> < العودة</a><div class="card p-5 shadow"><h2>${title}</h2><form class="my-4"><div class="input-group"><input name="${title === 'Network Tool' ? 'host' : (title === 'لوحة التحكم' ? 'data' : 'q')}" class="form-control" placeholder="${placeholder}"><button class="btn btn-primary px-4">إرسال</button></div></form><div class="flag-box">${content}</div></div></div>`);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Professional Lab running on port ${PORT}`));