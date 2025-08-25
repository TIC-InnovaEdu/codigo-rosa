// Configuración de la API
const API_BASE_URL = "http://localhost:5000/api"

// Variables globales
let currentUser = null
let currentDifficulty = ""
let currentCategory = ""
let currentQuestionIndex = 0
let score = 0
let timer = null
let timeLeft = 0
let sessionStartTime = null
let currentQuestions = []
let isAnswerSelected = false

// ✅ NUEVAS VARIABLES GLOBALES PARA DASHBOARD DOCENTE
let currentCourse = null
let teacherCourses = []
let editingQuestion = null
let editingCourse = null
let currentStudents = []

// Categorías disponibles con mapeo correcto
const categories = [
  { name: "algebra", displayName: "Álgebra", icon: "fas fa-square-root-alt" },
  { name: "trigonometria", displayName: "Trigonometría", icon: "fas fa-wave-square" },
  { name: "geometria", displayName: "Geometría", icon: "fas fa-shapes" },
  { name: "estadisticas", displayName: "Estadísticas", icon: "fas fa-chart-bar" },
  { name: "numeros", displayName: "Números", icon: "fas fa-hashtag" },
  { name: "funciones", displayName: "Funciones", icon: "fas fa-project-diagram" },
]

// Tiempo por dificultad
const timeByDifficulty = {
  facil: 10,
  intermedio: 20,
  dificil: 30,
}

// Importación de particlesJS
const particlesJS = window.particlesJS

// Inicialización de partículas
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
    })
  }
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  initializeApp()
  initParticles()
})

function initializeApp() {
  // Botones principales
  document.getElementById("loginBtn").addEventListener("click", showLoginModal)
  document.getElementById("registerBtn").addEventListener("click", showRegisterScreen)

  // Modal de login
  document.querySelector(".close").addEventListener("click", hideLoginModal)
  document.getElementById("loginForm").addEventListener("submit", handleLogin)
  document.getElementById("toggleLoginPassword").addEventListener("click", togglePasswordVisibility)

  // Formulario de registro
  document.getElementById("registerForm").addEventListener("submit", handleRegister)
  document.getElementById("backToMain").addEventListener("click", showMainScreen)
  document.getElementById("togglePassword").addEventListener("click", toggleRegisterPasswordVisibility)

  // Juego
  document.getElementById("spinBtn").addEventListener("click", spinRoulette)
  document.getElementById("playAgainBtn").addEventListener("click", playAgain)
  document.getElementById("logoutBtn").addEventListener("click", logout)
  document.getElementById("backToGameBtn").addEventListener("click", backToGame)

  // Dashboard Docente
  document.getElementById("teacherLogoutBtn").addEventListener("click", logout)

  // Opciones de preguntas
  document.querySelectorAll(".option-btn").forEach((btn) => {
    btn.addEventListener("click", selectAnswer)
  })

  
  // Cerrar modal al hacer clic fuera
  window.addEventListener("click", (event) => {
    const loginModal = document.getElementById("loginModal")
    if (event.target === loginModal || event.target.classList.contains("modal-overlay")) {
      hideLoginModal()
    }
  })
}

// Función para mostrar/ocultar campos de estudiante
function toggleStudentFields() {
  const tipoUsuario = document.getElementById("tipoUsuario").value
  const studentFields = document.getElementById("studentFields")
  const paraleloField = document.getElementById("paralelo")

  if (tipoUsuario === "estudiante") {
    studentFields.style.display = "block"
    paraleloField.required = true
  } else {
    studentFields.style.display = "none"
    paraleloField.required = false
  }
}

// Funciones de navegación
function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.remove("active")
  })
  document.getElementById(screenId).classList.add("active")

  const activeScreen = document.getElementById(screenId)
  activeScreen.classList.add("fade-in")
  setTimeout(() => {
    activeScreen.classList.remove("fade-in")
  }, 500)
}

function showMainScreen() {
  showScreen("mainScreen")
}

function showRegisterScreen() {
  showScreen("registerScreen")
}

function showGameScreen() {
  showScreen("gameScreen")
  updateUserInfo()
}

function showQuestionScreen() {
  showScreen("questionScreen")
}

function showResultsScreen() {
  showScreen("resultsScreen")
}

function showTeacherDashboard() {
  showScreen("teacherDashboard")
  updateTeacherInfo()
  initializeTeacherDashboard() // ✅ INICIALIZAR DASHBOARD
}

// Funciones del modal de login
function showLoginModal() {
  document.getElementById("loginModal").style.display = "block"
  document.getElementById("difficultyContainer").style.display = "none"
  document.getElementById("errorMessage").textContent = ""
  document.body.style.overflow = "hidden"
}

function hideLoginModal() {
  document.getElementById("loginModal").style.display = "none"
  document.getElementById("loginForm").reset()
  document.getElementById("difficultyContainer").style.display = "none"
  document.getElementById("errorMessage").textContent = ""
  document.body.style.overflow = "auto"
}

// Funciones de autenticación
async function handleLogin(e) {
  e.preventDefault()
  showLoading(true)

  const nombreUsuario = document.getElementById("loginUsername").value
  const contrasena = document.getElementById("loginPassword").value

  try {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nombreUsuario, contrasena }),
    })

    const data = await response.json()

    if (response.ok) {
      // Guardar token y datos del usuario
      localStorage.setItem("token", data.token)
      localStorage.setItem("userRole", data.rol)

      // ✅ CORRECCIÓN: Obtener datos completos del usuario incluyendo ID
      currentUser = {
        id: data.id, // ✅ ID REAL NECESARIO PARA guardar sesión
        nombreUsuario,
        rol: data.rol,
        nombre: data.nombre || nombreUsuario,
        paralelo: data.paralelo || "A",
      }

      document.getElementById("errorMessage").textContent = ""

      if (data.rol === "docente") {
        hideLoginModal()
        showTeacherDashboard()
      } else {
        // ✅ Deshabilitar campos en lugar de limpiarlos
        document.getElementById("loginUsername").setAttribute("disabled", true)
        document.getElementById("loginPassword").setAttribute("disabled", true)

        document.getElementById("difficultyContainer").style.display = "block"
        document.getElementById("loginSubmitBtn").innerHTML = '<i class="fas fa-play"></i> Comenzar Juego'

        document.getElementById("loginSubmitBtn").onclick = () => {
          const selectedDifficulty = document.querySelector('input[name="difficulty"]:checked')
          currentDifficulty = selectedDifficulty ? selectedDifficulty.value : "facil"
          hideLoginModal()
          showGameScreen()
          activarLogoutEstudiante()
        }
      }
    } else {
      document.getElementById("errorMessage").textContent = data.mensaje || "Error al iniciar sesión"
    }
  } catch (error) {
    console.error("Error en login:", error)
    document.getElementById("errorMessage").textContent =
      "Error de conexión. Verifica que el servidor esté funcionando."
  } finally {
    showLoading(false)
  }
}

async function handleRegister(e) {
  e.preventDefault()
  showLoading(true)

  const nombre = document.getElementById("nombre").value
  const apellido = document.getElementById("apellido").value
  const tipoUsuario = document.getElementById("tipoUsuario").value
  const nombreUsuario = document.getElementById("username").value
  const contrasena = document.getElementById("password").value

  // Campos específicos para estudiantes
  let paralelo = null
  let codigoCurso = null

  if (tipoUsuario === "estudiante") {
    paralelo = document.getElementById("paralelo").value
    codigoCurso = document.getElementById("codigoCurso").value || null
  }

  // Validaciones del frontend
  if (!validateUsername(nombreUsuario)) {
    document.getElementById("registerError").textContent =
      "El nombre de usuario debe tener mínimo 8 caracteres y contener números"
    showLoading(false)
    return
  }

  if (!validatePassword(contrasena)) {
    document.getElementById("registerError").textContent =
      "La contraseña debe tener mínimo 8 caracteres, contener números y símbolos"
    showLoading(false)
    return
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nombre,
        apellido,
        nombreUsuario,
        contrasena,
        rol: tipoUsuario,
        paralelo,
        codigoCurso,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      // Mostrar mensaje de éxito
      document.getElementById("registerError").style.color = "#10b981"
      document.getElementById("registerError").textContent = "¡Usuario registrado exitosamente!"

      // Limpiar formulario y volver a pantalla principal después de 2 segundos
      setTimeout(() => {
        document.getElementById("registerForm").reset()
        document.getElementById("registerError").textContent = ""
        document.getElementById("registerError").style.color = "#ef4444"
        document.getElementById("studentFields").style.display = "none"
        showMainScreen()
      }, 2000)
    } else {
      document.getElementById("registerError").textContent = data.mensaje || "Error al registrar usuario"
    }
  } catch (error) {
    console.error("Error en registro:", error)
    document.getElementById("registerError").textContent =
      "Error de conexión. Verifica que el servidor esté funcionando."
  } finally {
    showLoading(false)
  }
}

