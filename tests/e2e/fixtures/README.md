# Fixtures E2E de PulsePass

Datos de prueba mínimos para ejecutar la colección `PulsePass-Manual-E2E` de la Fase 5.

> **Alcance:** este material es exclusivo de la base de datos de pruebas `pulsepass_e2e`.
> Nunca aplique `seed-e2e.sql` ni los procedimientos de esta guía sobre desarrollo, QA o
> producción.

## 1. Aplicación de la semilla

Requisito previo: las migraciones Flyway V1–V4 ya aplicadas (arrancar una vez la aplicación con
`DB_URL` apuntando a `pulsepass_e2e`).

```bash
psql -h localhost -p 5432 -U postgres -d pulsepass_e2e -f tests/e2e/fixtures/seed-e2e.sql
```

El script es idempotente (`ON CONFLICT DO NOTHING`): puede reaplicarse sin duplicar filas.

## 2. Inventario de fixtures

| Fixture | Valor | Variable del ambiente | Uso en la colección |
|---|---|---|---|
| Venue activo | `VEN-E2E-01` (Arena E2E Bogota, capacidad 500) | `venueActiveCode` | eventos, creación de evento |
| Venue activo | `VEN-E2E-02` (Teatro E2E Medellin, capacidad 120) | — | `EVT-E2E-TO-PUBLISH` |
| Venue inactivo | `VEN-E2E-03` (activo = false) | — | casos de regla de negocio de venue inactivo |
| Artistas | migración `V2__insert_initial_artists.sql` (5 artistas activos, p. ej. `Solar Beat`) | `artistId`, `artistStageName` | consultas y asociación a eventos |
| Evento publicado | `EVT-E2E-PUB` (2027-02-20 20:00, `MUSIC`, edad mínima 0) | `publishedEventCode` | compras, listado operativo |
| Evento borrador | `EVT-E2E-DRAFT` (2027-03-15 19:00, `TECHNOLOGY`, edad mínima 18) | `draftEventCode` | visibilidad de borradores |
| Evento por publicar | `EVT-E2E-TO-PUBLISH` (2027-04-10 18:00, `MUSIC`, DRAFT) | `eventToPublishCode` | `PATCH /publish`, asociación de artista |
| Asociación | `EVT-E2E-PUB` ↔ `Solar Beat` | — | `GET /api/events/by-artist` |
| STAFF | `staff.e2e` / `staff.e2e@example.test`, activo, rol `STAFF` | `staffIdentifier`, `staffPassword` | operaciones de tickets |
| ADMIN | `admin.e2e` / `admin.e2e@example.test`, activo, rol `ADMIN` | `adminIdentifier`, `adminPassword` | catálogo de eventos |
| INACTIVE_USER | `inactive.e2e` / `inactive.e2e@example.test`, **inactivo**, rol `USER` | `inactivePassword` | login denegado y `TC-AUTH-013` |

Los identificadores de artista dependen de la secuencia `IDENTITY`: **no los suponga**, léalos de
`GET /api/artists/active` y cópielos a `artistId` / `artistStageName`.

Los eventos del fixture usan fechas futuras (2027) porque el contrato exige `eventDate` posterior a
`now()`. Si la fecha del sistema supera esas fechas, actualice el fixture antes de ejecutar.

## 3. Credenciales de prueba

| Cuenta | Password de prueba | Origen |
|---|---|---|
| `staff.e2e` | `StaffE2ePass2026!` | hash BCrypt (coste 10) en `seed-e2e.sql` |
| `admin.e2e` | `AdminE2ePass2026!` | hash BCrypt (coste 10) en `seed-e2e.sql` |
| `inactive.e2e` | `InactiveE2ePass2026!` | hash BCrypt (coste 10) en `seed-e2e.sql` |

Son credenciales de laboratorio: no protegen datos reales y solo existen en `pulsepass_e2e`.
Los hashes se generaron con el `BCryptPasswordEncoder` de la aplicación. Las cuentas privilegiadas
se provisionan por semilla SQL (nunca por `POST /api/users`, que solo produce `USER`).

## 4. Procedimientos manuales para casos que requieren fixture

### 4.1 `TC-AUTH-010` — JWT expirado

