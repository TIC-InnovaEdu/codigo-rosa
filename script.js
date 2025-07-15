// Variables globales
const users = JSON.parse(localStorage.getItem("mathSpinUsers")) || []
let currentUser = null
let currentDifficulty = ""
let currentCategory = ""
let currentQuestions = []
let currentQuestionIndex = 0
let score = 0
let timer = null
let timeLeft = 0
let isSpinning = false

const optionLetters = ["a", "b", "c", "d"]

// Base de datos de preguntas integrada
const questions = {
  facil: {
    algebra: [
      {
        question: "Resuelve: 2x + 5 = 13",
        options: ["x = 4", "x = 3", "x = 5", "x = 6"],
        correct: "b",
      },
      {
        question: "Simplifica: 3x + 2x",
        options: ["5x", "6x", "x", "5x²"],
        correct: "a",
      },
      {
        question: "Si x = 3, ¿cuál es el valor de 2x + 1?",
        options: ["7", "6", "8", "5"],
        correct: "a",
      },
      {
        question: "Resuelve: x - 7 = 12",
        options: ["x = 19", "x = 5", "x = -5", "x = 20"],
        correct: "a",
      },
      {
        question: "¿Cuál es el coeficiente de x en 5x + 3?",
        options: ["5", "3", "8", "x"],
        correct: "a",
      },
    ],
    trigonometria: [
      {
        question: "¿Cuál es el valor de sen(30°)?",
        options: ["1/2", "√3/2", "1", "√2/2"],
        correct: "a",
      },
      {
        question: "¿Cuál es el valor de cos(0°)?",
        options: ["1", "0", "1/2", "-1"],
        correct: "c",
      },
      {
        question: "En un triángulo rectángulo, ¿qué es sen(θ)?",
        options: [
          "cateto opuesto/hipotenusa",
          "cateto adyacente/hipotenusa",
          "cateto opuesto/cateto adyacente",
          "hipotenusa/cateto opuesto",
        ],
        correct: "a",
      },
      {
        question: "¿Cuál es el valor de tan(45°)?",
        options: ["1", "√3", "1/2", "√2"],
        correct: "a",
      },
      {
        question: "¿Cuál es el valor de cos(90°)?",
        options: ["0", "1", "-1", "1/2"],
        correct: "a",
      },
    ],
    geometria: [
      {
        question: "¿Cuál es el área de un cuadrado de lado 4 cm?",
        options: ["16 cm²", "8 cm²", "12 cm²", "20 cm²"],
        correct: "a",
      },
      {
        question: "¿Cuántos grados suman los ángulos internos de un triángulo?",
        options: ["180°", "360°", "90°", "270°"],
        correct: "a",
      },
      {
        question: "¿Cuál es el perímetro de un rectángulo de 5 cm × 3 cm?",
        options: ["16 cm", "15 cm", "8 cm", "20 cm"],
        correct: "a",
      },
      {
        question: "¿Cuál es el área de un círculo con radio 2 cm? (π ≈ 3.14)",
        options: ["12.56 cm²", "6.28 cm²", "4 cm²", "8 cm²"],
        correct: "a",
      },
      {
        question: "¿Cuántas caras tiene un cubo?",
        options: ["6", "8", "4", "12"],
        correct: "a",
      },
    ],
    estadisticas: [
      {
        question: "¿Cuál es la media de 2, 4, 6, 8?",
        options: ["5", "4", "6", "20"],
        correct: "a",
      },
      {
        question: "En el conjunto {1, 2, 2, 3, 4}, ¿cuál es la moda?",
        options: ["2", "1", "3", "4"],
        correct: "a",
      },
      {
        question: "¿Cuál es la mediana de 1, 3, 5, 7, 9?",
        options: ["5", "3", "7", "25"],
        correct: "a",
      },
      {
        question: "Si lanzas una moneda, ¿cuál es la probabilidad de obtener cara?",
        options: ["1/2", "1/4", "1", "2/3"],
        correct: "a",
      },
      {
        question: "¿Cuál es el rango de 2, 5, 8, 1, 9?",
        options: ["8", "5", "9", "25"],
        correct: "a",
      },
    ],
    "numeros-racionales": [
      {
        question: "¿Cuál es el resultado de 1/2 + 1/4?",
        options: ["3/4", "1/6", "2/6", "1/3"],
        correct: "a",
      },
      {
        question: "Convierte 0.5 a fracción:",
        options: ["1/2", "1/4", "2/3", "3/4"],
        correct: "a",
      },
      {
        question: "¿Cuál es el resultado de 2/3 × 3/4?",
        options: ["1/2", "5/7", "6/12", "2/4"],
        correct: "a",
      },
      {
        question: "¿Cuál es el decimal de 3/4?",
        options: ["0.75", "0.5", "0.25", "1.25"],
        correct: "a",
      },
      {
        question: "¿Cuál es el resultado de 1 - 2/3?",
        options: ["1/3", "2/3", "1/2", "3/2"],
        correct: "a",
      },
    ],
    funciones: [
      {
        question: "Si f(x) = 2x + 1, ¿cuál es f(3)?",
        options: ["7", "6", "5", "8"],
        correct: "a",
      },
      {
        question: "¿Cuál es el dominio de f(x) = x + 2?",
        options: ["Todos los números reales", "x > 0", "x ≥ 2", "x ≠ 2"],
        correct: "a",
      },
      {
        question: "Si f(x) = x², ¿cuál es f(4)?",
        options: ["16", "8", "4", "12"],
        correct: "a",
      },
      {
        question: "¿Cuál es la pendiente de la función f(x) = 3x + 5?",
        options: ["3", "5", "8", "x"],
        correct: "a",
      },
      {
        question: "Si f(x) = 5, ¿qué tipo de función es?",
        options: ["Función constante", "Función lineal", "Función cuadrática", "Función exponencial"],
        correct: "a",
      },
    ],
  },
  intermedio: {
    algebra: [
      {
        question: "Resuelve: x² - 5x + 6 = 0",
        options: ["x = 2, x = 3", "x = 1, x = 6", "x = -2, x = -3", "x = 0, x = 5"],
        correct: "a",
      },
      {
        question: "Simplifica: (2x + 3)(x - 1)",
        options: ["2x² + x - 3", "2x² - 2x + 3", "2x² + 5x - 3", "x² + 2x - 3"],
        correct: "a",
      },
      {
        question: "Si 2x + y = 7 y x - y = 2, ¿cuál es el valor de x?",
        options: ["x = 3", "x = 2", "x = 4", "x = 1"],
        correct: "a",
      },
      {
        question: "Factoriza: x² - 9",
        options: ["(x + 3)(x - 3)", "(x - 3)²", "(x + 3)²", "x(x - 9)"],
        correct: "a",
      },
      {
        question: "Resuelve: |x - 3| = 5",
        options: ["x = 8, x = -2", "x = 2, x = 8", "x = -8, x = 2", "x = 3, x = 5"],
        correct: "a",
      },
    ],
    trigonometria: [
      {
        question: "¿Cuál es el valor de sen²(θ) + cos²(θ)?",
        options: ["1", "0", "2", "sen(2θ)"],
        correct: "a",
      },
      {
        question: "Si sen(θ) = 3/5, ¿cuál es cos(θ) en el primer cuadrante?",
        options: ["4/5", "3/4", "5/4", "5/3"],
        correct: "a",
      },
      {
        question: "¿Cuál es el período de la función sen(x)?",
        options: ["2π", "π", "π/2", "4π"],
        correct: "a",
      },
      {
        question: "Resuelve: 2sen(x) = 1 para 0 ≤ x ≤ 2π",
        options: ["x = π/6, x = 5π/6", "x = π/4, x = 3π/4", "x = π/3, x = 2π/3", "x = π/2, x = 3π/2"],
        correct: "a",
      },
      {
        question: "¿Cuál es la amplitud de y = 3sen(x)?",
        options: ["3", "1", "π", "6"],
        correct: "a",
      },
    ],
    geometria: [
      {
        question: "¿Cuál es el volumen de una esfera con radio 3 cm?",
        options: ["36π cm³", "12π cm³", "9π cm³", "27π cm³"],
        correct: "a",
      },
      {
        question: "En un triángulo rectángulo, si los catetos miden 3 y 4, ¿cuánto mide la hipotenusa?",
        options: ["5", "7", "6", "√7"],
        correct: "a",
      },
      {
        question: "¿Cuál es el área de un trapecio con bases 6 y 4, y altura 5?",
        options: ["25", "30", "20", "15"],
        correct: "d",
      },
      {
        question: "¿Cuántas diagonales tiene un hexágono?",
        options: ["9", "6", "12", "15"],
        correct: "a",
      },
      {
        question: "¿Cuál es el área lateral de un cilindro con radio 2 y altura 5?",
        options: ["20π", "10π", "4π", "25π"],
        correct: "a",
      },
    ],
    estadisticas: [
      {
        question: "¿Cuál es la desviación estándar de {2, 4, 4, 4, 5, 5, 7, 9}?",
        options: ["2", "1.5", "2.5", "3"],
        correct: "a",
      },
      {
        question: "En una distribución normal, ¿qué porcentaje de datos está dentro de 1 desviación estándar?",
        options: ["68%", "95%", "99.7%", "50%"],
        correct: "a",
      },
      {
        question: "Si P(A) = 0.3 y P(B) = 0.4, y A y B son independientes, ¿cuál es P(A ∩ B)?",
        options: ["0.12", "0.7", "0.1", "0.24"],
        correct: "a",
      },
      {
        question: "¿Cuál es el coeficiente de correlación máximo posible?",
        options: ["1", "0", "∞", "100"],
        correct: "a",
      },
      {
        question: "En una muestra de 100 personas, 60 prefieren café. ¿Cuál es la proporción muestral?",
        options: ["0.6", "0.4", "60", "40"],
        correct: "a",
      },
    ],
    "numeros-racionales": [
      {
        question: "¿Cuál es el resultado de (2/3) ÷ (4/5)?",
        options: ["5/6", "8/15", "6/5", "10/12"],
        correct: "a",
      },
      {
        question: "Convierte 2.75 a fracción mixta:",
        options: ["2 3/4", "2 1/4", "3 1/4", "2 1/2"],
        correct: "a",
      },
      {
        question: "¿Cuál es el MCM de 12 y 18?",
        options: ["36", "6", "216", "30"],
        correct: "a",
      },
      {
        question: "Resuelve: 3/4 - 2/3",
        options: ["1/12", "1/7", "5/12", "1/6"],
        correct: "a",
      },
      {
        question: "¿Cuál es el resultado de (1/2)³?",
        options: ["1/8", "3/2", "1/6", "3/8"],
        correct: "a",
      },
    ],
    funciones: [
      {
        question: "¿Cuál es la inversa de f(x) = 2x + 3?",
        options: ["f⁻¹(x) = (x-3)/2", "f⁻¹(x) = 2x - 3", "f⁻¹(x) = x/2 + 3", "f⁻¹(x) = (x+3)/2"],
        correct: "a",
      },
      {
        question: "Si f(x) = x² - 4x + 3, ¿cuál es el vértice de la parábola?",
        options: ["(2, -1)", "(4, 3)", "(-2, 15)", "(0, 3)"],
        correct: "a",
      },
      {
        question: "¿Cuál es el dominio de f(x) = √(x - 2)?",
        options: ["x ≥ 2", "x > 2", "x ≤ 2", "Todos los reales"],
        correct: "a",
      },
      {
        question: "Si f(x) = 3ˣ, ¿cuál es f(-2)?",
        options: ["1/9", "9", "-9", "6"],
        correct: "a",
      },
      {
        question: "¿Cuáles son las raíces de f(x) = x² - 7x + 12?",
        options: ["x = 3, x = 4", "x = 1, x = 12", "x = -3, x = -4", "x = 2, x = 6"],
        correct: "a",
      },
    ],
  },
  dificil: {
    algebra: [
      {
        question: "Resuelve el sistema: 2x + 3y = 12, 4x - y = 5",
        options: ["x = 3, y = 2", "x = 2, y = 3", "x = 1, y = 4", "x = 4, y = 1"],
        correct: "a",
      },
      {
        question: "Simplifica: (x² - 4)/(x² + 4x + 4)",
        options: ["(x-2)/(x+2)", "(x+2)/(x-2)", "1/(x+2)", "(x-2)²/(x+2)²"],
        correct: "a",
      },
      {
        question: "Resuelve: log₂(x + 3) = 4",
        options: ["x = 13", "x = 16", "x = 11", "x = 19"],
        correct: "a",
      },
      {
        question: "¿Cuál es la suma de una progresión aritmética con a₁ = 3, d = 4, n = 10?",
        options: ["210", "190", "230", "170"],
        correct: "a",
      },
      {
        question: "Resuelve: 2ˣ⁺¹ = 32",
        options: ["x = 4", "x = 5", "x = 3", "x = 6"],
        correct: "a",
      },
    ],
    trigonometria: [
      {
        question: "Resuelve: sen(2x) = √3/2 para 0 ≤ x ≤ π",
        options: ["x = π/6, x = π/3", "x = π/4, x = π/2", "x = π/3, x = 2π/3", "x = π/12, x = 5π/12"],
        correct: "a",
      },
      {
        question: "¿Cuál es el valor de cos(π/12)?",
        options: ["(√6 + √2)/4", "(√6 - √2)/4", "√3/2", "1/2"],
        correct: "a",
      },
      {
        question: "Si tan(α) = 2 y α está en el primer cuadrante, ¿cuál es sen(α)?",
        options: ["2/√5", "1/√5", "2", "√5/2"],
        correct: "a",
      },
      {
        question: "Demuestra que: sen(A + B) = sen(A)cos(B) + cos(A)sen(B). ¿Cuál es sen(75°)?",
        options: ["(√6 + √2)/4", "(√6 - √2)/4", "√3/2", "(√3 + 1)/2√2"],
        correct: "a",
      },
      {
        question: "¿Cuál es la solución general de sen(x) = 1/2?",
        options: [
          "x = π/6 + 2πn, x = 5π/6 + 2πn",
          "x = π/4 + 2πn, x = 3π/4 + 2πn",
          "x = π/3 + 2πn, x = 2π/3 + 2πn",
          "x = π/2 + 2πn",
        ],
        correct: "a",
      },
    ],
    geometria: [
      {
        question: "¿Cuál es el volumen de un cono truncado con radios 3 y 5, y altura 4?",
        options: ["148π/3", "52π", "44π", "156π/3"],
        correct: "a",
      },
      {
        question: "En un tetraedro regular de arista a, ¿cuál es su volumen?",
        options: ["a³√2/12", "a³√3/12", "a³/6", "a³√2/6"],
        correct: "a",
      },
      {
        question: "¿Cuál es la ecuación de la circunferencia con centro (2, -3) y radio 5?",
        options: ["(x-2)² + (y+3)² = 25", "(x+2)² + (y-3)² = 25", "(x-2)² + (y-3)² = 25", "x² + y² = 25"],
        correct: "a",
      },
      {
        question: "¿Cuál es el área de un polígono regular de n lados inscrito en un círculo de radio r?",
        options: ["(n·r²·sen(2π/n))/2", "n·r²·sen(π/n)", "π·r²/n", "n·r²·cos(π/n)"],
        correct: "a",
      },
      {
        question: "¿Cuál es la distancia entre los puntos A(1, 2, 3) y B(4, 6, 8) en el espacio?",
        options: ["5√2", "√50", "7", "√34"],
        correct: "a",
      },
    ],
    estadisticas: [
      {
        question: "En una distribución binomial con n = 20 y p = 0.3, ¿cuál es la media?",
        options: ["6", "14", "4.2", "8"],
        correct: "a",
      },
      {
        question: "¿Cuál es el estadístico de prueba para una prueba t de una muestra?",
        options: ["t = (x̄ - μ)/(s/√n)", "t = (x̄ - μ)/(σ/√n)", "z = (x̄ - μ)/σ", "t = (x̄ - μ)/s"],
        correct: "a",
      },
      {
        question: "Si X ~ N(100, 15²), ¿cuál es P(X > 115)?",
        options: ["0.1587", "0.8413", "0.5", "0.3413"],
        correct: "a",
      },
      {
        question: "¿Cuál es la fórmula del intervalo de confianza para la media poblacional?",
        options: ["x̄ ± t(α/2) · s/√n", "x̄ ± z(α/2) · σ", "μ ± t(α/2) · s", "x̄ ± s/√n"],
        correct: "a",
      },
      {
        question: "En una regresión lineal, si r² = 0.64, ¿qué porcentaje de variabilidad explica el modelo?",
        options: ["64%", "36%", "80%", "0.64%"],
        correct: "a",
      },
    ],
    "numeros-racionales": [
      {
        question: "¿Cuál es el resultado de ∛(8/27)?",
        options: ["2/3", "8/27", "4/9", "2/9"],
        correct: "a",
      },
      {
        question: "Resuelve: (2/3)ˣ = 8/27",
        options: ["x = 3", "x = 2", "x = -3", "x = 1/3"],
        correct: "a",
      },
      {
        question: "¿Cuál es la fracción continua de √2?",
        options: [
          "1 + 1/(2 + 1/(2 + 1/(2 + ...)))",
          "[1; 2, 2, 2, ...]",
          "2 + 1/(2 + 1/(2 + ...))",
          "[2; 1, 1, 1, ...]",
        ],
        correct: "a",
      },
      {
        question: "Si a/b = 3/4 y b/c = 2/5, ¿cuál es a/c?",
        options: ["3/10", "6/20", "5/6", "15/8"],
        correct: "a",
      },
      {
        question: "¿Cuál es el resultado de (1 + 1/2)(1 + 1/3)(1 + 1/4)...(1 + 1/n)?",
        options: ["(n+1)/2", "n+1", "n/2", "2n"],
        correct: "a",
      },
    ],
    funciones: [
      {
        question: "¿Cuál es la derivada de f(x) = ln(x² + 1)?",
        options: ["2x/(x² + 1)", "1/(x² + 1)", "2x", "x/(x² + 1)"],
        correct: "a",
      },
      {
        question: "¿Cuál es el límite de (sen(x))/x cuando x → 0?",
        options: ["1", "0", "∞", "No existe"],
        correct: "a",
      },
      {
        question: "¿Cuál es la integral de ∫x·eˣ dx?",
        options: ["eˣ(x - 1) + C", "x·eˣ + C", "eˣ(x + 1) + C", "x²·eˣ/2 + C"],
        correct: "b",
      },
      {
        question: "¿Cuáles son las asíntotas de f(x) = (2x + 1)/(x - 3)?",
        options: ["x = 3, y = 2", "x = -1/2, y = 2", "x = 3, y = 0", "x = 0, y = 3"],
        correct: "a",
      },
      {
        question: "¿Cuál es el dominio de f(x) = log(x² - 4)?",
        options: ["x < -2 o x > 2", "x ≥ 2", "x ≠ ±2", "x > 4"],
        correct: "a",
      },
    ],
  },
}