function validateUsername(username) {
  return username.length >= 8 && /\d/.test(username)
}

function validatePassword(password) {
  return password.length >= 8 && /\d/.test(password)
}

// Funciones de visibilidad de contraseña
function togglePasswordVisibility() {
  const passwordInput = document.getElementById("loginPassword")
  const eyeIcon = document.getElementById("toggleLoginPassword")

  if (passwordInput.type === "password") {
    passwordInput.type = "text"
    eyeIcon.innerHTML = '<i class="fas fa-eye-slash"></i>'
  } else {
    passwordInput.type = "password"
    eyeIcon.innerHTML = '<i class="fas fa-eye"></i>'
  }
}

function toggleRegisterPasswordVisibility() {
  const passwordInput = document.getElementById("password")
  const eyeIcon = document.getElementById("togglePassword")

  if (passwordInput.type === "password") {
    passwordInput.type = "text"
    eyeIcon.innerHTML = '<i class="fas fa-eye-slash"></i>'
  } else {
    passwordInput.type = "password"
    eyeIcon.innerHTML = '<i class="fas fa-eye"></i>'
  }
}

// Función para mostrar/ocultar loading
function showLoading(show) {
  const overlay = document.getElementById("loadingOverlay")
  if (show) {
    overlay.style.display = "flex"
  } else {
    overlay.style.display = "none"
  }
}

// Actualizar información del usuario
function updateUserInfo() {
  if (currentUser) {
    document.getElementById("currentUserName").textContent = currentUser.nombre || currentUser.nombreUsuario
    document.getElementById("currentUserCourse").textContent = `10mo EGB - Paralelo ${currentUser.paralelo || "A"}`
  }
}

function updateTeacherInfo() {
  if (currentUser) {
    document.getElementById("teacherName").textContent = currentUser.nombre || currentUser.nombreUsuario
  }
}

// Funciones de la ruleta CORREGIDAS
function spinRoulette() {
  const spinBtn = document.getElementById("spinBtn")
  const wheel = document.getElementById("wheel")

  spinBtn.disabled = true
  spinBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Girando...</span>'

  // Limpiar sector ganador anterior
  document.querySelectorAll(".sector").forEach((sector) => {
    sector.classList.remove("winner")
  })

  // Generar rotación aleatoria
  const randomRotation = Math.floor(Math.random() * 360) + 1440 // Al menos 4 vueltas completas
  wheel.style.transform = `rotate(${randomRotation}deg)`

  setTimeout(() => {
    // CÁLCULO CORREGIDO: Los sectores están distribuidos cada 60 grados
    const finalRotation = randomRotation % 360

    // Mapeo correcto de ángulos a categorías (considerando que 0° está arriba)
    let categoryIndex
    let selectedSector

    // Los sectores están posicionados así en el CSS:
    // algebra: 0° (transform: rotate(0deg))
    // trigonometry: 60° (transform: rotate(60deg))
    // geometry: 120° (transform: rotate(120deg))
    // statistics: 180° (transform: rotate(180deg))
    // numbers: 240° (transform: rotate(240deg))
    // functions: 300° (transform: rotate(300deg))

    if (finalRotation >= 330 || finalRotation < 30) {
      categoryIndex = 0 // Álgebra
      selectedSector = document.querySelector(".sector.algebra")
    } else if (finalRotation >= 30 && finalRotation < 90) {
      categoryIndex = 1 // Trigonometría
      selectedSector = document.querySelector(".sector.trigonometry")
    } else if (finalRotation >= 90 && finalRotation < 150) {
      categoryIndex = 2 // Geometría
      selectedSector = document.querySelector(".sector.geometry")
    } else if (finalRotation >= 150 && finalRotation < 210) {
      categoryIndex = 3 // Estadísticas
      selectedSector = document.querySelector(".sector.statistics")
    } else if (finalRotation >= 210 && finalRotation < 270) {
      categoryIndex = 4 // Números
      selectedSector = document.querySelector(".sector.numbers")
    } else {
      categoryIndex = 5 // Funciones
      selectedSector = document.querySelector(".sector.functions")
    }

    currentCategory = categories[categoryIndex].name

    // Resaltar sector ganador
    selectedSector.classList.add("winner")

    console.log(`🎯 Rotación final: ${finalRotation}°`)
    console.log(`🏆 Categoría ganadora: ${currentCategory}`)

    setTimeout(() => {
      startQuestions()
    }, 1500)
  }, 3000)
}

