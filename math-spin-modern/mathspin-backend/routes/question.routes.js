const express = require("express");
const router = express.Router();
const questionController = require("../controllers/question.controller");
const authMiddleware = require("../middlewares/auth.middleware.js");

// ✅ Ruta pública para obtener preguntas por categoría y dificultad
router.get("/category/:categoria", questionController.getByCategoryAndDifficulty);

// ✅ Ruta para crear preguntas de muestra (sin autenticación)
router.post("/create-samples", questionController.createSampleQuestions);

// ✅ Middleware de autenticación para el resto
 router.use(authMiddleware);

// ✅ CRUD para docentes autenticados
router.get("/docente", questionController.obtenerPreguntasDocente);
router.post("/crear", questionController.crearPregunta);
router.put("/:id", questionController.actualizarPregunta);
router.delete("/:id", questionController.eliminarPregunta);

module.exports = router;