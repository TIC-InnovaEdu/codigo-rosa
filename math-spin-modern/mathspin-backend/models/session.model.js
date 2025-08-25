const mongoose = require("mongoose")

const sessionSchema = new mongoose.Schema(
  {
    usuarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    categoria: {
      type: String,
      required: true,
    },
    dificultad: {
      type: String,
      required: true,
    },
    respuestas: [
      {
        preguntaId: mongoose.Schema.Types.ObjectId,
        respuestaSeleccionada: String,
        respuestaCorrecta: String,
        esCorrecta: Boolean,
      },
    ],
    puntaje: {
      type: Number,
      required: true,
    },
    totalPreguntas: Number,
    porcentaje: Number,
    duracion: Number,
    fechaInicio: Date,
    fechaFin: Date,
  },
  { timestamps: true },
)

module.exports = mongoose.model("Session", sessionSchema)