// Funciones de preguntas CORREGIDAS
async function startQuestions() {
  currentQuestionIndex = 0
  score = 0
  sessionStartTime = new Date()
  isAnswerSelected = false

  try {
    // Intentar obtener preguntas de la base de datos
    const token = localStorage.getItem("token")
    const response = await fetch(
      `${API_BASE_URL}/questions/category/${currentCategory}?difficulty=${currentDifficulty}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    if (response.ok) {
      const data = await response.json()
      currentQuestions = data.preguntas || []
    } else {
      console.log("No se pudieron obtener preguntas de la BD, usando preguntas de ejemplo")
      currentQuestions = []
    }

    // Si no hay preguntas de la BD, usar preguntas de ejemplo
    if (currentQuestions.length === 0) {
      currentQuestions = getExampleQuestions()
    }

    // Tomar solo 5 preguntas aleatorias
    currentQuestions = shuffleArray(currentQuestions).slice(0, 5)

    showQuestionScreen()

    // Esperar un momento para que se cargue la pantalla
    setTimeout(() => {
      loadQuestion()
    }, 500)
  } catch (error) {
    console.error("Error obteniendo preguntas:", error)
    currentQuestions = getExampleQuestions()
    currentQuestions = shuffleArray(currentQuestions).slice(0, 5)
    showQuestionScreen()
    setTimeout(() => {
      loadQuestion()
    }, 500)
  }
}

function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function getExampleQuestions() {
  const exampleQuestions = {
    algebra: [
      {
        titulo: "¿Cuál es el valor de x en la ecuación: 2x + 5 = 13?",
        opciones: ["x = 3", "x = 4", "x = 5", "x = 6"],
        respuestaCorrecta: "b",
      },
      {
        titulo: "Simplifica: 3x + 2x - x",
        opciones: ["4x", "5x", "6x", "3x"],
        respuestaCorrecta: "a",
      },
      {
        titulo: "¿Cuál es el resultado de (x + 3)(x - 3)?",
        opciones: ["x² - 9", "x² + 9", "x² - 6", "x² + 6"],
        respuestaCorrecta: "a",
      },
      {
        titulo: "Si 3x = 15, entonces x =",
        opciones: ["3", "4", "5", "6"],
        respuestaCorrecta: "c",
      },
      {
        titulo: "¿Cuál es el valor de y en: y - 7 = 12?",
        opciones: ["19", "18", "20", "17"],
        respuestaCorrecta: "a",
      },
    ],
    trigonometria: [
      {
        titulo: "¿Cuál es el valor de sen(90°)?",
        opciones: ["0", "1", "-1", "1/2"],
        respuestaCorrecta: "b",
      },
      {
        titulo: "¿Cuál es el valor de cos(0°)?",
        opciones: ["0", "1", "-1", "1/2"],
        respuestaCorrecta: "b",
      },
      {
        titulo: "En un triángulo rectángulo, sen(θ) =",
        opciones: [
          "cateto opuesto / hipotenusa",
          "cateto adyacente / hipotenusa",
          "cateto opuesto / cateto adyacente",
          "hipotenusa / cateto opuesto",
        ],
        respuestaCorrecta: "a",
      },
      {
        titulo: "¿Cuál es el valor de tan(45°)?",
        opciones: ["0", "1", "√3", "1/2"],
        respuestaCorrecta: "b",
      },
      {
        titulo: "¿Cuántos grados tiene un radián aproximadamente?",
        opciones: ["45°", "57.3°", "90°", "60°"],
        respuestaCorrecta: "b",
      },
    ],
    geometria: [
      {
        titulo: "¿Cuál es el área de un círculo con radio 5?",
        opciones: ["25π", "10π", "5π", "15π"],
        respuestaCorrecta: "a",
      },
      {
        titulo: "¿Cuántos lados tiene un hexágono?",
        opciones: ["5", "6", "7", "8"],
        respuestaCorrecta: "b",
      },
      {
        titulo: "¿Cuál es la suma de los ángulos internos de un triángulo?",
        opciones: ["90°", "180°", "270°", "360°"],
        respuestaCorrecta: "b",
      },
      {
        titulo: "¿Cuál es el volumen de un cubo con lado 3?",
        opciones: ["9", "18", "27", "36"],
        respuestaCorrecta: "c",
      },
      {
        titulo: "¿Cuál es el perímetro de un rectángulo de 4x6?",
        opciones: ["10", "20", "24", "30"],
        respuestaCorrecta: "b",
      },
    ],
    estadisticas: [
      {
        titulo: "¿Cuál es la media de: 2, 4, 6, 8?",
        opciones: ["4", "5", "6", "7"],
        respuestaCorrecta: "b",
      },
      {
        titulo: "¿Cuál es la mediana de: 1, 3, 5, 7, 9?",
        opciones: ["3", "5", "7", "9"],
        respuestaCorrecta: "b",
      },
      {
        titulo: "¿Cuál es la moda de: 2, 3, 3, 4, 5?",
        opciones: ["2", "3", "4", "5"],
        respuestaCorrecta: "b",
      },
      {
        titulo: "¿Cuál es el rango de: 10, 15, 20, 25?",
        opciones: ["10", "15", "20", "25"],
        respuestaCorrecta: "b",
      },
      {
        titulo: "En una muestra de 100 datos, ¿cuántos están en el primer cuartil?",
        opciones: ["25", "50", "75", "100"],
        respuestaCorrecta: "a",
      },
    ],
    numeros: [
      {
        titulo: "¿Cuál es el resultado de 3/4 + 1/4?",
        opciones: ["1/2", "3/4", "1", "4/4"],
        respuestaCorrecta: "c",
      },
      {
        titulo: "¿Cuál es el decimal de 3/8?",
        opciones: ["0.375", "0.25", "0.5", "0.125"],
        respuestaCorrecta: "a",
      },
      {
        titulo: "¿Cuál es el 25% de 80?",
        opciones: ["15", "20", "25", "30"],
        respuestaCorrecta: "b",
      },
      {
        titulo: "¿Cuál es la fracción equivalente a 0.6?",
        opciones: ["3/5", "2/3", "1/2", "4/5"],
        respuestaCorrecta: "a",
      },
      {
        titulo: "¿Cuál es el resultado de (-3) × (-4)?",
        opciones: ["-12", "12", "-7", "7"],
        respuestaCorrecta: "b",
      },
    ],
    funciones: [
      {
        titulo: "Si f(x) = 2x + 3, ¿cuál es f(5)?",
        opciones: ["10", "11", "13", "15"],
        respuestaCorrecta: "c",
      },
      {
        titulo: "¿Cuál es la pendiente de la recta y = 3x + 2?",
        opciones: ["2", "3", "5", "1"],
        respuestaCorrecta: "b",
      },
      {
        titulo: "¿Cuál es el dominio de f(x) = 1/x?",
        opciones: ["Todos los reales", "x ≠ 0", "x > 0", "x < 0"],
        respuestaCorrecta: "b",
      },
      {
        titulo: "¿Cuál es la intersección con el eje y de y = 2x - 4?",
        opciones: ["2", "-2", "4", "-4"],
        respuestaCorrecta: "d",
      },
      {
        titulo: "Si g(x) = x², ¿cuál es g(-3)?",
        opciones: ["-9", "9", "-6", "6"],
        respuestaCorrecta: "b",
      },
    ],
  }

  return exampleQuestions[currentCategory] || exampleQuestions.algebra
}

function loadQuestion() {
  if (currentQuestionIndex >= currentQuestions.length) {
    showResults()
    return
  }

  // Limpiar timer anterior si existe
  if (timer) {
    clearInterval(timer)
  }

  isAnswerSelected = false
  const question = currentQuestions[currentQuestionIndex]

  // NUEVA VERIFICACIÓN: Asegurar que la pregunta tiene datos válidos
  if (!question || !question.titulo || !question.opciones || question.opciones.length !== 4) {
    console.error("Pregunta inválida:", question)
    // Usar pregunta de ejemplo si hay error
    const exampleQuestions = getExampleQuestions()
    if (exampleQuestions.length > 0) {
      currentQuestions[currentQuestionIndex] = exampleQuestions[0]
      loadQuestion() // Reintentar con pregunta de ejemplo
      return
    }
  }

  // Verificar que estamos en la pantalla correcta
  const questionScreen = document.getElementById("questionScreen")
  if (!questionScreen || !questionScreen.classList.contains("active")) {
    console.error("Question screen not active!")
    return
  }

  // Actualizar interfaz
  const categoryTitle = document.getElementById("categoryTitle")
  const categoryIcon = document.querySelector(".category-icon")

  if (categoryTitle && categoryIcon) {
    const categoryData = categories.find((cat) => cat.name === currentCategory)
    categoryTitle.textContent = categoryData.displayName
    categoryIcon.className = `category-icon ${categoryData.icon}`
  }

  // Actualizar progreso
  const questionProgress = document.getElementById("questionProgress")
  if (questionProgress) {
    questionProgress.textContent = `${currentQuestionIndex + 1}/5`
  }

  // Actualizar barra de progreso
  const progressFill = document.querySelector(".progress-fill")
  if (progressFill) {
    const progressPercentage = ((currentQuestionIndex + 1) / 5) * 100
    progressFill.style.width = `${progressPercentage}%`
  }

  // Actualizar pregunta
  const questionText = document.getElementById("questionText")
  if (questionText) {
    questionText.textContent = question.titulo
  }

  // Cargar opciones - CORREGIDO
  const optionButtons = [
    { id: "optionA", letter: "A" },
    { id: "optionB", letter: "B" },
    { id: "optionC", letter: "C" },
    { id: "optionD", letter: "D" },
  ]

  optionButtons.forEach((buttonInfo, index) => {
   //opciones question.opciones
   document.getElementById("opcion1").innerText =  question.opciones[0]
   document.getElementById("opcion2").innerText =  question.opciones[1]
   document.getElementById("opcion3").innerText =  question.opciones[2]
   document.getElementById("opcion4").innerText =  question.opciones[3]
    const button = document.getElementById(buttonInfo.id)
    if (button) {
      const optionText = button.querySelector(".option-text")
      if (optionText && question.opciones && question.opciones[index]) {
        optionText.textContent = question.opciones[index]
        console.log(`Opción ${buttonInfo.letter}: ${question.opciones[index]}`) // Debug
      } else {
        console.error(`No se pudo cargar opción ${buttonInfo.letter}:`, {
          optionText: optionText,
          questionOptions: question.opciones,
          optionIndex: index,
        })
      }
    }
  })

  // Debug adicional
  console.log("Pregunta cargada:", {
    titulo: question.titulo,
    opciones: question.opciones,
    respuestaCorrecta: question.respuestaCorrecta,
  })

  // Resetear botones
  document.querySelectorAll(".option-btn").forEach((btn) => {
    btn.classList.remove("correct", "incorrect")
    btn.disabled = false
  })

  // Resetear timer visual
  const timerProgress = document.querySelector(".timer-progress")
  const timerText = document.getElementById("timer")
  if (timerProgress && timerText) {
    timerProgress.style.stroke = "#10b981"
    timerText.style.color = "white"
  }

  // Iniciar temporizador
  startTimer()
}

function startTimer() {
  timeLeft = timeByDifficulty[currentDifficulty]
  const timerText = document.getElementById("timer")
  const timerProgress = document.querySelector(".timer-progress")
  const totalTime = timeByDifficulty[currentDifficulty]

  // Verificación de elementos
  if (!timerText || !timerProgress) {
    console.error("Timer elements not found! timerText:", timerText, "timerProgress:", timerProgress)
    // Continuar sin timer visual pero con funcionalidad
    setTimeout(() => {
      if (!isAnswerSelected) {
        handleTimeUp()
      }
    }, totalTime * 1000)
    return
  }

  // Inicializar stroke-dasharray
  const circumference = 283 // 2 * π * 45
  timerProgress.style.strokeDasharray = circumference
  timerProgress.style.strokeDashoffset = 0

  timerText.textContent = timeLeft

  timer = setInterval(() => {
    if (isAnswerSelected) {
      clearInterval(timer)
      return
    }

    timeLeft--
    timerText.textContent = timeLeft

    // Actualizar círculo de progreso
    const progressPercentage = (timeLeft / totalTime) * 100
    const offset = circumference - (progressPercentage / 100) * circumference
    timerProgress.style.strokeDashoffset = offset

    // Cambiar color según el tiempo restante
    if (progressPercentage <= 30) {
      timerProgress.style.stroke = "#ef4444" // Rojo
      timerText.style.color = "#ef4444"
    } else if (progressPercentage <= 50) {
      timerProgress.style.stroke = "#f59e0b" // Amarillo
      timerText.style.color = "#f59e0b"
    } else {
      timerProgress.style.stroke = "#10b981" // Verde
      timerText.style.color = "white"
    }

    if (timeLeft <= 0) {
      clearInterval(timer)
      handleTimeUp()
    }
  }, 1000)
}

function selectAnswer(e) {
  if (isAnswerSelected) return

  isAnswerSelected = true
  clearInterval(timer)

  const selectedOption = e.target.closest(".option-btn").dataset.option
  const question = currentQuestions[currentQuestionIndex]
  const correctOption = question.respuestaCorrecta

  // Deshabilitar todos los botones
  document.querySelectorAll(".option-btn").forEach((btn) => {
    btn.disabled = true
  })

  // Mostrar respuesta correcta
  const correctBtn = document.querySelector(`[data-option="${correctOption}"]`)
  if (correctBtn) {
    correctBtn.classList.add("correct")
  }

  if (selectedOption === correctOption) {
    score++
  } else {
    const selectedBtn = e.target.closest(".option-btn")
    if (selectedBtn) {
      selectedBtn.classList.add("incorrect")
    }
  }

  // Mostrar mensaje de confirmación
  console.log(`Respuesta seleccionada: ${selectedOption}, Correcta: ${correctOption}`)

  setTimeout(() => {
    nextQuestion()
  }, 2000)
}

function handleTimeUp() {
  if (isAnswerSelected) return

  isAnswerSelected = true

  // Mostrar respuesta correcta
  const question = currentQuestions[currentQuestionIndex]
  const correctOption = question.respuestaCorrecta

  document.querySelectorAll(".option-btn").forEach((btn) => {
    btn.disabled = true
  })

  const correctBtn = document.querySelector(`[data-option="${correctOption}"]`)
  if (correctBtn) {
    correctBtn.classList.add("correct")
  }

  console.log("¡Tiempo agotado! Respuesta correcta:", correctOption)

  setTimeout(() => {
    nextQuestion()
  }, 2000)
}

function nextQuestion() {
  currentQuestionIndex++

  if (currentQuestionIndex < currentQuestions.length) {
    loadQuestion()
  } else {
    showResults()
  }
}

// Función para guardar progreso en la base de datos
async function saveGameSession(sessionData) {
  try {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_BASE_URL}/game/save-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(sessionData),
    })

    if (response.ok) {
      console.log("✅ Sesión guardada exitosamente en la base de datos")
      return true
    } else {
      console.error("❌ Error guardando sesión:", await response.text())
      return false
    }
  } catch (error) {
    console.error("❌ Error de conexión guardando sesión:", error)
    return false
  }
}

function showResults() {
  const percentage = Math.round((score / currentQuestions.length) * 100)
  const sessionEndTime = new Date()
  const duration = Math.round((sessionEndTime - sessionStartTime) / 1000 / 60) // en minutos

  // ✅ CORRECCIÓN: Guardar sesión en la base de datos con campos correctos
  const sessionData = {
    usuarioId: currentUser.id, // ✅ CAMBIO CLAVE: usar usuarioId en lugar de usuario
    categoria: currentCategory,
    dificultad: currentDifficulty,
    puntaje: score, // ✅ CAMBIO CLAVE: usar puntaje en lugar de puntuacion
    totalPreguntas: currentQuestions.length,
    porcentaje: percentage,
    duracion: duration,
    fechaInicio: sessionStartTime,
    fechaFin: sessionEndTime,
  }

  saveGameSession(sessionData)

  // Actualizar interfaz de resultados
  const finalScore = document.getElementById("finalScore")
  const percentageElement = document.getElementById("percentage")
  const resultCategory = document.getElementById("resultCategory")
  const resultDifficulty = document.getElementById("resultDifficulty")
  const sessionDuration = document.getElementById("sessionDuration")

  if (finalScore) finalScore.textContent = `${score}/${currentQuestions.length}`
  if (percentageElement) percentageElement.textContent = `${percentage}%`
  if (resultCategory) {
    const categoryData = categories.find((cat) => cat.name === currentCategory)
    resultCategory.textContent = categoryData ? categoryData.displayName : currentCategory
  }
  if (resultDifficulty) {
    const difficultyNames = {
      facil: "Básico",
      intermedio: "Medio",
      dificil: "Avanzado",
    }
    resultDifficulty.textContent = difficultyNames[currentDifficulty] || currentDifficulty
  }
  if (sessionDuration) sessionDuration.textContent = `${duration} min`

  // Animar círculo de puntuación
  const scoreProgress = document.querySelector(".score-progress")
  if (scoreProgress) {
    const circumference = 628 // 2 * π * 100
    const offset = circumference - (percentage / 100) * circumference

    // Inicializar stroke-dasharray
    scoreProgress.style.strokeDasharray = circumference
    scoreProgress.style.strokeDashoffset = circumference

    // Crear gradiente SVG dinámicamente
    const svg = scoreProgress.closest("svg")
    if (svg && !svg.querySelector("defs")) {
      const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs")
      const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient")
      gradient.id = "scoreGradient"
      gradient.innerHTML = `
        <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#ec4899;stop-opacity:1" />
      `
      defs.appendChild(gradient)
      svg.appendChild(defs)
    }

    // Animar después de un pequeño delay
    setTimeout(() => {
      scoreProgress.style.strokeDashoffset = offset
      scoreProgress.style.stroke = "url(#scoreGradient)"
    }, 500)
  }

  showResultsScreen()
}

// Funciones de control del juego
function playAgain() {
  // Resetear variables
  currentQuestionIndex = 0
  score = 0
  isAnswerSelected = false

  // Resetear ruleta
  document.getElementById("wheel").style.transform = "rotate(0deg)"
  document.querySelectorAll(".sector").forEach((sector) => {
    sector.classList.remove("winner")
  })

  const spinBtn = document.getElementById("spinBtn")
  spinBtn.disabled = false
  spinBtn.innerHTML = '<i class="fas fa-sync-alt"></i> <span>Girar Ruleta</span>'

  showGameScreen()
  activarLogoutEstudiante()

}

function backToGame() {
  playAgain()

}

function logout() {
  currentUser = null
  currentDifficulty = ""
  currentCategory = ""
  currentQuestionIndex = 0
  score = 0
  isAnswerSelected = false

  // Limpiar localStorage
  localStorage.removeItem("token")
  localStorage.removeItem("userRole")

  // Resetear ruleta
  document.getElementById("wheel").style.transform = "rotate(0deg)"
  document.querySelectorAll(".sector").forEach((sector) => {
    sector.classList.remove("winner")
  })

  const spinBtn = document.getElementById("spinBtn")
  spinBtn.disabled = false
  spinBtn.innerHTML = '<i class="fas fa-sync-alt"></i> <span>Girar Ruleta</span>'

  showMainScreen()
}

// Hacer la función global para que funcione el onchange en el HTML
window.toggleStudentFields = toggleStudentFields

// Función de debug para verificar conexión con BD
async function testDatabaseConnection() {
  try {
    const response = await fetch(`${API_BASE_URL}/test`, {
      method: "GET",
    })

    if (response.ok) {
      console.log("✅ Conexión con la base de datos exitosa")
      return true
    } else {
      console.log("❌ Error de conexión con la base de datos")
      return false
    }
  } catch (error) {
    console.error("❌ Error de red:", error)
    return false
  }
}

// Llamar al test de conexión al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  testDatabaseConnection()
})

// ✅ NUEVAS FUNCIONES PARA DASHBOARD DOCENTE

// Inicializar dashboard docente
async function initializeTeacherDashboard() {
  try {
    // Cargar cursos del docente
    await loadTeacherCourses()

    // Configurar event listeners del dashboard
    setupDashboardEventListeners()

    // Cargar datos iniciales si hay un curso seleccionado
    if (currentCourse) {
      await loadCourseAnalytics()
    }

    console.log("✅ Dashboard docente inicializado")
  } catch (error) {
    console.error("❌ Error inicializando dashboard docente:", error)
  }
}

// Configurar event listeners del dashboard
function setupDashboardEventListeners() {
  // Navigation tabs
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const section = e.target.dataset.section
      switchDashboardSection(section)
    })
  })

  // Course selector
  const courseSelect = document.getElementById("courseSelect")
  if (courseSelect) {
    courseSelect.addEventListener("change", handleCourseChange)
  }

  // Period selector
  const periodSelect = document.getElementById("periodSelect")
  if (periodSelect) {
    periodSelect.addEventListener("change", handlePeriodChange)
  }

  // Create course button
  const createCourseBtn = document.getElementById("createCourseBtn")
  if (createCourseBtn) {
    createCourseBtn.addEventListener("click", showCreateCourseModal)
  }

  // Add course button (in courses section)
  const addCourseBtn = document.getElementById("addCourseBtn")
  if (addCourseBtn) {
    addCourseBtn.addEventListener("click", showCreateCourseModal)
  }

  // Course form
  const courseForm = document.getElementById("courseForm")
  if (courseForm) {
    courseForm.addEventListener("submit", handleCourseSubmit)
  }

  // Generate code button
  const generateCodeBtn = document.getElementById("generateCodeBtn")
  if (generateCodeBtn) {
    generateCodeBtn.addEventListener("click", generateCourseCode)
  }

  // Close course modal
  const closeCourseModal = document.getElementById("closeCourseModal")
  if (closeCourseModal) {
    closeCourseModal.addEventListener("click", hideCourseModal)
  }

  // Cancel course button
  const cancelCourseBtn = document.getElementById("cancelCourseBtn")
  if (cancelCourseBtn) {
    cancelCourseBtn.addEventListener("click", hideCourseModal)
  }

  // Add question button
  const addQuestionBtn = document.getElementById("addQuestionBtn")
  if (addQuestionBtn) {
    addQuestionBtn.addEventListener("click", showCreateQuestionModal)
  }

  // Question form
  const questionForm = document.getElementById("questionForm")
  if (questionForm) {
    questionForm.addEventListener("submit", handleQuestionSubmit)
  }

  // Close question modal
  const closeQuestionModal = document.getElementById("closeQuestionModal")
  if (closeQuestionModal) {
    closeQuestionModal.addEventListener("click", hideQuestionModal)
  }

  // Cancel question button
  const cancelQuestionBtn = document.getElementById("cancelQuestionBtn")
  if (cancelQuestionBtn) {
    cancelQuestionBtn.addEventListener("click", hideQuestionModal)
  }

  // Question filters
  const categoryFilter = document.getElementById("categoryFilter")
  const difficultyFilter = document.getElementById("difficultyFilter")
  const questionSearch = document.getElementById("questionSearch")

  if (categoryFilter) categoryFilter.addEventListener("change", filterQuestions)
  if (difficultyFilter) difficultyFilter.addEventListener("change", filterQuestions)
  if (questionSearch) questionSearch.addEventListener("input", filterQuestions)

  // Add student button
  const addStudentBtn = document.getElementById("addStudentBtn")
  if (addStudentBtn) {
    addStudentBtn.addEventListener("click", showInviteStudentModal)
  }

  // Close invite modal
  const closeInviteModal = document.getElementById("closeInviteModal")
  if (closeInviteModal) {
    closeInviteModal.addEventListener("click", hideInviteStudentModal)
  }

  // Copy course code button
  const copyCourseCode = document.getElementById("copyCourseCode")
  if (copyCourseCode) {
    copyCourseCode.addEventListener("click", copyToClipboard)
  }
}

// Cargar cursos del docente
async function loadTeacherCourses() {
  try {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_BASE_URL}/cursos/docente`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      teacherCourses = data.cursos || []

      // Actualizar selector de cursos
      updateCourseSelector()

      // Actualizar sección de cursos
      updateCoursesSection()

      console.log(`✅ Cursos cargados: ${teacherCourses.length}`)
    } else {
      console.error("❌ Error cargando cursos")
      teacherCourses = []
    }
  } catch (error) {
    console.error("❌ Error cargando cursos:", error)
    teacherCourses = []
  }
}

