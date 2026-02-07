/* =========================================================
   CONFIG
========================================================= */
const API_BASE_URL = "http://localhost:5000/api";

/* =========================================================
   VARIABLES GLOBALES (Juego)
========================================================= */
let currentUser = null;
let currentDifficulty = "";
let currentCategory = "";
let currentQuestionIndex = 0;
let score = 0;
let timer = null;
let timeLeft = 0;
let sessionStartTime = null;
let currentQuestions = [];
let isAnswerSelected = false;

/* =========================================================
   CATEGORÍAS / TIEMPOS
========================================================= */
const categories = [
  { name: "algebra", displayName: "Álgebra", icon: "fas fa-square-root-alt" },
  { name: "trigonometria", displayName: "Trigonometría", icon: "fas fa-wave-square" },
  { name: "geometria", displayName: "Geometría", icon: "fas fa-shapes" },
  { name: "estadisticas", displayName: "Estadísticas", icon: "fas fa-chart-bar" },
  { name: "numeros", displayName: "Números", icon: "fas fa-hashtag" },
  { name: "funciones", displayName: "Funciones", icon: "fas fa-project-diagram" },
];

const timeByDifficulty = {
  facil: 10,
  intermedio: 20,
  dificil: 30,
};

/* =========================================================
   PARTICLES
========================================================= */
const particlesJS = window.particlesJS;
function initParticles() {
  if (typeof particlesJS !== "undefined") {
    particlesJS("particles-js", {
      particles: {
        number: { value: 80, density: { enable: true, value_area: 800 } },
        color: { value: "#ffffff" },
        shape: { type: "circle" },
        opacity: { value: 0.5, random: false },
        size: { value: 3, random: true },
        line_linked: {
          enable: true,
          distance: 150,
          color: "#ffffff",
          opacity: 0.4,
          width: 1,
        },
        move: {
          enable: true,
          speed: 6,
          direction: "none",
          random: false,
          straight: false,
          out_mode: "out",
          bounce: false,
        },
      },
      interactivity: {
        detect_on: "canvas",
        events: {
          onhover: { enable: true, mode: "repulse" },
          onclick: { enable: true, mode: "push" },
          resize: true,
        },
      },
      retina_detect: true,
    });
  }
}

/* =========================================================
   UI / NAVEGACIÓN PANTALLAS
========================================================= */
function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach((screen) => screen.classList.remove("active"));
  const active = document.getElementById(screenId);
  if (!active) return;

  active.classList.add("active", "fade-in");
  setTimeout(() => active.classList.remove("fade-in"), 500);

  // Si entramos a preguntas, ponemos A como default resaltado
  if (screenId === "questionScreen") {
    setTimeout(() => {
      selectedOption = "a";
      highlightOption("a");
    }, 60);
  }
}

function showMainScreen() { showScreen("mainScreen"); }
function showRegisterScreen() { showScreen("registerScreen"); }
function showGameScreen() { showScreen("gameScreen"); updateUserInfo(); }
function showQuestionScreen() { showScreen("questionScreen"); }
function showResultsScreen() { showScreen("resultsScreen"); }
function showTeacherDashboard() { showScreen("teacherDashboard"); updateTeacherInfo(); /* aquí puedes iniciar dashboard */ }

/* =========================================================
   LOGIN MODAL
========================================================= */
function showLoginModal() {
  const modal = document.getElementById("loginModal");
  if (!modal) return;
  modal.style.display = "block";
  document.getElementById("difficultyContainer").style.display = "none";
  document.getElementById("errorMessage").textContent = "";
  document.body.style.overflow = "hidden";
}

function hideLoginModal() {
  const modal = document.getElementById("loginModal");
  if (!modal) return;
  modal.style.display = "none";
  document.getElementById("loginForm").reset();
  document.getElementById("difficultyContainer").style.display = "none";
  document.getElementById("errorMessage").textContent = "";
  document.body.style.overflow = "auto";

  // Rehabilitar inputs por si se volvió a login
  document.getElementById("loginUsername").removeAttribute("disabled");
  document.getElementById("loginPassword").removeAttribute("disabled");
  const btn = document.getElementById("loginSubmitBtn");
  if (btn) btn.onclick = null;
}

/* =========================================================
   LOADING
========================================================= */
function showLoading(show) {
  const overlay = document.getElementById("loadingOverlay");
  if (!overlay) return;
  overlay.style.display = show ? "flex" : "none";
}

