// === BUZZER ===
const int buzzerPin = 2;

#include <Wire.h>
#include <U8g2lib.h>

// === OLED: SH1106 128x64 I2C ===
U8G2_SH1106_128X64_NONAME_F_HW_I2C u8g2(U8G2_R0, U8X8_PIN_NONE);

// === Pines (MEGA) ===
const int botonPin  = 22;  // Botón principal (gira ruleta)
const int primerLed = 23;  // LEDs 23..28
const int ultimoLed = 28;

const int botonA = 29; // A = Fácil
const int botonB = 30; // B = Intermedio
const int botonC = 31; // C = Difícil
const int botonD = 32; // D = Difícil (alias)

bool jugando = false;

// === Control de modo SOLO por Serial (virtual desde la web) ===
// false = WEB (digital, bloqueado), true = PHYSICAL (habilita botón rojo)
bool modoFisico = false;
uint32_t lastStatusMs = 0;
String __rxBuf = "";

// === Categorías por LED 23..28 ===
const char* categorias[] = {
  "Trigonometria", // 23 -> 0
  "Funciones",     // 24 -> 1
  "Numeros",       // 25 -> 2
  "Estadistica",   // 26 -> 3
  "Geometria",     // 27 -> 4
  "Algebra"        // 28 -> 5
};

// ---------- Banco: 6 cat × (facil, inter, dificil) × 2 c/u ----------
struct Pregunta {
  const char* enunciado;
  const char* a;
  const char* b;
  const char* c;
  const char* d;
  char correcta;   // 'A'...'D'
  uint8_t segundos;
};

