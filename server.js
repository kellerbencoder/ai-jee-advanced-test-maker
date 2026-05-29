const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = __dirname;
loadEnvFile();
const port = Number(process.env.PORT || 3000);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "POST" && url.pathname === "/api/generate-test") {
      const body = await readJsonBody(req);
      const data = await generateTestWithAI(body);
      return sendJson(res, 200, data);
    }

    if (req.method === "GET") {
      return serveStaticFile(url.pathname, res);
    }

    sendJson(res, 405, { error: "Method not allowed" });
  } catch (error) {
    sendJson(res, 500, {
      error: "Server error",
      message: error.message
    });
  }
});

server.listen(port, () => {
  console.log(`AI JEE Advanced Test Maker running at http://localhost:${port}`);
});

function loadEnvFile() {
  const envPath = path.join(rootDir, ".env");

  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function serveStaticFile(pathname, res) {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const safePath = path.normalize(decodeURIComponent(requestedPath)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(rootDir, safePath);

  if (!filePath.startsWith(rootDir)) {
    return sendJson(res, 403, { error: "Forbidden" });
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      return sendJson(res, 404, { error: "File not found" });
    }

    const extension = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": mimeTypes[extension] || "application/octet-stream"
    });
    res.end(content);
  });
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;

      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("Request body is too large"));
      }
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
  });
}

async function generateTestWithAI(studentProfile) {
  if (!process.env.OPENAI_API_KEY) {
    return {
      source: "local-fallback",
      note: "OPENAI_API_KEY is not set, so the app used built-in demo questions.",
      questions: null
    };
  }

  const prompt = buildPrompt(studentProfile);

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.2",
      input: prompt
    })
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error?.message || "OpenAI API request failed");
  }

  const text = getResponseText(payload);
  const parsed = parseJsonFromText(text);

  return {
    source: "openai",
    model: process.env.OPENAI_MODEL || "gpt-5.2",
    questions: parsed.questions
  };
}

function buildPrompt(profile) {
  return `
You are an expert JEE Advanced test setter.
Create an adaptive practice test after student level verification.

Student profile:
- Name: ${profile.studentName}
- Class level: ${profile.classLevel}
- Verified level: ${profile.level}
- Accuracy band: ${profile.accuracy}
- Weakest topic: ${profile.topic}
- Daily study hours: ${profile.studyHours}

Return only valid JSON in this exact shape:
{
  "questions": [
    {
      "subject": "Physics | Chemistry | Maths",
      "topic": "specific topic",
      "type": "single | numeric",
      "marks": 4,
      "question": "question text",
      "options": ["A", "B", "C", "D"],
      "answer": "correct answer exactly matching one option or numeric value",
      "solution": "short solution and concept explanation"
    }
  ]
}

Rules:
- Generate 6 questions.
- Use JEE Advanced style reasoning.
- Include at least 2 questions from the student's weakest topic if possible.
- For numeric questions, use an empty options array.
- Keep answers concise and unambiguous.
`;
}

function getResponseText(payload) {
  if (payload.output_text) {
    return payload.output_text;
  }

  return (payload.output || [])
    .flatMap((item) => item.content || [])
    .map((content) => content.text || "")
    .join("\n");
}

function parseJsonFromText(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);

    if (!match) {
      throw new Error("AI response did not contain JSON");
    }

    return JSON.parse(match[0]);
  }
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });
  res.end(JSON.stringify(data));
}
