const Question = require("../models/question.model")

// Función para normalizar categoría y dificultad
const normalizar = (str) =>
  str
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

exports.getByCategoryAndDifficulty = async (req, res) => {
  try {
    const { categoria } = req.params
    const { difficulty } = req.query

    const catNorm = normalizar(categoria)
    const difNorm = normalizar(difficulty)

    console.log(`🔍 Buscando preguntas: categoria=${catNorm}, dificultad=${difNorm}`)

    const questions = await Question.find({
      categoria: { $regex: new RegExp(`^${catNorm}$`, "i") },
      dificultad: { $regex: new RegExp(`^${difNorm}$`, "i") },
      activa: true,
    })

    console.log(`📊 Preguntas encontradas: ${questions.length}`)

    if (questions.length === 0) {
      return res.status(404).json({ message: "No se encontraron preguntas" })
    }

    // ✅ CORRECCIÓN CRÍTICA: Normalizar estructura para compatibilidad
    const normalizedQuestions = questions.map((q) => ({
      _id: q._id,
      titulo: q.titulo || q.pregunta, // ✅ Usar titulo o pregunta como fallback
      opciones: q.opciones,
      respuestaCorrecta: q.respuestaCorrecta,
      categoria: q.categoria,
      dificultad: q.dificultad,
    }))

    res.json({ preguntas: normalizedQuestions })
  } catch (err) {
    console.error("❌ Error al obtener preguntas:", err)
    res.status(500).json({ message: "Error al obtener preguntas", error: err.message })
  }
}

// ✅ NUEVO: Obtener preguntas del docente
exports.obtenerPreguntasDocente = async (req, res) => {
  try {
    const docenteId = req.user.id
    const { categoria, dificultad } = req.query

    const filtros = { docenteId, activa: true }

    if (categoria) filtros.categoria = categoria
    if (dificultad) filtros.dificultad = dificultad

    const preguntas = await Question.find(filtros).sort({ createdAt: -1 })

    res.json({ preguntas })
  } catch (error) {
    console.error("❌ Error al obtener preguntas del docente:", error)
    res.status(500).json({ mensaje: "Error al obtener preguntas", error: error.message })
  }
}

// ✅ NUEVO: Crear pregunta
exports.crearPregunta = async (req, res) => {
  try {
    const docenteId = req.user.id
    const { titulo, categoria, dificultad, opciones, respuestaCorrecta, imagen, tieneLatex } = req.body

    const nuevaPregunta = new Question({
      titulo,
      pregunta: titulo, // Para compatibilidad
      categoria,
      dificultad,
      opciones,
      respuestaCorrecta,
      docenteId,
      imagen,
      tieneLatex,
    })

    await nuevaPregunta.save()

    res.status(201).json({
      mensaje: "Pregunta creada exitosamente",
      pregunta: nuevaPregunta,
    })
  } catch (error) {
    console.error("❌ Error al crear pregunta:", error)
    res.status(500).json({ mensaje: "Error al crear pregunta", error: error.message })
  }
}

// ✅ NUEVO: Actualizar pregunta
exports.actualizarPregunta = async (req, res) => {
  try {
    const { id } = req.params
    const docenteId = req.user.id
    const actualizaciones = req.body

    const pregunta = await Question.findOneAndUpdate(
      { _id: id, docenteId },
      { ...actualizaciones, pregunta: actualizaciones.titulo }, // Mantener compatibilidad
      { new: true },
    )

    if (!pregunta) {
      return res.status(404).json({ mensaje: "Pregunta no encontrada" })
    }

    res.json({ mensaje: "Pregunta actualizada exitosamente", pregunta })
  } catch (error) {
    console.error("❌ Error al actualizar pregunta:", error)
    res.status(500).json({ mensaje: "Error al actualizar pregunta", error: error.message })
  }
}

