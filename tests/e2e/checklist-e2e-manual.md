# PulsePass — Checklist de ejecución manual (Fase 5)

Orden de rutas y escenarios de `PulsePass-Manual-E2E.postman_collection.json`.
Marque cada casilla únicamente después de inspeccionar *Status*, *Headers*, *Body* y, cuando
aplique, el `GET` posterior de comprobación. Los resultados se registran en
`registro-ejecucion-manual.md`.

Recordatorios: sin scripts en Pre-request/Post-response · sin Collection Runner · tokens
copiados a mano a las variables del ambiente · un `2xx` no basta para aprobar.

Nota sobre `runId`: las carpetas 03, 05 y 09 crean usuarios y eventos con identificadores
derivados de `runId`. Si ejecuta la carpeta 09 en la misma sesión que 03 y 05, cambie `runId`
(por ejemplo a `e2e02`) antes de empezar 09; un `409` por datos ya existentes es colisión de
la corrida anterior y no un defecto. También puede ejecutar 09 sola sobre una base recién
sembrada.

## 00 Preparación / conectividad

| ✓ | Caso | Método y ruta | Actor | HTTP esperado |
|---|---|---|---|---|
| [x] | PRE-01 | `GET /api/venues/active` | ANONYMOUS | 200 |

## 01 Venues (2 rutas)

| ✓ | Caso | Método y ruta | Actor | HTTP esperado |
|---|---|---|---|---|
| [x] | E2E-VEN-01 / TC-BIZ-001 | `GET /api/venues/{{venueActiveCode}}` | ANONYMOUS | 200 |
| [x] | TC-HTTP-VEN-404 | `GET /api/venues/{{runId}}-NOEXISTE` | ANONYMOUS | 404 |
| [x] | E2E-VEN-02 / TC-BIZ-001 | `GET /api/venues/active` | ANONYMOUS | 200 |

## 02 Artists (3 rutas)

| ✓ | Caso | Método y ruta | Actor | HTTP esperado |
|---|---|---|---|---|
| [x] | E2E-ART-01 / TC-BIZ-002 | `GET /api/artists/{{artistId}}` | ANONYMOUS | 200 |
| [x] | E2E-ART-02 / TC-BIZ-002 | `GET /api/artists/by-stage-name?stageName=` | ANONYMOUS | 200 |
| [x] | E2E-ART-03 / TC-BIZ-002 | `GET /api/artists/active` | ANONYMOUS | 200 |
| [x] | TC-HTTP-ART-404 | `GET /api/artists/999999` | ANONYMOUS | 404 |

## 03 Auth / usuarios (registro, login, me)

| ✓ | Caso | Método y ruta | Actor | HTTP esperado |
|---|---|---|---|---|
| [x] | E2E-USR-01 / TC-AUTH-001 / TC-BIZ-006 | `POST /api/users` | ANONYMOUS | 201 |
| [x] | E2E-USR-01-B / TC-BIZ-006 | `POST /api/users` | ANONYMOUS | 201 |
| [x] | TC-HTTP-USR-409-EMAIL | `POST /api/users` | ANONYMOUS | 409 |
| [x] | TC-HTTP-USR-409-USERNAME | `POST /api/users` | ANONYMOUS | 409 |
| [x] | E2E-AUTH-01 / TC-AUTH-002 | `POST /api/auth/login` | ANONYMOUS | 200 |
| [x] | TC-AUTH-003 | `POST /api/auth/login` | ANONYMOUS | 200 |
| [x] | E2E-AUTH-01-B | `POST /api/auth/login` | ANONYMOUS | 200 |
| [x] | E2E-AUTH-01-STAFF | `POST /api/auth/login` | ANONYMOUS | 200 |
| [x] | E2E-AUTH-01-ADMIN | `POST /api/auth/login` | ANONYMOUS | 200 |
| [x] | TC-AUTH-004 | `POST /api/auth/login` | ANONYMOUS | 401 |
| [x] | TC-AUTH-005 | `POST /api/auth/login` | ANONYMOUS | 401 |
| [x] | TC-AUTH-013-LOGIN | `POST /api/auth/login` | ANONYMOUS | 401 |
| [x] | E2E-AUTH-02 / TC-AUTH-006 | `GET /api/auth/me` | USER_A ({{userAToken}}) | 200 |
| [x] | TC-AUTH-006-B | `GET /api/auth/me` | USER_B ({{userBToken}}) | 200 |
| [x] | TC-AUTH-006-STAFF | `GET /api/auth/me` | STAFF ({{staffToken}}) | 200 |
| [x] | TC-AUTH-006-ADMIN | `GET /api/auth/me` | ADMIN ({{adminToken}}) | 200 |