```bash
# 1) Arrancar la aplicación E2E con TTL muy corto
PULSEPASS_JWT_EXPIRATION_SECONDS=10 java -jar target/pulsepass-0.0.1-SNAPSHOT.jar

# 2) Hacer login (Postman: E2E-AUTH-01) y copiar accessToken
# 3) Esperar 15 segundos
# 4) Enviar GET /api/auth/me con ese token → esperado 401
```

Registre el token obtenido solo en memoria; no lo pegue en el repositorio.

### 4.2 `TC-AUTH-011` — JWT firmado con otra clave o issuer

```bash
# 1) Arrancar una segunda instancia con secreto/issuer distintos
PULSEPASS_JWT_SECRET_BASE64="$(openssl rand -base64 48)" \
PULSEPASS_JWT_ISSUER=otro-issuer \
java -jar target/pulsepass-0.0.1-SNAPSHOT.jar --server.port=8081

# 2) Hacer login contra http://localhost:8081 y copiar accessToken
# 3) Enviar GET /api/auth/me contra http://localhost:8080 con ese token → esperado 401
```

Nunca use el secreto real de la aplicación ni claves de producción.

### 4.3 `TC-AUTH-013` — Token previo de una cuenta desactivada

```bash
# 1) Registrar un usuario temporal y hacer login (copiar accessToken)
# 2) Desactivar la cuenta
psql -h localhost -p 5432 -U postgres -d pulsepass_e2e \
  -c "UPDATE users SET active = false WHERE username = 'temporal.e2e';"
# 3) Reenviar GET /api/auth/me con el token anterior → esperado 401 o denegación configurada
```

### 4.4 `TC-SEC-017` — Rol de fixture revocado

```bash
# 1) Login de staff.e2e y copiar el token a staffToken
# 2) Revocar el rol en persistencia
psql -h localhost -p 5432 -U postgres -d pulsepass_e2e \
  -c "DELETE FROM user_roles WHERE role = 'STAFF' AND user_id = (SELECT id FROM users WHERE username = 'staff.e2e');"
# 3) Reenviar una operación de STAFF → 403 si el servidor recarga roles desde persistencia;
#    si las autoridades viajan en los claims del JWT, el token conserva el rol hasta expirar.
```

Al terminar, restaure el rol:

```sql
INSERT INTO user_roles (user_id, role)
SELECT id, 'STAFF' FROM users WHERE username = 'staff.e2e'
ON CONFLICT DO NOTHING;
```

### 4.5 `TC-BIZ-014` y `TC-BIZ-015` — Reglas de negocio

- Compra en evento no publicado: use `{{draftEventCode}}` y espere `409`.
- Evento con venue inactivo: use `VEN-E2E-03` en `POST /api/events` y espere `409`.
- Aforo agotado: solo si reduce `venues.capacity` del venue de prueba por debajo de los tickets
  `PAID` del evento; documente el cambio y restáurelo.

## 5. Datos creados por HTTP

Las requests crean usuarios (`usera.{{runId}}`, `userb.{{runId}}`, `escalada.{{runId}}`), eventos
(`{{newEventCode}}`, `{{newEventCode}}-NEG`, `{{newEventCode}}-SEC`, códigos negativos) y tickets
(`TKT-<UUID>`). Para repetir la ejecución:

1. Restaure la base `pulsepass_e2e` y reaplique la semilla, **o**
2. Cambie `runId` en el ambiente para generar identificadores nuevos.

La limpieza opcional de una corrida concreta:

```sql
-- SOLO pulsepass_e2e; ajuste el runId
DELETE FROM tickets WHERE ticket_code IN (
    SELECT t.ticket_code FROM tickets t JOIN users u ON u.id = t.user_id
    WHERE u.username LIKE '%.e2e01');
DELETE FROM events WHERE event_code LIKE 'EVT-e2e01%';
DELETE FROM users WHERE username LIKE '%.e2e01';
```

Los `DELETE` sobre `users` arrastran perfil, credenciales y roles por las claves foráneas con
`ON DELETE CASCADE`; los tickets deben eliminarse antes porque su FK no es en cascada.

## 6. Reglas de seguridad de los fixtures

- No versionar tokens, contraseñas reales ni el secreto JWT del ambiente.
- No usar datos personales reales: todos los correos usan el dominio reservado `example.test`.
- Prefijar con `runId` cualquier dato creado durante la ejecución para evitar colisiones.
- Verificar el nombre de la base (`pulsepass_e2e`) antes de cualquier operación destructiva.
