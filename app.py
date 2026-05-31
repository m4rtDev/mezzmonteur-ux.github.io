import sqlite3
import secrets, time, hashlib
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, render_template, request, jsonify, session, redirect, url_for, g

ADMIN_ROUTE = "web4856"
ADMIN_PASSWORD = "r$9_C|T4JYU{03lJ^" # UHQQQQQ PASSWORDDDD
LOGIN_RATE_LIMIT = 5
SESSION_TIMEOUT = 3600

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)

DB_PATH = "instance/visits.db"

def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.executescript("""
            CREATE TABLE IF NOT EXISTS visits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                page TEXT NOT NULL,
                browser TEXT NOT NULL,
                device TEXT NOT NULL,
                referrer TEXT NOT NULL DEFAULT 'direct'
            );
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                ip TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
                created_at TEXT NOT NULL,
                reply TEXT,
                replied_at TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
        """)
        g.db.commit()
    return g.db

@app.teardown_appcontext
def close_db(exception):
    db = g.pop("db", None)
    if db is not None:
        db.close()

def site_login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get("user_id"):
            return jsonify({"ok": False, "error": "Non connecté"}), 401
        return f(*args, **kwargs)
    return decorated

def admin_login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get("admin_logged_in"):
            return redirect(url_for("admin_login"))
        if time.time() - session.get("admin_login_time", 0) > SESSION_TIMEOUT:
            session.clear()
            return redirect(url_for("admin_login"))
        session["admin_login_time"] = time.time()
        return f(*args, **kwargs)
    return decorated

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/visit", methods=["POST"])
def track_visit():
    db = get_db()
    body = request.get_json(silent=True) or {}
    db.execute(
        "INSERT INTO visits (timestamp, page, browser, device, referrer) VALUES (?, ?, ?, ?, ?)",
        (datetime.now().isoformat(),
         body.get("page", "/"),
         body.get("browser", "Unknown"),
         body.get("device", "Desktop"),
         body.get("referrer", "direct"))
    )
    db.commit()
    return jsonify({"ok": True})

# je pense que le endpoint d'inscription est correct, mais faudrais peut être limiter le debit pour éviter les abus, genre max 5 inscriptions par IP par heure ou un truc du genre
@app.route("/api/register", methods=["POST"])
def register():
    db = get_db()
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    ip = request.remote_addr or "0.0.0.0"

    if len(username) < 2 or len(password) < 4:
        return jsonify({"ok": False, "error": "Pseudo (2+) et mot de passe (4+)"}), 400
    if db.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone():
        return jsonify({"ok": False, "error": "Ce pseudo est déjà pris"}), 400
    h = hashlib.sha256(password.encode()).hexdigest()
    db.execute("INSERT INTO users (username, password, ip, created_at) VALUES (?, ?, ?, ?)",
               (username, h, ip, datetime.now().isoformat()))
    db.commit()
    user = db.execute("SELECT id, username FROM users WHERE username = ?", (username,)).fetchone()
    session["user_id"] = user["id"]
    session["username"] = user["username"]
    return jsonify({"ok": True, "username": user["username"]})

@app.route("/api/login", methods=["POST"])
def site_login():
    db = get_db()
    data = request.get_json(silent=True) or {}
    username = data.get("username") or ""
    password = data.get("password") or ""
    h = hashlib.sha256(password.encode()).hexdigest()
    user = db.execute("SELECT id, username FROM users WHERE username = ? AND password = ?",
                      (username, h)).fetchone()
    if not user:
        return jsonify({"ok": False, "error": "Identifiants incorrects"}), 401
    session["user_id"] = user["id"]
    session["username"] = user["username"]
    return jsonify({"ok": True, "username": user["username"]})

@app.route("/api/logout", methods=["POST"])
def site_logout():
    session.pop("user_id", None)
    session.pop("username", None)
    return jsonify({"ok": True})

@app.route("/api/me")
def site_me():
    if session.get("user_id"):
        return jsonify({"ok": True, "username": session.get("username")})
    return jsonify({"ok": False})