/* =========================================================
   AUTH
========================================================= */
async function handleLogin(e) {
  e.preventDefault();
  showLoading(true);

  const nombreUsuario = document.getElementById("loginUsername").value;
  const contrasena = document.getElementById("loginPassword").value;

  try {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombreUsuario, contrasena }),
    });

    const data = await response.json();

    if (!response.ok) {
      document.getElementById("errorMessage").textContent = data.mensaje || "Error al iniciar sesión";
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("userRole", data.rol);

    currentUser = {
      id: data.id,
      nombreUsuario,
      rol: data.rol,
      nombre: data.nombre || nombreUsuario,
      paralelo: data.paralelo || "A",
    };

    document.getElementById("errorMessage").textContent = "";

    if (data.rol === "docente") {
      hideLoginModal();
      showTeacherDashboard();
      return;
    }

    // estudiante
    document.getElementById("loginUsername").setAttribute("disabled", true);
    document.getElementById("loginPassword").setAttribute("disabled", true);

    document.getElementById("difficultyContainer").style.display = "block";
    document.getElementById("loginSubmitBtn").innerHTML = '<i class="fas fa-play"></i> Comenzar Juego';

    document.getElementById("loginSubmitBtn").onclick = () => {
      const selectedDifficulty = document.querySelector('input[name="difficulty"]:checked');
      currentDifficulty = selectedDifficulty ? selectedDifficulty.value : "facil";
      hideLoginModal();
      showGameScreen();
      activarLogoutEstudiante();
    };

  } catch (err) {
    console.error("Error en login:", err);
    document.getElementById("errorMessage").textContent =
      "Error de conexión. Verifica que el servidor esté funcionando.";
  } finally {
    showLoading(false);
  }
}

async function handleRegister(e) {
  e.preventDefault();
  showLoading(true);

  const nombre = document.getElementById("nombre").value;
  const apellido = document.getElementById("apellido").value;
  const tipoUsuario = document.getElementById("tipoUsuario").value;
  const nombreUsuario = document.getElementById("username").value;
  const contrasena = document.getElementById("password").value;

  let paralelo = null;
  let codigoCurso = null;

  if (tipoUsuario === "estudiante") {
    paralelo = document.getElementById("paralelo").value;
    codigoCurso = document.getElementById("codigoCurso").value || null;
  }

  if (!validateUsername(nombreUsuario)) {
    document.getElementById("registerError").textContent =
      "El nombre de usuario debe tener mínimo 8 caracteres y contener números";
    showLoading(false);
    return;
  }

  if (!validatePassword(contrasena)) {
    document.getElementById("registerError").textContent =
      "La contraseña debe tener mínimo 8 caracteres, contener números y símbolos";
    showLoading(false);
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre,
        apellido,
        nombreUsuario,
        contrasena,
        rol: tipoUsuario,
        paralelo,
        codigoCurso,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      document.getElementById("registerError").textContent = data.mensaje || "Error al registrar usuario";
      return;
    }

    document.getElementById("registerError").style.color = "#10b981";
    document.getElementById("registerError").textContent = "¡Usuario registrado exitosamente!";

    setTimeout(() => {
      document.getElementById("registerForm").reset();
      document.getElementById("registerError").textContent = "";
      document.getElementById("registerError").style.color = "#ef4444";
      document.getElementById("studentFields").style.display = "none";
      showMainScreen();
    }, 1500);

  } catch (err) {
    console.error("Error en registro:", err);
    document.getElementById("registerError").textContent =
      "Error de conexión. Verifica que el servidor esté funcionando.";
  } finally {
    showLoading(false);
  }
}

function validateUsername(username) { return username.length >= 8 && /\d/.test(username); }
function validatePassword(password) { return password.length >= 8 && /\d/.test(password); }

/* =========================================================
   USER INFO
========================================================= */
function updateUserInfo() {
  if (!currentUser) return;
  const nameEl = document.getElementById("currentUserName");
  const courseEl = document.getElementById("currentUserCourse");
  if (nameEl) nameEl.textContent = currentUser.nombre || currentUser.nombreUsuario;
  if (courseEl) courseEl.textContent = `10mo EGB - Paralelo ${currentUser.paralelo || "A"}`;
}

function updateTeacherInfo() {
  if (!currentUser) return;
  const el = document.getElementById("teacherName");
  if (el) el.textContent = currentUser.nombre || currentUser.nombreUsuario;
}