// Elementos del DOM
const pages = {
  main: document.getElementById("main-page"),
  register: document.getElementById("register-page"),
  game: document.getElementById("game-page"),
  question: document.getElementById("question-page"),
  results: document.getElementById("results-page"),
}

const modals = {
  login: document.getElementById("login-modal"),
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  // Botones principales
  document.getElementById("login-btn").addEventListener("click", showLoginModal)
  document.getElementById("register-btn").addEventListener("click", showRegisterPage)

  // Modal de login
  document.querySelector(".close").addEventListener("click", hideLoginModal)
  document.getElementById("login-form").addEventListener("submit", handleLogin)
  document.getElementById("toggle-login-password").addEventListener("click", togglePasswordVisibility)

  // Página de registro
  document.getElementById("register-form").addEventListener("submit", handleRegister)
  document.getElementById("back-to-main").addEventListener("click", showMainPage)
  document.getElementById("toggle-reg-password").addEventListener("click", toggleRegPasswordVisibility)

  // Juego
  document.getElementById("spin-btn").addEventListener("click", spinWheel)

  // Preguntas
  document.querySelectorAll(".option-btn").forEach((btn) => {
    btn.addEventListener("click", selectAnswer)
  })

  // Resultados
  document.getElementById("play-again-btn").addEventListener("click", showGamePage)
  document.getElementById("logout-btn").addEventListener("click", logout)

  // Cerrar modal al hacer clic fuera
  window.addEventListener("click", (event) => {
    if (event.target === modals.login) {
      hideLoginModal()
    }
  })
})

