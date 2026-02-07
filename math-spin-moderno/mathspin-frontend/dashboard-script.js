import { Chart } from "@/components/ui/chart"
// Variables globales
let currentUser = null
let currentCourse = null
let courses = []
let questions = []
const students = []

// Configuración de la API
const API_BASE = "http://localhost:5000/api"
const API_BASE_URL = "http://localhost:5000/api";

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
  initializeDashboard()
  setupEventListeners()
})

// Inicializar dashboard
async function initializeDashboard() {
  try {
    // Verificar autenticación
    const token = localStorage.getItem("token")
    if (!token) {
      window.location.href = "login.html"
      return
    }

    // Obtener datos del usuario
    await loadUserData()
    await loadCourses()

    // Configurar interfaz inicial
    setupTabs()

    showNotification("Dashboard cargado correctamente", "success")
  } catch (error) {
    console.error("Error al inicializar dashboard:", error)
    showNotification("Error al cargar el dashboard", "error")
  }
}

// Cargar datos del usuario
async function loadUserData() {
  try {
    const response = await fetch(`${API_BASE}/users/perfil`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })

    if (response.ok) {
      currentUser = await response.json()
      document.getElementById("nombreDocente").textContent = currentUser.nombre
    } else {
      throw new Error("Error al cargar datos del usuario")
    }
  } catch (error) {
    console.error("Error:", error)
    localStorage.removeItem("token")
    window.location.href = "login.html"
  }
}

// Cargar cursos del docente
async function loadCourses() {
  try {
    const response = await fetch(`${API_BASE}/cursos/docente`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })

    if (response.ok) {
      courses = await response.json()
      updateCourseSelector()
      updateCoursesGrid()
    }
  } catch (error) {
    console.error("Error al cargar cursos:", error)
    showNotification("Error al cargar cursos", "error")
  }
}

// Actualizar selector de cursos
function updateCourseSelector() {
  const selector = document.getElementById("cursoSelect")
  selector.innerHTML = '<option value="">Seleccionar curso...</option>'

  courses.forEach((course) => {
    const option = document.createElement("option")
    option.value = course._id
    option.textContent = `${course.nombre} - ${course.paralelo} (${course.codigo})`
    selector.appendChild(option)
  })
}

// Configurar event listeners
function setupEventListeners() {
  // Selector de curso
  document.getElementById("cursoSelect").addEventListener("change", handleCourseChange)

  // Botones principales
  document.getElementById("crearCursoBtn").addEventListener("click", () => openModal("modalCrearCurso"))
  document.getElementById("nuevoCursoBtn").addEventListener("click", () => openModal("modalCrearCurso"))
  document.getElementById("nuevaPreguntaBtn").addEventListener("click", () => openModal("modalPregunta"))
  document.getElementById("invitarEstudianteBtn").addEventListener("click", showInviteModal)
  document.getElementById("logoutBtn").addEventListener("click", logout)

  // Formularios
  document.getElementById("formCrearCurso").addEventListener("submit", handleCreateCourse)
  document.getElementById("formPregunta").addEventListener("submit", handleSaveQuestion)

  // Filtros
  document.getElementById("periodoSelect").addEventListener("change", loadAnalytics)
  document.getElementById("categoriaFiltro").addEventListener("change", loadQuestions)
  document.getElementById("dificultadFiltro").addEventListener("change", loadQuestions)
  document.getElementById("busquedaInput").addEventListener("input", debounce(loadQuestions, 300))

  // Copiar código
  document.getElementById("copiarCodigoBtn").addEventListener("click", copyCode)

  // Cerrar modales
  document.querySelectorAll(".close").forEach((closeBtn) => {
    closeBtn.addEventListener("click", (e) => {
      const modal = e.target.closest(".modal")
      closeModal(modal.id)
    })
  })

  // Cerrar modal al hacer clic fuera
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      closeModal(e.target.id)
    }
  })
}

// Configurar tabs
function setupTabs() {
  const tabBtns = document.querySelectorAll(".tab-btn")
  const tabContents = document.querySelectorAll(".tab-content")

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetTab = btn.dataset.tab

      // Actualizar botones
      tabBtns.forEach((b) => b.classList.remove("active"))
      btn.classList.add("active")

      // Actualizar contenido
      tabContents.forEach((content) => {
        content.classList.remove("active")
        if (content.id === targetTab) {
          content.classList.add("active")

          // Cargar datos específicos del tab
          loadTabData(targetTab)
        }
      })
    })
  })
}

