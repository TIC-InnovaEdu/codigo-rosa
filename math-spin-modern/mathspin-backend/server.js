require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

// ⛳ Ajusta esta ruta si tu db está en ./db.js en lugar de ./config/db.js
const connectDB = require("./config/db"); // o: const connectDB = require("./db");

// 📌 Importar rutas
const userRoutes = require("./routes/user.routes");
const cursoRoutes = require("./routes/curso.routes");
const questionRoutes = require("./routes/question.routes");
const sessionRoutes = require("./routes/session.routes");
const gameRoutes = require("./routes/game.routes");
const deviceRoutes = require("./routes/device.routes"); // 🔌 Control del Arduino
const arduino = require("./services/arduino.service");  // 🔌 Servicio para conexión física

const app = express();

// 📌 Conexión a MongoDB
connectDB();

// 📌 Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 📌 Rutas para el control físico (Arduino)
app.use("/api/device", deviceRoutes);

// 📌 Carpeta pública del frontend
app.use(express.static(path.join(__dirname, "../mathspin-frontend")));

// 📌 Rutas API
app.use("/api/users", userRoutes);
app.use("/api/cursos", cursoRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/game", gameRoutes);

// 📌 Ruta de prueba API
app.get("/api/test", (req, res) => {
  res.json({ mensaje: "API funcionando correctamente" });
});

// 📌 Servir frontend en rutas no API (SPA)
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../mathspin-frontend/index.html"));
});

// 📌 Middleware de errores (último)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ mensaje: "Error interno del servidor" });
});

// 📌 Auto-conexión al Arduino si está activado en .env
if (process.env.AUTO_CONNECT === "true") {
  arduino.connectIfNeeded().catch((e) => {
    console.error("No se pudo auto-conectar al Arduino:", e.message);
  });
}

// 📌 Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
