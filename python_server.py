from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from http import cookies
from email.message import EmailMessage
import hashlib
import hmac
import json
import mimetypes
import os
import random
import secrets
import smtplib
import sqlite3
import time
import urllib.parse


ROOT = Path(__file__).parent
PORT = int(os.environ.get("PORT", "5000"))
DB_PATH = ROOT / "app.db"
SESSION_SECONDS = 60 * 60 * 24 * 7
PUBLIC_EXTENSIONS = {".html", ".css", ".js", ".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico"}
AUTH_ATTEMPTS = {}
AUTH_WINDOW_SECONDS = 60
MAX_AUTH_ATTEMPTS = 8
VERIFICATION_SECONDS = 60 * 60 * 24


QUESTION_BANK = [
    {
        "subject": "Physics",
        "topic": "Mechanics",
        "level": "beginner",
        "type": "single",
        "marks": 4,
        "question": "A block starts from rest with acceleration 2 m/s². What is its velocity after 5 seconds?",
        "options": ["5 m/s", "8 m/s", "10 m/s", "20 m/s"],
        "answer": "10 m/s",
        "solution": "Use v = u + at. Here u = 0, a = 2, t = 5, so v = 10 m/s.",
    },
    {
        "subject": "Physics",
        "topic": "Mechanics",
        "level": "intermediate",
        "type": "single",
        "marks": 4,
        "question": "A particle moves in a circle of radius 2 m with speed 6 m/s. Find centripetal acceleration.",
        "options": ["9 m/s²", "12 m/s²", "18 m/s²", "36 m/s²"],
        "answer": "18 m/s²",
        "solution": "Centripetal acceleration is v²/r = 36/2 = 18 m/s².",
    },
    {
        "subject": "Physics",
        "topic": "Mechanics",
        "level": "advanced",
        "type": "single",
        "marks": 4,
        "question": "A projectile has range R at 30°. If speed is unchanged and angle becomes 60°, what happens to range?",
        "options": ["It becomes half", "It doubles", "It remains same", "It becomes zero"],
        "answer": "It remains same",
        "solution": "Range is proportional to sin 2θ. sin 60° and sin 120° are equal.",
    },
    {
        "subject": "Physics",
        "topic": "Electrostatics",
        "level": "advanced",
        "type": "numeric",
        "marks": 4,
        "question": "Two identical charges repel with force F at distance r. If distance becomes 2r, force becomes F/n. Find n.",
        "options": [],
        "answer": "4",
        "solution": "By Coulomb's law, force varies as 1/r². Doubling distance makes force one-fourth.",
    },
    {
        "subject": "Chemistry",
        "topic": "Mole Concept",
        "level": "beginner",
        "type": "single",
        "marks": 4,
        "question": "How many moles are present in 18 g of water?",
        "options": ["0.5 mol", "1 mol", "2 mol", "18 mol"],
        "answer": "1 mol",
        "solution": "Molar mass of water is 18 g/mol, so 18 g contains 1 mole.",
    },
    {
        "subject": "Chemistry",
        "topic": "Thermodynamics",
        "level": "intermediate",
        "type": "single",
        "marks": 4,
        "question": "For an ideal gas in an isothermal process, which quantity remains constant?",
        "options": ["Pressure", "Volume", "Temperature", "Internal energy always increases"],
        "answer": "Temperature",
        "solution": "Isothermal means constant temperature.",
    },
    {
        "subject": "Chemistry",
        "topic": "Organic Chemistry",
        "level": "advanced",
        "type": "single",
        "marks": 4,
        "question": "Which effect explains electron donation through sigma bonds?",
        "options": ["Inductive effect", "Mesomeric effect", "Hyperconjugation", "Tyndall effect"],
        "answer": "Hyperconjugation",
        "solution": "Hyperconjugation is delocalisation involving sigma bonds.",
    },
    {
        "subject": "Chemistry",
        "topic": "Chemical Equilibrium",
        "level": "advanced",
        "type": "numeric",
        "marks": 4,
        "question": "For Kp = Kc(RT)^Δn and Δn = 0, find Kp/Kc.",
        "options": [],
        "answer": "1",
        "solution": "When Δn = 0, (RT)^0 = 1, so Kp = Kc.",
    },
    {
        "subject": "Maths",
        "topic": "Calculus",
        "level": "beginner",
        "type": "numeric",
        "marks": 4,
        "question": "If f(x) = x², find f'(3).",
        "options": [],
        "answer": "6",
        "solution": "f'(x) = 2x, so f'(3) = 6.",
    },
    {
        "subject": "Maths",
        "topic": "Coordinate Geometry",
        "level": "intermediate",
        "type": "numeric",
        "marks": 4,
        "question": "Find the distance between points (1, 2) and (4, 6).",
        "options": [],
        "answer": "5",
        "solution": "Distance = sqrt((4 - 1)² + (6 - 2)²) = 5.",
    },
    {
        "subject": "Maths",
        "topic": "Calculus",
        "level": "intermediate",
        "type": "single",
        "marks": 4,
        "question": "If y = sin x, then dy/dx is:",
        "options": ["cos x", "-cos x", "tan x", "-sin x"],
        "answer": "cos x",
        "solution": "The derivative of sin x is cos x.",
    },
    {
        "subject": "Maths",
        "topic": "Matrices",
        "level": "advanced",
        "type": "numeric",
        "marks": 4,
        "question": "If A is a 2 x 2 identity matrix, find det(A).",
        "options": [],
        "answer": "1",
        "solution": "The determinant of an identity matrix is 1.",
    },
]


