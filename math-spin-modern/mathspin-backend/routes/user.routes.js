const express = require("express")
const router = express.Router()
const userController = require("../controllers/user.controller")

// Ruta para registrar nuevo usuario
router.post("/register", userController.registrarUsuario)

// Ruta para iniciar sesión
router.post("/login", userController.iniciarSesion)

module.exports = router