## 04 Usuarios / consulta y propiedad (2 rutas)

| ✓ | Caso | Método y ruta | Actor | HTTP esperado |
|---|---|---|---|---|
| [x] | E2E-USR-02 / TC-BIZ-006 | `GET /api/users/by-email?email=` | USER_A ({{userAToken}}) | 200 |
| [x] | TC-SEC-006 | `GET /api/users/by-email?email=` | USER_B ({{userBToken}}) | 403 |
| [x] | E2E-USR-03 / TC-BIZ-006 | `GET /api/users/by-username?username=` | USER_A ({{userAToken}}) | 200 |
| [x] | TC-SEC-007 | `GET /api/users/by-username?username=` | USER_B ({{userBToken}}) | 403 |
| [x] | E2E-USR-02-ADMIN / TC-SEC-015 | `GET /api/users/by-email?email=` | ADMIN ({{adminToken}}) | 200 |
| [x] | TC-HTTP-USR-404 | `GET /api/users/by-email?email=` | USER_A ({{userAToken}}) | 404 |

## 05 Events / administración y visibilidad (6 rutas)

| ✓ | Caso | Método y ruta | Actor | HTTP esperado |
|---|---|---|---|---|
| [x] | E2E-EVT-01 / TC-BIZ-003 | `POST /api/events` | ADMIN ({{adminToken}}) | 201 |
| [x] | TC-SEC-001-A | `POST /api/events` | ANONYMOUS | 401 |
| [x] | TC-SEC-001-B / TC-AUTH-014 | `POST /api/events` | USER_A ({{userAToken}}) | 403 |
| [x] | TC-SEC-001-C | `POST /api/events` | STAFF ({{staffToken}}) | 403 |
| [x] | E2E-EVT-02-OPS / TC-SEC-015 | `GET /api/events/{{eventToPublishCode}}` | ADMIN ({{adminToken}}) | 200 |
| [x] | E2E-EVT-02-OPS-STAFF | `GET /api/events/{{draftEventCode}}` | STAFF ({{staffToken}}) | 200 |
| [x] | E2E-EVT-02 / TC-SEC-004 | `GET /api/events/{{draftEventCode}}` | ANONYMOUS | 403 |
| [x] | E2E-EVT-03 / TC-SEC-005 | `GET /api/events/published` | ANONYMOUS | 200 |
| [x] | E2E-EVT-04 / TC-BIZ-004 | `PATCH /api/events/{{eventToPublishCode}}/publish` | ADMIN ({{adminToken}}) | 200 |
| [x] | TC-SEC-002-A | `PATCH /api/events/{{newEventCode}}/publish` | USER_A ({{userAToken}}) | 403 |
| [x] | TC-SEC-002-B | `PATCH /api/events/{{newEventCode}}/publish` | STAFF ({{staffToken}}) | 403 |
| [x] | E2E-EVT-05 / TC-BIZ-005 | `POST /api/events/{{eventToPublishCode}}/artists/{{artistId}}` | ADMIN ({{adminToken}}) | 200 |
| [x] | TC-SEC-003 | `POST /api/events/{{newEventCode}}/artists/{{artistId}}` | USER_A ({{userAToken}}) | 403 |
| [x] | E2E-EVT-05-REPEAT | `POST /api/events/{{eventToPublishCode}}/artists/{{artistId}}` | ADMIN ({{adminToken}}) | 409 |
| [x] | E2E-EVT-06 / TC-BIZ-005 / TC-SEC-005 | `GET /api/events/by-artist?stageName=` | ANONYMOUS | 200 |
| [x] | E2E-EVT-04-VERIFY / FR-E2E-008 | `GET /api/events/published` | ANONYMOUS | 200 |
| [x] | TC-HTTP-EVT-404 | `GET /api/events/{{runId}}-NOEXISTE` | ANONYMOUS | 404 |

## 06 Tickets / compra, consulta y ciclo de vida (6 rutas)

