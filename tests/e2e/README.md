# PulsePass — Pruebas HTTP end-to-end manuales (Fase 5)

Guía de preparación y ejecución **manual** de la colección Postman de PulsePass.
Cubre las **22 rutas** del contrato (20 de negocio de la Fase 3 + `POST /api/auth/login` y
`GET /api/auth/me` de la Fase 4) contra una aplicación real conectada a PostgreSQL, sin mocks.

> Restricción de la fase: **no hay scripts**. Las pestañas *Pre-request* y *Post-response/Tests*
> de cada request deben permanecer vacías; no se usa Collection Runner, Newman ni Postman CLI.
> Un `2xx` por sí solo no aprueba un caso: hay que inspeccionar el JSON y el efecto de negocio.

## 1. Contenido del directorio

```
tests/e2e/
├── README.md                                  (este documento: preparación y ejecución)
├── postman/
│   ├── PulsePass-Manual-E2E.postman_collection.json   (colección v2.1, 158 requests, sin scripts)
│   └── PulsePass-local.postman_environment.json       (plantilla de variables, sin secretos)
├── fixtures/
│   ├── README.md                              (fixtures, credenciales de prueba y procedimientos)
│   └── seed-e2e.sql                           (datos de prueba; solo base pulsepass_e2e)
├── checklist-e2e-manual.md                    (orden de rutas y escenarios)
├── registro-ejecucion-manual.md               (bitácora diligenciable)
└── .gitignore
```

Carpetas de la colección: `00 Preparación / conectividad`, `01 Venues (2 rutas)`,
`02 Artists (3 rutas)`, `03 Auth / usuarios`, `04 Usuarios / consulta y propiedad (2 rutas)`,
`05 Events / administración y visibilidad (6 rutas)`,
`06 Tickets / compra, consulta y ciclo de vida (6 rutas)`,
`07 Seguridad / escenarios negativos`, `08 Validaciones y errores HTTP`,
`09 Flujos de negocio / secuencia recomendada`.

## 2. Precondiciones bloqueantes

| Requisito | Verificación |
|---|---|
| Java 21 y Maven Wrapper | `./mvnw -v` |
| PostgreSQL accesible | base dedicada `pulsepass_e2e` creada |
| Migraciones Flyway V1–V4 aplicadas | primer arranque de la aplicación sobre la base E2E |
| Fixtures cargados | `fixtures/seed-e2e.sql` aplicado |
| `PULSEPASS_JWT_SECRET_BASE64` aleatorio (≥ 32 bytes) definido en runtime | `openssl rand -base64 48` |
| `GET /api/auth/me` implementado | presente en `AuthController` |
| Credenciales de `staff.e2e` / `admin.e2e` / `inactive.e2e` | `fixtures/README.md` |
| Postman Desktop/Web Agent instalado | importación de la colección y del ambiente |

Si un prerrequisito no se cumple, los casos dependientes se registran como **BLOCKED**
(nunca como PASS y nunca como defecto del producto sin evidencia).

## 3. Preparación del ambiente E2E

### 3.1 Base de datos dedicada

```bash
# PostgreSQL local (o contenedor) escuchando en 5432
createdb -h localhost -p 5432 -U postgres pulsepass_e2e
```

Nunca reutilice la base de desarrollo, QA o producción para estas pruebas.

### 3.2 Secreto JWT exclusivo de E2E

```bash
export PULSEPASS_JWT_SECRET_BASE64="$(openssl rand -base64 48)"
```

No incluya este valor en la colección, en el ambiente exportado ni en capturas de evidencia.

### 3.3 Arranque de la aplicación

```bash
export DB_URL="jdbc:postgresql://localhost:5432/pulsepass_e2e"
export DB_USER=postgres
export DB_PASSWORD=postgres

./mvnw -DskipTests package
java -jar target/pulsepass-0.0.1-SNAPSHOT.jar
```

Al arrancar, Flyway aplica V1–V4. La aplicación queda escuchando en `http://localhost:8080`.

### 3.4 Fixtures

```bash
psql -h localhost -p 5432 -U postgres -d pulsepass_e2e -f tests/e2e/fixtures/seed-e2e.sql
```