// 0=Trig, 1=Func, 2=Num, 3=Est, 4=Geo, 5=Alg
// 0=Facil(10), 1=Inter(20), 2=Dificil(30)
Pregunta banco[6][3][2] = {
  // 0: TRIGONOMETRIA
  {
    { // Faciles
      {"Valor de sen(90 deg)", "0", "1", "-1", "1/2", 'B', 10},
      {"Valor de cos(0 deg)",  "0", "1", "-1", "1/2", 'B', 10}
    },
    { // Intermedias
      {"En triangulo recto, sen(theta) =", "opuesto/hipotenusa", "adyacente/hipotenusa", "opuesto/adyacente", "hipotenusa/opuesto", 'A', 20},
      {"Valor de tan(45 deg)", "0", "1", "sqrt(3)", "1/2", 'B', 20}
    },
    { // Dificiles
      {"cos^2+sen^2 =", "1", "0", "2", "1/2", 'A', 30},
      {"sen(theta)=1/2 y agudo, halla theta", "30 deg", "45 deg", "60 deg", "90 deg", 'A', 30}
    }
  },

  // 1: FUNCIONES
  {
    { // Faciles
      {"Si f(x)=2x+3, f(5) =", "10", "11", "13", "15", 'C', 10},
      {"Pendiente de y=3x+2", "2", "3", "5", "1", 'B', 10}
    },
    { // Intermedias
      {"Dominio de f(x)=1/x", "Todos reales", "x!=0", "x>0", "x<0", 'B', 20},
      {"Interseccion eje y de y=2x-4", "2", "-2", "4", "-4", 'D', 20}
    },
    { // Dificiles
      {"Si g(x)=x^2, g(-3) =", "-9", "9", "-6", "6", 'B', 30},
      {"Si h(x)=sqrt(x+4), h(5) =", "2", "3", "sqrt(9)", "4", 'C', 30}
    }
  },

  // 2: NUMEROS
  {
    { // Faciles
      {"Resultado de 3/4 + 1/4", "1/2", "3/4", "1", "4/4", 'C', 10},
      {"Decimal de 3/8", "0.375", "0.25", "0.5", "0.125", 'A', 10}
    },
    { // Intermedias
      {"25% de 80", "15", "20", "25", "30", 'B', 20},
      {"Fraccion equivalente a 0.6", "3/5", "2/3", "1/2", "4/5", 'A', 20}
    },
    { // Dificiles
      {"(-3) x (-4) =", "-12", "12", "-7", "7", 'B', 30},
      {"Potencia: 2^5", "16", "32", "64", "128", 'B', 30}
    }
  },

  // 3: ESTADISTICA
  {
    { // Faciles
      {"Media de 2, 4, 6, 8", "4", "5", "6", "7", 'B', 10},
      {"Mediana de 1,3,5,7,9", "3", "5", "7", "9", 'B', 10}
    },
    { // Intermedias
      {"Moda de 2,3,3,4,5", "2", "3", "4", "5", 'B', 20},
      {"Rango de 10,15,20,25", "10", "15", "20", "25", 'B', 20}
    },
    { // Dificiles
      {"En 100 datos, primer cuartil tiene", "25", "50", "75", "100", 'A', 30},
      {"Si Q1=20 y Q3=40, RIC =", "10", "20", "30", "40", 'B', 30}
    }
  },

  // 4: GEOMETRIA
  {
    { // Faciles
      {"Area de circulo radio 5", "25 pi", "10 pi", "5 pi", "15 pi", 'A', 10},
      {"Lados de un hexagono", "5", "6", "7", "8", 'B', 10}
    },
    { // Intermedias
      {"Suma angulos internos de triangulo", "90 deg", "180 deg", "270 deg", "360 deg", 'B', 20},
      {"Volumen de cubo lado 3", "9", "18", "27", "36", 'C', 20}
    },
    { // Dificiles
      {"Perimetro de rectangulo 4x6", "10", "20", "24", "30", 'B', 30},
      {"Diagonal cuadrado lado 5 aprox", "5.8", "7.07", "6.5", "8", 'B', 30}
    }
  },

  // 5: ALGEBRA
  {
    { // Faciles
      {"Cuanto vale x en 2x+5=13?", "3", "4", "5", "6", 'B', 10},
      {"Simplifica: 3x + 2x - x", "4x", "5x", "6x", "3x", 'A', 10}
    },
    { // Intermedias
      {"Factoriza: x^2 - 9", "(x-3)(x+3)", "(x+9)(x-1)", "(x-9)(x+1)", "(x+3)^2", 'A', 20},
      {"Si 4x - 2 = 10, x =", "2", "3", "4", "5", 'C', 20}
    },
    { // Dificiles
      {"Resuelve: 2(x - 1) = x + 5", "5", "7", "3", "2", 'B', 30},
      {"Si x^2 + 2x = 15, x =", "3 y -5", "5 y -3", "4 y -2", "6 y -1", 'A', 30}
    }
  }
};

// ---------- UTILIDADES DE UI ----------
void drawTimeBar(uint32_t tRemain, uint32_t tTotal) {
  const int x = 123, w = 5, h = 62, y0 = 1;
  int filled = (int)((long)h * tRemain / tTotal);
  u8g2.drawFrame(x, y0, w, h);
  for (int y = 0; y < h; y++) {
    if (y >= h - filled) {
      for (int xx = x + 1; xx < x + w - 1; xx++) u8g2.drawPixel(xx, y0 + y);
    }
  }
}

// Envoltura por palabras hasta 4 lineas
int drawWrappedCount(int x, int y, int maxW, const char* text, uint8_t lineH = 10, uint8_t maxLines = 4) {
  String s(text);
  int start = 0;
  int curY = y;
  uint8_t lines = 0;

  while (start < (int)s.length() && lines < maxLines) {
    int end = start;
    String line = "";
    while (end < (int)s.length()) {
      int nextSpace = s.indexOf(' ', end);
      if (nextSpace == -1) nextSpace = s.length();
      String candidate = line + (line.length() ? " " : "") + s.substring(end, nextSpace);
      if (u8g2.getUTF8Width(candidate.c_str()) > maxW) break;
      line = candidate;
      end = nextSpace;
      if (end < (int)s.length()) end++;
    }
    if (line.length() == 0) { // palabra larguísima
      line = s.substring(start, min(start + 12, (int)s.length()));
      end = start + line.length();
    }
    u8g2.drawUTF8(x, curY, line.c_str());
    curY += lineH;
    lines++;
    start = end;
  }

  if (start < (int)s.length() && lines > 0) {
    u8g2.drawUTF8(x + maxW - u8g2.getUTF8Width("..."), y + (lines - 1) * lineH, "...");
  }
  return lines;
}