// Funciones de navegación
function showPage(pageName) {
  Object.values(pages).forEach((page) => page.classList.remove("active"))
  pages[pageName].classList.add("active")
}

function showMainPage() {
  showPage("main")
  resetGame()
}

function showRegisterPage() {
  showPage("register")
}

function showGamePage() {
  showPage("game")
  resetGame()
}

function showQuestionPage() {
  showPage("question")
}

function showResultsPage() {
  showPage("results")
}

// Funciones de modal
function showLoginModal() {
  modals.login.style.display = "block"
  document.getElementById("difficulty-container").style.display = "none"
  document.getElementById("error-message").classList.remove("show")
}

function hideLoginModal() {
  modals.login.style.display = "none"
  document.getElementById("login-form").reset()
  document.getElementById("difficulty-container").style.display = "none"
  document.getElementById("error-message").classList.remove("show")
}

// Funciones de autenticación
function handleLogin(e) {
  e.preventDefault()

  const username = document.getElementById("login-username").value
  const password = document.getElementById("login-password").value

  const user = users.find((u) => u.username === username && u.password === password)

  if (user) {
    currentUser = user
    document.getElementById("difficulty-container").style.display = "block"
    document.getElementById("error-message").classList.remove("show")

    // Agregar event listener para el botón de continuar
    const continueBtn = document.createElement("button")
    continueBtn.textContent = "Continuar al Juego"
    continueBtn.className = "submit-btn"
    continueBtn.style.marginTop = "10px"
    continueBtn.addEventListener("click", () => {
      currentDifficulty = document.getElementById("difficulty-select").value
      hideLoginModal()
      showGamePage()
    })

    const difficultyContainer = document.getElementById("difficulty-container")
    if (!difficultyContainer.querySelector("button")) {
      difficultyContainer.appendChild(continueBtn)
    }
  } else {
    const errorMsg = document.getElementById("error-message")
    errorMsg.textContent = "El nombre de usuario o contraseña es incorrecta"
    errorMsg.classList.add("show")
  }
}

