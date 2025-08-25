const Usuario = require("../models/user.model");
const Curso = require("../models/curso.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "clave_secreta_super_segura";

exports.registrarUsuario = async (req, res) => {
  try {
    const { nombre, apellido, nombreUsuario, contrasena, rol, paralelo, codigoCurso } = req.body;

    const existe = await Usuario.findOne({ nombreUsuario });
    if (existe) return res.status(400).json({ mensaje: "Nombre de usuario ya registrado" });

    const hash = await bcrypt.hash(contrasena, 10);

    let cursoId = null;
    if (rol === "estudiante" && codigoCurso) {
      const curso = await Curso.findOne({ codigo: codigoCurso });
      if (!curso) return res.status(400).json({ mensaje: "Código de curso inválido" });
      cursoId = curso._id;
      curso.totalEstudiantes += 1;
      await curso.save();
    }

    const nuevoUsuario = new Usuario({
      nombre,
      apellido,
      nombreUsuario,
      contrasena: hash,
      rol,
      paralelo: rol === "estudiante" ? paralelo : null,
      cursoId,
      codigoCurso: rol === "estudiante" ? codigoCurso : null,
    });

    await nuevoUsuario.save();
    res.status(201).json({ mensaje: "Usuario registrado correctamente" });
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    res.status(500).json({ mensaje: "Error al registrar usuario", error: error.message });
  }
};

exports.iniciarSesion = async (req, res) => {
  try {
    const { nombreUsuario, contrasena } = req.body;
    const usuario = await Usuario.findOne({ nombreUsuario });

    if (!usuario) return res.status(404).json({ mensaje: "Usuario no encontrado" });

    const valid = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!valid) return res.status(401).json({ mensaje: "Contraseña incorrecta" });

    const token = jwt.sign({ id: usuario._id, rol: usuario.rol }, SECRET, { expiresIn: "2h" });

    res.json({
      mensaje: "Inicio de sesión exitoso",
      token,
      rol: usuario.rol,
      id: usuario._id.toString(),
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      paralelo: usuario.paralelo,
    });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    res.status(500).json({ mensaje: "Error al iniciar sesión", error: error.message });
  }
};

exports.obtenerPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.user.id).select("-contrasena");
    if (!usuario) return res.status(404).json({ mensaje: "Usuario no encontrado" });
    res.json(usuario);
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    res.status(500).json({ mensaje: "Error al obtener perfil", error: error.message });
  }
};