| ✓ | Caso | Método y ruta | Actor | HTTP esperado |
|---|---|---|---|---|
| [x] | E2E-TKT-01 / TC-BIZ-007 | `POST /api/tickets` | USER_A ({{userAToken}}) | 201 |
| [x] | E2E-TKT-01-B / TC-BIZ-007 | `POST /api/tickets` | USER_A ({{userAToken}}) | 201 |
| [x] | TC-SEC-008 / AC-05 | `POST /api/tickets` | USER_A ({{userAToken}}) | 403 |
| [x] | TC-BIZ-014 | `POST /api/tickets` | USER_A ({{userAToken}}) | 409 |
| [x] | E2E-TKT-02 / TC-BIZ-008 | `GET /api/tickets/{{ticketCancelableCode}}` | USER_A ({{userAToken}}) | 200 |
| [x] | TC-SEC-009 | `GET /api/tickets/{{ticketCancelableCode}}` | USER_B ({{userBToken}}) | 403 |
| [x] | E2E-TKT-03 / TC-BIZ-008 | `GET /api/tickets/by-user?email=` | USER_A ({{userAToken}}) | 200 |
| [x] | TC-SEC-010 | `GET /api/tickets/by-user?email=` | USER_B ({{userBToken}}) | 403 |
| [x] | E2E-TKT-04 / TC-BIZ-009 / TC-SEC-014 | `GET /api/events/{{publishedEventCode}}/tickets/paid` | STAFF ({{staffToken}}) | 200 |
| [x] | TC-SEC-013 | `GET /api/events/{{publishedEventCode}}/tickets/paid` | USER_A ({{userAToken}}) | 403 |
| [x] | TC-SEC-011 / AC-04 | `PATCH /api/tickets/{{ticketUsableCode}}/cancel` | USER_B ({{userBToken}}) | 403 |
| [x] | E2E-TKT-05 / TC-BIZ-010 | `PATCH /api/tickets/{{ticketCancelableCode}}/cancel` | USER_A ({{userAToken}}) | 200 |
| [x] | TC-BIZ-011 | `PATCH /api/tickets/{{ticketCancelableCode}}/cancel` | USER_A ({{userAToken}}) | 409 |
| [x] | E2E-TKT-05-VERIFY / FR-E2E-008 | `GET /api/tickets/{{ticketCancelableCode}}` | USER_A ({{userAToken}}) | 200 |
| [x] | TC-SEC-012 / AC-04 | `PATCH /api/tickets/{{ticketUsableCode}}/use` | USER_B ({{userBToken}}) | 403 |
| [x] | E2E-TKT-06 / TC-BIZ-012 / TC-SEC-014 | `PATCH /api/tickets/{{ticketUsableCode}}/use` | STAFF ({{staffToken}}) | 200 |
| [x] | TC-BIZ-013 | `PATCH /api/tickets/{{ticketUsableCode}}/use` | STAFF ({{staffToken}}) | 409 |
| [x] | E2E-TKT-06-VERIFY / FR-E2E-008 | `GET /api/tickets/{{ticketUsableCode}}` | STAFF ({{staffToken}}) | 200 |
| [x] | TC-HTTP-TKT-404-CODE | `GET /api/tickets/{{runId}}-NOEXISTE` | USER_A ({{userAToken}}) | 404 |

## 07 Seguridad / escenarios negativos

