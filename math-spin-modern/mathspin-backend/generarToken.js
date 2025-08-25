const jwt = require("jsonwebtoken");

const SECRET = "clave_secreta_super_segura";

const payload = { id: "689bc5b2e5d5f22bd788c148" };

const token = jwt.sign(payload, SECRET, { expiresIn: "1h" });

console.log(token);
