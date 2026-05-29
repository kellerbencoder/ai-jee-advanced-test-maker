const loginForm = document.querySelector("#loginForm");
const loginMessage = document.querySelector("#loginMessage");
const verificationForm = document.querySelector("#verificationForm");
const chatMessages = document.querySelector("#chatMessages");
const testOutput = document.querySelector("#testOutput");
const testTitle = document.querySelector("#testTitle");
const levelBadge = document.querySelector("#levelBadge");
const testDetails = document.querySelector("#testDetails");
const previewLevel = document.querySelector("#previewLevel");
const testForm = document.querySelector("#testForm");
const analyticsOutput = document.querySelector("#analyticsOutput");
const menuButton = document.querySelector("#menuButton");
const dayTabs = document.querySelector("#dayTabs");
const lectureList = document.querySelector("#lectureList");
const testsGenerated = document.querySelector("#testsGenerated");
const latestScore = document.querySelector("#latestScore");
const detectedLevel = document.querySelector("#detectedLevel");
const weakTopicStat = document.querySelector("#weakTopicStat");
const emailStatus = document.querySelector("#emailStatus");

if (window.location.protocol === "file:") {
  window.location.replace("http://localhost:5000");
}

let loggedInStudent = null;
let activeQuestions = [];
let generatedCount = 0;
let lastProfile = null;
let previousPerformance = null;

const weeklySchedule = {
  Mon: [
    { time: "08:00 AM", title: "Physics Live Class", detail: "Mechanics: projectile motion", status: "Live" },
    { time: "11:30 AM", title: "Maths Practice", detail: "Limits and derivatives timed set", status: "Practice" },
    { time: "07:00 PM", title: "AI Test Review", detail: "Check weak topics from last test", status: "Review" }
  ],
  Tue: [
    { time: "09:00 AM", title: "Chemistry Class", detail: "Organic GOC fundamentals", status: "Live" },
    { time: "02:00 PM", title: "DPP Solving", detail: "Mixed Physics numerical drill", status: "Practice" },
    { time: "08:00 PM", title: "Formula Revision", detail: "Calculus and coordinate geometry", status: "Revise" }
  ],
  Wed: [
    { time: "08:30 AM", title: "Maths Live Class", detail: "Coordinate geometry: circles", status: "Live" },
    { time: "01:00 PM", title: "Chemistry Quiz", detail: "Thermodynamics and equilibrium", status: "Quiz" },
    { time: "06:30 PM", title: "AI Generated Test", detail: "Adaptive JEE Advanced practice", status: "AI" }
  ],
  Thu: [
    { time: "10:00 AM", title: "Physics Revision", detail: "Work, energy, and power", status: "Revise" },
    { time: "03:00 PM", title: "Maths DPP", detail: "Matrices and determinants", status: "Practice" },
    { time: "08:30 PM", title: "Mistake Notebook", detail: "Reattempt incorrect questions", status: "Review" }
  ],
  Fri: [
    { time: "09:30 AM", title: "Chemistry Live Class", detail: "Chemical bonding", status: "Live" },
    { time: "04:00 PM", title: "Full Test Section", detail: "Physics, Chemistry, Maths mixed", status: "Test" },
    { time: "09:00 PM", title: "Analytics Review", detail: "Find next weak topic", status: "Review" }
  ],
  Sat: [
    { time: "08:00 AM", title: "Grand Practice Test", detail: "JEE Advanced pattern mock", status: "Test" },
    { time: "01:00 PM", title: "Solution Analysis", detail: "Concept-wise error review", status: "Review" },
    { time: "06:00 PM", title: "Backlog Clearance", detail: "Finish pending weak chapters", status: "Practice" }
  ]
};

const testTemplates = {
  beginner: {
    label: "Foundation",
    minutes: 60,
    questions: 12,
    focus: "concept clarity and single-correct problems",
    difficulty: "Easy to moderate"
  },
  intermediate: {
    label: "Intermediate",
    minutes: 90,
    questions: 18,
    focus: "mixed concepts, numerical answers, and multi-step reasoning",
    difficulty: "Moderate"
  },
  advanced: {
    label: "Advanced",
    minutes: 120,
    questions: 24,
    focus: "JEE Advanced style multi-correct, integer, and paragraph questions",
    difficulty: "Difficult"
  }
};