| ✓ | Caso | Método y ruta | Actor | HTTP esperado |
|---|---|---|---|---|
| [x] | TC-SEC-000A | `POST /api/tickets` | USER_A ({{userAToken}}) | 201 |
| [x] | TC-SEC-000B | `POST /api/events` | ADMIN ({{adminToken}}) | 201 |
| [x] | TC-AUTH-007 | `GET /api/auth/me` | ANONYMOUS | 401 |
| [x] | TC-AUTH-008 | `GET /api/auth/me` | Authorization: Bearer no-es-un-jwt | 401 |
| [x] | TC-AUTH-009 | `GET /api/auth/me` | Authorization: Bearer <token alterado manualmente> | 401 |
| [x] | TC-AUTH-010 | `GET /api/auth/me` | Authorization: Bearer <token expirado> | 401 |
| [x] | TC-AUTH-011 | `GET /api/auth/me` | Authorization: Bearer <token de otra clave> | 401 |
| [x] | TC-AUTH-012 | `GET /api/auth/me?access_token=` | Sin Authorization; token en ?access_token= | 401 |
| [x] | TC-AUTH-013 | `GET /api/auth/me` | Authorization: Bearer <token previo a la desactivación> | 401 |
| [x] | TC-AUTH-014 | `POST /api/events` | USER_A ({{userAToken}}) | 403 |
| [x] | TC-AUTH-015 | `GET /api/venues/active` | Authorization: Bearer token-invalido | 200 |
| [x] | TC-SEC-002-A | `PATCH /api/events/{{newEventCode}}-SEC/publish` | USER_A ({{userAToken}}) | 403 |
| [x] | TC-SEC-002-B | `PATCH /api/events/{{newEventCode}}-SEC/publish` | STAFF ({{staffToken}}) | 403 |
| [x] | TC-SEC-003 | `POST /api/events/{{newEventCode}}-SEC/artists/{{artistId}}` | USER_A ({{userAToken}}) | 403 |
| [x] | TC-SEC-004 (duplicado de 05 para la matriz de seguridad) | `GET /api/events/{{draftEventCode}}` | ANONYMOUS | 403 |
| [x] | TC-SEC-005 (duplicado de 05) | `GET /api/events/by-artist?stageName=` | ANONYMOUS | 200 |
| [x] | TC-SEC-006 (duplicado de 04) | `GET /api/users/by-email?email=` | USER_B ({{userBToken}}) | 403 |
| [x] | TC-SEC-007 (duplicado de 04) | `GET /api/users/by-username?username=` | USER_B ({{userBToken}}) | 403 |
| [x] | TC-SEC-008 (duplicado de 06) | `POST /api/tickets` | USER_A ({{userAToken}}) | 403 |
| [x] | TC-SEC-009 (duplicado de 06) | `GET /api/tickets/{{ticketCancelableCode}}` | USER_B ({{userBToken}}) | 403 |
| [x] | TC-SEC-010 (duplicado de 06) | `GET /api/tickets/by-user?email=` | USER_B ({{userBToken}}) | 403 |
| [x] | TC-SEC-011 (duplicado de 06) | `PATCH /api/tickets/{{ticketUsableCode}}/cancel` | USER_B ({{userBToken}}) | 403 |
| [x] | TC-SEC-012 (duplicado de 06) | `PATCH /api/tickets/{{ticketUsableCode}}/use` | USER_B ({{userBToken}}) | 403 |
| [x] | TC-SEC-013 (duplicado de 06) | `GET /api/events/{{publishedEventCode}}/tickets/paid` | USER_A ({{userAToken}}) | 403 |
| [x] | TC-SEC-014 (duplicado de 06) | `PATCH /api/tickets/{{ticketUsableCode}}/use` | STAFF ({{staffToken}}) | 200 |
| [x] | TC-SEC-015 (duplicado de 05) | `GET /api/events/{{draftEventCode}}` | ADMIN ({{adminToken}}) | 200 |
| [x] | TC-SEC-016 / AC-03 | `POST /api/users` | ANONYMOUS | 201 |
| [x] | TC-SEC-016-VERIFY | `GET /api/auth/me` | Authorization: Bearer <token de escalada.{{runId}}> | 200 |
| [x] | TC-SEC-017 | `POST /api/events` | STAFF ({{staffToken}}) | 403 |

## 08 Validaciones y errores HTTP

| ✓ | Caso | Método y ruta | Actor | HTTP esperado |
|---|---|---|---|---|
| [x] | TC-HTTP-001 | `POST /api/users` | ANONYMOUS | 400 |
| [x] | TC-HTTP-002 | `POST /api/users` | ANONYMOUS | 400 |
| [x] | TC-HTTP-003 | `POST /api/users` | ANONYMOUS | 400 |
| [x] | TC-HTTP-004 | `POST /api/events` | ADMIN ({{adminToken}}) | 400 |
| [x] | TC-HTTP-005 | `POST /api/events` | ADMIN ({{adminToken}}) | 400 |
| [x] | TC-HTTP-006 | `POST /api/events` | ADMIN ({{adminToken}}) | 409 |
| [x] | TC-HTTP-007 / TC-BIZ-015 | `POST /api/events` | ADMIN ({{adminToken}}) | 409 |
| [x] | TC-HTTP-008 | `POST /api/events` | ADMIN ({{adminToken}}) | 404 |
| [x] | TC-HTTP-009 | `POST /api/tickets` | USER_A ({{userAToken}}) | 400 |
| [x] | TC-HTTP-010 | `POST /api/tickets` | USER_A ({{userAToken}}) | 404 |
| [x] | TC-HTTP-011 | `GET /api/tickets/by-user` | USER_A ({{userAToken}}) | 400 |
| [x] | TC-HTTP-012 | `GET /api/events/{{runId}}-NOEXISTE` | ANONYMOUS | 404 |
| [x] | TC-HTTP-013 | `POST /api/users` | ANONYMOUS | 409 |

