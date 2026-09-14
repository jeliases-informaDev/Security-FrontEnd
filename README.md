# 🛡️ Security - Web Platform (Frontend)

Este repositorio contiene la plataforma web administrativa del ecosistema Security. Está construida con **Next.js (App Router), React y TypeScript**, y se encarga de consumir la API del backend para gestionar de forma visual la seguridad, los riesgos y las operaciones.

## 🏗️ Arquitectura del Proyecto

El proyecto sigue una estructura altamente modular para mantener la interfaz escalable y ordenada, separando estrictamente el enrutamiento de la lógica de negocio. 

```text
src/
├── app/                    # Enrutamiento de Next.js (App Router)
│   ├── (auth)/             # Rutas públicas (Ej. /login)
│   ├── (dashboard)/        # Rutas privadas (Requieren autenticación)
│   │   ├── cursos/
│   │   ├── denuncias/
│   │   ├── listas-negativas/
│   │   ├── matriz-riesgos/
│   │   ├── operaciones/
│   │   ├── overview/
│   │   └── scoring/
│   ├── globals.css         # Estilos globales de Tailwind/CSS
│   └── layout.tsx & page.tsx
├── modules/                # Componentes y lógica de negocio por dominio
│   ├── cursos/
│   ├── debida_diligencia/
│   ├── denuncias/
│   ├── listas_negativas/
│   ├── matrices_riesgo/
│   ├── motor_reglas/
│   ├── operaciones/
│   └── scoring/
└── shared/                 # Código reutilizable en toda la aplicación
    ├── api/                # Clientes Axios/Fetch (Ej. apiClient.ts)
    └── lib/                # Utilidades y funciones de soporte

```
Regla de oro para el equipo: La carpeta app/ solo debe utilizarse para declarar las rutas (page.tsx) y la estructura visual base (layout.tsx). Todos los componentes pesados, formularios, interfaces y lógica de estado deben programarse dentro de su respectivo dominio en la carpeta modules/.

🛑 ALTO: Requisitos Previos (Instalaciones necesarias)
Para que este proyecto funcione en tu computadora, debes tener instalado lo siguiente:

Node.js (v18 o superior): Descárgalo desde nodejs.org. Esto instalará automáticamente npm.

Visual Studio Code: El editor recomendado para trabajar con React.

🛠️ Paso a paso para levantar el proyecto localmente
Paso 1:

Clonar el proyecto
Abre tu terminal y descarga el código fuente:

Bash
git clone [https://github.com/jeliases-informaDev/Security-FrontEnd.git](https://github.com/jeliases-informaDev/Security-FrontEnd.git)
cd security-web


Paso 2:

Instalar las dependencias
A diferencia del backend, aquí sí usamos Node. Ejecuta este comando para descargar todas las librerías (React, Next, utilidades visuales) definidas en el package.json:

Bash
npm install
(Este paso creará una carpeta llamada node_modules que pesa bastante; no te preocupes, está ignorada en Git y no se subirá).

Paso 3:

Configurar variables de entorno (Opcional por ahora)
Crea un archivo llamado .env.local en la raíz del proyecto (al mismo nivel que el package.json). Aquí definiremos la ruta para conectar con el backend de Kotlin:

Fragmento de código
NEXT_PUBLIC_API_URL=http://localhost:8081

Paso 4: 

evantar el servidor de desarrollo
Una vez finalizada la instalación de paquetes, arranca el proyecto con este comando:

Bash
npm run dev


✅ ¿Cómo sé que funcionó?
La consola te indicará que el servidor compiló exitosamente. Abre tu navegador web y entra a http://localhost:3000. Verás la pantalla inicial de la plataforma.

🤝 Flujo de Trabajo para el Equipo (Git Flow)
Para evitar sobrescribir el trabajo de otros compañeros, seguiremos estas reglas estrictas:

Nunca programes ni hagas commits en la rama main.

Antes de empezar tu día, actualiza tu código: git pull origin main.

Crea una rama para la pantalla o componente que vayas a hacer: git checkout -b feature/pantalla-denuncias o fix/boton-login.

Haz tus cambios y súbelos a tu rama:

Bash
git add .
git commit -m "feat: agrega diseño base del dashboard de operaciones"
git push origin feature/pantalla-denuncias
En GitHub, crea un Pull Request (PR) para unir tu código con la rama principal después de una revisión.
