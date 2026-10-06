# 🛡️ Security - Web Platform (Frontend)

Plataforma web administrativa del ecosistema Security. **Next.js (App Router), React y TypeScript.** Consume la API del backend (repositorio **Security-Backend**) para gestionar seguridad, riesgos y operaciones.

## 🏗️ Arquitectura del proyecto

```text
src/
├── app/                    # Enrutamiento de Next.js (App Router)
│   ├── (auth)/             # Rutas públicas (Ej. /login)
│   ├── (dashboard)/        # Rutas privadas (requieren autenticación)
│   │   ├── cursos/ denuncias/ listas-negativas/ matriz-riesgos/
│   │   └── operaciones/ overview/ scoring/
│   ├── globals.css
│   └── layout.tsx & page.tsx
├── modules/                # Componentes y lógica de negocio por dominio
│   └── cursos/ debida_diligencia/ denuncias/ listas_negativas/
│       matrices_riesgo/ motor_reglas/ operaciones/ scoring/
└── shared/                 # Código reutilizable
    ├── api/                # Clientes HTTP (apiClient.ts)
    └── lib/                # Utilidades
```

**Regla de oro:** `app/` solo declara rutas (`page.tsx`) y estructura visual base (`layout.tsx`). Los componentes pesados, formularios, interfaces y estado van en su dominio dentro de `modules/`.

---

## ✅ Antes de empezar: necesitas el backend

La web no funciona sola: todo (incluido el login) lo pide al backend en `http://localhost:8081`. Levántalo desde su repositorio (**Security-Backend**, su README lo explica en 3 comandos):

```bash
git clone https://github.com/jeliases-informaDev/Security-Backend.git
cd Security-Backend
docker compose up -d --build
```

Cuando esté listo, entras a la web con **`superadmin` / `Admin12345!`**. (Si tu equipo tiene un backend compartido, puedes apuntar a él: ver "Configuración".)

## 🛠️ Programar el frontend (recomendado, con recarga en caliente)

Requisitos: **Node.js 20 o superior** (https://nodejs.org).

```bash
git clone https://github.com/jeliases-informaDev/Security-FrontEnd.git
cd Security-FrontEnd
copy .env.example .env.local        # Mac/Linux: cp   (ya apunta a http://localhost:8081/api)
npm install
npm run dev
```

Abre http://localhost:3000.

## 🐳 Alternativa: la web ya compilada con Docker (sin Node)

Para ver la web sin instalar Node ni programar (build de producción, no recarga al editar):

```bash
docker compose up -d --build        # http://localhost:3000
docker compose down                 # apagar
```

## ⚙️ Configuración (opcional)

| Variable | Dónde | Por defecto | Nota |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | `.env.local` (npm) o `.env` (Docker) | `http://localhost:8081/api` | URL del backend **incluyendo `/api`**. Se incrusta al compilar: si la cambias, reinicia `npm run dev` o reconstruye con `docker compose up -d --build`. |
| `WEB_PORT` | `.env` (Docker) | `3000` | Puerto de la web en tu PC. |

> ⚠️ **CORS:** el backend solo acepta peticiones desde `http://localhost:3000`. Si usas otro puerto (porque el 3000 está ocupado), el login fallará con error de red: define `CORS_ALLOWED_ORIGINS=http://localhost:<tu puerto>` en el `.env` del backend y reinícialo.

## 🔧 Problemas comunes

| Síntoma | Solución |
|---|---|
| El login dice error de red / no responde | El backend no está corriendo o aún arranca (1–2 min la primera vez). Comprueba http://localhost:8081/actuator/health: debe decir `UP`. |
| Login falla desde otro puerto (3001…) | CORS: ver la nota de arriba. |
| `port is already allocated` (Docker) | Cambia `WEB_PORT` en `.env`. |
| Usuario o clave "inválidos" con `superadmin` | Usuario y clave deben tener 8–12 caracteres; revisa que el backend se levantó con su compose (crea ese usuario en la base nueva). |

## 🤝 Flujo de trabajo del equipo (Git Flow)

1. Nunca programes ni hagas commits en `main`.
2. Antes de empezar: `git pull origin main`.
3. Crea una rama por tarea: `git checkout -b feature/pantalla-denuncias` (o `fix/boton-login`).
4. Sube tus cambios: `git add . && git commit -m "feat: ..." && git push origin feature/pantalla-denuncias`.
5. Abre un Pull Request en GitHub para revisión.