El script es idempotente y solo debe ejecutarse sobre `pulsepass_e2e`
(detalle de cada fixture y de las credenciales de prueba en `fixtures/README.md`).

### 3.5 Alternativa sin Docker

Testcontainers/Docker no son necesarios para esta fase. Si el equipo no dispone de Docker ni de
un PostgreSQL instalado, puede usar binarios portables de PostgreSQL:

```bash
mkdir -p /tmp/pg-e2e && cd /tmp/pg-e2e
curl -sSLO https://repo1.maven.org/maven2/io/zonky/test/postgres/embedded-postgres-binaries-linux-amd64/16.15.0/embedded-postgres-binaries-linux-amd64-16.15.0.jar
unzip -o embedded-postgres-binaries-linux-amd64-16.15.0.jar postgres-linux-x86_64.txz
tar -xJf postgres-linux-x86_64.txz
./bin/initdb -D data -U postgres --auth=trust -E UTF8
./bin/pg_ctl -D data -o "-p 5433 -k /tmp/pg-e2e -c listen_addresses=127.0.0.1" -l pg.log start
# crear la base con cualquier cliente JDBC (por ejemplo DBeaver o jshell):
#   CREATE DATABASE pulsepass_e2e;
```

Con esta variante ajuste `DB_URL` a `jdbc:postgresql://127.0.0.1:5433/pulsepass_e2e`.

## 4. Importación y configuración en Postman

1. **Import** → seleccione los dos archivos de `tests/e2e/postman/` (colección y ambiente).
2. Seleccione el ambiente **PulsePass-local** en el selector superior derecho.
3. Abra la pestaña **Environments → PulsePass-local** y complete las variables marcadas como
   *secret* (las que están vacías en la plantilla).
4. Verifique que `baseUrl` apunta a la aplicación E2E y ajuste `runId` si repite la ejecución.
5. Compruebe que ninguna request tenga contenido en *Pre-request* ni en *Post-response/Tests*.

### 4.1 Variables del ambiente

| Variable | Tipo | Origen / uso |
|---|---|---|
| `baseUrl` | default | `http://localhost:8080` o URL del despliegue E2E |
| `runId` | default | identificador alfanumérico elegido antes de comenzar (prefija usuarios y eventos nuevos) |
| `userAUsername`, `userAEmail` | default | datos de registro de USER_A (derivan de `runId`) |
| `userBUsername`, `userBEmail` | default | datos de registro de USER_B (derivan de `runId`) |
| `userAPassword`, `userBPassword` | **secret** | contraseñas locales (12–72 caracteres); no se versionan |
| `adminIdentifier`, `staffIdentifier` | default | identidades de los fixtures privilegiados (`admin.e2e`, `staff.e2e`) |
| `adminPassword`, `staffPassword`, `inactivePassword` | **secret** | contraseñas de fixtures (ver `fixtures/README.md`) |
| `userAToken`, `userBToken`, `adminToken`, `staffToken` | **secret** | se copian a mano desde `accessToken` de cada login |
| `venueActiveCode`, `artistId`, `artistStageName` | default | fixtures verificados con `GET /api/venues/active` y `GET /api/artists/active` |
| `publishedEventCode`, `draftEventCode`, `eventToPublishCode` | default | eventos del fixture |
| `newEventCode` | default | código del evento que crea el ADMIN (`EVT-{{runId}}-NEW`) |
| `ticketCancelableCode`, `ticketUsableCode` | default | se copian a mano desde `ticketCode` de las compras |
| `expectedIssuer` | default | `pulsepass-api` (claim `iss` esperado) |
| `expectedTokenTtlSeconds` | default | `900` (TTL del MVP) |
| `expectedForeignResourceStatus` | default | `403` (política elegida para recursos ajenos, ver §7) |

## 5. Ejecución manual paso a paso

Orden recomendado: **carpeta 00 → 09** (el detalle caso por caso está en
`checklist-e2e-manual.md`; la secuencia de negocio es la de los Flujos A–E).

1. `00 Preparación / conectividad` → `GET /api/venues/active`. Si no responde, detenga la
   ejecución y registre **BLOCKED**.