function handleRegister(e) {
  e.preventDefault()

  const name = document.getElementById("reg-name").value
  const course = document.getElementById("reg-course").value
  const parallel = document.getElementById("reg-parallel").value
  const username = document.getElementById("reg-username").value
  const password = document.getElementById("reg-password").value

  // Validaciones
  if (!validateUsername(username)) {
    showRegisterError("El nombre de usuario debe tener mínimo 8 caracteres y contener números")
    return
  }

  if (!validatePassword(password)) {
    showRegisterError("La contraseña debe tener mínimo 8 caracteres y contener números")
    return
  }

  if (users.find((u) => u.username === username)) {
    showRegisterError("El nombre de usuario ya existe")
    return
  }

  // Crear nuevo usuario
  const newUser = {
    name,
    course,
    parallel,
    username,
    password,
    id: Date.now(),
  }

  users.push(newUser)
  localStorage.setItem("mathSpinUsers", JSON.stringify(users))

  alert("¡Registro exitoso! Ahora puedes iniciar sesión.")
  showMainPage()
}

function validateUsername(username) {
  return username.length >= 8 && /\d/.test(username)
}

function validatePassword(password) {
  return password.length >= 8 && /\d/.test(password)
}

function showRegisterError(message) {
  const errorElement = document.getElementById("register-error")
  errorElement.textContent = message
  errorElement.classList.add("show")
  setTimeout(() => {
    errorElement.classList.remove("show")
  }, 5000)
}

