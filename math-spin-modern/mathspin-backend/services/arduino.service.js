// services/arduino.service.js
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

let port = null;
let parser = null;

// Estado de modo
let currentMode = "web";       // lo que nos reporta el Arduino (STATUS:WEB/PHYSICAL)
let desiredMode = "web";       // lo que queremos (lo reenvía al abrir puerto)

// Último estado para /status
let lastStatus = {
  connected: false,
  mode: "web",
  port: null,
  baud: Number(process.env.ARDUINO_BAUD || 115200),
};

async function listPorts() {
  try {
    return await SerialPort.list();
  } catch (e) {
    console.error("❌ Error listando puertos:", e.message);
    return [];
  }
}

function _attachHandlers(comPath) {
  parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

  parser.on("data", (rawLine) => {
    const msg = String(rawLine).replace(/\r/g, "").trim();
    if (!msg) return;
    // Ej: STATUS:PHYSICAL | STATUS:WEB | PONG | logs varios
    // console.log("🎧 Arduino:", msg);

    if (msg.startsWith("STATUS:")) {
      const m = msg.split(":")[1]?.toLowerCase();
      currentMode = m === "physical" ? "physical" : "web";
      lastStatus.mode = currentMode;
    }
  });

  port.on("open", async () => {
    console.log("✅ Puerto serial abierto:", comPath);
    lastStatus.connected = true;
    lastStatus.port = comPath;

    // Reenviar modo deseado al abrir
    await sendMode(desiredMode);
  });

  port.on("close", () => {
    console.log("⚠️ Puerto serial cerrado");
    lastStatus.connected = false;
    lastStatus.port = null;
  });

  port.on("error", (e) => {
    console.error("❌ Error en puerto serial:", e.message);
    lastStatus.connected = false;
    lastStatus.port = null;
  });
}

async function _openPort(comPath, baud) {
  return new Promise((resolve, reject) => {
    try {
      port = new SerialPort({ path: comPath, baudRate: baud }, (err) => {
        if (err) {
          return reject(err);
        }
        _attachHandlers(comPath);
        resolve();
      });
    } catch (e) {
      reject(e);
    }
  });
}

async function connectIfNeeded() {
  if (port && port.isOpen) {
    return getStatus();
  }

  const baud = Number(process.env.ARDUINO_BAUD || 115200);
  let com = process.env.ARDUINO_COM; // opcional

  // Autodetección si no hay ARDUINO_COM
  if (!com) {
    const ports = await listPorts();
    const preferred = ports.find(
      (p) =>
        /arduino|mega|usb|wch|silicon/i.test(`${p.manufacturer || ""} ${p.friendlyName || ""}`) ||
        /arduino/i.test(`${p.vendorId || ""}-${p.productId || ""}`)
    );
    com = preferred?.path || ports[0]?.path;
  }

  if (!com) {
    throw new Error("No se encontró ningún puerto serial. Conecta el Arduino o define ARDUINO_COM en .env");
  }

  try {
    await _openPort(com, baud);
    lastStatus = { ...lastStatus, connected: true, port: com };
  } catch (err) {
    console.error("❌ No se pudo abrir el puerto serial:", err.message);
    lastStatus = { ...lastStatus, connected: false, port: null };
    throw err;
  }

  return getStatus();
}

function isConnected() {
  return Boolean(port && port.isOpen);
}

async function writeLine(line) {
  if (!isConnected()) return; // no lanzar; permite llamar sendMode incluso sin conexión
  return new Promise((resolve, reject) => {
    port.write(line + "\n", (err) => {
      if (err) return reject(err);
      port.drain((err2) => (err2 ? reject(err2) : resolve()));
    });
  });
}

async function sendMode(mode) {
  desiredMode = mode === "physical" ? "physical" : "web";
  lastStatus.mode = desiredMode; // estado deseado

  if (!isConnected()) return getStatus(); // se enviará cuando abra el puerto
  await writeLine(desiredMode === "physical" ? "MODE:PHYSICAL" : "MODE:WEB");
  return getStatus();
}

async function ping() {
  await writeLine("PING");
  // la respuesta "PONG" la veríamos por consola si la quieres loguear
}

function getStatus() {
  return {
    connected: lastStatus.connected,
    mode: lastStatus.mode,
    port: lastStatus.port,
    baud: lastStatus.baud,
  };
}

async function disconnect() {
  if (!isConnected()) return;
  await new Promise((resolve) => port.close(() => resolve()));
}

module.exports = {
  listPorts,
  connectIfNeeded,
  isConnected,
  sendMode,
  ping,
  getStatus,
  disconnect,
};