2. `01`–`02` → catálogos públicos (venues y artistas). Anote `venueActiveCode`, `artistId` y
   `artistStageName` reales en el ambiente.
3. `03 Auth / usuarios` → registre USER_A y USER_B; haga login de los cuatro actores y copie
   `accessToken` a la variable del actor. **Cada request protegida debe declarar su token en la
   pestaña Authorization → Bearer Token** (`{{userAToken}}`, `{{userBToken}}`, `{{staffToken}}`,
   `{{adminToken}}`).
4. `04`–`06` → usuarios, eventos y tickets, en el orden en que aparecen (los casos negativos de
   autorización se ejecutan **antes** de las transiciones de estado).
5. `07` → matriz de seguridad. Las dos primeras requests preparan un ticket `PAID` y un borrador
   aislados: copie el `ticketCode` de `TC-SEC-000A` a `ticketUsableCode` antes de continuar.
6. `08` → validaciones y contrato de errores.
7. `09` → flujos A–E completos en el orden mostrado. Si ya ejecutó las carpetas 03 y 05 con el
   mismo `runId`, **cambie `runId` antes de empezar** (por ejemplo a `e2e02`): los flujos vuelven a
   registrar usuarios y a crear eventos con los mismos códigos. Un `409` por datos repetidos no es
   un defecto; es colisión de datos de la corrida anterior. La carpeta 09 también puede ejecutarse
   sola sobre una base recién sembrada.

Después de **cada** `Send`: inspeccione *Status*, *Headers* y *Body*, y cuando el caso lo indique
haga un `GET` posterior para comprobar el estado persistido. Registre el resultado en
`registro-ejecucion-manual.md`.

### 5.1 Encadenamiento manual de variables

| Se obtiene de | Campo | Se copia a |
|---|---|---|
| `GET /api/venues/active` | `code` del venue elegido | `venueActiveCode` |
| `GET /api/artists/active` | `id` y `stageName` del artista elegido | `artistId`, `artistStageName` |
| `POST /api/auth/login` (cada actor) | `accessToken` | `userAToken`, `userBToken`, `staffToken`, `adminToken` |
| `POST /api/tickets` (compra 1) | `ticketCode` | `ticketCancelableCode` |
| `POST /api/tickets` (compra 2 / `TC-SEC-000A`) | `ticketCode` | `ticketUsableCode` |

Nunca pegue tokens o contraseñas en el repositorio, en la colección exportada ni en capturas.

### 5.2 Expiración del token

El JWT dura 15 minutos. Si una request devuelve `401` con un token que antes funcionaba, repita el
login del actor, actualice su variable de token y vuelva a enviar la request. No registre ese `401`
como defecto.

## 6. Comparación manual de respuestas

### 6.1 Respuestas exitosas

- Código exacto (`200` o `201`, no “2xx” genérico).
- `Content-Type: application/json`.
- Forma JSON según contrato (objeto o arreglo) y campos representativos del DTO real:
  - `VenueResponse`: `id, code, name, city, address, capacity, active`
  - `ArtistResponse`: `id, stageName, country, genre, active`
  - `UserResponse`: `id, username, email, active, firstName, lastName, phone, city, birthDate`
  - `AuthResponse`: `accessToken, tokenType, expiresIn`
  - `AuthenticatedUserResponse`: `id, username, email, roles`
  - `EventResponse`: `id, eventCode, name, description, category, status, eventDate, minimumAge, venueCode, venueName, artists[]`
  - `EventSummaryResponse`: `id, eventCode, name, category, status, eventDate, venueCode, venueName`
  - `TicketResponse`: `id, ticketCode, type, price, status, purchaseDate, userEmail, eventCode, eventName`
- Ausencia de `password`, `passwordHash`, `credential`, `secret` y entidades JPA internas.
- En `POST`, guarde el código/ID devuelto para las consultas posteriores.

