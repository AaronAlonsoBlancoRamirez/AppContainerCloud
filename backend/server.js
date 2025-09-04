import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";

const {
  DB_HOST = "db",
  DB_USER = "root",
  DB_PASSWORD = "root",
  DB_NAME = "appdb",
  PORT = 8080,
} = process.env;

const app = express();
app.use(cors({ origin: "*" }));          // habilita CORS para el frontend en 3000
app.use(express.json());                  // parsea JSON del body

// Pool de conexiones
const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

// Inicialización de esquema
async function initSchema() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS visits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS modules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(120) NOT NULL,
        description TEXT,
        week TINYINT UNSIGNED NOT NULL,
        status ENUM('planned','in_progress','done') DEFAULT 'planned',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Semillas opcionales si está vacío
    const [rows] = await conn.query("SELECT COUNT(*) AS c FROM modules");
    if (rows[0].c === 0) {
      await conn.query(
        "INSERT INTO modules (title, description, week, status) VALUES (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?)",
        [
          "Introducción a Cloud",
          "Conceptos básicos de virtualización y contenedores.",
          1,
          "planned",
          "Docker y Compose",
          "Imágenes, contenedores, redes y volúmenes.",
          2,
          "in_progress",
          "Orquestación",
          "Introducción a Docker Compose y nociones de Kubernetes.",
          3,
          "planned",
        ]
      );
      console.log("Seed: módulos iniciales creados.");
    }
    console.log("DB lista y esquema verificado");
  } finally {
    conn.release();
  }
}
await initSchema();

// ---------- Endpoints de demo existentes ----------
app.get("/api/ping", (req, res) => res.json({ ok: true, msg: "pong" }));
app.get("/api/visitas", async (req, res) => {
  await pool.query("INSERT INTO visits () VALUES ()");
  const [rows] = await pool.query("SELECT COUNT(*) AS total FROM visits");
  res.json({ total_visitas: rows[0].total });
});

// ---------- CRUD de módulos ----------

// Listar todos
app.get("/api/modules", async (_req, res) => {
  const [rows] = await pool.query(
    "SELECT id, title, description, week, status, created_at, updated_at FROM modules ORDER BY week, id"
  );
  res.json(rows);
});

// Obtener uno
app.get("/api/modules/:id", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM modules WHERE id = ?", [
    req.params.id,
  ]);
  if (rows.length === 0) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

// Crear
app.post("/api/modules", async (req, res) => {
  const { title, description = "", week, status = "planned" } = req.body || {};
  if (!title || !Number.isInteger(Number(week))) {
    return res.status(400).json({ error: "title y week son obligatorios" });
  }
  const valid = ["planned", "in_progress", "done"];
  if (!valid.includes(status)) {
    return res.status(400).json({ error: "status inválido" });
  }
  const [result] = await pool.query(
    "INSERT INTO modules (title, description, week, status) VALUES (?, ?, ?, ?)",
    [title, description, Number(week), status]
  );
  const [rows] = await pool.query("SELECT * FROM modules WHERE id = ?", [
    result.insertId,
  ]);
  res.status(201).json(rows[0]);
});

// Actualizar
app.put("/api/modules/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { title, description, week, status } = req.body || {};
  const fields = [];
  const values = [];

  if (title !== undefined) { fields.push("title = ?"); values.push(title); }
  if (description !== undefined) { fields.push("description = ?"); values.push(description); }
  if (week !== undefined) {
    if (!Number.isInteger(Number(week))) return res.status(400).json({ error: "week debe ser entero" });
    fields.push("week = ?");
    values.push(Number(week));
  }
  if (status !== undefined) {
    const valid = ["planned", "in_progress", "done"];
    if (!valid.includes(status)) return res.status(400).json({ error: "status inválido" });
    fields.push("status = ?");
    values.push(status);
  }
  if (fields.length === 0) return res.status(400).json({ error: "Nada para actualizar" });

  values.push(id);
  const [result] = await pool.query(
    `UPDATE modules SET ${fields.join(", ")} WHERE id = ?`,
    values
  );
  if (result.affectedRows === 0) return res.status(404).json({ error: "Not found" });
  const [rows] = await pool.query("SELECT * FROM modules WHERE id = ?", [id]);
  res.json(rows[0]);
});

// Eliminar
app.delete("/api/modules/:id", async (req, res) => {
  const [result] = await pool.query("DELETE FROM modules WHERE id = ?", [
    req.params.id,
  ]);
  if (result.affectedRows === 0) return res.status(404).json({ error: "Not found" });
  res.status(204).send();
});

app.listen(PORT, () => console.log(`Backend escuchando en ${PORT}`));