// Actualizar selector de cursos
function updateCourseSelector() {
  const courseSelect = document.getElementById("courseSelect")
  if (!courseSelect) return

  // Limpiar opciones existentes
  courseSelect.innerHTML = '<option value="">Seleccionar curso...</option>'

  // Agregar cursos
  teacherCourses.forEach((curso) => {
    const option = document.createElement("option")
    option.value = curso._id
    option.textContent = `${curso.nombre} - ${curso.paralelo} (${curso.codigo})`
    courseSelect.appendChild(option)
  })

  // Seleccionar primer curso si existe
  if (teacherCourses.length > 0 && !currentCourse) {
    currentCourse = teacherCourses[0]
    courseSelect.value = currentCourse._id
    loadCourseAnalytics()
  }
}

// Manejar cambio de curso
async function handleCourseChange(e) {
  const courseId = e.target.value

  if (courseId) {
    currentCourse = teacherCourses.find((c) => c._id === courseId)
    await loadCourseAnalytics()
    await loadCourseStudents()
  } else {
    currentCourse = null
    clearDashboardData()
  }
}

// Manejar cambio de período
async function handlePeriodChange() {
  if (currentCourse) {
    await loadCourseAnalytics()
  }
}

// Cargar analytics del curso
async function loadCourseAnalytics() {
  if (!currentCourse) {
    clearDashboardData()
    return
  }

  try {
    const token = localStorage.getItem("token")
    const period = document.getElementById("periodSelect")?.value || "30"

    const response = await fetch(`${API_BASE_URL}/cursos/${currentCourse._id}/analytics?periodo=${period}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      updateAnalyticsDisplay(data)
      console.log("✅ Analytics cargados")
    } else {
      console.error("❌ Error cargando analytics")
    }
  } catch (error) {
    console.error("❌ Error cargando analytics:", error)
  }
}

// Actualizar display de analytics
function updateAnalyticsDisplay(data) {
  const { resumen, categorias, topEstudiantes, sesionesRecientes } = data

  // Actualizar KPIs
  updateElement("totalStudents", resumen.totalEstudiantes)
  updateElement("totalSessions", resumen.totalSesiones)
  updateElement("averageScore", `${resumen.promedioGeneral}%`)
  updateElement("averageTime", `${resumen.tiempoPromedio} min`)

  // Actualizar gráfico de categorías
  updateCategoryChart(categorias)

  // Actualizar top estudiantes
  updateTopStudents(topEstudiantes)

  // Actualizar tabla de sesiones
  updateSessionsTable(sesionesRecientes)
}

// Actualizar gráfico de categorías
function updateCategoryChart(categorias) {
  const chartContainer = document.getElementById("categoryChart")
  if (!chartContainer) return

  chartContainer.innerHTML = ""

  const categoryNames = {
    algebra: "Álgebra",
    trigonometria: "Trigonometría",
    geometria: "Geometría",
    estadisticas: "Estadísticas",
    numeros: "Números",
    funciones: "Funciones",
  }

  Object.entries(categorias).forEach(([categoria, data]) => {
    const barContainer = document.createElement("div")
    barContainer.className = "category-bar"

    const maxPromedio = Math.max(...Object.values(categorias).map((c) => c.promedio))
    const percentage = maxPromedio > 0 ? (data.promedio / maxPromedio) * 100 : 0

    barContainer.innerHTML = `
      <div class="category-name">${categoryNames[categoria] || categoria}</div>
      <div class="bar-container">
        <div class="bar-fill ${categoria}" style="width: ${percentage}%">
          <span class="bar-percentage">${data.promedio}%</span>
        </div>
      </div>
    `

    chartContainer.appendChild(barContainer)
  })
}

// Actualizar top estudiantes
function updateTopStudents(estudiantes) {
  const container = document.getElementById("topStudents")
  if (!container) return

  container.innerHTML = ""

  if (estudiantes.length === 0) {
    container.innerHTML = '<p class="no-data">No hay datos de estudiantes</p>'
    return
  }

  estudiantes.forEach((estudiante, index) => {
    const rankDiv = document.createElement("div")
    rankDiv.className = "student-rank"

    const rankClass = index === 0 ? "first" : index === 1 ? "second" : index === 2 ? "third" : ""

    rankDiv.innerHTML = `
      <div class="rank-number ${rankClass}">${index + 1}</div>
      <div class="student-info">
        <div class="student-name">${estudiante.nombre} ${estudiante.apellido}</div>
        <div class="student-stats">${estudiante.totalSesiones} sesiones</div>
      </div>
      <div class="student-score">${estudiante.promedio}%</div>
    `

    container.appendChild(rankDiv)
  })
}

// Actualizar tabla de sesiones
function updateSessionsTable(sesiones) {
  const tbody = document.getElementById("sessionsTableBody")
  if (!tbody) return

  tbody.innerHTML = ""

  if (sesiones.length === 0) {
    tbody.innerHTML = `
      <tr class="no-data">
        <td colspan="6">
          <div class="no-data-message">
            <i class="fas fa-info-circle"></i>
            <p>No hay sesiones recientes</p>
          </div>
        </td>
      </tr>
    `
    return
  }

  sesiones.forEach((sesion) => {
    const row = document.createElement("tr")

    const scoreClass = sesion.porcentaje >= 80 ? "excellent" : sesion.porcentaje >= 60 ? "good" : "poor"

    const difficultyNames = {
      facil: "Básico",
      intermedio: "Medio",
      dificil: "Avanzado",
    }

    row.innerHTML = `
      <td>${sesion.usuarioId?.nombre || "Usuario"} ${sesion.usuarioId?.apellido || ""}</td>
      <td><span class="category-badge ${sesion.categoria}">${sesion.categoria}</span></td>
      <td>${difficultyNames[sesion.dificultad] || sesion.dificultad}</td>
      <td><span class="session-score ${scoreClass}">${sesion.puntaje}/${sesion.totalPreguntas}</span></td>
      <td>${sesion.duracion} min</td>
      <td>${new Date(sesion.createdAt).toLocaleDateString()}</td>
    `

    tbody.appendChild(row)
  })
}

// Cargar estudiantes del curso
async function loadCourseStudents() {
  if (!currentCourse) {
    updateStudentsDisplay([])
    return
  }

  try {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_BASE_URL}/cursos/${currentCourse._id}/estudiantes`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      currentStudents = data.estudiantes || []
      updateStudentsDisplay(currentStudents)
      console.log(`✅ Estudiantes cargados: ${currentStudents.length}`)
    } else {
      console.error("❌ Error cargando estudiantes")
      currentStudents = []
      updateStudentsDisplay([])
    }
  } catch (error) {
    console.error("❌ Error cargando estudiantes:", error)
    currentStudents = []
    updateStudentsDisplay([])
  }
}