Enums reales del código: `EventCategory` = `MUSIC, SPORTS, TECHNOLOGY, EDUCATION, CULTURE,
ENTERTAINMENT`; `EventStatus` = `DRAFT, PUBLISHED, SOLD_OUT, CANCELLED, FINISHED`;
`TicketType` = `GENERAL, VIP, BACKSTAGE, STUDENT`; `TicketStatus` = `RESERVED, PAID, CANCELLED, USED`.

### 6.2 ErrorResponse

Toda respuesta de error debe ser un objeto con cinco campos:

```json
{
  "timestamp": "2026-10-18T21:21:50.097185694",
  "status": 403,
  "error": "Forbidden",
  "message": "<mensaje seguro>",
  "details": {}
}
```

`status` debe coincidir con el código HTTP y no debe haber stack traces, hashes ni secretos.
Si un error se devuelve con otra forma (por ejemplo un JSON reducido sin `timestamp`), anótelo como
divergencia de contrato.

### 6.3 Semántica de códigos esperada

| Código | Cuándo | Ejemplos |
|---|---|---|
| `400` | validación de entrada, enum inválido, JSON malformado, parámetro obligatorio ausente | `TC-HTTP-001`..`TC-HTTP-005`, `TC-HTTP-009`, `TC-HTTP-011` |
| `401` | sin token, token inválido/expirado/alterado, credenciales incorrectas | `TC-AUTH-004`..`TC-AUTH-013` |
| `403` | autenticado sin privilegio suficiente o recurso ajeno | `TC-SEC-001`..`TC-SEC-013`, `TC-AUTH-014` |
| `404` | recurso inexistente | `TC-HTTP-VEN-404`, `TC-HTTP-ART-404`, `TC-HTTP-EVT-404`, `TC-HTTP-TKT-404-CODE` |
| `409` | duplicados y transiciones/reglas de negocio no admitidas | `TC-HTTP-USR-409-*`, `TC-HTTP-EVT-409`, `TC-BIZ-011`, `TC-BIZ-013`, `TC-BIZ-014` |

Los `500` no son un resultado esperado: si aparecen en un escenario nominal, el caso es **FAIL** y
se registra como defecto con su reproducción manual.

## 7. Política de propiedad: 403 o 404

`expectedForeignResourceStatus` = **403**. Se elige 403 (y no 404 anti-enumeración) porque el
contrato de la Fase 4 expone `AccessDeniedException` → `403` mediante el manejador global, y la
matriz de la Fase 5 admite `403/404*` siempre que la política sea explícita y consistente.
Registre en la bitácora el código realmente observado: si el servidor devuelve `200` con datos de
otro usuario, es un hallazgo IDOR crítico, no una variante de política.

## 8. Criterios de resultado

| Resultado | Cuándo marcarlo |
|---|---|
| **PASS** | el código HTTP, la forma/valores del JSON y la condición de negocio o seguridad coinciden con lo esperado, incluida la ausencia o presencia de mutación |
| **FAIL** | cualquiera de las comprobaciones no coincide, o aparece un `500` no esperado |
| **BLOCKED** | no se puede ejecutar por falta de fixture, actor, token o respuesta previa indispensable (p. ej. `TC-AUTH-010`, `TC-AUTH-011`, `TC-AUTH-013` sin generar sus fixtures) |
| **NOT RUN** | caso no ejecutado todavía |

Un caso dependiente bloqueado nunca se contabiliza como aprobado. Para las denegaciones sobre
recursos mutables, la evidencia solo es válida si se relee el recurso con un actor autorizado y se
comprueba que el estado no cambió.

## 9. Repetibilidad y limpieza

Antes de una nueva sesión manual:

1. Restaure únicamente la base `pulsepass_e2e` (verifique el nombre de la base antes de borrar).
2. Deje que Flyway vuelva a aplicar las migraciones en el siguiente arranque.
3. Reaplique `tests/e2e/fixtures/seed-e2e.sql`.
4. Use un `runId` nuevo para no colisionar con usuarios/eventos creados en la corrida anterior.
5. Vacíe los valores de tokens y contraseñas del ambiente local.

