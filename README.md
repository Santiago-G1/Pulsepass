# PulsePass

Proyecto academico para eventos, artistas, usuarios y tickets. El backend actual
implementa persistencia; la aplicacion React del frontend vive de forma
independiente en `frontend/` y consume el contrato REST descrito en el PRD de
Frontend. Los endpoints REST y de autenticacion todavía deben implementarse en
el backend para habilitar el flujo de punta a punta.

## Tecnologias

- Java 21
- Spring Boot 4
- Spring Data JPA / Hibernate
- PostgreSQL
- Flyway
- Testcontainers
- Maven

## Backend

El backend usa Java 21, Spring Boot 4, Spring Data JPA, PostgreSQL, Flyway y
Testcontainers. Su alcance actual es persistencia: todavía no incluye
controladores, servicios, DTOs ni autenticación REST.

### Modelo

El dominio contiene `Venue`, `Event`, `Artist`, `User`, `UserProfile` y `Ticket`.
Las relaciones principales son:

```text
Venue 1:N Event
Event N:M Artist
User 1:0..1 UserProfile
User 1:N Ticket
Event 1:N Ticket
```

`Ticket` es una entidad propia porque conserva tipo, precio, estado y fecha de
compra. Los enums se almacenan como texto estable y los precios como `NUMERIC`.

### Estructura

```text
src/
  main/
    java/com/pulsepass/pulsepass/
      domain/           Entidades y enums del dominio
      repository/       Repositories Spring Data JPA
      PulsePassApplication.java
    resources/
      db/migration/     Migraciones Flyway
      application.properties
  test/
    java/com/pulsepass/pulsepass/
      PersistenceIntegrationTest.java

El paquete raiz sigue la misma convencion que el proyecto de referencia
DeepBlue Rescue: `com.<proyecto>.<proyecto>`.
```

### Ejecucion

Configura PostgreSQL o define `DB_URL`, `DB_USER` y `DB_PASSWORD`. Luego ejecuta:

```bash
./mvnw clean test
```

En Windows:

```powershell
.\mvnw.cmd clean test
```

Las pruebas de integracion deben usar PostgreSQL mediante Testcontainers. Hibernate esta configurado con `ddl-auto=validate`; Flyway es responsable de crear y evolucionar el esquema.

Docker debe estar iniciado para ejecutar la suite de integración.

### Migraciones

- `V1__create_schema.sql`: crea tablas, relaciones, constraints e indices.
- `V2__insert_initial_artists.sql`: inserta los cinco artistas del escenario.
- `V3__add_streaming_url_to_event.sql`: agrega `streaming_url` de forma nullable.

### Consultas implementadas

Los repositories incluyen Query Methods para códigos, estados, navegación de
relaciones, tickets de usuarios y conteo de ventas. `EventRepository` incluye
consultas JPQL para eventos por artista, ciudad y artista, y recomendaciones con
`DISTINCT`, filtro case-insensitive y orden cronológico.

## Frontend

La aplicación de usuario está en `frontend/` y sigue el PRD de Frontend de
PulsePass: React, TypeScript estricto, Tailwind CSS v4, React Router, TanStack
Query, Zod y React Hook Form. Las pruebas simulan la API con MSW.

Requiere Node.js 22.22 o superior. Para instalar y ejecutar:

```bash
cd frontend
npm install
npm run dev
```

Vite envía `/api` a `http://localhost:8080` por defecto. Se puede cambiar el
destino con `PULSEPASS_API_URL`; `VITE_API_BASE_URL` permite definir la base de
API para otros entornos. El cliente no incluye datos de demostración ni
simula respuestas del backend.

Verificaciones disponibles:

```bash
npm test
npm run lint
npm run build
```

Variables de entorno:

- `PULSEPASS_API_URL`: destino del proxy de desarrollo de Vite; por defecto `http://localhost:8080`.
- `VITE_API_BASE_URL`: base usada por el cliente HTTP; por defecto `/api`.

Rutas principales:

- `/eventos`, `/artistas`, `/sedes`
- `/login`, `/registro`, `/cuenta`, `/mis-tickets`
- `/staff/validacion`, `/staff/eventos/:eventCode/tickets`
- `/admin/eventos`, `/admin/eventos/nuevo`, `/admin/eventos/:eventCode`