const express = require("express")
const router = express.Router()
const cursoController = require("../controllers/curso.controller")
const authMiddleware = require("../middlewares/auth.middleware.js")

// Todas las rutas requieren autenticación
router.use(authMiddleware)

// Rutas de cursos
router.post("/crear", cursoController.crearCurso)
router.get("/docente", cursoController.obtenerCursosDocente)
router.get("/:cursoId/analytics", cursoController.obtenerAnalyticsCurso)
router.get("/:cursoId/estudiantes", cursoController.obtenerEstudiantesCurso)
router.delete("/estudiante/:estudianteId", cursoController.eliminarEstudianteCurso)
router.put("/estudiante/:estudianteId/transferir", cursoController.transferirEstudiante)

module.exports = router