// Actualizar display de estudiantes
function updateStudentsDisplay(estudiantes) {
  const container = document.getElementById("studentsGrid")
  if (!container) return

  container.innerHTML = ""

  if (estudiantes.length === 0) {
    container.innerHTML = `
      <div class="no-data-message">
        <i class="fas fa-users"></i>
        <h3>No hay estudiantes</h3>
        <p>Selecciona un curso para ver los estudiantes o comparte el código del curso</p>
      </div>
    `
    return
  }

  estudiantes.forEach((estudiante) => {
    const card = document.createElement("div")
    card.className = "student-card"

    const initials = `${estudiante.nombre.charAt(0)}${estudiante.apellido.charAt(0)}`
    const lastConnection = estudiante.ultimaConexion
      ? new Date(estudiante.ultimaConexion).toLocaleDateString()
      : "Nunca"

    card.innerHTML = `
      <div class="student-header">
        <div class="student-avatar">${initials}</div>
        <div class="student-details">
          <h4>${estudiante.nombre} ${estudiante.apellido}</h4>
          <p>@${estudiante.nombreUsuario}</p>
        </div>
      </div>
      
      <div class="student-stats-grid">
        <div class="student-stat">
          <div class="student-stat-value">${estudiante.totalSesiones}</div>
          <div class="student-stat-label">Sesiones</div>
        </div>
        <div class="student-stat">
          <div class="student-stat-value">${estudiante.promedioGeneral}%</div>
          <div class="student-stat-label">Promedio</div>
        </div>
      </div>
      
      <div class="student-meta">
        <small>Última conexión: ${lastConnection}</small>
      </div>
      
      <div class="student-actions">
        <button class="student-action-btn view" onclick="viewStudentHistory('${estudiante._id}')" title="Ver historial">
          <i class="fas fa-chart-line"></i>
        </button>
        <button class="student-action-btn transfer" onclick="transferStudent('${estudiante._id}')" title="Transferir">
          <i class="fas fa-exchange-alt"></i>
        </button>
        <button class="student-action-btn remove" onclick="removeStudent('${estudiante._id}')" title="Eliminar">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `

    container.appendChild(card)
  })
}