void sonidoOK() {
  tone(buzzerPin, 1000, 150); delay(180);
  tone(buzzerPin, 1300, 150); delay(180);
  tone(buzzerPin, 1600, 400); delay(420);
  noTone(buzzerPin);
}

void sonidoFail() {
  for (int f = 800; f >= 200; f -= 20) {
    tone(buzzerPin, f, 30);
    delay(30);
  }
  noTone(buzzerPin);
}

void animCheckX(bool ok) {
  u8g2.clearBuffer();
  u8g2.setFont(u8g2_font_6x10_tr);
  // Carita con ojitos
  const int cx = 20, cy = 18, r = 10;
  u8g2.drawCircle(cx, cy, r);
  u8g2.drawDisc(cx - 4, cy - 3, 1);
  u8g2.drawDisc(cx + 4, cy - 3, 1);
  if (ok) { // sonrisa
    u8g2.drawLine(cx - 5, cy + 4, cx, cy + 6);
    u8g2.drawLine(cx, cy + 6, cx + 5, cy + 4);
  } else {  // triste
    u8g2.drawLine(cx - 5, cy + 6, cx, cy + 4);
    u8g2.drawLine(cx, cy + 4, cx + 5, cy + 6);
  }
  // Check/X + texto
  if (ok) {
    u8g2.drawLine(6, 34, 14, 44);
    u8g2.drawLine(14, 44, 28, 30);
    u8g2.drawUTF8(40, 30, "Correcto!");
  } else {
    u8g2.drawLine(6, 32, 28, 48);
    u8g2.drawLine(28, 32, 6, 48);
    u8g2.drawUTF8(40, 30, "Incorrecto");
  }
  u8g2.sendBuffer();

  // Sonido
  if (ok) sonidoOK();
  else    sonidoFail();
}

// ¿Caben en dos líneas (A+B y C+D)?
bool opcionesSonCortas(const char* A, const char* B, const char* C, const char* D) {
  String sA = String("A) ") + A;
  String sB = String("B) ") + B;
  String sC = String("C) ") + C;
  String sD = String("D) ") + D;

  int wA = u8g2.getUTF8Width(sA.c_str());
  int wB = u8g2.getUTF8Width(sB.c_str());
  int wC = u8g2.getUTF8Width(sC.c_str());
  int wD = u8g2.getUTF8Width(sD.c_str());

  if (wA > 58 || wB > 58 || wC > 58 || wD > 58) return false;
  if (wA + wB > 118) return false;
  if (wC + wD > 118) return false;
  return true;
}

char leerBotonRespuesta() {
  if (digitalRead(botonA) == HIGH) return 'A';
  if (digitalRead(botonB) == HIGH) return 'B';
  if (digitalRead(botonC) == HIGH) return 'C';
  if (digitalRead(botonD) == HIGH) return 'D';
  return 0;
}