LEVEL_ORDER = ["beginner", "intermediate", "advanced"]


def init_db():
    with sqlite3.connect(DB_PATH) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                parent_email TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                email_verified INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL
            )
            """
        )
        ensure_column(connection, "users", "parent_email", "TEXT NOT NULL DEFAULT ''")
        ensure_column(connection, "users", "email_verified", "INTEGER NOT NULL DEFAULT 0")
        connection.execute("UPDATE users SET parent_email = email WHERE parent_email = ''")
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                token_hash TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                expires_at INTEGER NOT NULL,
                created_at INTEGER NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS test_attempts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                score INTEGER NOT NULL,
                total INTEGER NOT NULL,
                weak_topics TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS email_verifications (
                token_hash TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                expires_at INTEGER NOT NULL,
                used_at INTEGER,
                created_at INTEGER NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """
        )
        connection.commit()


def ensure_column(connection, table, column, definition):
    existing = [row[1] for row in connection.execute(f"PRAGMA table_info({table})").fetchall()]
    if column not in existing:
        connection.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")


def load_env_file():
    env_path = ROOT / ".env"
    if not env_path.exists():
        return

    for line in env_path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip("\"'"))


def hash_password(password, salt=None):
    salt = salt or secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 210_000)
    return f"pbkdf2_sha256$210000${salt}${key.hex()}"


def verify_password(password, stored_hash):
    try:
        algorithm, iterations, salt, expected = stored_hash.split("$")
    except ValueError:
        return False

    if algorithm != "pbkdf2_sha256":
        return False

    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), int(iterations))
    return hmac.compare_digest(key.hex(), expected)


def hash_token(token):
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_session(user_id):
    token = secrets.token_urlsafe(48)
    now = int(time.time())

    with sqlite3.connect(DB_PATH) as connection:
        connection.execute(
            "INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
            (hash_token(token), user_id, now + SESSION_SECONDS, now),
        )
        connection.commit()

    return token


def get_cookie_token(headers):
    raw_cookie = headers.get("Cookie")
    if not raw_cookie:
        return None

    parsed = cookies.SimpleCookie()
    parsed.load(raw_cookie)
    session_cookie = parsed.get("session")
    return session_cookie.value if session_cookie else None


def get_session_user(headers):
    token = get_cookie_token(headers)
    if not token:
        return None

    now = int(time.time())
    with sqlite3.connect(DB_PATH) as connection:
        connection.row_factory = sqlite3.Row
        row = connection.execute(
            """
            SELECT users.id, users.name, users.email
            FROM sessions
            JOIN users ON users.id = sessions.user_id
            WHERE sessions.token_hash = ? AND sessions.expires_at > ?
            """,
            (hash_token(token), now),
        ).fetchone()

    return dict(row) if row else None


