const mongoose = require("mongoose")

const userSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    nombreUsuario: { type: String, required: true, unique: true },
    contrasena: { type: String, required: true },
    rol: { type: String, enum: ["estudiante", "docente", "admin"], required: true },

    // Campos específicos para estudiantes
    paralelo: { type: String }, // Solo para estudiante
    cursoId: { type: mongoose.Schema.Types.ObjectId, ref: "Curso" }, // Curso al que pertenece
    codigoCurso: { type: String }, // Código del curso ingresado

    // Campos adicionales
    ultimaConexion: { type: Date, default: Date.now },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true },
)

module.exports = mongoose.model("Usuario", userSchema)
