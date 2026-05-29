# Production Setup Notes

This app now uses the Python backend for real authentication.

## What is implemented

- Users are stored in `app.db` using SQLite.
- Passwords are never stored directly.
- Passwords are hashed with PBKDF2-SHA256 and a random salt.
- Login creates a random session token.
- Only a SHA-256 hash of the session token is stored in the database.
- The browser receives the session in an `HttpOnly` cookie.
- Test generation requires a valid backend session.
- Test attempts can be saved against the logged-in user.
- The static file server blocks database and environment files.
- The login route has basic rate limiting.
- Student email verification is supported.
- Test reports can be emailed to the student and parent with SMTP.

## How to run

Double-click:

```text
start-python-ai-server.bat
```

Then open:

```text
http://localhost:5000
```

## Before real public deployment

- Configure SMTP credentials in `.env` for verification and report emails.
- Put the app behind HTTPS.
- Run it behind a production web server such as Nginx, Caddy, or a cloud app platform.
- Use PostgreSQL instead of SQLite if many students will use it at the same time.
- Add admin tools for managing students, questions, and attempts.
- Add backups for the database.
- Add email verification and password reset.
- Add more questions to the internal AI question bank.
