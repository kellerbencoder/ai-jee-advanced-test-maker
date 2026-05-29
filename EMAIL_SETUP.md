# Email Sending Setup

The app can send:

- Student email verification links
- Test reports to the student email
- Test reports to the parent email

## Gmail Setup

1. Turn on 2-Step Verification in your Google account.
2. Create a Gmail App Password.
3. Double-click `setup-email.bat`.
4. Fill `.env` like this:

```env
PORT=5000
APP_BASE_URL=http://localhost:5000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_16_character_gmail_app_password
SMTP_FROM=your_email@gmail.com
```

5. Save `.env`.
6. Close and restart `start-python-ai-server.bat`.
7. Open `http://localhost:5000`.

When email is configured, the login form will show `Email sending is active.`