const questionBank = {
  beginner: [
    {
      subject: "Physics",
      topic: "Mechanics",
      type: "single",
      marks: 4,
      question: "A block starts from rest and moves with constant acceleration 2 m/s². What is its velocity after 5 seconds?",
      options: ["5 m/s", "8 m/s", "10 m/s", "20 m/s"],
      answer: "10 m/s",
      solution: "Use v = u + at. Here u = 0, a = 2, t = 5, so v = 10 m/s."
    },
    {
      subject: "Chemistry",
      topic: "Mole Concept",
      type: "single",
      marks: 4,
      question: "How many moles are present in 18 g of water?",
      options: ["0.5 mol", "1 mol", "2 mol", "18 mol"],
      answer: "1 mol",
      solution: "Molar mass of water is 18 g/mol, so 18 g contains 1 mole."
    },
    {
      subject: "Maths",
      topic: "Calculus",
      type: "numeric",
      marks: 4,
      question: "If f(x) = x², find f'(3).",
      answer: "6",
      solution: "f'(x) = 2x, so f'(3) = 6."
    }
  ],
  intermediate: [
    {
      subject: "Physics",
      topic: "Mechanics",
      type: "single",
      marks: 4,
      question: "A particle moves in a circle of radius 2 m with speed 6 m/s. Find centripetal acceleration.",
      options: ["9 m/s²", "12 m/s²", "18 m/s²", "36 m/s²"],
      answer: "18 m/s²",
      solution: "Centripetal acceleration is v²/r = 36/2 = 18 m/s²."
    },
    {
      subject: "Chemistry",
      topic: "Thermodynamics",
      type: "single",
      marks: 4,
      question: "For an ideal gas in an isothermal process, which quantity remains constant?",
      options: ["Pressure", "Volume", "Temperature", "Internal energy always increases"],
      answer: "Temperature",
      solution: "Isothermal means constant temperature."
    },
    {
      subject: "Maths",
      topic: "Coordinate Geometry",
      type: "numeric",
      marks: 4,
      question: "Find the distance between points (1, 2) and (4, 6).",
      answer: "5",
      solution: "Distance = sqrt((4 - 1)² + (6 - 2)²) = sqrt(9 + 16) = 5."
    },
    {
      subject: "Maths",
      topic: "Calculus",
      type: "single",
      marks: 4,
      question: "If y = sin x, then dy/dx is:",
      options: ["cos x", "-cos x", "tan x", "-sin x"],
      answer: "cos x",
      solution: "The derivative of sin x is cos x."
    }
  ],
  advanced: [
    {
      subject: "Physics",
      topic: "Mechanics",
      type: "single",
      marks: 4,
      question: "A projectile has range R on level ground. If its launch speed is unchanged and angle is changed from 30° to 60°, what happens to the range?",
      options: ["It becomes half", "It doubles", "It remains same", "It becomes zero"],
      answer: "It remains same",
      solution: "Range is proportional to sin 2θ. sin 60° and sin 120° are equal."
    },
    {
      subject: "Physics",
      topic: "Electrostatics",
      type: "numeric",
      marks: 4,
      question: "Two identical charges repel with force F at distance r. If distance becomes 2r, force becomes F/n. Find n.",
      answer: "4",
      solution: "By Coulomb's law, force varies as 1/r². Doubling distance makes force one-fourth."
    },
    {
      subject: "Chemistry",
      topic: "Organic Chemistry",
      type: "single",
      marks: 4,
      question: "Which effect explains electron donation through sigma bonds?",
      options: ["Inductive effect", "Mesomeric effect", "Hyperconjugation", "Tyndall effect"],
      answer: "Hyperconjugation",
      solution: "Hyperconjugation is delocalisation involving sigma bonds."
    },
    {
      subject: "Chemistry",
      topic: "Chemical Equilibrium",
      type: "numeric",
      marks: 4,
      question: "For a reaction, if Kp = Kc(RT)^Δn and Δn = 0, then Kp/Kc equals:",
      answer: "1",
      solution: "When Δn = 0, (RT)^0 = 1, so Kp = Kc."
    },
    {
      subject: "Maths",
      topic: "Calculus",
      type: "single",
      marks: 4,
      question: "If f'(x) is positive for all x in an interval, then f(x) is:",
      options: ["Increasing", "Decreasing", "Constant", "Not differentiable"],
      answer: "Increasing",
      solution: "A positive derivative means the function is increasing."
    },
    {
      subject: "Maths",
      topic: "Matrices",
      type: "numeric",
      marks: 4,
      question: "If A is a 2 x 2 identity matrix, find det(A).",
      answer: "1",
      solution: "The determinant of an identity matrix is 1."
    }
  ]
};