// Cargar preguntas del docente
async function loadTeacherQuestions() {
  try {
    const token = localStorage.getItem("token")
    const categoryFilter = document.getElementById("categoryFilter")?.value || ""
    const difficultyFilter = document.getElementById("difficultyFilter")?.value || ""

    let url = `${API_BASE_URL}/questions/docente?`
    if (categoryFilter) url += `categoria=${categoryFilter}&`
    if (difficultyFilter) url += `dificultad=${difficultyFilter}&`

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      currentQuestions = data.preguntas || []
      updateQuestionsDisplay(currentQuestions)
      console.log(`✅ Preguntas cargadas: ${currentQuestions.length}`)
    } else {
      console.error("❌ Error cargando preguntas")
      currentQuestions = []
      updateQuestionsDisplay([])
    }
  } catch (error) {
    console.error("❌ Error cargando preguntas:", error)
    currentQuestions = []
    updateQuestionsDisplay([])
  }
}

// Actualizar display de preguntas
function updateQuestionsDisplay(preguntas) {
  const container = document.getElementById("questionsContainer")
  if (!container) return

  container.innerHTML = ""

  if (preguntas.length === 0) {
    container.innerHTML = `
      <div class="no-data-message">
        <i class="fas fa-question-circle"></i>
        <h3>No hay preguntas</h3>
        <p>Comienza agregando preguntas para tus estudiantes</p>
      </div>
    `
    return
  }

  preguntas.forEach((pregunta) => {
    const card = document.createElement("div")
    card.className = "question-card"

    const categoryNames = {
      algebra: "Álgebra",
      trigonometria: "Trigonometría",
      geometria: "Geometría",
      estadisticas: "Estadísticas",
      numeros: "Números",
      funciones: "Funciones",
    }

    const difficultyNames = {
      facil: "Básico",
      intermedio: "Medio",
      dificil: "Avanzado",
    }

    const correctIndex = pregunta.respuestaCorrecta.charCodeAt(0) - 97 // a=0, b=1, c=2, d=3

    card.innerHTML = `
      <div class="question-header">
        <div class="question-meta">
          <span class="category-badge ${pregunta.categoria}">${categoryNames[pregunta.categoria] || pregunta.categoria}</span>
          <span class="difficulty-badge ${pregunta.dificultad}">${difficultyNames[pregunta.dificultad] || pregunta.dificultad}</span>
        </div>
        <div class="question-actions">
          <button class="question-action-btn edit" onclick="editQuestion('${pregunta._id}')">
            <i class="fas fa-edit"></i>
            Editar
          </button>
          <button class="question-action-btn duplicate" onclick="duplicateQuestion('${pregunta._id}')">
            <i class="fas fa-copy"></i>
            Duplicar
          </button>
          <button class="question-action-btn delete" onclick="deleteQuestion('${pregunta._id}')">
            <i class="fas fa-trash"></i>
            Eliminar
          </button>
        </div>
      </div>
      
      <div class="question-title">${pregunta.titulo}</div>
      
      <div class="question-options">
        ${pregunta.opciones
          .map(
            (opcion, index) => `
          <div class="question-option ${index === correctIndex ? "correct" : ""}">
            ${String.fromCharCode(65 + index)}. ${opcion}
          </div>
        `,
          )
          .join("")}
      </div>
    `

    container.appendChild(card)
  })
}