@app.route("/api/reviews", methods=["GET"])
def get_reviews():
    db = get_db()
    rows = db.execute("""
        SELECT r.id, r.content, r.rating, r.created_at, r.reply, r.replied_at, u.username
        FROM reviews r JOIN users u ON r.user_id = u.id
        ORDER BY r.created_at DESC
    """).fetchall()
    res = []
    for r in rows:
        res.append({
            "id": r["id"],
            "username": r["username"],
            "content": r["content"],
            "rating": r["rating"],
            "created_at": datetime.fromisoformat(r["created_at"]).strftime("%d/%m/%Y"),
            "reply": r["reply"],
            "replied_at": datetime.fromisoformat(r["replied_at"]).strftime("%d/%m/%Y") if r["replied_at"] else None
        })
    return jsonify(res)

@app.route("/api/review", methods=["POST"])
@site_login_required
def post_review():
    db = get_db()
    data = request.get_json(silent=True) or {}
    content = (data.get("content") or "").strip()
    rating = data.get("rating", 0)

    if not content or len(content) < 5:
        return jsonify({"ok": False, "error": "Message trop court (5+)"}), 400
    if rating < 1 or rating > 5:
        return jsonify({"ok": False, "error": "Note entre 1 et 5"}), 400
    if db.execute("SELECT id FROM reviews WHERE user_id = ?", (session["user_id"],)).fetchone():
        return jsonify({"ok": False, "error": "Vous avez déjà laissé un avis"}), 400

    db.execute("INSERT INTO reviews (user_id, content, rating, created_at) VALUES (?, ?, ?, ?)",
               (session["user_id"], content, rating, datetime.now().isoformat()))
    db.commit()
    return jsonify({"ok": True})

@app.route(f"/{ADMIN_ROUTE}")
def admin_login():
    if session.get("admin_logged_in"):
        return redirect(url_for("admin_dashboard"))
    return render_template("admin/login.html")

@app.route(f"/{ADMIN_ROUTE}/dashboard")
@admin_login_required
def admin_dashboard():
    return render_template("admin/dashboard.html")

@app.route(f"/{ADMIN_ROUTE}/login", methods=["POST"])
def admin_login_post():
    ip = request.remote_addr or "0.0.0.0"
    attempts = session.get("login_attempts", {})
    now = time.time()
    attempts = {k: v for k, v in attempts.items() if now - v < 60}
    session["login_attempts"] = attempts
    if ip in attempts and len([v for v in attempts.values() if now - v < 60]) >= LOGIN_RATE_LIMIT:
        return jsonify({"ok": False, "error": "Trop de tentatives. Réessayez dans une minute."}), 429
    data = request.get_json(silent=True) or {}
    if data.get("password") == ADMIN_PASSWORD:
        session["admin_logged_in"] = True
        session["admin_login_time"] = time.time()
        session.pop("login_attempts", None)
        return jsonify({"ok": True})
    else:
        attempts[ip] = now
        session["login_attempts"] = attempts
        return jsonify({"ok": False, "error": "Mot de passe incorrect"}), 401

@app.route(f"/{ADMIN_ROUTE}/logout")
def admin_logout():
    session.clear()
    return redirect(url_for("admin_login"))