## 09 Flujos de negocio / secuencia recomendada

| ✓ | Caso | Método y ruta | Actor | HTTP esperado |
|---|---|---|---|---|
| [x] | FLUJO-A.1 (§9.1) | `GET /api/venues/active` | ANONYMOUS | 200 |
| [x] | FLUJO-A.2 (§9.1) | `GET /api/venues/{{venueActiveCode}}` | ANONYMOUS | 200 |
| [x] | FLUJO-A.3 (§9.1) | `GET /api/artists/active` | ANONYMOUS | 200 |
| [x] | FLUJO-A.4 (§9.1) | `GET /api/artists/{{artistId}}` | ANONYMOUS | 200 |
| [x] | FLUJO-A.5 (§9.1) | `GET /api/artists/by-stage-name?stageName=` | ANONYMOUS | 200 |
| [x] | FLUJO-A.6 (§9.1) | `GET /api/events/published` | ANONYMOUS | 200 |
| [x] | FLUJO-A.7 (§9.1) | `GET /api/events/{{publishedEventCode}}` | ANONYMOUS | 200 |
| [x] | FLUJO-A.8 (§9.1) | `GET /api/events/{{draftEventCode}}` | ANONYMOUS | 403 |
| [x] | FLUJO-A.9 (§9.1) | `GET /api/events/by-artist?stageName=` | ANONYMOUS | 200 |
| [x] | FLUJO-B.1 (§9.2) | `POST /api/users` | ANONYMOUS | 201 |
| [x] | FLUJO-B.2 (§9.2) | `POST /api/users` | ANONYMOUS | 201 |
| [x] | FLUJO-B.3 (§9.2) | `POST /api/auth/login` | ANONYMOUS | 200 |
| [x] | FLUJO-B.4 (§9.2) | `POST /api/auth/login` | ANONYMOUS | 200 |
| [x] | FLUJO-B.5 (§9.2) | `POST /api/auth/login` | ANONYMOUS | 200 |
| [x] | FLUJO-B.6 (§9.2) | `POST /api/auth/login` | ANONYMOUS | 200 |
| [x] | FLUJO-B.7 (§9.2) | `GET /api/auth/me` | USER_A ({{userAToken}}) | 200 |
| [x] | FLUJO-B.8 (§9.2) | `GET /api/auth/me` | STAFF ({{staffToken}}) | 200 |
| [x] | FLUJO-B.9 (§9.2) | `GET /api/auth/me` | ADMIN ({{adminToken}}) | 200 |
| [x] | FLUJO-B.10 (§9.2) | `POST /api/auth/login` | ANONYMOUS | 401 |
| [x] | FLUJO-B.11 (§9.2) | `GET /api/auth/me` | ANONYMOUS | 401 |
| [x] | FLUJO-B.12 (§9.2) | `POST /api/events` | USER_A ({{userAToken}}) | 403 |
| [x] | FLUJO-C.1 (§9.3) | `POST /api/events` | ADMIN ({{adminToken}}) | 201 |
| [x] | FLUJO-C.2 (§9.3) | `GET /api/events/{{newEventCode}}` | ADMIN ({{adminToken}}) | 200 |
| [x] | FLUJO-C.2b (§9.3) | `POST /api/events` | ADMIN ({{adminToken}}) | 201 |
| [x] | FLUJO-C.3 (§9.3) | `GET /api/events/published` | ANONYMOUS | 200 |
| [x] | FLUJO-C.4 (§9.3) | `POST /api/events/{{newEventCode}}/artists/{{artistId}}` | ADMIN ({{adminToken}}) | 200 |
| [x] | FLUJO-C.5 (§9.3) | `PATCH /api/events/{{newEventCode}}/publish` | ADMIN ({{adminToken}}) | 200 |
| [x] | FLUJO-C.6 (§9.3) | `GET /api/events/{{newEventCode}}` | ANONYMOUS | 200 |
| [x] | FLUJO-C.7 (§9.3) | `GET /api/events/published` | ANONYMOUS | 200 |
| [x] | FLUJO-C.8 (§9.3) | `GET /api/events/by-artist?stageName=` | ANONYMOUS | 200 |
| [x] | FLUJO-C.9 (§9.3) | `POST /api/events` | USER_A ({{userAToken}}) | 403 |
| [x] | FLUJO-C.10 (§9.3) | `PATCH /api/events/{{newEventCode}}-NEG/publish` | STAFF ({{staffToken}}) | 403 |
| [x] | FLUJO-D.1 (§9.4) | `POST /api/tickets` | USER_A ({{userAToken}}) | 201 |
| [x] | FLUJO-D.2 (§9.4) | `GET /api/tickets/{{ticketCancelableCode}}` | USER_A ({{userAToken}}) | 200 |
| [x] | FLUJO-D.3 (§9.4) | `GET /api/tickets/{{ticketCancelableCode}}` | USER_B ({{userBToken}}) | 403 |
| [x] | FLUJO-D.4 (§9.4) | `PATCH /api/tickets/{{ticketCancelableCode}}/cancel` | USER_B ({{userBToken}}) | 403 |
| [x] | FLUJO-D.5 (§9.4) | `GET /api/tickets/{{ticketCancelableCode}}` | USER_A ({{userAToken}}) | 200 |
| [x] | FLUJO-D.6 (§9.4) | `PATCH /api/tickets/{{ticketCancelableCode}}/cancel` | USER_A ({{userAToken}}) | 200 |
| [x] | FLUJO-D.7 (§9.4) | `GET /api/tickets/{{ticketCancelableCode}}` | USER_A ({{userAToken}}) | 200 |
| [x] | FLUJO-D.8 (§9.4) | `POST /api/tickets` | USER_A ({{userAToken}}) | 201 |
| [x] | FLUJO-D.9 (§9.4) | `GET /api/events/{{publishedEventCode}}/tickets/paid` | STAFF ({{staffToken}}) | 200 |
| [x] | FLUJO-D.10 (§9.4) | `PATCH /api/tickets/{{ticketUsableCode}}/use` | STAFF ({{staffToken}}) | 200 |
| [x] | FLUJO-D.11 (§9.4) | `PATCH /api/tickets/{{ticketUsableCode}}/use` | STAFF ({{staffToken}}) | 409 |
| [x] | FLUJO-D.12 (§9.4) | `GET /api/tickets/{{ticketUsableCode}}` | STAFF ({{staffToken}}) | 200 |
| [x] | FLUJO-E.1 (§9.5) | `POST /api/users` | ANONYMOUS | 400 |
| [x] | FLUJO-E.2 (§9.5) | `GET /api/venues/{{runId}}-NOEXISTE` | ANONYMOUS | 404 |
| [x] | FLUJO-E.3 (§9.5) | `POST /api/users` | ANONYMOUS | 409 |
| [x] | FLUJO-E.4 (§9.5) | `PATCH /api/tickets/{{ticketUsableCode}}/cancel` | USER_A ({{userAToken}}) | 409 |
| [x] | FLUJO-E.5 (§9.5) | `GET /api/auth/me` | ANONYMOUS | 401 |
| [x] | FLUJO-E.6 (§9.5) | `GET /api/events/{{publishedEventCode}}/tickets/paid` | USER_A ({{userAToken}}) | 403 |

## Cierre de la ejecución

- [ ] Las 22 rutas de la matriz tienen al menos un caso nominal ejecutado (README §10).
- [ ] Los casos 400, 401, 403, 404 y 409 aplicables quedaron registrados.
- [ ] Se verificó la ausencia de mutación tras cada denegación (relectura autorizada).
- [ ] Se verificó el estado persistido tras cada transición de eventos y tickets.
- [ ] La bitácora no contiene tokens, contraseñas ni datos personales reales.
- [ ] Se consolidaron PASS, FAIL y BLOCKED por módulo y se registraron los defectos.