// ---------- PREGUNTAS ----------
void presentarPregunta(int catIndex, int dificultad) {
  int idx = random(0, 2);
  Pregunta q = banco[catIndex][dificultad][idx];
  uint32_t totalMs = (uint32_t)q.segundos * 1000UL;
  uint32_t t0 = millis();

  while (true) {
    uint32_t elapsed = millis() - t0;
    if (elapsed >= totalMs) {
      animCheckX(false);
      delay(5000);
      return;
    }

    u8g2.clearBuffer();

    // Enunciado hasta 4 lineas (ancho 122 para dejar barra)
    u8g2.setFont(u8g2_font_6x10_tr);
    const int qX = 0, qY = 10, qW = 122, qLH = 10, qMaxLines = 4;
    int used = drawWrappedCount(qX, qY, qW, q.enunciado, qLH, qMaxLines);

    // Opciones adaptativas
    int startY = qY + used * qLH + 2;
    if (startY < 36) startY = 36;

    u8g2.setFont(u8g2_font_5x8_tr);
    bool cortas = opcionesSonCortas(q.a, q.b, q.c, q.d);

    if (cortas && startY <= 46) {
      u8g2.drawUTF8(0, 46, (String("A) ") + q.a).c_str());
      u8g2.drawUTF8(64, 46, (String("B) ") + q.b).c_str());
      u8g2.drawUTF8(0, 60, (String("C) ") + q.c).c_str());
      u8g2.drawUTF8(64, 60, (String("D) ") + q.d).c_str());
    } else {
      int y1 = startY;
      int step = 9;
      if (y1 + step * 3 > 63) step = 8;
      if (y1 + step * 3 > 63) y1 = 33;

      u8g2.drawUTF8(0, y1,          (String("A) ") + q.a).c_str());
      u8g2.drawUTF8(0, y1 + step,   (String("B) ") + q.b).c_str());
      u8g2.drawUTF8(0, y1 + step*2, (String("C) ") + q.c).c_str());
      u8g2.drawUTF8(0, y1 + step*3, (String("D) ") + q.d).c_str());
    }

    // Barra de tiempo
    drawTimeBar(totalMs - elapsed, totalMs);

    u8g2.sendBuffer();

    // Lectura de respuesta
    char r = leerBotonRespuesta();
    if (r) {
      bool ok = (r == q.correcta);
      animCheckX(ok);
      delay(5000);
      return;
    }
    delay(35);
  }
}

// ---------- Ruleta y pantallas ----------
void encenderSolo(int pinEncendido) {
  for (int pin = primerLed; pin <= ultimoLed; pin++)
    digitalWrite(pin, pin == pinEncendido ? HIGH : LOW);
}

int ruleta() {
  int ledActual = primerLed;
  int pasosTotales = random(15, 25);
  int velocidad = 50;
  for (int paso = 0; paso < pasosTotales; paso++) {
    encenderSolo(ledActual);
    delay(velocidad);
    if (paso > pasosTotales - 6 && velocidad < 250) velocidad += 30;
    ledActual++;
    if (ledActual > ultimoLed) ledActual = primerLed;
  }
  encenderSolo(ledActual);
  return ledActual;
}

void mostrarMensajeEspera() {
  for (int pin = primerLed; pin <= ultimoLed; pin++) digitalWrite(pin, LOW);
  u8g2.clearBuffer();
  u8g2.setFont(u8g2_font_ncenB08_tr);
  u8g2.drawStr(0, 15, "Presiona el boton");
  u8g2.drawStr(0, 35, "para girar la");
  u8g2.drawStr(0, 50, "ruleta!");
  u8g2.sendBuffer();
}

// Selección de dificultad con "Categoria: ..."
void mostrarOpciones(int ledGanador) {
  int catIndex = ledGanador - primerLed;

  u8g2.clearBuffer();
  u8g2.setFont(u8g2_font_ncenB08_tr);
  u8g2.drawStr(0, 12, "Elige dificultad");

  u8g2.setFont(u8g2_font_6x10_tr);
  String linea = String("Categoria: ") + categorias[catIndex];
  u8g2.drawUTF8(0, 28, linea.c_str());

  u8g2.setFont(u8g2_font_ncenB08_tr);
  u8g2.drawStr(0, 46, "A) FACIL");
  u8g2.drawStr(70, 46, "B) INTER");
  u8g2.drawStr(0, 62, "C) DIFICIL");
  u8g2.sendBuffer();
}

void mostrarSeleccion(const char* opcion) {
  u8g2.clearBuffer();
  u8g2.setFont(u8g2_font_ncenB08_tr);
  u8g2.drawStr(0, 20, "Has seleccionado:");
  u8g2.setCursor(0, 40);
  u8g2.print(opcion);
  u8g2.sendBuffer();
  delay(1000);
}

