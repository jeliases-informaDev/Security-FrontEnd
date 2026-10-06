# Imagen del frontend para uso local con Docker (la usa docker-compose.yml de este repo).
# Es un build de produccion: arranca rapido pero NO recarga al editar codigo.
# Si vas a trabajar en el frontend, usa  npm run dev  en tu maquina (ver README.md).
FROM node:22-alpine
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Next.js incrusta NEXT_PUBLIC_* al compilar, asi que la URL se fija aqui. La llama el NAVEGADOR,
# por eso es localhost y no el nombre interno del contenedor.
ARG NEXT_PUBLIC_API_URL=http://localhost:8081/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "3000"]
