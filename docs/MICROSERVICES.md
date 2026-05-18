# Filmoteca Microservices Architecture

## Overview

La aplicación web de Filmoteca ha sido refactorizada de un monolito (`web/backend`) a una arquitectura de microservicios independientes que se comunican entre sí.

## Services

### 1. **API Gateway** (`web/gateway`)
- **Puerto**: 3000
- **Descripción**: Punto de entrada único para la aplicación
- **Responsabilidades**:
  - Servir archivos estáticos del frontend (`web/frontend/public`)
  - Servir imágenes de portadas (`/posters/*`)
  - Enrutar peticiones API a los microservicios correspondientes
  - CORS y configuración de cabeceras
- **Variables de entorno**:
  - `DATABASE_URL`: URL del servicio de base de datos (default: `http://localhost:3003`)
  - `AUTH_URL`: URL del servicio de autenticación (default: `http://localhost:3001`)
  - `I18N_URL`: URL del servicio de internacionalización (default: `http://localhost:3002`)

### 2. **Database Service** (`web/database`)
- **Puerto**: 3003
- **Descripción**: Gestor de la base de datos SQLite de Filmoteca
- **Responsabilidades**:
  - Exponer API REST para operaciones CRUD de películas
  - Gestionar géneros, países, atributos de películas
  - Estadísticas y reportes
  - Health check
- **Rutas principales**:
  - `GET /database/health` - Health check
  - `GET /database/api/get_all_genres` - Obtener todos los géneros
  - `GET /database/api/last_movies` - Películas más recientes
  - `GET /database/api/search_movies` - Búsqueda de películas
  - `GET /database/api/get_movie` - Detalles de una película
  - `PUT /database/api/modify_movie` - Actualizar película
  - `DELETE /database/api/delete_movie` - Eliminar película
  - `GET /database/api/stats/summary` - Estadísticas generales
- **Variables de entorno**:
  - `DB_PATH`: Ruta de la base de datos SQLite (default: `../../data/filmoteca.db`)
  - `QUERIES_PATH`: Ruta al archivo de queries en JSON (default: `./queries.json`)

### 3. **Auth Service** (`web/auth`)
- **Puerto**: 3001
- **Descripción**: Servicio de autenticación (reservado para expansión futura)
- **Responsabilidades** (futuro):
  - Autenticación de usuarios
  - JWT tokens
  - OAuth integrations
  - 2FA
- **Rutas actuales**:
  - `GET /auth/health` - Health check

### 4. **i18n Service** (`web/i18n`)
- **Puerto**: 3002
- **Descripción**: Servicio de internacionalización y traducciones
- **Responsabilidades**:
  - Servir archivos de traducciones
  - Gestionar idiomas disponibles
  - Cambiar idioma de la sesión
- **Rutas principales**:
  - `GET /i18n/health` - Health check
  - `GET /i18n/available-languages` - Idiomas disponibles
  - `GET /i18n/translations` - Obtener traducciones
  - `POST /i18n/change-language` - Cambiar idioma
  - `GET /i18n/locales/:language.json` - Archivo de traducciones

## Shared Configuration

### `web/shared/fastify-config.js`

Configuración centralizada de Fastify reutilizada por todos los microservicios:
- Logger configuration
- CORS setup
- Error handling
- Request/Response logging (solo gateway)

## API Routing

El Gateway (puerto 3000) enruta las peticiones así:

```
/api/database/* → Database Service (3003)
/api/auth/*     → Auth Service (3001)
/api/i18n/*     → i18n Service (3002)
```

## Starting Services

### Desarrollo Local (cada microservicio en su terminal)

```bash
# Terminal 1 - Database Service
cd web/database
npm install
npm run dev

# Terminal 2 - Auth Service
cd web/auth
npm install
npm run dev

# Terminal 3 - i18n Service
cd web/i18n
npm install
npm run dev

# Terminal 4 - API Gateway (después de que los otros estén listos)
cd web/gateway
npm install
npm run dev
```

### Con Docker Compose (futura implementación)

```bash
docker-compose up
```

## Database Setup

El servicio de base de datos carga queries desde `web/database/queries.json`. Este archivo contiene todas las consultas SQL etiquetadas que la aplicación necesita.

### Locales (Traducciones)

Los archivos de traducción están en `web/i18n/locales/`:
- `en.json` - English
- `es.json` - Español
- `ja.json` - 日本語

## Frontend Integration

El frontend se sirve desde el Gateway (puerto 3000):
- Archivos estáticos: `web/frontend/public/*`
- Imágenes de portadas: `web/frontend/public/assets/posters/*`

Las peticiones a `/api/*` se enrutan automáticamente a los microservicios.

## Architecture Benefits

1. **Escalabilidad**: Cada servicio puede escalarse independientemente
2. **Mantenibilidad**: Código separado por dominio
3. **Reusabilidad**: Configuración compartida mediante `fastify-config.js`
4. **Testing**: Servicios pueden testearse aisladamente
5. **Deployment**: Cada servicio puede deployarse independientemente

## Future Enhancements

- [ ] Implementar autenticación real en `web/auth`
- [ ] Agregar caché distribuido (Redis)
- [ ] Service discovery automático
- [ ] API versioning
- [ ] Rate limiting por servicio
- [ ] Distributed logging (ELK/Loki)
- [ ] Métricas y monitoreo (Prometheus)