// Cargar datos específicos del tab
async function loadTabData(tab) {
  if (!currentCourse) return

  switch (tab) {
    case "analytics":
      await loadAnalytics()
      break
    case "estudiantes":
      await loadStudents()
      break
    case "preguntas":
      await loadQuestions()
      break
    case "cursos":
      updateCoursesGrid()
      break
  }
}

// Manejar cambio de curso
async function handleCourseChange(e) {
  const courseId = e.target.value

  if (courseId) {
    currentCourse = courses.find((c) => c._id === courseId)

    // Cargar datos del curso actual
    const activeTab = document.querySelector(".tab-btn.active").dataset.tab
    await loadTabData(activeTab)

    showNotification(`Curso ${currentCourse.nombre} seleccionado`, "success")
  } else {
    currentCourse = null
    clearDashboard()
  }
}

// Limpiar dashboard
function clearDashboard() {
  // Limpiar KPIs
  document.getElementById("totalEstudiantes").textContent = "0"
  document.getElementById("totalSesiones").textContent = "0"
  document.getElementById("promedioGeneral").textContent = "0%"
  document.getElementById("tiempoPromedio").textContent = "0min"

  // Limpiar grids
  document.getElementById("estudiantesGrid").innerHTML =
    '<p style="color: white; text-align: center;">Selecciona un curso para ver los estudiantes</p>'
  document.getElementById("preguntasGrid").innerHTML =
    '<p style="color: white; text-align: center;">Selecciona un curso para gestionar preguntas</p>'
}

