// routes/device.routes.js
const express = require("express");
const router = express.Router();
const arduino = require("../services/arduino.service");

// Listar puertos
router.get("/ports", async (req, res) => {
  const ports = await arduino.listPorts();
  res.json({ ports });
});

// Conectar (autodetecta si no hay ARDUINO_COM)
router.post("/connect", async (req, res) => {
  try {
    const st = await arduino.connectIfNeeded();
    res.json({ status: st });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Estado
router.get("/status", (req, res) => {
  res.json({ status: arduino.getStatus() });
});

// Cambiar modo
router.post("/mode", async (req, res) => {
  try {
    const { mode } = req.body || {};
    const st = await arduino.sendMode(mode);
    res.json({ status: st });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Desconectar
router.post("/disconnect", async (req, res) => {
  try {
    await arduino.disconnect();
    res.json({ status: arduino.getStatus() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