function addChatMessage(text, sender = "bot") {
  const message = document.createElement("div");
  message.className = `chat-message ${sender}`;
  message.innerHTML = `<p>${text}</p>`;
  chatMessages.appendChild(message);
  message.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function renderSchedule(day = "Mon") {
  lectureList.innerHTML = weeklySchedule[day].map((lecture) => `
    <article class="lecture-card">
      <span class="lecture-time">${lecture.time}</span>
      <div>
        <h3>${lecture.title}</h3>
        <p>${lecture.detail}</p>
      </div>
      <span class="lecture-status">${lecture.status}</span>
    </article>
  `).join("");
}

function getVerifiedLevel(accuracy, studyHours) {
  const hours = Number(studyHours);

  if (accuracy === "advanced" && hours >= 5) {
    return "advanced";
  }

  if (accuracy === "beginner" || hours < 3) {
    return "beginner";
  }

  return "intermediate";
}

async function generateTest({ level, topic, classLevel, accuracy, studyHours }) {
  const template = testTemplates[level];
  const classText = classLevel === "dropper" ? "Dropper" : `Class ${classLevel}`;
  activeQuestions = buildQuestionSet(level, topic);
  lastProfile = { level, topic, classLevel, accuracy, studyHours };

  testTitle.textContent = `${template.label} Test for ${loggedInStudent.name}`;
  levelBadge.textContent = `${template.label} Level`;
  detectedLevel.textContent = template.label;
  weakTopicStat.textContent = topic;
  generatedCount += 1;
  testsGenerated.textContent = generatedCount;

  testDetails.innerHTML = `
    <article class="test-card">
      <h4>Student Level</h4>
      <p>${classText} student verified as <strong>${template.label}</strong>.</p>
      <p>Difficulty: ${template.difficulty}</p>
    </article>
    <article class="test-card">
      <h4>Test Structure</h4>
      <p>${template.questions} questions in ${template.minutes} minutes.</p>
      <p>Focus: ${template.focus}.</p>
    </article>
    <article class="test-card">
      <h4>Generated Topics</h4>
      <ul>
        <li>Main weak area: ${topic}</li>
        <li>Physics: application-based numericals</li>
        <li>Chemistry: concept and reasoning mix</li>
        <li>Maths: timed problem solving</li>
      </ul>
    </article>
  `;

  testForm.innerHTML = `<p class="form-message">Generating AI questions. Please wait...</p>`;
  analyticsOutput.hidden = true;
  analyticsOutput.classList.remove("empty-state");
  analyticsOutput.innerHTML = "";
  testOutput.hidden = false;
  testOutput.scrollIntoView({ behavior: "smooth", block: "start" });

  const aiResult = await requestAiGeneratedQuestions({
    studentName: loggedInStudent.name,
    classLevel,
    accuracy,
    topic,
    studyHours,
    level,
    previousPerformance
  });

  if (aiResult.questions) {
    activeQuestions = aiResult.questions.map((question, index) => ({
      ...question,
      id: `q${index}`,
      marks: Number(question.marks || 4),
      options: Array.isArray(question.options) ? question.options : []
    }));
    const strategyReason = aiResult.strategy?.reason || "The internal AI selected questions from the student's current pattern.";
    addChatMessage(`The test was generated through ${aiResult.source}. ${strategyReason}`, "bot");
  } else if (aiResult.note) {
    addChatMessage(aiResult.note, "bot");
  }

  renderQuestions();
}

async function requestAiGeneratedQuestions(profile) {
  try {
    const response = await fetch("/api/generate-test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(profile)
    });

    if (!response.ok) {
      const data = await response.json();
      if (response.status === 401) {
        loggedInStudent = null;
        return {
          source: "auth-required",
          note: data.error || "Your secure session expired. Please login again.",
          questions: null
        };
      }
      throw new Error(data.error || "The AI server request failed.");
    }

    return await response.json();
  } catch (error) {
    return {
      source: "browser-fallback",
      note: "The backend server is not running yet, so the app used built-in demo questions. Start the Python server for production login and sessions.",
      questions: null
    };
  }
}