def authenticate_or_create_user(name, email, parent_email, password):
    clean_name = (name or "").strip()
    clean_email = (email or "").strip().lower()
    clean_parent_email = (parent_email or "").strip().lower()

    if len(clean_name) < 2:
        raise ValueError("Name must be at least 2 characters.")
    if "@" not in clean_email or "." not in clean_email:
        raise ValueError("Please enter a valid email address.")
    if "@" not in clean_parent_email or "." not in clean_parent_email:
        raise ValueError("Please enter a valid parent email address.")
    if len(password or "") < 8:
        raise ValueError("Password must be at least 8 characters for production use.")

    now = int(time.time())

    with sqlite3.connect(DB_PATH) as connection:
        connection.row_factory = sqlite3.Row
        existing_user = connection.execute(
            "SELECT id, name, email, parent_email, password_hash, email_verified FROM users WHERE email = ?",
            (clean_email,),
        ).fetchone()

        if existing_user:
            if not verify_password(password, existing_user["password_hash"]):
                raise PermissionError("Incorrect password for this email.")
            user = dict(existing_user)
            if not user["email_verified"]:
                send_verification_email(user["id"], user["email"], user["name"])
                raise PermissionError("Email is not verified yet. A new verification link was sent.")
        else:
            cursor = connection.execute(
                "INSERT INTO users (name, email, parent_email, password_hash, email_verified, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (clean_name, clean_email, clean_parent_email, hash_password(password), 0, now),
            )
            connection.commit()
            user = {
                "id": cursor.lastrowid,
                "name": clean_name,
                "email": clean_email,
                "parent_email": clean_parent_email,
                "email_verified": 0,
            }
            send_verification_email(user["id"], user["email"], user["name"])
            raise PermissionError("Account created. Please verify your email using the link sent to you.")

    token = create_session(user["id"])
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "parent_email": user["parent_email"],
        "email_verified": user["email_verified"],
    }, token


def create_verification_token(user_id):
    token = secrets.token_urlsafe(40)
    now = int(time.time())
    with sqlite3.connect(DB_PATH) as connection:
        connection.execute(
            "INSERT INTO email_verifications (token_hash, user_id, expires_at, used_at, created_at) VALUES (?, ?, ?, NULL, ?)",
            (hash_token(token), user_id, now + VERIFICATION_SECONDS, now),
        )
        connection.commit()
    return token


def verify_email_token(token):
    now = int(time.time())
    with sqlite3.connect(DB_PATH) as connection:
        connection.row_factory = sqlite3.Row
        row = connection.execute(
            "SELECT token_hash, user_id FROM email_verifications WHERE token_hash = ? AND expires_at > ? AND used_at IS NULL",
            (hash_token(token), now),
        ).fetchone()
        if not row:
            return False
        connection.execute("UPDATE users SET email_verified = 1 WHERE id = ?", (row["user_id"],))
        connection.execute("UPDATE email_verifications SET used_at = ? WHERE token_hash = ?", (now, row["token_hash"]))
        connection.commit()
    return True


def app_base_url():
    return os.environ.get("APP_BASE_URL", f"http://localhost:{PORT}")


def send_verification_email(user_id, student_email, student_name):
    token = create_verification_token(user_id)
    link = f"{app_base_url()}/api/verify-email?token={urllib.parse.quote(token)}"
    subject = "Verify your AI JEE account"
    body = (
        f"Hello {student_name},\n\n"
        "Please verify your AI JEE Advanced Test Maker account using this link:\n"
        f"{link}\n\n"
        "This link expires in 24 hours.\n"
    )
    send_email(student_email, subject, body)


def send_test_report_email(user, attempt):
    weak_topics = attempt.get("weakTopics") or []
    recipients = [user["email"]]
    if user.get("parent_email"):
        recipients.append(user["parent_email"])
    subject = f"AI JEE Test Report: {attempt.get('score', 0)}/{attempt.get('total', 0)}"
    weak_text = ", ".join(weak_topics) if weak_topics else "No weak area detected in this test"
    body = (
        f"Student: {user['name']}\n"
        f"Score: {attempt.get('score', 0)}/{attempt.get('total', 0)}\n"
        f"Weak topics: {weak_text}\n\n"
        "Suggested next step: regenerate an adaptive test and practice the weak topics first.\n"
    )
    results = []
    for recipient in recipients:
        results.append(send_email(recipient, subject, body))
    return all(results)