function togglePasswordVisibility() {
  const passwordInput = document.getElementById("login-password")
  const eyeIcon = document.getElementById("toggle-login-password")

  if (passwordInput.type === "password") {
    passwordInput.type = "text"
    eyeIcon.textContent = "🙈"
  } else {
    passwordInput.type = "password"
    eyeIcon.textContent = "👁️"
  }
}

function toggleRegPasswordVisibility() {
  const passwordInput = document.getElementById("reg-password")
  const eyeIcon = document.getElementById("toggle-reg-password")

  if (passwordInput.type === "password") {
    passwordInput.type = "text"
    eyeIcon.textContent = "🙈"
  } else {
    passwordInput.type = "password"
    eyeIcon.textContent = "👁️"
  }
}

// Funciones del juego
function spinWheel() {
  if (isSpinning) return

  isSpinning = true
  const wheel = document.getElementById("wheel")
  const spinBtn = document.getElementById("spin-btn")
  spinBtn.disabled = true
  spinBtn.textContent = "Girando..."

  // Remove any existing highlights before spinning
  document.querySelectorAll(".wheel-section").forEach((section) => {
    section.classList.remove("highlighted")
  })

  const categories = ["algebra", "trigonometria", "geometria", "funciones", "numeros-racionales", "estadisticas"]
  const targetCategoryIndex = Math.floor(Math.random() * categories.length) // Index of the category we want to land on

  // Calculate the angle to make the selected category face the right (0 degrees, where pointer was)
  // Each section is 60 degrees. Algebra starts at 0deg.
  // We want the *center* of the target category to land at 0 degrees (the right side).
  // Each section is 60 degrees. Algebra starts at 0deg.
  // We want the *center* of the target category to land at 0 degrees (the right side).
  // The center of section `i` is at `i * 60 + 30` degrees.
  const desiredAngleForCenter = targetCategoryIndex * 60 + 30

  // Calculate the wheel's rotation (finalWheelAngle) such that `desiredAngleForCenter`
  // ends up at the 0-degree position (right side of the wheel container).
  // If the wheel rotates `finalWheelAngle` degrees clockwise, then the point that was at `desiredAngleForCenter`
  // will move to `(desiredAngleForCenter + finalWheelAngle) % 360`.
  // We want this to be 0 degrees.
  // So, `(desiredAngleForCenter + finalWheelAngle) % 360 = 0`.
  // `finalWheelAngle = (0 - desiredAngleForCenter + 360) % 360`.
  const finalWheelAngle = (0 - desiredAngleForCenter + 360) % 360

  // Add multiple full rotations (e.g., 4 full spins = 1440 degrees) for visual effect
  const totalRotation = 1440 + finalWheelAngle

  wheel.style.transform = `rotate(${totalRotation}deg)`

  // Esperar a que termine la animación
  setTimeout(() => {
    // Determine the actual category based on the final rotation
    // The angle on the wheel that is now at 0 degrees (the right side).
    const angleAtZero = (0 - (totalRotation % 360) + 360) % 360

    // Based on the angle, determine which section it falls into.
    // Each section is 60 degrees. Algebra is 0-59.9, Trig is 60-119.9 etc.
    const landedSectionIndex = Math.floor(angleAtZero / 60)

    currentCategory = categories[landedSectionIndex] || categories[0] // Fallback to algebra if somehow out of bounds

    // Highlight the selected section
    const selectedSection = document.querySelector(`.wheel-section[data-category="${currentCategory}"]`)
    if (selectedSection) {
      selectedSection.classList.add("highlighted")
    }

    isSpinning = false
    spinBtn.disabled = false
    spinBtn.textContent = "Girar Ruleta"

    // Mostrar ventana emergente con las preguntas
    setTimeout(() => {
      showQuestionModal()
    }, 1000)
  }, 3000)
}