function buildQuestionSet(level, weakTopic) {
  const selected = [...questionBank[level]];
  const extraWeakTopicQuestion = selected.find((question) => question.topic === weakTopic);

  if (extraWeakTopicQuestion) {
    selected.unshift(extraWeakTopicQuestion);
  }

  return selected
    .filter((question, index, questions) => questions.findIndex((item) => item.question === question.question) === index)
    .map((question, index) => ({ ...question, id: `q${index}` }));
}

function renderQuestions() {
  testForm.innerHTML = activeQuestions.map((question, index) => {
    const answerControl = question.type === "numeric"
      ? `<input class="numeric-answer" name="${question.id}" type="text" inputmode="decimal" placeholder="Enter numerical answer" required>`
      : `<div class="options">
          ${question.options.map((option) => `
            <label class="option">
              <input type="radio" name="${question.id}" value="${option}" required>
              <span>${option}</span>
            </label>
          `).join("")}
        </div>`;

    return `
      <article class="question-card">
        <div class="question-meta">
          <span class="tag">Q${index + 1}</span>
          <span class="tag">${question.subject}</span>
          <span class="tag">${question.topic}</span>
          <span class="tag">${question.marks} marks</span>
        </div>
        <h4>${question.question}</h4>
        ${answerControl}
      </article>
    `;
  }).join("") + `<button class="button primary submit-test" type="submit">Submit Test and Show Analytics</button>`;
}

function normalizeAnswer(answer) {
  return String(answer).trim().toLowerCase();
}

function analyzeTest(formData) {
  const subjectStats = {};
  const weakTopics = [];
  let score = 0;
  let total = 0;

  activeQuestions.forEach((question) => {
    const userAnswer = formData.get(question.id);
    const isCorrect = normalizeAnswer(userAnswer) === normalizeAnswer(question.answer);

    total += question.marks;
    if (!subjectStats[question.subject]) {
      subjectStats[question.subject] = { correct: 0, total: 0, topics: [] };
    }

    subjectStats[question.subject].total += question.marks;

    if (isCorrect) {
      score += question.marks;
      subjectStats[question.subject].correct += question.marks;
    } else {
      subjectStats[question.subject].topics.push(question.topic);
      weakTopics.push({
        subject: question.subject,
        topic: question.topic,
        solution: question.solution,
        correctAnswer: question.answer
      });
    }
  });

  return { score, total, subjectStats, weakTopics };
}

function renderAnalytics(result) {
  const percentage = Math.round((result.score / result.total) * 100);
  previousPerformance = {
    score: result.score,
    total: result.total,
    percentage,
    weakTopics: result.weakTopics.map((item) => item.topic)
  };
  saveAttempt(previousPerformance);
  const subjectCards = Object.entries(result.subjectStats).map(([subject, stats]) => {
    const subjectPercent = Math.round((stats.correct / stats.total) * 100);
    return `
      <article class="analytics-card">
        <strong>${subject}: ${subjectPercent}%</strong>
        <div class="bar"><span style="width: ${subjectPercent}%"></span></div>
        <p>${stats.correct}/${stats.total} marks</p>
      </article>
    `;
  }).join("");

  const weakAreaHtml = result.weakTopics.length
    ? result.weakTopics.map((item) => `
        <li>
          <strong>${item.subject} - ${item.topic}:</strong>
          Correct answer: ${item.correctAnswer}. ${item.solution}
        </li>
      `).join("")
    : "<li>Great work. No weak area was detected in this test.</li>";

  analyticsOutput.innerHTML = `
    <p class="eyebrow">Test analytics</p>
    <h3>Score: ${result.score}/${result.total} (${percentage}%)</h3>
    <div class="analytics-grid">${subjectCards}</div>
    <h4>Weak Areas and Improvement Plan</h4>
    <ul class="weak-list">${weakAreaHtml}</ul>
    <button class="button primary submit-test" id="regenerateTestButton" type="button">Regenerate Adaptive Test</button>
  `;

  analyticsOutput.hidden = false;
  analyticsOutput.classList.remove("empty-state");
  analyticsOutput.scrollIntoView({ behavior: "smooth", block: "start" });
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(loginForm);
  loginMessage.textContent = "Checking secure login...";
  secureLogin({
    name: formData.get("studentName").trim(),
    email: formData.get("studentEmail").trim(),
    parentEmail: formData.get("parentEmail").trim(),
    password: formData.get("studentPassword")
  });
});

