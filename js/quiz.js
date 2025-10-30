// js/quiz.js
// Generic quiz runner. This module reads data-file and subject from the <script> attributes
// in the quiz page and runs the quiz, saving attempt results to Firestore via firebase-auth.js

import { auth, onAuthStateChanged, saveAttemptAndUpdateUser } from './firebase-auth.js';

const scriptTag = document.currentScript;
const dataFile = scriptTag.getAttribute('data-file') || '../data/html.json';
const subject = scriptTag.getAttribute('data-subject') || 'html';

let allQuestions = [];
let selected = []; // chosen question objects
let answers = []; // user answers by index
let currentIndex = 0;
let timer = null;
let timeLeft = 0;
let perQuestionTimed = false;
let perQSeconds = 30;

const startBtn = document.getElementById('start-btn');
const numQEl = document.getElementById('num-questions');
const timedEl = document.getElementById('timed');
const timePerQWrap = document.getElementById('time-per-q-wrap');
const timePerQEl = document.getElementById('time-per-q');

const quizArea = document.getElementById('quiz-area');
const questionWrap = document.getElementById('question-wrap');
const currentQEl = document.getElementById('current-q');
const totalQEl = document.getElementById('total-q');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const finishBtn = document.getElementById('finish-btn');
const progressText = document.getElementById('progress-text');
const countdownEl = document.getElementById('countdown');

const resultArea = document.getElementById('result-area');
const scoreText = document.getElementById('score-text');
const resultDetails = document.getElementById('result-details');
const returnDashboardBtn = document.getElementById('return-dashboard');

const subjectTitle = document.getElementById('subject-title');
if (subjectTitle) subjectTitle.textContent = `${subject.toUpperCase()} Quiz`;

/* show/hide time per question */
timedEl.addEventListener('change', () => {
  timePerQWrap.style.display = timedEl.checked ? 'inline-block' : 'none';
});

/* Load question bank from local JSON file */
async function loadQuestions() {
  const resp = await fetch(dataFile);
  const json = await resp.json();
  allQuestions = json.questions || [];
}

/* Random sample without replacement */
function sampleQuestions(n) {
  const copy = allQuestions.slice();
  const res = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    res.push(copy.splice(idx, 1)[0]);
  }
  return res;
}

/* Render current question */
function renderQuestion() {
  const q = selected[currentIndex];
  questionWrap.innerHTML = '';
  const qnum = document.createElement('h3');
  qnum.textContent = `Q${currentIndex + 1}: ${q.question}`;
  questionWrap.appendChild(qnum);

  const options = document.createElement('div');
  options.className = 'options';

  q.options.forEach((opt, idx) => {
    const label = document.createElement('label');
    label.className = 'option';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'answer';
    input.value = idx;
    if (answers[currentIndex] === idx) input.checked = true;
    input.addEventListener('change', () => {
      answers[currentIndex] = idx;
    });
    label.appendChild(input);
    const span = document.createElement('span');
    span.innerHTML = opt;
    label.appendChild(span);
    options.appendChild(label);
  });

  questionWrap.appendChild(options);

  // update progress UI
  currentQEl.textContent = currentIndex + 1;
  totalQEl.textContent = selected.length;
  if (countdownEl) countdownEl.textContent = perQuestionTimed ? `Time left: ${timeLeft}s` : '';
}

/* Start quiz */
startBtn.addEventListener('click', async () => {
  const num = Math.max(1, Math.min(50, parseInt(numQEl.value) || 10));
  perQuestionTimed = timedEl.checked;
  perQSeconds = Math.max(5, parseInt(timePerQEl.value) || 30);

  await loadQuestions();

  selected = sampleQuestions(Math.min(num, allQuestions.length));
  answers = new Array(selected.length).fill(null);
  currentIndex = 0;

  document.getElementById('total-q').textContent = selected.length;
  quizArea.classList.remove('hidden');
  resultArea.classList.add('hidden');

  // start timer for first question if timed
  if (perQuestionTimed) {
    timeLeft = perQSeconds;
    startTimer();
  }
  renderQuestion();
});

/* Timer functions */
function startTimer() {
  clearInterval(timer);
  countdownEl.textContent = `Time left: ${timeLeft}s`;
  timer = setInterval(() => {
    timeLeft -= 1;
    if (timeLeft <= 0) {
      clearInterval(timer);
      // auto-move to next question
      if (currentIndex < selected.length - 1) {
        currentIndex++;
        timeLeft = perQSeconds;
        renderQuestion();
        startTimer();
      } else {
        finishQuiz();
      }
    } else {
      countdownEl.textContent = `Time left: ${timeLeft}s`;
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timer);
}

/* Navigation */
nextBtn.addEventListener('click', () => {
  if (currentIndex < selected.length - 1) {
    currentIndex++;
    if (perQuestionTimed) timeLeft = perQSeconds;
    renderQuestion();
  }
});
prevBtn.addEventListener('click', () => {
  if (currentIndex > 0) {
    currentIndex--;
    if (perQuestionTimed) timeLeft = perQSeconds;
    renderQuestion();
  }
});

/* Finish */
finishBtn.addEventListener('click', finishQuiz);

async function finishQuiz() {
  stopTimer();
  // compute score
  let score = 0;
  const details = [];
  selected.forEach((q, i) => {
    const userAns = answers[i];
    const correctIndex = q.answer;
    const ok = (userAns !== null && userAns === correctIndex);
    if (ok) score++;
    details.push({
      questionId: q.id || `${subject}-${i}`,
      question: q.question,
      selected: userAns,
      correctIndex,
      options: q.options,
      explanation: q.explanation || ''
    });
  });

  // show result
  quizArea.classList.add('hidden');
  resultArea.classList.remove('hidden');
  scoreText.textContent = `${score} / ${selected.length}`;
  resultDetails.innerHTML = '';
  details.forEach((d, idx) => {
    const div = document.createElement('div');
    div.className = 'result-item';
    const qh = document.createElement('p');
    qh.innerHTML = `<strong>Q${idx + 1}</strong> ${d.question}`;
    div.appendChild(qh);
    const user = document.createElement('p');
    const sel = d.selected !== null ? d.options[d.selected] : '<em>No answer</em>';
    const corr = d.options[d.correctIndex];
    user.innerHTML = `Your answer: ${sel} — Correct: ${corr}`;
    div.appendChild(user);
    if (d.explanation) {
      const explain = document.createElement('p');
      explain.className = 'muted';
      explain.textContent = d.explanation;
      div.appendChild(explain);
    }
    resultDetails.appendChild(div);
  });

  // prepare attempt object
  const attempt = {
    subject,
    questionIds: details.map(d => d.questionId),
    answers: details.map(d => d.selected),
    score,
    maxScore: selected.length,
    durationSeconds: 0, // could measure start->finish if needed
    // createdAt will be serverTimestamp when saved
  };

  // Save attempt if user is logged in
  const user = auth.currentUser;
  if (user) {
    try {
      await saveAttemptAndUpdateUser(user.uid, attempt);
      console.log('Attempt saved.');
    } catch (err) {
      console.error('Failed to save attempt', err);
    }
  } else {
    console.warn('User not logged in — attempt not saved.');
  }
}

returnDashboardBtn.addEventListener('click', () => {
  window.location.href = '../index.html';
});

/* Protect: ensure user logged in using onAuthStateChanged (redirect to login if not) */
onAuthStateChanged(user => {
  // If page is being used but user not signed in -> redirect to login with return link
  if (!user) {
    const dest = encodeURIComponent(location.pathname + location.search);
    window.location.href = '/login.html?redirect=' + dest;
  }
});