function showQuestionModal() {
  // Crear modal de preguntas
  const questionModal = document.createElement("div")
  questionModal.id = "question-modal"
  questionModal.className = "modal"
  questionModal.style.display = "block"

  questionModal.innerHTML = `
    <div class="modal-content" style="max-width: 600px;">
      <h2>Categoría: ${getCategoryDisplayName(currentCategory)}</h2>
      <p>Dificultad: ${currentDifficulty.charAt(0).toUpperCase() + currentDifficulty.slice(1)}</p>
      <p>¡Prepárate para responder 5 preguntas!</p>
      <button id="start-questions-btn" class="submit-btn">Comenzar Preguntas</button>
    </div>
  `

  document.body.appendChild(questionModal)

  document.getElementById("start-questions-btn").addEventListener("click", () => {
    document.body.removeChild(questionModal)
    startQuestions()
  })
}

function startQuestions() {
  currentQuestions = [...questions[currentDifficulty][currentCategory]]

  // Shuffle options for each question
  currentQuestions.forEach((question) => {
    const originalCorrectText = question.options[optionLetters.indexOf(question.correct)]

    // Create a copy of options to shuffle
    const shuffledOptions = [...question.options]

    // Fisher-Yates shuffle algorithm
    for (let i = shuffledOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]]
    }

    question.options = shuffledOptions
    question.correct = optionLetters[shuffledOptions.indexOf(originalCorrectText)]
  })

  currentQuestionIndex = 0
  score = 0

  showQuestionPage()
  displayQuestion()
}