```sql
-- SOLO sobre pulsepass_e2e
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

Alternativamente, cambie `runId` y prepare recursos nuevos; nunca elimine datos de otras bases.

## 10. Matriz de cobertura: 22 rutas y roles

| # | Caso base | Método y ruta | Éxito | Roles probados |
|---|---|---|---|---|
| 1 | E2E-VEN-01 | `GET /api/venues/{code}` | 200 | ANONYMOUS |
| 2 | E2E-VEN-02 | `GET /api/venues/active` | 200 | ANONYMOUS |
| 3 | E2E-ART-01 | `GET /api/artists/{id}` | 200 | ANONYMOUS |
| 4 | E2E-ART-02 | `GET /api/artists/by-stage-name?stageName=` | 200 | ANONYMOUS |
| 5 | E2E-ART-03 | `GET /api/artists/active` | 200 | ANONYMOUS |
| 6 | E2E-USR-01 | `POST /api/users` | 201 | ANONYMOUS (crea USER) |
| 7 | E2E-USR-02 | `GET /api/users/by-email?email=` | 200 | USER propietario, ADMIN, USER ajeno (403) |
| 8 | E2E-USR-03 | `GET /api/users/by-username?username=` | 200 | USER propietario, USER ajeno (403) |
| 9 | E2E-EVT-01 | `POST /api/events` | 201 | ADMIN, STAFF (403), USER (403), ANONYMOUS (401) |
| 10 | E2E-EVT-02 | `GET /api/events/{eventCode}` | 200 | ANONYMOUS (borrador 403), ADMIN/STAFF (200) |
| 11 | E2E-EVT-03 | `GET /api/events/published` | 200 | ANONYMOUS |
| 12 | E2E-EVT-04 | `PATCH /api/events/{eventCode}/publish` | 200 | ADMIN, STAFF (403), USER (403) |
| 13 | E2E-EVT-05 | `POST /api/events/{eventCode}/artists/{artistId}` | 200 | ADMIN, USER (403) |
| 14 | E2E-EVT-06 | `GET /api/events/by-artist?stageName=` | 200 | ANONYMOUS (solo publicados) |
| 15 | E2E-TKT-01 | `POST /api/tickets` | 201 | USER propietario, USER con email ajeno (403) |
| 16 | E2E-TKT-02 | `GET /api/tickets/{ticketCode}` | 200 | USER propietario, USER ajeno (403) |
| 17 | E2E-TKT-03 | `GET /api/tickets/by-user?email=` | 200 | USER propietario, USER ajeno (403) |
| 18 | E2E-TKT-04 | `GET /api/events/{eventCode}/tickets/paid` | 200 | STAFF, USER (403) |
| 19 | E2E-TKT-05 | `PATCH /api/tickets/{ticketCode}/cancel` | 200 | USER propietario, USER ajeno (403), repetición (409) |
| 20 | E2E-TKT-06 | `PATCH /api/tickets/{ticketCode}/use` | 200 | STAFF, USER (403), repetición (409) |
| 21 | E2E-AUTH-01 | `POST /api/auth/login` | 200 | ANONYMOUS (credenciales correctas/incorrectas) |
| 22 | E2E-AUTH-02 | `GET /api/auth/me` | 200 | USER, STAFF, ADMIN, ANONYMOUS (401) |

## 11. Trazabilidad requisito → evidencia

| Requisito | Evidencia manual |
|---|---|
| FR-E2E-001/002 | colección importada, ambiente seleccionado y variables editables |
| FR-E2E-003/004 | logins por actor y `/api/auth/me` con cada token |
| FR-E2E-005/006 | HTTP/JSON esperado por request y códigos copiados entre solicitudes |
| FR-E2E-007/008 | casos 401/403/propiedad y relecturas de estado posteriores |
| FR-E2E-009 | inspección de los cinco campos de `ErrorResponse` |
| FR-E2E-010/016 | `fixtures/README.md` y sección 9 de este README |
| FR-E2E-011/012 | `checklist-e2e-manual.md` y `registro-ejecucion-manual.md` |
| FR-E2E-013 | archivos exportados sin tokens ni contraseñas |
| FR-E2E-014/015 | defectos y casos `BLOCKED` registrados en la bitácora |
| FR-E2E-017 | cuerpos y consultas alineados con los DTO reales del código |
