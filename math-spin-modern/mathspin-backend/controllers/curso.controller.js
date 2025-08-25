const Curso = require("../models/curso.model")
const Usuario = require("../models/user.model")
const Session = require("../models/session.model")

// Crear nuevo curso
exports.crearCurso = async (req, res) => {
  try {
    const { paralelo, descripcion, codigo } = req.body
    const docenteId = req.user.id // Del middleware de autenticación

    // Verificar que el código no exista si se proporciona
    if (codigo) {
      const cursoExistente = await Curso.findOne({ codigo })
      if (cursoExistente) {
        return res.status(400).json({ mensaje: "El código de curso ya existe" })
      }
    }

    const nuevoCurso = new Curso({
      paralelo,
      descripcion,
      codigo, // Si no se proporciona, se genera automáticamente
      docenteId,
    })

    await nuevoCurso.save()

    res.status(201).json({
      mensaje: "Curso creado exitosamente",
      curso: nuevoCurso,
    })
  } catch (error) {
    console.error("Error al crear curso:", error)
    res.status(500).json({ mensaje: "Error al crear curso", error: error.message })
  }
}

// Obtener cursos del docente
exports.obtenerCursosDocente = async (req, res) => {
  try {
    const docenteId = req.user.id

    const cursos = await Curso.find({ docenteId, activo: true })
      .populate("docenteId", "nombre apellido")
      .sort({ createdAt: -1 })

    // Actualizar estadísticas de cada curso
    for (const curso of cursos) {
      const totalEstudiantes = await Usuario.countDocuments({
        cursoId: curso._id,
        activo: true,
      })

      const totalSesiones = await Session.countDocuments({
        usuarioId: { $in: await Usuario.find({ cursoId: curso._id }).select("_id") },
      })

      curso.totalEstudiantes = totalEstudiantes
      curso.totalSesiones = totalSesiones
      await curso.save()
    }

    res.json({ cursos })
  } catch (error) {
    console.error("Error al obtener cursos:", error)
    res.status(500).json({ mensaje: "Error al obtener cursos", error: error.message })
  }
}

// Obtener analytics por curso
exports.obtenerAnalyticsCurso = async (req, res) => {
  try {
    const { cursoId } = req.params
    const { periodo = "30" } = req.query // días

    const fechaInicio = new Date()
    fechaInicio.setDate(fechaInicio.getDate() - Number.parseInt(periodo))

    // Obtener estudiantes del curso
    const estudiantes = await Usuario.find({
      cursoId,
      activo: true,
    }).select("_id nombre apellido ultimaConexion")

    // Obtener sesiones del período
    const sesiones = await Session.find({
      usuarioId: { $in: estudiantes.map((e) => e._id) },
      createdAt: { $gte: fechaInicio },
    }).populate("usuarioId", "nombre apellido")

    // Calcular estadísticas
    const totalEstudiantes = estudiantes.length
    const totalSesiones = sesiones.length
    const promedioGeneral =
      sesiones.length > 0 ? Math.round(sesiones.reduce((acc, s) => acc + s.porcentaje, 0) / sesiones.length) : 0
    const tiempoPromedio =
      sesiones.length > 0 ? Math.round(sesiones.reduce((acc, s) => acc + s.duracion, 0) / sesiones.length) : 0

    // Estadísticas por categoría
    const categorias = {}
    sesiones.forEach((sesion) => {
      if (!categorias[sesion.categoria]) {
        categorias[sesion.categoria] = {
          total: 0,
          promedio: 0,
          sesiones: [],
        }
      }
      categorias[sesion.categoria].total++
      categorias[sesion.categoria].sesiones.push(sesion.porcentaje)
    })

    // Calcular promedios por categoría
    Object.keys(categorias).forEach((cat) => {
      const sesionesCategoria = categorias[cat].sesiones
      categorias[cat].promedio = Math.round(sesionesCategoria.reduce((a, b) => a + b, 0) / sesionesCategoria.length)
    })

    // Top 5 estudiantes
    const estudiantesStats = estudiantes
      .map((estudiante) => {
        const sesionesEstudiante = sesiones.filter((s) => s.usuarioId._id.toString() === estudiante._id.toString())

        return {
          ...estudiante.toObject(),
          totalSesiones: sesionesEstudiante.length,
          promedio:
            sesionesEstudiante.length > 0
              ? Math.round(sesionesEstudiante.reduce((acc, s) => acc + s.porcentaje, 0) / sesionesEstudiante.length)
              : 0,
        }
      })
      .sort((a, b) => b.promedio - a.promedio)
      .slice(0, 5)

    res.json({
      resumen: {
        totalEstudiantes,
        totalSesiones,
        promedioGeneral,
        tiempoPromedio,
      },
      categorias,
      topEstudiantes: estudiantesStats,
      sesionesRecientes: sesiones.slice(-10).reverse(),
    })
  } catch (error) {
    console.error("Error al obtener analytics:", error)
    res.status(500).json({ mensaje: "Error al obtener analytics", error: error.message })
  }
}

// Obtener estudiantes por curso
exports.obtenerEstudiantesCurso = async (req, res) => {
  try {
    const { cursoId } = req.params

    const estudiantes = await Usuario.find({
      cursoId,
      rol: "estudiante",
      activo: true,
    }).select("nombre apellido nombreUsuario ultimaConexion paralelo createdAt")

    // Obtener estadísticas de cada estudiante
    const estudiantesConStats = await Promise.all(
      estudiantes.map(async (estudiante) => {
        const sesiones = await Session.find({ usuarioId: estudiante._id })

        const totalSesiones = sesiones.length
        const promedioGeneral =
          sesiones.length > 0 ? Math.round(sesiones.reduce((acc, s) => acc + s.porcentaje, 0) / sesiones.length) : 0

        return {
          ...estudiante.toObject(),
          totalSesiones,
          promedioGeneral,
          ultimaSesion: sesiones.length > 0 ? sesiones[sesiones.length - 1].createdAt : null,
        }
      }),
    )

    res.json({ estudiantes: estudiantesConStats })
  } catch (error) {
    console.error("Error al obtener estudiantes:", error)
    res.status(500).json({ mensaje: "Error al obtener estudiantes", error: error.message })
  }
}

// Eliminar estudiante del curso
exports.eliminarEstudianteCurso = async (req, res) => {
  try {
    const { estudianteId } = req.params

    await Usuario.findByIdAndUpdate(estudianteId, {
      cursoId: null,
    })

    res.json({ mensaje: "Estudiante eliminado del curso exitosamente" })
  } catch (error) {
    console.error("Error al eliminar estudiante:", error)
    res.status(500).json({ mensaje: "Error al eliminar estudiante", error: error.message })
  }
}

// Transferir estudiante a otro curso
exports.transferirEstudiante = async (req, res) => {
  try {
    const { estudianteId } = req.params
    const { nuevoCursoId } = req.body

    await Usuario.findByIdAndUpdate(estudianteId, {
      cursoId: nuevoCursoId,
    })

    res.json({ mensaje: "Estudiante transferido exitosamente" })
  } catch (error) {
    console.error("Error al transferir estudiante:", error)
    res.status(500).json({ mensaje: "Error al transferir estudiante", error: error.message })
  }
}