function displayQuestion() {
  if (currentQuestionIndex >= currentQuestions.length) {
    showResults()
    return
  }

  const question = currentQuestions[currentQuestionIndex]

  // Actualizar interfaz
  document.getElementById("category-title").textContent = getCategoryDisplayName(currentCategory)
  document.getElementById("question-counter").textContent = `${currentQuestionIndex + 1}/5`
  document.getElementById("question-text").textContent = question.question

  // Mostrar opciones
  const options = ["a", "b", "c", "d"]
  options.forEach((option, index) => {
    const btn = document.getElementById(`option-${option}`)
    btn.textContent = `${option.toUpperCase()}) ${question.options[index]}`
    btn.disabled = false
    btn.className = "option-btn"
  })

  // Iniciar temporizador
  startTimer()
}

function getCategoryDisplayName(category) {
  const names = {
    algebra: "Álgebra",
    trigonometria: "Trigonometría",
    geometria: "Geometría",
    estadisticas: "Estadísticas",
    "numeros-racionales": "Números Racionales",
    funciones: "Funciones",
  }
  return names[category] || category
}

function startTimer() {
  const timeSettings = {
    facil: 10,
    intermedio: 20,
    dificil: 30,
  }

  timeLeft = timeSettings[currentDifficulty]
  document.getElementById("timer").textContent = timeLeft

  timer = setInterval(() => {
    timeLeft--
    document.getElementById("timer").textContent = timeLeft

    if (timeLeft <= 0) {
      clearInterval(timer)
      handleTimeOut()
    }
  }, 1000)
}

