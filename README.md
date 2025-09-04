# AppContainerCloud — Frontend + Backend + DB con Docker Compose

Aplicación de ejemplo para el curso **Cloud Computing** compuesta por **tres contenedores**:

- **Frontend**: Nginx sirviendo HTML/CSS/JS.
- **Backend**: API REST en Node.js + Express (CRUD de *módulos*).
- **DB**: MySQL 8 con persistencia en volumen.

El backend expone un CRUD completo para `modules` y un endpoint de demo con contador de visitas.

---

## 🧭 Arquitectura

```
[ Navegador ] --HTTP--> [ Frontend (Nginx) :3000 ]
     JS fetch a http://localhost:8080
                          |
                          v
                 [ Backend (Express) :8080 ]
                          |
                   (Docker network)
                          |
                          v
                   [ DB (MySQL) :3306 ]
```

- Compose crea una **red bridge** interna: los servicios se resuelven por nombre (`db`, `backend`, `frontend`).
- **Persistencia**: los datos de MySQL viven en el volumen `db_data`.

---

## ✅ Requisitos

- Docker Desktop (Windows/macOS) o Docker Engine (Linux).
- En Windows: WSL2 recomendado (Ubuntu).
- (Opcional) MySQL Workbench para inspeccionar la base.

---

## 🚀 Puesta en marcha rápida

```bash
git clone https://github.com/AaronAlonsoBlancoRamirez/AppContainerCloud.git
cd <tu-repo>

# compila imágenes y levanta contenedores
docker compose up -d --build

# ver estado y logs
docker compose ps
docker compose logs -f backend
```

Accesos:

- Frontend → **http://localhost:3000**
- API → **http://localhost:8080**
- MySQL para clientes externos → **127.0.0.1:3307**  
  Usuario: `root` · Password: `root` · Base: `appdb`

Detener:

```bash
docker compose down          # conserva datos
# docker compose down -v     # ⚠️ borra el volumen (pierdes la BD)
```

---

## 🗂️ Estructura

```
.
├─ docker-compose.yml
├─ backend/
│  ├─ Dockerfile
│  ├─ package.json
│  └─ server.js
└─ frontend/
   ├─ Dockerfile
   ├─ index.html
   ├─ style.css
   └─ script.js
```

---

## ⚙️ Configuración (resumen)

### `docker-compose.yml`
- **db** (MySQL 8):  
  `MYSQL_ROOT_PASSWORD=root`, `MYSQL_DATABASE=appdb`, puertos `3307:3306`, volumen `db_data:/var/lib/mysql` y *healthcheck*.
- **backend** (Node + Express):  
  build `./backend`, puertos `8080:8080`, variables `DB_HOST=db`, `DB_USER=root`, `DB_PASSWORD=root`, `DB_NAME=appdb`, `PORT=8080`, y `depends_on` (espera a MySQL sano).
- **frontend** (Nginx):  
  build `./frontend`, puertos `3000:80`, depende del backend.

### `backend/Dockerfile`
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY server.js ./
EXPOSE 8080
CMD ["node", "server.js"]
```

### `frontend/Dockerfile`
```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
```

---

## 🧩 Endpoints del backend

- Salud / demo:
  - `GET /api/ping` → `{ ok: true, msg: "pong" }`
  - `GET /api/visitas` → incrementa y devuelve `{ total_visitas: N }`
- CRUD de módulos:
  - `GET    /api/modules`
  - `GET    /api/modules/:id`
  - `POST   /api/modules`
  - `PUT    /api/modules/:id`
  - `DELETE /api/modules/:id`

Ejemplos:
```bash
curl http://localhost:8080/api/modules

curl -X POST http://localhost:8080/api/modules \
  -H "Content-Type: application/json" \
  -d '{"title":"Evaluación final","description":"Trabajo",
       "week":8,"status":"planned"}'

curl -X PUT http://localhost:8080/api/modules/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"done"}'

curl -X DELETE http://localhost:8080/api/modules/1
```

---

## 🧪 Probar el frontend

Abre **http://localhost:3000** y utiliza la interfaz para crear, editar y eliminar módulos.

---

## 🔁 Flujo de desarrollo

- Cambié **frontend** (HTML/CSS/JS) → reconstruir solo frontend:
  ```bash
  docker compose build frontend
  docker compose up -d
  ```
- Modo “en vivo” (opcional) sin reconstruir cada cambio:
  ```yaml
  # en docker-compose.yml
  frontend:
    build: ./frontend
    ports: ["3000:80"]
    volumes:
      - ./frontend:/usr/share/nginx/html
  ```
  > En producción, elimina `volumes` y deja la imagen empaquetada.

---

## 🩺 Troubleshooting

- **Error de puerto 3306 ocupado** en Windows: mantén `3307:3306` (ya configurado) o detén MySQL local.
- **La API no responde**: revisa `docker compose logs -f backend`.  
  Asegúrate de que `db` esté `healthy` y que `DB_HOST=db`.

---

## 📜 Licencia

MIT (ajústala si lo necesitas).

---

## 📎 Enlaces

- Repo: `https://github.com/<tu-usuario>/<tu-repo>` (reemplaza con el real)
- Docker: https://docs.docker.com/
- Express: https://expressjs.com/
- MySQL: https://dev.mysql.com/doc/

> **Nota:** credenciales y puertos son educativos. Para entornos reales, usa variables en `.env` y no publiques secretos.