// ✅ NUEVO: Eliminar pregunta
exports.eliminarPregunta = async (req, res) => {
  try {
    const { id } = req.params
    const docenteId = req.user.id

    const pregunta = await Question.findOneAndUpdate({ _id: id, docenteId }, { activa: false }, { new: true })

    if (!pregunta) {
      return res.status(404).json({ mensaje: "Pregunta no encontrada" })
    }

    res.json({ mensaje: "Pregunta eliminada exitosamente" })
  } catch (error) {
    console.error("❌ Error al eliminar pregunta:", error)
    res.status(500).json({ mensaje: "Error al eliminar pregunta", error: error.message })
  }
}

// Función para crear preguntas de ejemplo (actualizada)
exports.createSampleQuestions = async (req, res) => {
  try {
    // Buscar un docente para asignar las preguntas de ejemplo
    const docente = await require("../models/user.model").findOne({ rol: "docente" })

    if (!docente) {
      return res.status(400).json({ mensaje: "No hay docentes registrados para crear preguntas de ejemplo" })
    }

    const sampleQuestions = [
      // Álgebra
      {
        titulo: "¿Cuál es el valor de x en la ecuación: 2x + 5 = 13?",
        pregunta: "¿Cuál es el valor de x en la ecuación: 2x + 5 = 13?",
        categoria: "algebra",
        dificultad: "facil",
        opciones: ["x = 3", "x = 4", "x = 5", "x = 6"],
        respuestaCorrecta: "b",
        docenteId: docente._id,
      },
      {
        titulo: "Simplifica: 3x + 2x - x",
        pregunta: "Simplifica: 3x + 2x - x",
        categoria: "algebra",
        dificultad: "facil",
        opciones: ["4x", "5x", "6x", "3x"],
        respuestaCorrecta: "a",
        docenteId: docente._id,
      },
      {
        titulo: "¿Cuál es el resultado de (x + 3)(x - 3)?",
        pregunta: "¿Cuál es el resultado de (x + 3)(x - 3)?",
        categoria: "algebra",
        dificultad: "facil",
        opciones: ["x² - 9", "x² + 9", "x² - 6", "x² + 6"],
        respuestaCorrecta: "a",
        docenteId: docente._id,
      },
      {
        titulo: "Si 3x = 15, entonces x =",
        pregunta: "Si 3x = 15, entonces x =",
        categoria: "algebra",
        dificultad: "facil",
        opciones: ["3", "4", "5", "6"],
        respuestaCorrecta: "c",
        docenteId: docente._id,
      },
      {
        titulo: "¿Cuál es el valor de y en: y - 7 = 12?",
        pregunta: "¿Cuál es el valor de y en: y - 7 = 12?",
        categoria: "algebra",
        dificultad: "facil",
        opciones: ["19", "18", "20", "17"],
        respuestaCorrecta: "a",
        docenteId: docente._id,
      },
      // Trigonometría
      {
        titulo: "¿Cuál es el valor de sen(90°)?",
        pregunta: "¿Cuál es el valor de sen(90°)?",
        categoria: "trigonometria",
        dificultad: "facil",
        opciones: ["0", "1", "-1", "1/2"],
        respuestaCorrecta: "b",
        docenteId: docente._id,
      },
      {
        titulo: "¿Cuál es el valor de cos(0°)?",
        pregunta: "¿Cuál es el valor de cos(0°)?",
        categoria: "trigonometria",
        dificultad: "facil",
        opciones: ["0", "1", "-1", "1/2"],
        respuestaCorrecta: "b",
        docenteId: docente._id,
      },
      {
        titulo: "En un triángulo rectángulo, sen(θ) =",
        pregunta: "En un triángulo rectángulo, sen(θ) =",
        categoria: "trigonometria",
        dificultad: "facil",
        opciones: [
          "cateto opuesto / hipotenusa",
          "cateto adyacente / hipotenusa",
          "cateto opuesto / cateto adyacente",
          "hipotenusa / cateto opuesto",
        ],
        respuestaCorrecta: "a",
        docenteId: docente._id,
      },
      {
        titulo: "¿Cuál es el valor de tan(45°)?",
        pregunta: "¿Cuál es el valor de tan(45°)?",
        categoria: "trigonometria",
        dificultad: "facil",
        opciones: ["0", "1", "√3", "1/2"],
        respuestaCorrecta: "b",
        docenteId: docente._id,
      },
      {
        titulo: "¿Cuántos grados tiene un radián aproximadamente?",
        pregunta: "¿Cuántos grados tiene un radián aproximadamente?",
        categoria: "trigonometria",
        dificultad: "facil",
        opciones: ["45°", "57.3°", "90°", "60°"],
        respuestaCorrecta: "b",
        docenteId: docente._id,
      },
      // Geometría
      {
        titulo: "¿Cuál es el área de un círculo con radio 5?",
        pregunta: "¿Cuál es el área de un círculo con radio 5?",
        categoria: "geometria",
        dificultad: "facil",
        opciones: ["25π", "10π", "5π", "15π"],
        respuestaCorrecta: "a",
        docenteId: docente._id,
      },
      {
        titulo: "¿Cuántos lados tiene un hexágono?",
        pregunta: "¿Cuántos lados tiene un hexágono?",
        categoria: "geometria",
        dificultad: "facil",
        opciones: ["5", "6", "7", "8"],
        respuestaCorrecta: "b",
        docenteId: docente._id,
      },
      {
        titulo: "¿Cuál es la suma de los ángulos internos de un triángulo?",
        pregunta: "¿Cuál es la suma de los ángulos internos de un triángulo?",
        categoria: "geometria",
        dificultad: "facil",
        opciones: ["90°", "180°", "270°", "360°"],
        respuestaCorrecta: "b",
        docenteId: docente._id,
      },
      {
        titulo: "¿Cuál es el volumen de un cubo con lado 3?",
        pregunta: "¿Cuál es el volumen de un cubo con lado 3?",
        categoria: "geometria",
        dificultad: "facil",
        opciones: ["9", "18", "27", "36"],
        respuestaCorrecta: "c",
        docenteId: docente._id,
      },
      {
        titulo: "¿Cuál es el perímetro de un rectángulo de 4x6?",
        pregunta: "¿Cuál es el perímetro de un rectángulo de 4x6?",
        categoria: "geometria",
        dificultad: "facil",
        opciones: ["10", "20", "24", "30"],
        respuestaCorrecta: "b",
        docenteId: docente._id,
      },
      // Estadísticas
      {
        titulo: "¿Cuál es la media de: 2, 4, 6, 8?",
        pregunta: "¿Cuál es la media de: 2, 4, 6, 8?",
        categoria: "estadisticas",
        dificultad: "facil",
        opciones: ["4", "5", "6", "7"],
        respuestaCorrecta: "b",
        docenteId: docente._id,
      },
      {
        titulo: "¿Cuál es la mediana de: 1, 3, 5, 7, 9?",
        pregunta: "¿Cuál es la mediana de: 1, 3, 5, 7, 9?",
        categoria: "estadisticas",
        dificultad: "facil",
        opciones: ["3", "5", "7", "9"],
        respuestaCorrecta: "b",
        docenteId: docente._id,
      },
      {
        titulo: "¿Cuál es la moda de: 2, 3, 3, 4, 5?",
        pregunta: "¿Cuál es la moda de: 2, 3, 3, 4, 5?",
        categoria: "estadisticas",
        dificultad: "facil",
        opciones: ["2", "3", "4", "5"],
        respuestaCorrecta: "b",
        docenteId: docente._id,
      },
      {
        titulo: "¿Cuál es el rango de: 10, 15, 20, 25?",
        pregunta: "¿Cuál es el rango de: 10, 15, 20, 25?",
        categoria: "estadisticas",
        dificultad: "facil",
        opciones: ["10", "15", "20", "25"],
        respuestaCorrecta: "b",
        docenteId: docente._id,
      },
      {
        titulo: "En una muestra de 100 datos, ¿cuántos están en el primer cuartil?",
        pregunta: "En una muestra de 100 datos, ¿cuántos están en el primer cuartil?",
        categoria: "estadisticas",
        dificultad: "facil",
        opciones: ["25", "50", "75", "100"],
        respuestaCorrecta: "a",
        docenteId: docente._id,
      },
      // Números
      {
        titulo: "¿Cuál es el resultado de 3/4 + 1/4?",
        pregunta: "¿Cuál es el resultado de 3/4 + 1/4?",
        categoria: "numeros",
        dificultad: "facil",
        opciones: ["1/2", "3/4", "1", "4/4"],
        respuestaCorrecta: "c",
        docenteId: docente._id,
      },
      {
        titulo: "¿Cuál es el decimal de 3/8?",
        pregunta: "¿Cuál es el decimal de 3/8?",
        categoria: "numeros",
        dificultad: "facil",
        opciones: ["0.375", "0.25", "0.5", "0.125"],
        respuestaCorrecta: "a",
        docenteId: docente._id,
      },
      {
        titulo: "¿Cuál es el 25% de 80?",
        pregunta: "¿Cuál es el 25% de 80?",
        categoria: "numeros",
        dificultad: "facil",
        opciones: ["15", "20", "25", "30"],
        respuestaCorrecta: "b",
        docenteId: docente._id,
      },
      {
        titulo: "¿Cuál es la fracción equivalente a 0.6?",
        pregunta: "¿Cuál es la fracción equivalente a 0.6?",
        categoria: "numeros",
        dificultad: "facil",
        opciones: ["3/5", "2/3", "1/2", "4/5"],
        respuestaCorrecta: "a",
        docenteId: docente._id,
      },
      {
        titulo: "¿Cuál es el resultado de (-3) × (-4)?",
        pregunta: "¿Cuál es el resultado de (-3) × (-4)?",
        categoria: "numeros",
        dificultad: "facil",
        opciones: ["-12", "12", "-7", "7"],
        respuestaCorrecta: "b",
        docenteId: docente._id,
      },
      // Funciones
      {
        titulo: "Si f(x) = 2x + 3, ¿cuál es f(5)?",
        pregunta: "Si f(x) = 2x + 3, ¿cuál es f(5)?",
        categoria: "funciones",
        dificultad: "facil",
        opciones: ["10", "11", "13", "15"],
        respuestaCorrecta: "c",
        docenteId: docente._id,
      },
      {
        titulo: "¿Cuál es la pendiente de la recta y = 3x + 2?",
        pregunta: "¿Cuál es la pendiente de la recta y = 3x + 2?",
        categoria: "funciones",
        dificultad: "facil",
        opciones: ["2", "3", "5", "1"],
        respuestaCorrecta: "b",
        docenteId: docente._id,
      },
      {
        titulo: "¿Cuál es el dominio de f(x) = 1/x?",
        pregunta: "¿Cuál es el dominio de f(x) = 1/x?",
        categoria: "funciones",
        dificultad: "facil",
        opciones: ["Todos los reales", "x ≠ 0", "x > 0", "x < 0"],
        respuestaCorrecta: "b",
        docenteId: docente._id,
      },
      {
        titulo: "¿Cuál es la intersección con el eje y de y = 2x - 4?",
        pregunta: "¿Cuál es la intersección con el eje y de y = 2x - 4?",
        categoria: "funciones",
        dificultad: "facil",
        opciones: ["2", "-2", "4", "-4"],
        respuestaCorrecta: "d",
        docenteId: docente._id,
      },
      {
        titulo: "Si g(x) = x², ¿cuál es g(-3)?",
        pregunta: "Si g(x) = x², ¿cuál es g(-3)?",
        categoria: "funciones",
        dificultad: "facil",
        opciones: ["-9", "9", "-6", "6"],
        respuestaCorrecta: "b",
        docenteId: docente._id,
      },
    ]

    // Eliminar preguntas existentes del docente
    await Question.deleteMany({ docenteId: docente._id })

    // Insertar preguntas de ejemplo
    await Question.insertMany(sampleQuestions)

    console.log(`✅ ${sampleQuestions.length} preguntas de ejemplo creadas para el docente ${docente.nombre}`)
    res.json({ message: `${sampleQuestions.length} preguntas de ejemplo creadas correctamente` })
  } catch (error) {
    console.error("❌ Error creando preguntas de ejemplo:", error)
    res.status(500).json({ message: "Error creando preguntas de ejemplo", error: error.message })
  }
}