void esperarSeleccion(int catIndex) {
  while (true) {
    if (digitalRead(botonA) == HIGH) { mostrarSeleccion("FACIL");      presentarPregunta(catIndex, 0); break; }
    if (digitalRead(botonB) == HIGH) { mostrarSeleccion("INTERMEDIO"); presentarPregunta(catIndex, 1); break; }
    if (digitalRead(botonC) == HIGH) { mostrarSeleccion("DIFICIL");    presentarPregunta(catIndex, 2); break; }
    if (digitalRead(botonD) == HIGH) { mostrarSeleccion("DIFICIL");    presentarPregunta(catIndex, 2); break; }
  }
}

// ---------- Serial / MODO (solo virtual) ----------
void enviarStatus() {
  if (modoFisico) Serial.println("STATUS:PHYSICAL");
  else            Serial.println("STATUS:WEB");
}

void mostrarMensajeModo() {
  u8g2.clearBuffer();
  u8g2.setFont(u8g2_font_ncenB08_tr);
  if (modoFisico) {
    u8g2.drawStr(0, 15, "MODO: FISICO");
    u8g2.drawStr(0, 35, "Use el boton rojo");
  } else {
    u8g2.drawStr(0, 15, "MODO: WEB");
    u8g2.drawStr(0, 35, "Ruleta deshabilitada");
  }
  u8g2.sendBuffer();
}

void procesarSerial() {
  while (Serial.available()) {
    char c = (char)Serial.read();
    if (c == '\n' || c == '\r') {
      __rxBuf.trim();
      if (__rxBuf.length()) {
        // Comandos: MODE:PHYSICAL | MODE:WEB | PING
        if (__rxBuf.equalsIgnoreCase("PING")) {
          Serial.println("PONG");
        } else if (__rxBuf.equalsIgnoreCase("MODE:PHYSICAL")) {
          modoFisico = true;
          mostrarMensajeModo();
          enviarStatus();
        } else if (__rxBuf.equalsIgnoreCase("MODE:WEB")) {
          modoFisico = false;
          mostrarMensajeModo();
          enviarStatus();
        }
      }
      __rxBuf = "";
    } else {
      __rxBuf += c;
      if (__rxBuf.length() > 120) __rxBuf = ""; // seguridad
    }
  }
}

// ---------- Setup / Loop ----------
void setup() {
  Serial.begin(115200);  // Debe coincidir con ARDUINO_BAUD en el backend
  u8g2.begin();

  for (int pin = primerLed; pin <= ultimoLed; pin++) pinMode(pin, OUTPUT);
  pinMode(botonPin, INPUT);
  pinMode(botonA, INPUT);
  pinMode(botonB, INPUT);
  pinMode(botonC, INPUT);
  pinMode(botonD, INPUT);
  pinMode(buzzerPin, OUTPUT);

  randomSeed(analogRead(0));

  // Arranca en modo WEB (digital): botón físico deshabilitado hasta que la web lo habilite
  modoFisico = false;
  mostrarMensajeModo();
  enviarStatus();
}

void loop() {
  // 1) Atiende mensajes de la web/backend
  procesarSerial();

  // 2) Reporta estado cada ~2s
  if (millis() - lastStatusMs > 2000) {
    enviarStatus();
    lastStatusMs = millis();
  }

  // 3) Si está en WEB, ignora el botón rojo
  if (!modoFisico) {
    delay(20);
    return;
  }

  // 4) MODO FÍSICO (habilitado desde la web): juego normal
  if (digitalRead(botonPin) == HIGH && !jugando) {
    delay(50);
    if (digitalRead(botonPin) == HIGH) {
      jugando = true;
      int ledGanador = ruleta();
      int catIndex = ledGanador - primerLed;
      mostrarOpciones(ledGanador);
      esperarSeleccion(catIndex);
      jugando = false;
      mostrarMensajeEspera();
    }
  }
}