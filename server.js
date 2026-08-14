const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const app = express();
const PORT = 3000;


// ==========================================
// CONFIGURACIÓN
// ==========================================

app.use(cors());
app.use(express.json());

// Permite que Express sirva index.html y styles.css
app.use(express.static(__dirname));


// ==========================================
// BASE DE DATOS SQLITE
// ==========================================

const databaseFolder = path.join(__dirname, "database");

// Crear carpeta database si no existe
if (!fs.existsSync(databaseFolder)) {
    fs.mkdirSync(databaseFolder);
}

const dbPath = path.join(databaseFolder, "usuarios.db");

const db = new Database(dbPath);


// Crear tabla de usuarios
db.prepare(`
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        telefono TEXT
    )
`).run();


// ==========================================
// GET - OBTENER TODOS LOS USUARIOS
// ==========================================

app.get("/api/usuarios", (req, res) => {

    try {

        const usuarios = db.prepare(`
            SELECT *
            FROM usuarios
            ORDER BY id DESC
        `).all();

        res.json(usuarios);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Error al obtener los usuarios"
        });

    }

});


// ==========================================
// POST - CREAR USUARIO
// ==========================================

app.post("/api/usuarios", (req, res) => {

    try {

        const {
            nombre,
            email,
            telefono
        } = req.body;


        // Validación
        if (!nombre || !email) {

            return res.status(400).json({
                error: "Nombre y correo son obligatorios"
            });

        }


        const resultado = db.prepare(`
            INSERT INTO usuarios
            (nombre, email, telefono)
            VALUES (?, ?, ?)
        `).run(
            nombre.trim(),
            email.trim(),
            telefono ? telefono.trim() : ""
        );


        const usuario = db.prepare(`
            SELECT *
            FROM usuarios
            WHERE id = ?
        `).get(resultado.lastInsertRowid);


        res.status(201).json(usuario);

    } catch (error) {

        console.error(error);


        // Email duplicado
        if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {

            return res.status(409).json({
                error: "Ya existe un usuario con ese correo"
            });

        }


        res.status(500).json({
            error: "Error al crear el usuario"
        });

    }

});


// ==========================================
// PUT - EDITAR USUARIO
// ==========================================

app.put("/api/usuarios/:id", (req, res) => {

    try {

        const id = Number(req.params.id);

        const {
            nombre,
            email,
            telefono
        } = req.body;


        if (!nombre || !email) {

            return res.status(400).json({
                error: "Nombre y correo son obligatorios"
            });

        }


        // Comprobar que existe
        const usuarioExiste = db.prepare(`
            SELECT *
            FROM usuarios
            WHERE id = ?
        `).get(id);


        if (!usuarioExiste) {

            return res.status(404).json({
                error: "Usuario no encontrado"
            });

        }


        db.prepare(`
            UPDATE usuarios
            SET
                nombre = ?,
                email = ?,
                telefono = ?
            WHERE id = ?
        `).run(
            nombre.trim(),
            email.trim(),
            telefono ? telefono.trim() : "",
            id
        );


        const usuarioActualizado = db.prepare(`
            SELECT *
            FROM usuarios
            WHERE id = ?
        `).get(id);


        res.json(usuarioActualizado);

    } catch (error) {

        console.error(error);


        if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {

            return res.status(409).json({
                error: "Ya existe otro usuario con ese correo"
            });

        }


        res.status(500).json({
            error: "Error al actualizar el usuario"
        });

    }

});


// ==========================================
// DELETE - ELIMINAR USUARIO
// ==========================================

app.delete("/api/usuarios/:id", (req, res) => {

    try {

        const id = Number(req.params.id);


        const usuario = db.prepare(`
            SELECT *
            FROM usuarios
            WHERE id = ?
        `).get(id);


        if (!usuario) {

            return res.status(404).json({
                error: "Usuario no encontrado"
            });

        }


        db.prepare(`
            DELETE FROM usuarios
            WHERE id = ?
        `).run(id);


        res.json({
            mensaje: "Usuario eliminado correctamente"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Error al eliminar el usuario"
        });

    }

});


// ==========================================
// RUTA PRINCIPAL
// ==========================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "index.html")
    );

});


// ==========================================
// INICIAR SERVIDOR
// ==========================================

app.listen(PORT, () => {

    console.log("");
    console.log("=================================");
    console.log("Luz Biviana Seguros");
    console.log("Backend iniciado correctamente");
    console.log("=================================");
    console.log(`Servidor: http://localhost:${PORT}`);
    console.log(`API:      http://localhost:${PORT}/api/usuarios`);
    console.log("");

});