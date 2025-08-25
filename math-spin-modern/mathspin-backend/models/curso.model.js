const mongoose = require("mongoose")

const cursoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      default: "10mo EGB",
    },
    paralelo: {
      type: String,
      required: true,
    },
    codigo: {
      type: String,
      required: true,
      unique: true,
    },
    docenteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    descripcion: {
      type: String,
    },
    activo: {
      type: Boolean,
      default: true,
    },
    // Estadísticas del curso
    totalEstudiantes: {
      type: Number,
      default: 0,
    },
    totalSesiones: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
)

// Generar código automáticamente antes de guardar
cursoSchema.pre("save", function (next) {
  if (!this.codigo) {
    const year = new Date().getFullYear().toString().slice(-2)
    const randomNum = Math.floor(Math.random() * 99)
      .toString()
      .padStart(2, "0")
    this.codigo = `MAT10${this.paralelo}${year}${randomNum}`
  }
  next()
})

module.exports = mongoose.model("Curso", cursoSchema)
