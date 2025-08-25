const mongoose = require("mongoose")

const questionSchema = new mongoose.Schema(
  {
    categoria: {
      type: String,
      required: true,
    },
    dificultad: {
      type: String,
      enum: ["facil", "intermedio", "dificil"],
      required: true,
    },
    pregunta: {
      type: String,
      required: true,
    },
    titulo: {
      type: String, // Campo adicional para compatibilidad
    },
    opciones: [
      {
        type: String,
        required: true,
      },
    ],
    respuestaCorrecta: {
      type: String,
      required: true,
    },
    // ✅ NUEVO: Asociar pregunta con docente
    // docenteId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Usuario",
    //   required: true,
    // },
    // // ✅ NUEVO: Soporte para imágenes
    // imagen: {
    //   type: String, // URL de la imagen
    // },
    // // ✅ NUEVO: Soporte para LaTeX
    // tieneLatex: {
    //   type: Boolean,
    //   default: false,
    // },
    // activa: {
    //   type: Boolean,
    //   default: true,
    // },
  },
  { timestamps: true },
)

module.exports = mongoose.model("Question", questionSchema)