def send_email(to_email, subject, body):
    host = os.environ.get("SMTP_HOST")
    port = int(os.environ.get("SMTP_PORT", "587"))
    username = os.environ.get("SMTP_USERNAME")
    password = os.environ.get("SMTP_PASSWORD")
    from_email = os.environ.get("SMTP_FROM", username or "noreply@localhost")

    if not host or not username or not password:
        print("Email not sent because SMTP is not configured.")
        print(f"To: {to_email}\nSubject: {subject}\n\n{body}")
        return False

    message = EmailMessage()
    message["From"] = from_email
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(body)

    with smtplib.SMTP(host, port) as smtp:
        smtp.starttls()
        smtp.login(username, password)
        smtp.send_message(message)
    return True


def email_is_configured():
    return all(
        os.environ.get(key)
        for key in ["SMTP_HOST", "SMTP_USERNAME", "SMTP_PASSWORD"]
    )


def assert_auth_rate_limit(client_ip):
    now = int(time.time())
    attempts = [stamp for stamp in AUTH_ATTEMPTS.get(client_ip, []) if now - stamp < AUTH_WINDOW_SECONDS]

    if len(attempts) >= MAX_AUTH_ATTEMPTS:
        AUTH_ATTEMPTS[client_ip] = attempts
        raise PermissionError("Too many login attempts. Please wait one minute and try again.")

    attempts.append(now)
    AUTH_ATTEMPTS[client_ip] = attempts


def next_level(level, score_percent):
    index = LEVEL_ORDER.index(level) if level in LEVEL_ORDER else 1
    if score_percent >= 75 and index < len(LEVEL_ORDER) - 1:
        return LEVEL_ORDER[index + 1]
    if score_percent < 40 and index > 0:
        return LEVEL_ORDER[index - 1]
    return LEVEL_ORDER[index]


def generate_adaptive_test(profile):
    level = profile.get("level") or "intermediate"
    weak_topic = profile.get("topic") or "Mechanics"
    previous = profile.get("previousPerformance") or {}
    score_percent = int(previous.get("percentage", 55))
    weak_topics = previous.get("weakTopics") or [weak_topic]
    target_level = next_level(level, score_percent)

    questions = []

    def add_matching(predicate, limit):
        matches = [item for item in QUESTION_BANK if predicate(item)]
        random.shuffle(matches)
        for item in matches:
            if len(questions) >= limit:
                break
            if item["question"] not in [q["question"] for q in questions]:
                questions.append(dict(item))

    add_matching(lambda q: q["topic"] in weak_topics, 3)
    add_matching(lambda q: q["level"] == target_level, 6)
    add_matching(lambda q: q["level"] in [level, target_level], 6)
    add_matching(lambda q: True, 6)

    for index, question in enumerate(questions[:6], start=1):
        question["id"] = f"ai{index}"

    return {
        "source": "python-internal-ai",
        "strategy": {
            "detectedLevel": target_level,
            "reason": build_strategy_reason(level, target_level, score_percent, weak_topics),
            "weakTopicsUsed": weak_topics,
        },
        "questions": questions[:6],
    }


def build_strategy_reason(old_level, target_level, score_percent, weak_topics):
    if target_level != old_level:
        change = f"changed from {old_level} to {target_level}"
    else:
        change = f"kept at {target_level}"
    return (
        f"The internal AI {change} because the previous score was {score_percent}%. "
        f"It added more practice from weak areas: {', '.join(weak_topics)}."
    )


class AppHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/verify-email":
            params = urllib.parse.parse_qs(parsed.query)
            token = (params.get("token") or [""])[0]
            verified = verify_email_token(token)
            message = "Email verified. You can now login." if verified else "Verification link is invalid or expired."
            self.send_html(200 if verified else 400, message)
            return

        if parsed.path == "/api/me":
            user = get_session_user(self.headers)
            if not user:
                self.send_json(401, {"error": "Not logged in"})
                return
            self.send_json(200, {"user": user})
            return

        if parsed.path == "/api/email-status":
            self.send_json(
                200,
                {
                    "configured": email_is_configured(),
                    "message": "Email sending is active." if email_is_configured() else "Email sending is not configured yet.",
                },
            )
            return

        file_path = ROOT / ("index.html" if parsed.path == "/" else parsed.path.lstrip("/"))

        if (
            not file_path.resolve().is_relative_to(ROOT.resolve())
            or not file_path.exists()
            or file_path.suffix.lower() not in PUBLIC_EXTENSIONS
        ):
            self.send_json(404, {"error": "File not found"})
            return

        content_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.end_headers()
        self.wfile.write(file_path.read_bytes())

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length).decode("utf-8")
            profile = json.loads(body or "{}")

            if self.path == "/api/auth":
                assert_auth_rate_limit(self.client_address[0])
                user, token = authenticate_or_create_user(
                    profile.get("name"),
                    profile.get("email"),
                    profile.get("parentEmail"),
                    profile.get("password"),
                )
                self.send_json(200, {"user": user}, session_token=token)
                return

            if self.path == "/api/logout":
                self.logout()
                return

            if self.path == "/api/save-attempt":
                user = get_session_user(self.headers)
                if not user:
                    self.send_json(401, {"error": "Please login first."})
                    return
                self.save_attempt(user["id"], profile)
                email_sent = send_test_report_email(user, profile)
                self.send_json(
                    200,
                    {
                        "saved": True,
                        "emailConfigured": email_is_configured(),
                        "emailSent": email_sent,
                    },
                )
                return

            if self.path == "/api/generate-test":
                user = get_session_user(self.headers)
                if not user:
                    self.send_json(401, {"error": "Please login first."})
                    return
                profile["studentName"] = user["name"]
                self.send_json(200, generate_adaptive_test(profile))
                return

            self.send_json(404, {"error": "API route not found"})
        except Exception as error:
            status = 401 if isinstance(error, PermissionError) else 400
            self.send_json(status, {"error": str(error)})

    def save_attempt(self, user_id, payload):
        weak_topics = payload.get("weakTopics") or []
        with sqlite3.connect(DB_PATH) as connection:
            connection.execute(
                "INSERT INTO test_attempts (user_id, score, total, weak_topics, created_at) VALUES (?, ?, ?, ?, ?)",
                (
                    user_id,
                    int(payload.get("score", 0)),
                    int(payload.get("total", 0)),
                    json.dumps(weak_topics),
                    int(time.time()),
                ),
            )
            connection.commit()

    def logout(self):
        token = get_cookie_token(self.headers)
        if token:
            with sqlite3.connect(DB_PATH) as connection:
                connection.execute("DELETE FROM sessions WHERE token_hash = ?", (hash_token(token),))
                connection.commit()
        self.send_json(200, {"loggedOut": True}, clear_session=True)

    def send_json(self, status, payload, session_token=None, clear_session=False):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        if session_token:
            secure_flag = "; Secure" if self.headers.get("X-Forwarded-Proto") == "https" else ""
            self.send_header(
                "Set-Cookie",
                f"session={session_token}; HttpOnly; SameSite=Lax; Path=/; Max-Age={SESSION_SECONDS}{secure_flag}",
            )
        if clear_session:
            self.send_header("Set-Cookie", "session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0")
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode("utf-8"))

    def send_html(self, status, message):
        html = f"""
        <!doctype html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Email Verification</title>
          <style>
            body {{ font-family: Arial, sans-serif; background: #f4f6fb; display: grid; place-items: center; min-height: 100vh; margin: 0; }}
            main {{ background: white; border: 1px solid #d9e0ea; border-radius: 8px; padding: 32px; max-width: 520px; box-shadow: 0 18px 45px rgba(16,24,40,.12); }}
            a {{ color: #5b3df5; font-weight: 700; }}
          </style>
        </head>
        <body>
          <main>
            <h1>{message}</h1>
            <p><a href="/">Return to AI JEE Advanced Test Maker</a></p>
          </main>
        </body>
        </html>
        """
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(html.encode("utf-8"))


if __name__ == "__main__":
    load_env_file()
    PORT = int(os.environ.get("PORT", str(PORT)))
    init_db()
    print(f"Python internal AI server running at http://localhost:{PORT}")
    ThreadingHTTPServer(("localhost", PORT), AppHandler).serve_forever()