// Cargar analytics
async function loadAnalytics() {
  if (!currentCourse) return

  try {
    const periodo = document.getElementById("periodoSelect").value
    const response = await fetch(`${API_BASE}/cursos/${currentCourse._id}/analytics?periodo=${periodo}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      updateAnalytics(data)
    }
  } catch (error) {
    console.error("Error al cargar analytics:", error)
    showNotification("Error al cargar analytics", "error")
  }
}

// Actualizar analytics en la interfaz
function updateAnalytics(data) {
  // Actualizar KPIs
  document.getElementById("totalEstudiantes").textContent = data.kpis.totalEstudiantes
  document.getElementById("totalSesiones").textContent = data.kpis.totalSesiones
  document.getElementById("promedioGeneral").textContent = `${Math.round(data.kpis.promedioGeneral)}%`
  document.getElementById("tiempoPromedio").textContent = `${Math.round(data.kpis.tiempoPromedio / 60)}min`

  // Actualizar gráfico de categorías
  updateCategoryChart(data.estadisticasPorCategoria)

  // Actualizar ranking
  updateRanking(data.topEstudiantes)

  // Actualizar tabla de sesiones
  updateSessionsTable(data.sesionesRecientes)
}

// Actualizar gráfico de categorías
function updateCategoryChart(data) {
  const ctx = document.getElementById("categoriaChart").getContext("2d")

  // Destruir gráfico anterior si existe
  if (window.categoryChart) {
    window.categoryChart.destroy()
  }

  const labels = Object.keys(data).map((cat) => cat.charAt(0).toUpperCase() + cat.slice(1))
  const scores = Object.values(data).map((cat) => cat.promedioScore)

  window.categoryChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Promedio de Puntuación",
          data: scores,
          backgroundColor: [
            "rgba(102, 126, 234, 0.8)",
            "rgba(118, 75, 162, 0.8)",
            "rgba(56, 161, 105, 0.8)",
            "rgba(237, 137, 54, 0.8)",
            "rgba(229, 62, 62, 0.8)",
          ],
          borderColor: [
            "rgba(102, 126, 234, 1)",
            "rgba(118, 75, 162, 1)",
            "rgba(56, 161, 105, 1)",
            "rgba(237, 137, 54, 1)",
            "rgba(229, 62, 62, 1)",
          ],
          borderWidth: 2,
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: (value) => value + "%",
          },
        },
      },
    },
  })
}

// Actualizar ranking
function updateRanking(students) {
  const container = document.getElementById("topEstudiantes")
  container.innerHTML = ""

  students.forEach((student) => {
    const item = document.createElement("div")
    item.className = "ranking-item"
    item.innerHTML = `
            <div class="ranking-position">${student.posicion}</div>
            <div class="ranking-info">
                <h4>${student.nombre}</h4>
                <p>${student.promedio}% promedio • ${student.totalSesiones} sesiones</p>
            </div>
        `
    container.appendChild(item)
  })
}

// Actualizar tabla de sesiones
function updateSessionsTable(sessions) {
  const tbody = document.querySelector("#sesionesTable tbody")
  tbody.innerHTML = ""

  sessions.forEach((session) => {
    const row = document.createElement("tr")
    row.innerHTML = `
            <td>${session.estudiante}</td>
            <td><span class="categoria-badge">${session.categoria}</span></td>
            <td><span class="dificultad-badge ${session.dificultad}">${session.dificultad}</span></td>
            <td>${session.puntuacion}%</td>
            <td>${new Date(session.fecha).toLocaleDateString()}</td>
        `
    tbody.appendChild(row)
  })
}

// Cargar estudiantes
async function loadStudents() {
  if (!currentCourse) return

  const container = document.getElementById("estudiantesGrid")
  container.innerHTML = ""

  if (currentCourse.estudiantes.length === 0) {
    container.innerHTML = '<p style="color: white; text-align: center;">No hay estudiantes en este curso</p>'
    return
  }

  currentCourse.estudiantes.forEach((student) => {
    const card = createStudentCard(student)
    container.appendChild(card)
  })
}

// Crear tarjeta de estudiante
function createStudentCard(student) {
  const card = document.createElement("div")
  card.className = "estudiante-card"

  const initials = student.nombre
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
  const lastConnection = new Date(student.ultimaConexion).toLocaleDateString()

  card.innerHTML = `
        <div class="estudiante-header">
            <div class="estudiante-avatar">${initials}</div>
            <div class="estudiante-info">
                <h4>${student.nombre}</h4>
                <p>Última conexión: ${lastConnection}</p>
            </div>
        </div>
        <div class="estudiante-stats">
            <div class="stat-item">
                <div class="value">${student.estadisticas.totalSesiones}</div>
                <div class="label">Sesiones</div>
            </div>
            <div class="stat-item">
                <div class="value">${Math.round(student.estadisticas.promedioGeneral)}%</div>
                <div class="label">Promedio</div>
            </div>
        </div>
        <div class="estudiante-actions">
            <button class="btn-primary btn-small" onclick="viewStudentHistory('${student._id}')">
                <i class="fas fa-chart-line"></i> Historial
            </button>
            <button class="btn-secondary btn-small" onclick="removeStudent('${student._id}')">
                <i class="fas fa-user-minus"></i> Remover
            </button>
        </div>
    `

  return card
}

// Cargar preguntas
async function loadQuestions() {
  try {
    const categoria = document.getElementById("categoriaFiltro").value
    const dificultad = document.getElementById("dificultadFiltro").value
    const busqueda = document.getElementById("busquedaInput").value

    const params = new URLSearchParams()
    if (categoria !== "todas") params.append("categoria", categoria)
    if (dificultad !== "todas") params.append("dificultad", dificultad)
    if (busqueda) params.append("busqueda", busqueda)

    const response = await fetch(`${API_BASE}/questions/docente?${params}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })

    if (response.ok) {
      questions = await response.json()
      updateQuestionsGrid()
    }
  } catch (error) {
    console.error("Error al cargar preguntas:", error)
    showNotification("Error al cargar preguntas", "error")
  }
}

// Actualizar grid de preguntas
function updateQuestionsGrid() {
  const container = document.getElementById("preguntasGrid")
  container.innerHTML = ""

  if (questions.length === 0) {
    container.innerHTML = '<p style="color: white; text-align: center;">No se encontraron preguntas</p>'
    return
  }

  questions.forEach((question) => {
    const card = createQuestionCard(question)
    container.appendChild(card)
  })
}