// Actualizar sección de cursos
function updateCoursesSection() {
  const container = document.getElementById("coursesContainer")
  if (!container) return

  container.innerHTML = ""

  if (teacherCourses.length === 0) {
    container.innerHTML = `
      <div class="no-data-message">
        <i class="fas fa-school"></i>
        <h3>No hay cursos</h3>
        <p>Crea tu primer curso para comenzar</p>
      </div>
    `
    return
  }

  const coursesGrid = document.createElement("div")
  coursesGrid.className = "courses-grid"

  teacherCourses.forEach((curso) => {
    const card = document.createElement("div")
    card.className = "course-card"

    card.innerHTML = `
      <div class="course-header">
        <div>
          <div class="course-title">${curso.nombre} - ${curso.paralelo}</div>
          <div class="course-code">${curso.codigo}</div>
        </div>
        <div class="course-actions">
          <button class="course-action-btn" onclick="editCourse('${curso._id}')" title="Editar">
            <i class="fas fa-edit"></i>
          </button>
          <button class="course-action-btn" onclick="deleteCourse('${curso._id}')" title="Eliminar">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      
      <div class="course-stats">
        <div class="course-stat">
          <div class="course-stat-value">${curso.totalEstudiantes}</div>
          <div class="course-stat-label">Estudiantes</div>
        </div>
        <div class="course-stat">
          <div class="course-stat-value">${curso.totalSesiones}</div>
          <div class="course-stat-label">Sesiones</div>
        </div>
      </div>
      
      ${curso.descripcion ? `<p class="course-description">${curso.descripcion}</p>` : ""}
    `

    coursesGrid.appendChild(card)
  })

  container.appendChild(coursesGrid)
}

// Funciones de navegación del dashboard
function switchDashboardSection(section) {
  // Actualizar botones de navegación
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.remove("active")
  })
  document.querySelector(`[data-section="${section}"]`).classList.add("active")

  // Mostrar sección correspondiente
  document.querySelectorAll(".dashboard-section").forEach((sec) => {
    sec.classList.remove("active")
  })
  document.getElementById(`${section}Section`).classList.add("active")

  // Cargar datos específicos de la sección
  switch (section) {
    case "analytics":
      if (currentCourse) loadCourseAnalytics()
      break
    case "students":
      if (currentCourse) loadCourseStudents()
      break
    case "questions":
      loadTeacherQuestions()
      break
    case "courses":
      // Los cursos ya están cargados
      break
  }
}

// Funciones de modal de curso
function showCreateCourseModal() {
  editingCourse = null
  document.getElementById("courseModalTitle").textContent = "Crear Curso"
  document.getElementById("courseSubmitText").textContent = "Crear Curso"
  document.getElementById("courseForm").reset()
  document.getElementById("courseName").value = "10mo EGB"
  document.getElementById("courseModal").style.display = "block"
  document.body.style.overflow = "hidden"
}

function hideCourseModal() {
  document.getElementById("courseModal").style.display = "none"
  document.getElementById("courseForm").reset()
  editingCourse = null
  document.body.style.overflow = "auto"
}

function generateCourseCode() {
  const paralelo = document.getElementById("courseParalelo").value || "A"
  const year = new Date().getFullYear().toString().slice(-2)
  const randomNum = Math.floor(Math.random() * 99)
    .toString()
    .padStart(2, "0")
  const code = `MAT10${paralelo}${year}${randomNum}`

  document.getElementById("courseCodigo").value = code
}

async function handleCourseSubmit(e) {
  e.preventDefault()
  showLoading(true)

  const formData = new FormData(e.target)
  const courseData = {
    paralelo: formData.get("courseParalelo"),
    descripcion: formData.get("courseDescription"),
    codigo: formData.get("courseCodigo"),
  }

  try {
    const token = localStorage.getItem("token")
    const url = editingCourse ? `${API_BASE_URL}/cursos/${editingCourse._id}` : `${API_BASE_URL}/cursos/crear`

    const method = editingCourse ? "PUT" : "POST"

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(courseData),
    })

    if (response.ok) {
      hideCourseModal()
      await loadTeacherCourses()
      showNotification(editingCourse ? "Curso actualizado exitosamente" : "Curso creado exitosamente", "success")
    } else {
      const error = await response.json()
      showNotification(error.mensaje || "Error al guardar curso", "error")
    }
  } catch (error) {
    console.error("Error guardando curso:", error)
    showNotification("Error de conexión", "error")
  } finally {
    showLoading(false)
  }
}

// Funciones de modal de pregunta
function showCreateQuestionModal() {
  editingQuestion = null
  document.getElementById("questionModalTitle").textContent = "Agregar Pregunta"
  document.getElementById("questionSubmitText").textContent = "Guardar Pregunta"
  document.getElementById("questionForm").reset()
  document.getElementById("questionModal").style.display = "block"
  document.body.style.overflow = "hidden"
}

function hideQuestionModal() {
  document.getElementById("questionModal").style.display = "none"
  document.getElementById("questionForm").reset()
  editingQuestion = null
  document.body.style.overflow = "auto"
}

async function handleQuestionSubmit(e) {
  e.preventDefault()
  showLoading(true)

  const formData = new FormData(e.target)
  const questionData = {
    titulo: formData.get("questionTitle"),
    categoria: formData.get("questionCategory"),
    dificultad: formData.get("questionDifficulty"),
    opciones: [formData.get("optionA"), formData.get("optionB"), formData.get("optionC"), formData.get("optionD")],
    respuestaCorrecta: formData.get("correctAnswer"),
    imagen: formData.get("questionImage"),
    tieneLatex: formData.has("hasLatex"),
  }

  try {
    const token = localStorage.getItem("token")
    const url = editingQuestion ? `${API_BASE_URL}/questions/${editingQuestion._id}` : `${API_BASE_URL}/questions/crear`

    const method = editingQuestion ? "PUT" : "POST"

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(questionData),
    })

    if (response.ok) {
      hideQuestionModal()
      await loadTeacherQuestions()
      showNotification(
        editingQuestion ? "Pregunta actualizada exitosamente" : "Pregunta creada exitosamente",
        "success",
      )
    } else {
      const error = await response.json()
      showNotification(error.mensaje || "Error al guardar pregunta", "error")
    }
  } catch (error) {
    console.error("Error guardando pregunta:", error)
    showNotification("Error de conexión", "error")
  } finally {
    showLoading(false)
  }
}

// Funciones de gestión de preguntas
async function editQuestion(questionId) {
  const question = currentQuestions.find((q) => q._id === questionId)
  if (!question) return

  editingQuestion = question

  // Llenar formulario
  document.getElementById("questionModalTitle").textContent = "Editar Pregunta"
  document.getElementById("questionSubmitText").textContent = "Actualizar Pregunta"
  document.getElementById("questionTitle").value = question.titulo
  document.getElementById("questionCategory").value = question.categoria
  document.getElementById("questionDifficulty").value = question.dificultad
  document.getElementById("optionA").value = question.opciones[0] || ""
  document.getElementById("optionB").value = question.opciones[1] || ""
  document.getElementById("optionC").value = question.opciones[2] || ""
  document.getElementById("optionD").value = question.opciones[3] || ""
  document.getElementById("correctAnswer").value = question.respuestaCorrecta
  document.getElementById("questionImage").value = question.imagen || ""
  document.getElementById("hasLatex").checked = question.tieneLatex || false

  document.getElementById("questionModal").style.display = "block"
  document.body.style.overflow = "hidden"
}

async function duplicateQuestion(questionId) {
  const question = currentQuestions.find((q) => q._id === questionId)
  if (!question) return

  editingQuestion = null

  // Llenar formulario con datos de la pregunta a duplicar
  document.getElementById("questionModalTitle").textContent = "Duplicar Pregunta"
  document.getElementById("questionSubmitText").textContent = "Crear Pregunta"
  document.getElementById("questionTitle").value = `${question.titulo} (Copia)`
  document.getElementById("questionCategory").value = question.categoria
  document.getElementById("questionDifficulty").value = question.dificultad
  document.getElementById("optionA").value = question.opciones[0] || ""
  document.getElementById("optionB").value = question.opciones[1] || ""
  document.getElementById("optionC").value = question.opciones[2] || ""
  document.getElementById("optionD").value = question.opciones[3] || ""
  document.getElementById("correctAnswer").value = question.respuestaCorrecta
  document.getElementById("questionImage").value = question.imagen || ""
  document.getElementById("hasLatex").checked = question.tieneLatex || false

  document.getElementById("questionModal").style.display = "block"
  document.body.style.overflow = "hidden"
}

