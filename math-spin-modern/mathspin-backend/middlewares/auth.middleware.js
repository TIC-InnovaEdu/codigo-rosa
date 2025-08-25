const jwt = require("jsonwebtoken")
const Usuario = require("../models/user.model")

const SECRET = process.env.JWT_SECRET || "clave_secreta_super_segura"

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ mensaje: "Token no proporcionado" })
    }

    const decoded = jwt.verify(token, SECRET)
    const usuario = await Usuario.findById(decoded.id)

    if (!usuario) { 
      return res.status(401).json({ mensaje: "Usuario no encontrado" })
    }

    req.user = usuario
    next()
  } catch (error) {
    res.status(401).json({ mensaje: "Token inválido" })
  }
}

module.exports = authMiddleware