// Crear tarjeta de pregunta
function createQuestionCard(question) {
  const card = document.createElement("div")
  card.className = "pregunta-card"

  card.innerHTML = `
        <div class="pregunta-header">
            <div class="pregunta-meta">
                <span class="categoria-badge">${question.categoria}</span>
                <span class="dificultad-badge ${question.dificultad}">${question.dificultad}</span>
            </div>
            <div class="pregunta-actions">
                <button class="btn-primary btn-small" onclick="editQuestion('${question._id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-secondary btn-small" onclick="deleteQuestion('${question._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="pregunta-texto">${question.pregunta}</div>
        <div class="pregunta-opciones">
            ${question.opciones
              .map(
                (opcion, index) => `
                <div class="opcion-item ${index === question.respuestaCorrecta ? "correcta" : ""}">
                    ${String.fromCharCode(65 + index)}. ${opcion}
                </div>
            `,
              )
              .join("")}
        </div>
    `

  return card
}

// Actualizar grid de cursos
function updateCoursesGrid() {
  const container = document.getElementById("cursosGrid")
  container.innerHTML = ""

  if (courses.length === 0) {
    container.innerHTML = '<p style="color: white; text-align: center;">No tienes cursos creados</p>'
    return
  }

  courses.forEach((course) => {
    const card = createCourseCard(course)
    container.appendChild(card)
  })
}

// Crear tarjeta de curso
function createCourseCard(course) {
  const card = document.createElement("div")
  card.className = "curso-card"

  card.innerHTML = `
        <div class="curso-header">
            <div class="curso-info">
                <h3>${course.nombre} - ${course.paralelo}</h3>
                <span class="curso-codigo">${course.codigo}</span>
            </div>
        </div>
        <div class="curso-stats">
            <div class="curso-stat">
                <div class="value">${course.estudiantes.length}</div>
                <div class="label">Estudiantes</div>
            </div>
            <div class="curso-stat">
                <div class="value">${course.nivel}</div>
                <div class="label">Nivel</div>
            </div>
            <div class="curso-stat">
                <div class="value">${course.año}</div>
                <div class="label">Año</div>
            </div>
        </div>
        <div class="curso-actions">
            <button class="btn-primary btn-small" onclick="selectCourse('${course._id}')">
                <i class="fas fa-eye"></i> Ver
            </button>
            <button class="btn-secondary btn-small" onclick="shareCourse('${course._id}')">
                <i class="fas fa-share"></i> Compartir
            </button>
        </div>
    `

  return card
}

// Manejar creación de curso
async function handleCreateCourse(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const courseData = {
    nombre: formData.get("nombreCurso"),
    nivel: formData.get("nivelCurso"),
    paralelo: formData.get("paraleloCurso"),
  }

  try {
    const response = await fetch(`${API_BASE}/cursos/crear`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(courseData),
    })

    if (response.ok) {
      const newCourse = await response.json()
      showNotification("Curso creado exitosamente", "success")
      closeModal("modalCrearCurso")
      await loadCourses()
      e.target.reset()
    } else {
      throw new Error("Error al crear curso")
    }
  } catch (error) {
    console.error("Error:", error)
    showNotification("Error al crear curso", "error")
  }
}

// Manejar guardado de pregunta
async function handleSaveQuestion(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const questionData = {
    pregunta: formData.get("textoPregunta"),
    categoria: formData.get("categoriaPregunta"),
    dificultad: formData.get("dificultadPregunta"),
    opciones: [formData.get("opcion0"), formData.get("opcion1"), formData.get("opcion2"), formData.get("opcion3")],
    respuestaCorrecta: Number.parseInt(formData.get("respuestaCorrecta")),
    explicacion: formData.get("explicacionPregunta"),
  }

  try {
    const questionId = e.target.dataset.questionId
    const url = questionId ? `${API_BASE}/questions/${questionId}` : `${API_BASE}/questions/crear`
    const method = questionId ? "PUT" : "POST"

    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(questionData),
    })

    if (response.ok) {
      showNotification("Pregunta guardada exitosamente", "success")
      closeModal("modalPregunta")
      await loadQuestions()
      e.target.reset()
      delete e.target.dataset.questionId
    } else {
      throw new Error("Error al guardar pregunta")
    }
  } catch (error) {
    console.error("Error:", error)
    showNotification("Error al guardar pregunta", "error")
  }
}