/* =========================================================
   RULETA
========================================================= */
function spinRoulette() {
  const spinBtn = document.getElementById("spinBtn");
  const wheel = document.getElementById("wheel");
  if (!spinBtn || !wheel) return;

  spinBtn.disabled = true;
  spinBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Girando...</span>';

  document.querySelectorAll(".sector").forEach((s) => s.classList.remove("winner"));

  const randomRotation = Math.floor(Math.random() * 360) + 1440;
  wheel.style.transform = `rotate(${randomRotation}deg)`;

  setTimeout(() => {
    const finalRotation = randomRotation % 360;

    let categoryIndex;
    let selectedSector;

    if (finalRotation >= 330 || finalRotation < 30) {
      categoryIndex = 0; selectedSector = document.querySelector(".sector.algebra");
    } else if (finalRotation >= 30 && finalRotation < 90) {
      categoryIndex = 1; selectedSector = document.querySelector(".sector.trigonometry");
    } else if (finalRotation >= 90 && finalRotation < 150) {
      categoryIndex = 2; selectedSector = document.querySelector(".sector.geometry");
    } else if (finalRotation >= 150 && finalRotation < 210) {
      categoryIndex = 3; selectedSector = document.querySelector(".sector.statistics");
    } else if (finalRotation >= 210 && finalRotation < 270) {
      categoryIndex = 4; selectedSector = document.querySelector(".sector.numbers");
    } else {
      categoryIndex = 5; selectedSector = document.querySelector(".sector.functions");
    }

    currentCategory = categories[categoryIndex].name;
    if (selectedSector) selectedSector.classList.add("winner");

    console.log(`🏆 Categoría ganadora: ${currentCategory}`);

    setTimeout(() => startQuestions(), 1200);
  }, 3000);
}