function handleTimeOut() {
  const question = currentQuestions[currentQuestionIndex]

  // Deshabilitar todos los botones
  document.querySelectorAll(".option-btn").forEach((btn) => {
    btn.disabled = true
  })

  // Mostrar respuesta correcta
  const correctBtn = document.getElementById(`option-${question.correct}`)
  correctBtn.classList.add("correct")

  // Continuar a la siguiente pregunta después de 2 segundos
  setTimeout(() => {
    currentQuestionIndex++
    displayQuestion()
  }, 2000)
}

function selectAnswer(event) {
  clearInterval(timer)

  const question = currentQuestions[currentQuestionIndex]
  const selectedOption = event.target.dataset.option

  // Deshabilitar todos los botones
  document.querySelectorAll(".option-btn").forEach((btn) => {
    btn.disabled = true
  })

  // Mostrar respuesta correcta
  const correctBtn = document.getElementById(`option-${question.correct}`)
  correctBtn.classList.add("correct")

  // Si se seleccionó una respuesta incorrecta, marcarla
  if (selectedOption !== question.correct) {
    const selectedBtn = document.getElementById(`option-${selectedOption}`)
    selectedBtn.classList.add("incorrect")
  } else {
    // Incrementar puntaje si es correcto
    score++
  }

  // Continuar a la siguiente pregunta después de 2 segundos
  setTimeout(() => {
    currentQuestionIndex++
    displayQuestion()
  }, 2000)
}

function showResults() {
  const percentage = Math.round((score / 5) * 100)

  document.getElementById("final-score").textContent = `Puntuación: ${score}/5 (${percentage}%)`

  let resultText = ""
  if (percentage >= 80) {
    resultText = "¡Excelente trabajo! 🎉"
  } else if (percentage >= 60) {
    resultText = "¡Buen trabajo! 👍"
  } else if (percentage >= 40) {
    resultText = "Puedes mejorar 📚"
  } else {
    resultText = "Necesitas estudiar más 📚"
  }

  document.getElementById("results-details").innerHTML = `
      <h4>${resultText}</h4>
      <p><strong>Categoría:</strong> ${getCategoryDisplayName(currentCategory)}</p>
      <p><strong>Dificultad:</strong> ${currentDifficulty.charAt(0).toUpperCase() + currentDifficulty.slice(1)}</p>
      <p><strong>Respuestas correctas:</strong> ${score} de 5</p>
      <p><strong>Porcentaje:</strong> ${percentage}%</p>
  `

  showResultsPage()
}

function resetGame() {
  currentCategory = ""
  currentQuestions = []
  currentQuestionIndex = 0
  score = 0
  isSpinning = false

  if (timer) {
    clearInterval(timer)
    timer = null
  }

  // Resetear ruleta
  const wheel = document.getElementById("wheel")
  wheel.style.transform = "rotate(0deg)"

  // Remove any lingering highlights
  document.querySelectorAll(".wheel-section").forEach((section) => {
    section.classList.remove("highlighted")
  })

  // Resetear botón de girar
  const spinBtn = document.getElementById("spin-btn")
  spinBtn.disabled = false
  spinBtn.textContent = "Girar Ruleta"
}

function logout() {
  currentUser = null
  currentDifficulty = ""
  showMainPage()
}