// Editar pregunta
async function editQuestion(questionId) {
  const question = questions.find((q) => q._id === questionId)
  if (!question) return

  // Llenar formulario
  document.getElementById("textoPregunta").value = question.pregunta
  document.getElementById("categoriaPregunta").value = question.categoria
  document.getElementById("dificultadPregunta").value = question.dificultad
  document.getElementById("explicacionPregunta").value = question.explicacion || ""

  question.opciones.forEach((opcion, index) => {
    document.getElementById(`opcion${index}`).value = opcion
  })

  document.querySelector(`input[name="respuestaCorrecta"][value="${question.respuestaCorrecta}"]`).checked = true

  // Configurar formulario para edición
  document.getElementById("tituloModalPregunta").textContent = "Editar Pregunta"
  document.getElementById("formPregunta").dataset.questionId = questionId

  openModal("modalPregunta")
}

// Eliminar pregunta
async function deleteQuestion(questionId) {
  if (!confirm("¿Estás seguro de que quieres eliminar esta pregunta?")) return

  try {
    const response = await fetch(`${API_BASE}/questions/${questionId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })

    if (response.ok) {
      showNotification("Pregunta eliminada exitosamente", "success")
      await loadQuestions()
    } else {
      throw new Error("Error al eliminar pregunta")
    }
  } catch (error) {
    console.error("Error:", error)
    showNotification("Error al eliminar pregunta", "error")
  }
}

// Mostrar modal de invitación
function showInviteModal() {
  if (!currentCourse) {
    showNotification("Selecciona un curso primero", "error")
    return
  }

  document.getElementById("codigoCurso").value = currentCourse.codigo
  openModal("modalInvitar")
}

// Copiar código
function copyCode() {
  const input = document.getElementById("codigoCurso")
  input.select()
  document.execCommand("copy")
  showNotification("Código copiado al portapapeles", "success")
}

// Seleccionar curso
function selectCourse(courseId) {
  document.getElementById("cursoSelect").value = courseId
  document.getElementById("cursoSelect").dispatchEvent(new Event("change"))

  // Cambiar a tab de analytics
  document.querySelector('.tab-btn[data-tab="analytics"]').click()
}

// Compartir curso
function shareCourse(courseId) {
  const course = courses.find((c) => c._id === courseId)
  if (course) {
    document.getElementById("codigoCurso").value = course.codigo
    openModal("modalInvitar")
  }
}

// Remover estudiante
async function removeStudent(studentId) {
  if (!confirm("¿Estás seguro de que quieres remover este estudiante del curso?")) return

  try {
    const response = await fetch(`${API_BASE}/cursos/${currentCourse._id}/estudiante/${studentId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })

    if (response.ok) {
      showNotification("Estudiante removido del curso", "success")
      await loadCourses()
      await loadStudents()
    } else {
      throw new Error("Error al remover estudiante")
    }
  } catch (error) {
    console.error("Error:", error)
    showNotification("Error al remover estudiante", "error")
  }
}

// Ver historial de estudiante
function viewStudentHistory(studentId) {
  // Implementar vista de historial
  showNotification("Función de historial en desarrollo", "info")
}

// Funciones de modal
function openModal(modalId) {
  document.getElementById(modalId).style.display = "block"
  document.body.style.overflow = "hidden"
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none"
  document.body.style.overflow = "auto"

  // Limpiar formularios
  const form = document.querySelector(`#${modalId} form`)
  if (form) {
    form.reset()
    delete form.dataset.questionId
  }

  // Resetear título de modal de pregunta
  if (modalId === "modalPregunta") {
    document.getElementById("tituloModalPregunta").textContent = "Nueva Pregunta"
  }
}

// Logout
function logout() {
  localStorage.removeItem("token")
  localStorage.removeItem("userRole")
  location.reload()
  //window.location.href = "login.html" ESTO ESTABA ANTES
}

// Mostrar notificación
function showNotification(message, type = "success") {
  const notification = document.getElementById("notification")
  const text = document.getElementById("notificationText")

  text.textContent = message
  notification.className = `notification ${type}`
  notification.classList.add("show")

  setTimeout(() => {
    notification.classList.remove("show")
  }, 3000)
}

// Función debounce para búsqueda
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}