# states route
@app.route(f"/{ADMIN_ROUTE}/api/stats")
@admin_login_required
def admin_stats():
    db = get_db()
    now = datetime.now()
    today = now.date()
    days_param = request.args.get("days", 30, type=int)
    days_param = max(1, min(365, days_param))

    total = db.execute("SELECT COUNT(*) FROM visits").fetchone()[0]
    today_count = db.execute("SELECT COUNT(*) FROM visits WHERE date(timestamp) = ?", (today.isoformat(),)).fetchone()[0]
    unique = db.execute("SELECT COUNT(DISTINCT browser || device || date(timestamp)) FROM visits").fetchone()[0]
    total_days = db.execute('SELECT COUNT(DISTINCT date(timestamp)) FROM visits').fetchone()[0]
    avg = round(total / total_days) if total_days else 0
    # pas uhq comme sa mais trkl
    five_ago = (now - timedelta(minutes=5)).isoformat()
    active = db.execute("SELECT COUNT(*) FROM visits WHERE timestamp >= ?", (five_ago,)).fetchone()[0]

    labels = []
    line_counts = []
    for i in range(days_param - 1, -1, -1):
        d = (now - timedelta(days=i)).date()
        labels.append(d.strftime("%d %b"))
        c = db.execute("SELECT COUNT(*) FROM visits WHERE date(timestamp) = ?", (d.isoformat(),)).fetchone()[0]
        line_counts.append(c)

    prev_count = 0
    if days_param > 0:
        prev_start = (now - timedelta(days=days_param * 2)).date()
        prev_end = (now - timedelta(days=days_param)).date()
        prev_count = db.execute(
            "SELECT COUNT(*) FROM visits WHERE date(timestamp) >= ? AND date(timestamp) < ?",
            (prev_start.isoformat(), prev_end.isoformat())
        ).fetchone()[0]
    current_count = sum(line_counts)
    trend_pct = 0
    if prev_count > 0:
        trend_pct = round(((current_count - prev_count) / prev_count) * 100)

    browser_rows = db.execute("SELECT browser, COUNT(*) as c FROM visits GROUP BY browser ORDER BY c DESC").fetchall()
    device_rows = db.execute("SELECT device, COUNT(*) as c FROM visits GROUP BY device ORDER BY c DESC").fetchall()
    page_rows = db.execute("SELECT page, COUNT(*) as c FROM visits GROUP BY page ORDER BY c DESC").fetchall()
    ref_rows = db.execute("SELECT referrer, COUNT(*) as c FROM visits GROUP BY referrer ORDER BY c DESC").fetchall()

    recent_rows = db.execute("SELECT timestamp, page, browser, device, referrer FROM visits ORDER BY id DESC LIMIT 30").fetchall()
    recent = []
    for r in recent_rows:
        dt = datetime.fromisoformat(r["timestamp"])
        recent.append({
            "date": dt.strftime("%d/%m/%Y %H:%M"),
            "page": r["page"],
            "browser": r["browser"],
            "device": r["device"],
            "referrer": r["referrer"]
        })

    return jsonify({
        "total": total, "today": today_count, "unique": unique,
        "avg": avg, "active": active, "trend": trend_pct,
        "labels": labels, "lineCounts": line_counts,
        "browsers": [{"label": r["browser"], "value": r["c"]} for r in browser_rows],
        "devices": [{"label": r["device"], "value": r["c"]} for r in device_rows],
        "pages": [{"label": r["page"], "value": r["c"]} for r in page_rows],
        "referrers": [{"label": r["referrer"], "value": r["c"]} for r in ref_rows],
        "recent": recent
    })

@app.route(f"/{ADMIN_ROUTE}/api/reset", methods=["POST"])
@admin_login_required
def admin_reset():
    db = get_db()
    db.execute("DELETE FROM visits")
    db.commit()
    return jsonify({"ok": True})

@app.route(f"/{ADMIN_ROUTE}/api/reviews")
@admin_login_required
def admin_reviews():
    db = get_db()
    rows = db.execute("""
        SELECT r.id, r.content, r.rating, r.created_at, r.reply, r.replied_at,
               u.username, u.ip
        FROM reviews r JOIN users u ON r.user_id = u.id
        ORDER BY r.created_at DESC
    """).fetchall()
    res = []
    for r in rows:
        res.append({
            "id": r["id"], "username": r["username"], "ip": r["ip"],
            "content": r["content"], "rating": r["rating"],
            "created_at": datetime.fromisoformat(r["created_at"]).strftime("%d/%m/%Y %H:%M"),
            "reply": r["reply"],
            "replied_at": datetime.fromisoformat(r["replied_at"]).strftime("%d/%m/%Y %H:%M") if r["replied_at"] else None
        })
    return jsonify(res)

@app.route(f"/{ADMIN_ROUTE}/api/review/<int:rid>/reply", methods=["POST"])
@admin_login_required
def admin_review_reply(rid):
    db = get_db()
    data = request.get_json(silent=True) or {}
    reply = (data.get("reply") or "").strip()
    if not reply:
        return jsonify({"ok": False, "error": "Réponse vide"}), 400
    db.execute("UPDATE reviews SET reply = ?, replied_at = ? WHERE id = ?",
               (reply, datetime.now().isoformat(), rid))
    db.commit()
    return jsonify({"ok": True})

@app.route(f"/{ADMIN_ROUTE}/api/review/<int:rid>/delete", methods=["POST"])
@admin_login_required
def admin_review_delete(rid):
    db = get_db()
    db.execute("DELETE FROM reviews WHERE id = ?", (rid,))
    db.commit()
    return jsonify({"ok": True})

if __name__ == "__main__":
    print("debug: starting flask app")  # TODO: remove this
    print(f"\n  -> http://localhost:5000")
    print(f"  -> http://localhost:5000/{ADMIN_ROUTE}\n")
    app.run(debug=True)