async function deleteQuestion(questionId) {
  if (!confirm("¿Estás seguro de que quieres eliminar esta pregunta?")) return

  showLoading(true)

  try {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.ok) {
      await loadTeacherQuestions()
      showNotification("Pregunta eliminada exitosamente", "success")
    } else {
      const error = await response.json()
      showNotification(error.mensaje || "Error al eliminar pregunta", "error")
    }
  } catch (error) {
    console.error("Error eliminando pregunta:", error)
    showNotification("Error de conexión", "error")
  } finally {
    showLoading(false)
  }
}

// Filtrar preguntas
function filterQuestions() {
  const categoryFilter = document.getElementById("categoryFilter")?.value || ""
  const difficultyFilter = document.getElementById("difficultyFilter")?.value || ""
  const searchTerm = document.getElementById("questionSearch")?.value.toLowerCase() || ""

  let filteredQuestions = currentQuestions

  if (categoryFilter) {
    filteredQuestions = filteredQuestions.filter((q) => q.categoria === categoryFilter)
  }

  if (difficultyFilter) {
    filteredQuestions = filteredQuestions.filter((q) => q.dificultad === difficultyFilter)
  }

  if (searchTerm) {
    filteredQuestions = filteredQuestions.filter(
      (q) =>
        q.titulo.toLowerCase().includes(searchTerm) ||
        q.opciones.some((opcion) => opcion.toLowerCase().includes(searchTerm)),
    )
  }

  updateQuestionsDisplay(filteredQuestions)
}

// Funciones de gestión de estudiantes
function showInviteStudentModal() {
  if (!currentCourse) {
    showNotification("Selecciona un curso primero", "warning")
    return
  }

  document.getElementById("displayCourseCode").textContent = currentCourse.codigo
  document.getElementById("instructionCode").textContent = currentCourse.codigo

  document.getElementById("inviteStudentModal").style.display = "block"
  document.body.style.overflow = "hidden"
}

function hideInviteStudentModal() {
  document.getElementById("inviteStudentModal").style.display = "none"
  document.body.style.overflow = "auto"
}

async function copyToClipboard() {
  if (!currentCourse) return

  try {
    await navigator.clipboard.writeText(currentCourse.codigo)
    showNotification("Código copiado al portapapeles", "success")

    // Cambiar temporalmente el texto del botón
    const btn = document.getElementById("copyCourseCode")
    const originalText = btn.innerHTML
    btn.innerHTML = '<i class="fas fa-check"></i> Copiado'
    btn.style.background = "var(--success-color)"

    setTimeout(() => {
      btn.innerHTML = originalText
      btn.style.background = "var(--primary-color)"
    }, 2000)
  } catch (error) {
    console.error("Error copiando al portapapeles:", error)
    showNotification("Error al copiar código", "error")
  }
}

async function viewStudentHistory(studentId) {
  // TODO: Implementar modal de historial del estudiante
  showNotification("Función en desarrollo", "info")
}

async function transferStudent(studentId) {
  // TODO: Implementar modal de transferencia
  showNotification("Función en desarrollo", "info")
}

async function removeStudent(studentId) {
  if (!confirm("¿Estás seguro de que quieres eliminar este estudiante del curso?")) return

  showLoading(true)

  try {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_BASE_URL}/cursos/estudiante/${studentId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.ok) {
      await loadCourseStudents()
      await loadCourseAnalytics() // Actualizar analytics
      showNotification("Estudiante eliminado del curso", "success")
    } else {
      const error = await response.json()
      showNotification(error.mensaje || "Error al eliminar estudiante", "error")
    }
  } catch (error) {
    console.error("Error eliminando estudiante:", error)
    showNotification("Error de conexión", "error")
  } finally {
    showLoading(false)
  }
}

// Funciones de gestión de cursos
async function editCourse(courseId) {
  const course = teacherCourses.find((c) => c._id === courseId)
  if (!course) return

  editingCourse = course

  document.getElementById("courseModalTitle").textContent = "Editar Curso"
  document.getElementById("courseSubmitText").textContent = "Actualizar Curso"
  document.getElementById("courseName").value = course.nombre
  document.getElementById("courseParalelo").value = course.paralelo
  document.getElementById("courseCodigo").value = course.codigo
  document.getElementById("courseDescription").value = course.descripcion || ""

  document.getElementById("courseModal").style.display = "block"
  document.body.style.overflow = "hidden"
}

async function deleteCourse(courseId) {
  if (!confirm("¿Estás seguro de que quieres eliminar este curso? Esta acción no se puede deshacer.")) return

  showLoading(true)

  try {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_BASE_URL}/cursos/${courseId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.ok) {
      await loadTeacherCourses()

      // Si el curso eliminado era el actual, limpiar selección
      if (currentCourse && currentCourse._id === courseId) {
        currentCourse = null
        document.getElementById("courseSelect").value = ""
        clearDashboardData()
      }

      showNotification("Curso eliminado exitosamente", "success")
    } else {
      const error = await response.json()
      showNotification(error.mensaje || "Error al eliminar curso", "error")
    }
  } catch (error) {
    console.error("Error eliminando curso:", error)
    showNotification("Error de conexión", "error")
  } finally {
    showLoading(false)
  }
}

// Limpiar datos del dashboard
function clearDashboardData() {
  // Limpiar KPIs
  updateElement("totalStudents", "0")
  updateElement("totalSessions", "0")
  updateElement("averageScore", "0%")
  updateElement("averageTime", "0 min")

  // Limpiar gráficos
  const categoryChart = document.getElementById("categoryChart")
  if (categoryChart) categoryChart.innerHTML = '<p class="no-data">Selecciona un curso para ver estadísticas</p>'

  const topStudents = document.getElementById("topStudents")
  if (topStudents) topStudents.innerHTML = '<p class="no-data">Selecciona un curso para ver estudiantes</p>'

  // Limpiar tabla de sesiones
  const tbody = document.getElementById("sessionsTableBody")
  if (tbody) {
    tbody.innerHTML = `
      <tr class="no-data">
        <td colspan="6">
          <div class="no-data-message">
            <i class="fas fa-info-circle"></i>
            <p>Selecciona un curso para ver las sesiones</p>
          </div>
        </td>
      </tr>
    `
  }

  // Limpiar estudiantes
  updateStudentsDisplay([])
}

// Función auxiliar para actualizar elementos
function updateElement(id, value) {
  const element = document.getElementById(id)
  if (element) element.textContent = value
}

// Función para mostrar notificaciones
function showNotification(message, type = "info") {
  // Crear elemento de notificación
  const notification = document.createElement("div")
  notification.className = `notification ${type}`
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-${getNotificationIcon(type)}"></i>
      <span>${message}</span>
    </div>
  `

  // Agregar estilos si no existen
  if (!document.querySelector("#notification-styles")) {
    const styles = document.createElement("style")
    styles.id = "notification-styles"
    styles.textContent = `
      .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: var(--radius-lg);
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s;
        animation-fill-mode: forwards;
        box-shadow: var(--shadow-lg);
      }
      
      .notification.success {
        background: var(--success-color);
      }
      
      .notification.error {
        background: var(--error-color);
      }
      
      .notification.warning {
        background: var(--warning-color);
      }
      
      .notification.info {
        background: var(--primary-color);
      }
      
      .notification-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes fadeOut {
        from {
          opacity: 1;
        }
        to {
          opacity: 0;
          transform: translateX(100%);
        }
      }
    `
    document.head.appendChild(styles)
  }

  // Agregar al DOM
  document.body.appendChild(notification)

  // Eliminar después de 3 segundos
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification)
    }
  }, 3000)
}

function getNotificationIcon(type) {
  switch (type) {
    case "success":
      return "check-circle"
    case "error":
      return "exclamation-circle"
    case "warning":
      return "exclamation-triangle"
    case "info":
      return "info-circle"
    default:
      return "info-circle"
  }
}

// 💡 Esto se ejecuta siempre que se muestre el gameScreen
function activarLogoutEstudiante() {
  const btnEstudiante = document.getElementById("logoutBtn");
  if (btnEstudiante) {
    btnEstudiante.addEventListener("click", () => {
      localStorage.clear();
      sessionStorage.clear();
      location.reload();
    });
  } else {
    console.warn("❌ No se encontró el botón logout del estudiante.");
  }
}