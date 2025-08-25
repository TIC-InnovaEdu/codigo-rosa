const Session = require("../models/session.model")

exports.saveSession = async (req, res) => {
  try {
    console.log("📦 Datos de sesión recibidos:", req.body)

    const newSession = new Session(req.body)
    await newSession.save()

    console.log("✅ Sesión guardada exitosamente en la base de datos")
    res.status(201).json({ message: "Sesión guardada con éxito" })
  } catch (error) {
    console.error("❌ Error al guardar la sesión:", error)
    res.status(500).json({
      message: "Error al guardar la sesión",
      error: error.message,
    })
  }
}

exports.getSessionsByUser = async (req, res) => {
  try {
    const { userId } = req.params
    const sessions = await Session.find({ usuarioId: userId })
      .populate("usuarioId", "nombre apellido")
      .sort({ fechaCreacion: -1 })

    res.json({ sessions })
  } catch (error) {
    console.error("❌ Error al obtener sesiones:", error)
    res.status(500).json({ message: "Error al obtener sesiones", error: error.message })
  }
}