/* =========================================================
   PREGUNTAS
========================================================= */
async function startQuestions() {
  currentQuestionIndex = 0;
  score = 0;
  sessionStartTime = new Date();
  isAnswerSelected = false;

  try {
    const token = localStorage.getItem("token");
    const response = await fetch(
      `${API_BASE_URL}/questions/category/${currentCategory}?difficulty=${currentDifficulty}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.ok) {
      const data = await response.json();
      currentQuestions = data.preguntas || [];
    } else {
      currentQuestions = [];
    }

    if (!currentQuestions.length) currentQuestions = getExampleQuestions();

    currentQuestions = shuffleArray(currentQuestions).slice(0, 5);

    showQuestionScreen();
    setTimeout(() => loadQuestion(), 250);

  } catch (err) {
    console.error("Error obteniendo preguntas:", err);
    currentQuestions = shuffleArray(getExampleQuestions()).slice(0, 5);
    showQuestionScreen();
    setTimeout(() => loadQuestion(), 250);
  }
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getExampleQuestions() {
  const example = {
    numeros: [
      { titulo: "¿Cuánto es el doble de 11?", opciones: ["21", "20", "22", "23"], respuestaCorrecta: "c" },
    ],
    geometria: [
      { titulo: "¿Cuántos lados tiene un hexágono?", opciones: ["5", "6", "7", "8"], respuestaCorrecta: "b" },
    ],
    algebra: [
      { titulo: "Si 3x = 15, entonces x =", opciones: ["3", "4", "5", "6"], respuestaCorrecta: "c" },
    ],
    trigonometria: [
      { titulo: "¿Cuál es el valor de sen(90°)?", opciones: ["0", "1", "-1", "1/2"], respuestaCorrecta: "b" },
    ],
    estadisticas: [
      { titulo: "¿Cuál es la media de: 2, 4, 6, 8?", opciones: ["4", "5", "6", "7"], respuestaCorrecta: "b" },
    ],
    funciones: [
      { titulo: "Si f(x)=2x+3, ¿cuál es f(5)?", opciones: ["10", "11", "13", "15"], respuestaCorrecta: "c" },
    ],
  };

  return example[currentCategory] || example.algebra;
}

function loadQuestion() {
  if (currentQuestionIndex >= currentQuestions.length) {
    showResults();
    return;
  }

  if (timer) clearInterval(timer);

  isAnswerSelected = false;

  const question = currentQuestions[currentQuestionIndex];
  if (!question || !question.titulo || !question.opciones || question.opciones.length !== 4) {
    console.error("Pregunta inválida:", question);
    return;
  }

  // Progress
  const progress = document.getElementById("questionProgress");
  if (progress) progress.textContent = `${currentQuestionIndex + 1}/5`;

  const fill = document.querySelector(".progress-fill");
  if (fill) fill.style.width = `${((currentQuestionIndex + 1) / 5) * 100}%`;

  // Category label
  const categoryTitle = document.getElementById("categoryTitle");
  const categoryIcon = document.querySelector(".category-icon");
  const catData = categories.find((c) => c.name === currentCategory);
  if (categoryTitle && catData) categoryTitle.textContent = catData.displayName;
  if (categoryIcon && catData) categoryIcon.className = `category-icon ${catData.icon}`;

  // Question text
  const qt = document.getElementById("questionText");
  if (qt) qt.textContent = question.titulo;

  // Options
  const mapBtns = [
    { id: "optionA", idx: 0 },
    { id: "optionB", idx: 1 },
    { id: "optionC", idx: 2 },
    { id: "optionD", idx: 3 },
  ];

  mapBtns.forEach(({ id, idx }) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    const txt = btn.querySelector(".option-text");
    if (txt) txt.textContent = question.opciones[idx];
    btn.classList.remove("correct", "incorrect", "selected-arduino");
    btn.disabled = false;
  });

  // ✅ Arduino/UI: preseleccionar A
  selectedOption = "a";
  highlightOption("a");

  startTimer();
}

function startTimer() {
  timeLeft = timeByDifficulty[currentDifficulty];
  const totalTime = timeByDifficulty[currentDifficulty];

  const timerText = document.getElementById("timer");
  const timerProgress = document.querySelector(".timer-progress");

  if (!timerText || !timerProgress) {
    setTimeout(() => { if (!isAnswerSelected) handleTimeUp(); }, totalTime * 1000);
    return;
  }

  const circumference = 283;
  timerProgress.style.strokeDasharray = circumference;
  timerProgress.style.strokeDashoffset = 0;

  timerText.textContent = timeLeft;

  timer = setInterval(() => {
    if (isAnswerSelected) { clearInterval(timer); return; }

    timeLeft--;
    timerText.textContent = timeLeft;

    const percent = (timeLeft / totalTime) * 100;
    const offset = circumference - (percent / 100) * circumference;
    timerProgress.style.strokeDashoffset = offset;

    if (percent <= 30) {
      timerProgress.style.stroke = "#ef4444";
      timerText.style.color = "#ef4444";
    } else if (percent <= 50) {
      timerProgress.style.stroke = "#f59e0b";
      timerText.style.color = "#f59e0b";
    } else {
      timerProgress.style.stroke = "#10b981";
      timerText.style.color = "white";
    }

    if (timeLeft <= 0) {
      clearInterval(timer);
      handleTimeUp();
    }
  }, 1000);
}

function selectAnswer(e) {
  if (isAnswerSelected) return;
  isAnswerSelected = true;
  clearInterval(timer);

  const btn = e.target.closest(".option-btn");
  if (!btn) return;

  const selected = btn.dataset.option; // a/b/c/d
  const question = currentQuestions[currentQuestionIndex];
  const correct = question.respuestaCorrecta;

  document.querySelectorAll(".option-btn").forEach((b) => (b.disabled = true));

  const correctBtn = document.querySelector(`.option-btn[data-option="${correct}"]`);
  if (correctBtn) correctBtn.classList.add("correct");

  if (selected === correct) score++;
  else btn.classList.add("incorrect");

  setTimeout(() => nextQuestion(), 1200);
}

function handleTimeUp() {
  if (isAnswerSelected) return;
  isAnswerSelected = true;

  const question = currentQuestions[currentQuestionIndex];
  const correct = question.respuestaCorrecta;

  document.querySelectorAll(".option-btn").forEach((b) => (b.disabled = true));
  const correctBtn = document.querySelector(`.option-btn[data-option="${correct}"]`);
  if (correctBtn) correctBtn.classList.add("correct");

  setTimeout(() => nextQuestion(), 1200);
}

function nextQuestion() {
  currentQuestionIndex++;
  if (currentQuestionIndex < currentQuestions.length) loadQuestion();
  else showResults();
}

/* =========================================================
   GUARDAR SESIÓN
========================================================= */
async function saveGameSession(sessionData) {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/game/save-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(sessionData),
    });

    if (response.ok) {
      console.log("✅ Sesión guardada exitosamente en la base de datos");
      return true;
    }
    console.error("❌ Error guardando sesión:", await response.text());
    return false;
  } catch (err) {
    console.error("❌ Error de conexión guardando sesión:", err);
    return false;
  }
}

function showResults() {
  const percentage = Math.round((score / currentQuestions.length) * 100);
  const sessionEndTime = new Date();
  const duration = Math.round((sessionEndTime - sessionStartTime) / 1000 / 60);

  const sessionData = {
    usuarioId: currentUser?.id,
    categoria: currentCategory,
    dificultad: currentDifficulty,
    puntaje: score,
    totalPreguntas: currentQuestions.length,
    porcentaje: percentage,
    duracion: duration,
    fechaInicio: sessionStartTime,
    fechaFin: sessionEndTime,
  };

  saveGameSession(sessionData);

  const finalScore = document.getElementById("finalScore");
  const pctEl = document.getElementById("percentage");
  const catEl = document.getElementById("resultCategory");
  const diffEl = document.getElementById("resultDifficulty");
  const durEl = document.getElementById("sessionDuration");

  if (finalScore) finalScore.textContent = `${score}/${currentQuestions.length}`;
  if (pctEl) pctEl.textContent = `${percentage}%`;

  const catData = categories.find((c) => c.name === currentCategory);
  if (catEl) catEl.textContent = catData ? catData.displayName : currentCategory;

  const diffNames = { facil: "Básico", intermedio: "Medio", dificil: "Avanzado" };
  if (diffEl) diffEl.textContent = diffNames[currentDifficulty] || currentDifficulty;

  if (durEl) durEl.textContent = `${duration} min`;

  showResultsScreen();
}

/* =========================================================
   CONTROL DE JUEGO
========================================================= */
function playAgain() {
  currentQuestionIndex = 0;
  score = 0;
  isAnswerSelected = false;

  const wheel = document.getElementById("wheel");
  if (wheel) wheel.style.transform = "rotate(0deg)";
  document.querySelectorAll(".sector").forEach((s) => s.classList.remove("winner"));

  const spinBtn = document.getElementById("spinBtn");
  if (spinBtn) {
    spinBtn.disabled = false;
    spinBtn.innerHTML = '<i class="fas fa-sync-alt"></i> <span>Girar Ruleta</span>';
  }

  showGameScreen();
  activarLogoutEstudiante();
}

function backToGame() { playAgain(); }

function logout() {
  currentUser = null;
  currentDifficulty = "";
  currentCategory = "";
  currentQuestionIndex = 0;
  score = 0;
  isAnswerSelected = false;

  localStorage.removeItem("token");
  localStorage.removeItem("userRole");

  const wheel = document.getElementById("wheel");
  if (wheel) wheel.style.transform = "rotate(0deg)";
  document.querySelectorAll(".sector").forEach((s) => s.classList.remove("winner"));

  const spinBtn = document.getElementById("spinBtn");
  if (spinBtn) {
    spinBtn.disabled = false;
    spinBtn.innerHTML = '<i class="fas fa-sync-alt"></i> <span>Girar Ruleta</span>';
  }

  showMainScreen();
}

/* =========================================================
   LOGOUT ESTUDIANTE (sin duplicar Arduino!)
========================================================= */
function activarLogoutEstudiante() {
  const btn = document.getElementById("logoutBtn");
  if (!btn) return;
  // evita múltiples listeners
  btn.onclick = () => {
    localStorage.clear();
    sessionStorage.clear();
    location.reload();
  };
}

/* =========================================================
   SOCKET.IO + ARDUINO (CORREGIDO)
========================================================= */
let socket = null;

// opción seleccionada SOLO preselección
let selectedOption = "a";

function isQuestionScreenActive() {
  const qs = document.getElementById("questionScreen");
  return qs && qs.classList.contains("active");
}

function highlightOption(letter) {
  const all = document.querySelectorAll(".option-btn");
  all.forEach((b) => b.classList.remove("selected-arduino"));

  const target = document.querySelector(`.option-btn[data-option="${letter}"]`);
  console.log("🎯 Resaltando:", letter, "=>", target);

  if (target) {
    target.classList.add("selected-arduino");
    selectedOption = letter;
  }
}

// Joystick: mover A-B-C-D con wrap
function moveSelection(step) {
  const order = ["a", "b", "c", "d"];
  let idx = order.indexOf(selectedOption);
  if (idx === -1) idx = 0;

  idx = (idx + step + order.length) % order.length;
  highlightOption(order[idx]);
}

// Click del joystick: recién aquí confirma
function confirmSelectedOption() {
  const btn = document.querySelector(`.option-btn[data-option="${selectedOption}"]`);
  if (btn && !btn.disabled) btn.click();
}

function initSocket() {
  socket = io(); // mismo host/puerto donde está servido el frontend

  socket.on("connect", () => console.log("✅ Socket conectado:", socket.id));
  socket.on("disconnect", () => console.log("❌ Socket desconectado"));

  socket.on("arduino:event", (data) => {
    console.log("🎮 Evento Arduino:", data);

    // Normalizar RAW
    if (data?.type === "raw") {
      const v = String(data.value || "").trim().toUpperCase();

      if (v === "ARRIBA") data = { type: "nav", value: "up" };
      else if (v === "ABAJO") data = { type: "nav", value: "down" };
      else if (v === "IZQUIERDA") data = { type: "nav", value: "left" };
      else if (v === "DERECHA") data = { type: "nav", value: "right" };
      else if (v === "KEY" || v === "CLICK") data = { type: "click", value: "sw" };
      else if (["A", "B", "C", "D"].includes(v)) data = { type: "preset", value: v.toLowerCase() };
      else return;
    }

    if (!isQuestionScreenActive()) return;

    if (data.type === "nav") {
      if (data.value === "up" || data.value === "left") moveSelection(-1);
      if (data.value === "down" || data.value === "right") moveSelection(1);
      return;
    }

    if (data.type === "preset") {
      // botones físicos: SOLO preselección
      highlightOption(data.value);
      return;
    }

    if (data.type === "click") {
      // joystick SW: confirma
      confirmSelectedOption();
    }
  });
}

/* =========================================================
   CSS DINÁMICO para que se VEA el resaltado
   (si ya lo pusiste en styles.css puedes borrar este bloque)
========================================================= */
function injectArduinoFocusCSS() {
  if (document.getElementById("arduino-focus-css")) return;
  const style = document.createElement("style");
  style.id = "arduino-focus-css";
  style.textContent = `
    .option-btn.selected-arduino{
      outline: 3px solid rgba(255,255,255,.95);
      box-shadow: 0 0 0 4px rgba(99,102,241,.55);
      transform: translateY(-2px);
    }
  `;
  document.head.appendChild(style);
}

/* =========================================================
   EVENTOS DOM
========================================================= */
function initializeApp() {
  // Main
  document.getElementById("loginBtn")?.addEventListener("click", showLoginModal);
  document.getElementById("registerBtn")?.addEventListener("click", showRegisterScreen);

  // Modal
  document.querySelector(".close")?.addEventListener("click", hideLoginModal);
  document.getElementById("loginForm")?.addEventListener("submit", handleLogin);

  // Register
  document.getElementById("registerForm")?.addEventListener("submit", handleRegister);
  document.getElementById("backToMain")?.addEventListener("click", showMainScreen);

  // Game
  document.getElementById("spinBtn")?.addEventListener("click", spinRoulette);
  document.getElementById("playAgainBtn")?.addEventListener("click", playAgain);
  document.getElementById("backToGameBtn")?.addEventListener("click", backToGame);
  document.getElementById("logoutBtn")?.addEventListener("click", logout);
  document.getElementById("teacherLogoutBtn")?.addEventListener("click", logout);

  // Options
  document.querySelectorAll(".option-btn").forEach((btn) => btn.addEventListener("click", selectAnswer));

  // click afuera del modal
  window.addEventListener("click", (event) => {
    const loginModal = document.getElementById("loginModal");
    if (event.target === loginModal || event.target.classList.contains("modal-overlay")) {
      hideLoginModal();
    }
  });
}

async function testDatabaseConnection() {
  try {
    const response = await fetch(`${API_BASE_URL}/test`);
    if (response.ok) console.log("✅ API OK");
    else console.log("❌ API error");
  } catch (e) {
    console.log("❌ API no responde");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  injectArduinoFocusCSS();
  initializeApp();
  initParticles();
  initSocket();
  testDatabaseConnection();
});

/* =========================================================
   NOTA:
   Si tienes dashboard docente gigante, pégalo aquí abajo.
   PERO: NO vuelvas a declarar `socket`, `selectedOption`,
   ni `initSocket`, ni `highlightOption`.
========================================================= */