async function secureLogin(credentials) {
  try {
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(credentials)
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Login failed");
    }

    loggedInStudent = data.user;
    loginMessage.textContent = `Welcome, ${loggedInStudent.name}. Your secure session is active.`;
    addChatMessage(`${loggedInStudent.name} has logged in with a secure backend session. Please complete level verification.`, "bot");
    document.querySelector("#test-maker").scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    loginMessage.textContent = error.message;
    addChatMessage("Login failed. Please run the Python server and use the correct password.", "bot");
  }
}

verificationForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!loggedInStudent) {
    addChatMessage("Please login first. The backend must verify your session before test generation.", "bot");
    document.querySelector("#login").scrollIntoView({ behavior: "smooth" });
    return;
  }

  const classLevel = document.querySelector("#classLevel").value;
  const accuracy = document.querySelector("#accuracy").value;
  const topic = document.querySelector("#topic").value;
  const studyHours = document.querySelector("#studyHours").value;
  const level = getVerifiedLevel(accuracy, studyHours);
  const template = testTemplates[level];

  addChatMessage(
    `My details: class ${classLevel}, accuracy ${accuracy}, weakest topic ${topic}, and ${studyHours} study hours daily.`,
    "user"
  );
  addChatMessage(
    `Verification complete. Your current level is ${template.label}. I am generating a ${template.questions}-question JEE Advanced test now.`,
    "bot"
  );

  generateTest({ level, topic, classLevel, accuracy, studyHours });
});

testForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const result = analyzeTest(new FormData(testForm));

  addChatMessage(
    `Test submitted. Your score is ${result.score}/${result.total}. I have prepared weak-area analytics below.`,
    "bot"
  );
  renderAnalytics(result);
  latestScore.textContent = `${result.score}/${result.total}`;
});

async function saveAttempt(performance) {
  try {
    const response = await fetch("/api/save-attempt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        score: performance.score,
        total: performance.total,
        percentage: performance.percentage,
        weakTopics: performance.weakTopics
      })
    });
    const data = await response.json();

    if (!data.emailConfigured) {
      addChatMessage("The test was saved, but email is not configured yet. Open setup-email, add SMTP details, restart the server, then try again.", "bot");
      return;
    }

    if (!data.emailSent) {
      addChatMessage("The test was saved, but the email provider rejected the message. Check the black server window for the exact SMTP error.", "bot");
      return;
    }

    addChatMessage("The test report was sent successfully to the student email and parent email.", "bot");
  } catch {
    addChatMessage("Your analytics are visible, but this attempt could not be saved because the backend is offline.", "bot");
  }
}

analyticsOutput.addEventListener("click", (event) => {
  const button = event.target.closest("#regenerateTestButton");

  if (!button || !lastProfile) {
    return;
  }

  addChatMessage("Regenerating a new test using your latest score and weak-topic pattern.", "bot");
  generateTest(lastProfile);
});

menuButton.addEventListener("click", () => {
  document.body.classList.toggle("menu-open");
});

document.querySelectorAll(".side-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    document.body.classList.remove("menu-open");
  });
});

dayTabs.addEventListener("click", (event) => {
  const button = event.target.closest("button");

  if (!button) {
    return;
  }

  dayTabs.querySelectorAll("button").forEach((tab) => tab.classList.remove("active"));
  button.classList.add("active");
  renderSchedule(button.dataset.day);
});

renderSchedule();
checkEmailStatus();

async function checkEmailStatus() {
  if (!emailStatus) {
    return;
  }

  try {
    const response = await fetch("/api/email-status");
    const data = await response.json();
    emailStatus.textContent = data.message;
    emailStatus.classList.toggle("ready", data.configured);
  } catch {
    emailStatus.textContent = "Email status unavailable. Start the Python server.";
  }
}
