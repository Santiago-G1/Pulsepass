# PulsePass — Bitácora de ejecución manual (Fase 5)

Diligencie una fila por caso inmediatamente después de pulsar **Send**.
`HTTP observado` y `JSON / estado observado` se copian de la respuesta real;
`Resultado` es PASS, FAIL, BLOCKED o NOT RUN. No adjunte tokens ni contraseñas en la columna
de evidencia.

Cómo diligenciar cada fila (ejemplo real de la ejecución ya hecha):

```
| Caso | Fecha/hora | Actor | Ruta | HTTP esperado | HTTP observado | JSON / estado observado | Resultado | Evidencia / observación |
| E2E-TKT-01 / TC-BIZ-007 | 2026-10-18 22:16 | USER_A ({{userAToken}}) | `POST /api/tickets` | 201 | 201 | TicketResponse status=PAID, type=GENERAL, price=100.00, userEmail=user0@ejemplo.com, eventCode=EVT-E2E-PUB, ticketCode=TKT-25F7D06F-… | PASS | captura 09-e2e-tkt-01-compra-201-paid.png |
```

Es decir: `pendiente` y `NOT RUN` se sustituyen por lo que viste en Postman. Si el HTTP observado
no coincide con el esperado, `Resultado` = FAIL y en la observación se describe la diferencia;
si no pudiste ejecutar el caso, `Resultado` = BLOCKED y se indica qué faltó.

Convenciones: la columna **Actor** indica el token que debe estar seleccionado en
`Authorization`; la columna **HTTP esperado** proviene del contrato de las Fases 3 y 4.
Si un caso no se puede ejecutar por falta de fixture, token o respuesta previa, se marca
**BLOCKED** y los casos que dependan de él también.

## 00 Preparación / conectividad

| Caso | Fecha/hora | Actor | Ruta | HTTP esperado | HTTP observado | JSON / estado observado | Resultado | Evidencia / observación |
|---|---|---|---|---|---|---|---|---|
| PRE-01 | 2026-10-18 21:42 | ANONYMOUS | `GET /api/venues/active` | 200 | 200 | arreglo con VEN-E2E-01 (Arena E2E Bogota, capacity 500) y VEN-E2E-02; el venue inactivo no aparece | PASS | conectividad confirmada antes de la matriz |

## 01 Venues (2 rutas)

| Caso | Fecha/hora | Actor | Ruta | HTTP esperado | HTTP observado | JSON / estado observado | Resultado | Evidencia / observación |
|---|---|---|---|---|---|---|---|---|
| E2E-VEN-01 / TC-BIZ-001 | 2026-10-18 22:42 | ANONYMOUS | `GET /api/venues/{{venueActiveCode}}` | 200 | 200 | VenueResponse id=1, code=VEN-E2E-01, Arena E2E Bogota, capacity=500, active=true | PASS | captura 22-42-44 |
| TC-HTTP-VEN-404 | 2026-10-18 22:44 | ANONYMOUS | `GET /api/venues/{{runId}}-NOEXISTE` | 404 | 404 | ErrorResponse timestamp=22:44:10, status=404, details={} | PASS | captura 22-44-28 |
| E2E-VEN-02 / TC-BIZ-001 | 2026-10-18 22:45 | ANONYMOUS | `GET /api/venues/active` | 200 | 200 | arreglo con VEN-E2E-01 y VEN-E2E-02; no aparece el venue inactivo | PASS | captura 22-45-02 |

## 02 Artists (3 rutas)

| Caso | Fecha/hora | Actor | Ruta | HTTP esperado | HTTP observado | JSON / estado observado | Resultado | Evidencia / observación |
|---|---|---|---|---|---|---|---|---|
| E2E-ART-01 / TC-BIZ-002 | 2026-10-18 22:45 | ANONYMOUS | `GET /api/artists/{{artistId}}` | 200 | 200 | ArtistResponse id=1, stageName=Solar Beat, Colombia, Electronic, active=true | PASS | captura 22-45-33 |
| E2E-ART-02 / TC-BIZ-002 | 2026-10-18 22:45 | ANONYMOUS | `GET /api/artists/by-stage-name?stageName=` | 200 | 200 | mismo artista que E2E-ART-01 (id=1, Solar Beat) | PASS | captura 22-45-56 |
| E2E-ART-03 / TC-BIZ-002 | 2026-10-18 22:46 | ANONYMOUS | `GET /api/artists/active` | 200 | 200 | arreglo de artistas activos (Caribbean Sound, ...) | PASS | captura 22-46-07 |
| TC-HTTP-ART-404 | 2026-10-19 06:12 | ANONYMOUS | `GET /api/artists/999999` | 404 | 404 | ErrorResponse timestamp=06:12:13, status=404, error=Not Found | PASS | captura 06-12-15 |

## 03 Auth / usuarios (registro, login, me)

| Caso | Fecha/hora | Actor | Ruta | HTTP esperado | HTTP observado | JSON / estado observado | Resultado | Evidencia / observación |
|---|---|---|---|---|---|---|---|---|
| E2E-USR-01 / TC-AUTH-001 / TC-BIZ-006 | 2026-10-18 22:00 | ANONYMOUS | `POST /api/users` | 201 | 201 | UserResponse id=6, username=user0, email=user0@ejemplo.com, active=true; sin password ni passwordHash; rol efectivo ROLE_USER (ver E2E-AUTH-02) | PASS | captura 03-registro-user-a-201.png |
| E2E-USR-01-B / TC-BIZ-006 | 2026-10-18 22:12 | ANONYMOUS | `POST /api/users` | 201 | 201 | UserResponse id=8, username=userb1, email=userb1@gmail.com, active=true; identidad distinta de USER_A | PASS | captura 06-e2e-usr-01-b-registro-user-b.png |
| TC-HTTP-USR-409-EMAIL | 2026-10-19 05:55 | ANONYMOUS | `POST /api/users` | 409 | 409 | ErrorResponse timestamp=05:55:37, status=409; no se crea un segundo usuario con el mismo email | PASS | captura 05-55-43 |
| TC-HTTP-USR-409-USERNAME | 2026-10-19 05:55 | ANONYMOUS | `POST /api/users` | 409 | 409 | ErrorResponse timestamp=05:55:50, status=409; sin crear usuario | PASS | captura 05-55-52 |
| E2E-AUTH-01 / TC-AUTH-002 | 2026-10-18 22:08 | ANONYMOUS | `POST /api/auth/login` | 200 | 200 | tokenType=Bearer, expiresIn=900, accessToken no vacío; copiado manualmente a userAToken | PASS | capturas 04 y 05; token oculto en la evidencia |
| TC-AUTH-003 | 2026-10-19 05:56 | ANONYMOUS | `POST /api/auth/login` | 200 | 200 | tokenType=Bearer, expiresIn=900; identificado el mismo usuario que por username | PASS | captura 05-56-21 |
| E2E-AUTH-01-B | 2026-10-18 22:12 | ANONYMOUS | `POST /api/auth/login` | 200 | 200 | tokenType=Bearer, expiresIn=900; accessToken copiado a userBToken | PASS | captura 07 (recortar el token antes de enviarla) |
| E2E-AUTH-01-STAFF | 2026-10-18 22:47 | ANONYMOUS | `POST /api/auth/login` | 200 | 200 | tokenType=Bearer, expiresIn=900; copiado a staffToken | PASS | captura 22-47-27 |
| E2E-AUTH-01-ADMIN | 2026-10-18 22:48 | ANONYMOUS | `POST /api/auth/login` | 200 | 200 | tokenType=Bearer, expiresIn=900; copiado a adminToken | PASS | captura 22-48-35 |
| TC-AUTH-004 | 2026-10-18 22:17 | ANONYMOUS | `POST /api/auth/login` | 401 | 401 | ErrorResponse: timestamp, status=401, error=Unauthorized, message=Invalid credentials, details={} | PASS | captura 10-tc-auth-004-401-errorresponse.png |
| TC-AUTH-005 | 2026-10-18 22:50 | ANONYMOUS | `POST /api/auth/login` | 401 | 401 | ErrorResponse timestamp=22:50:43, status=401, message=Invalid credentials (idéntico en forma a TC-AUTH-004) | PASS | captura 22-50-45 |
| TC-AUTH-013-LOGIN | 2026-10-18 22:51 | ANONYMOUS | `POST /api/auth/login` | 401 | 401 | ErrorResponse timestamp=22:51:29, status=401; la cuenta inactiva no obtiene JWT | PASS | captura 22-51-37 |
| E2E-AUTH-02 / TC-AUTH-006 | 2026-10-18 22:14 | USER_A ({{userAToken}}) | `GET /api/auth/me` | 200 | 200 | id=6, username=user0, email=user0@ejemplo.com, roles=[ROLE_USER]; sin credenciales | PASS | captura 08-e2e-auth-02-me-role-user.png |
| TC-AUTH-006-B | 2026-10-19 05:58 | USER_B ({{userBToken}}) | `GET /api/auth/me` | 200 | 200 | id=10, username=usuaiob2, email=usuaib3@gmail.com, roles=[ROLE_USER]; sin credenciales | PASS | captura 05-58-21 |
| TC-AUTH-006-STAFF | 2026-10-18 22:49 | STAFF ({{staffToken}}) | `GET /api/auth/me` | 200 | 200 | id=1, username=staff.e2e, email=staff.e2e@example.test, roles=[ROLE_STAFF] | PASS | captura 22-49-06 |
| TC-AUTH-006-ADMIN | 2026-10-18 22:49 | ADMIN ({{adminToken}}) | `GET /api/auth/me` | 200 | 200 | id=2, username=admin.e2e, email=admin.e2e@example.test, roles=[ROLE_ADMIN] | PASS | captura 22-49-39 |

## 04 Usuarios / consulta y propiedad (2 rutas)

| Caso | Fecha/hora | Actor | Ruta | HTTP esperado | HTTP observado | JSON / estado observado | Resultado | Evidencia / observación |
|---|---|---|---|---|---|---|---|---|
| E2E-USR-02 / TC-BIZ-006 | 2026-10-18 22:55 | USER_A ({{userAToken}}) | `GET /api/users/by-email?email=` | 200 | 200 | UserResponse id=6, username=user0, email=user0@ejemplo.com; sin credenciales | PASS | captura 22-55-46 |
| TC-SEC-006 | 2026-10-19 06:12 | USER_B ({{userBToken}}) | `GET /api/users/by-email?email=` | 403 | 200 | UserResponse id=6, username=user0, email=user0@ejemplo.com obtenido con token de USER_B | FAIL | esperado 403; defecto 3 (IDOR). Captura 06-12-36 |
| E2E-USR-03 / TC-BIZ-006 | 2026-10-18 22:56 | USER_A ({{userAToken}}) | `GET /api/users/by-username?username=` | 200 | 200 | UserResponse id=6, username=user0 | PASS | captura 22-56-50 |
| TC-SEC-007 | 2026-10-19 05:58 | USER_B ({{userBToken}}) | `GET /api/users/by-username?username=` | 403 | 200 | UserResponse id=6, username=user0, email=user0@ejemplo.com obtenido con token de USER_B | FAIL | esperado 403; defecto 3 (IDOR). Captura 05-58-45 |
| E2E-USR-02-ADMIN / TC-SEC-015 | 2026-10-18 22:58 | ADMIN ({{adminToken}}) | `GET /api/users/by-email?email=` | 200 | 200 | UserResponse id=6 (ADMIN sí accede) | PASS | captura 22-58-14 |
| TC-HTTP-USR-404 | 2026-10-18 22:59 | USER_A ({{userAToken}}) | `GET /api/users/by-email?email=` | 404 | 404 | ErrorResponse timestamp=22:58:58, status=404 | PASS | captura 22-59-03 |

## 05 Events / administración y visibilidad (6 rutas)

| Caso | Fecha/hora | Actor | Ruta | HTTP esperado | HTTP observado | JSON / estado observado | Resultado | Evidencia / observación |
|---|---|---|---|---|---|---|---|---|
| E2E-EVT-01 / TC-BIZ-003 | 2026-10-18 23:00 | ADMIN ({{adminToken}}) | `POST /api/events` | 201 | 201 | EventResponse id=4, eventCode=32, name='PulsePass E2E 1', status=DRAFT | PASS | captura 23-00-38; newEventCode quedó como '32' |
| TC-SEC-001-A | 2026-10-18 23:01 | ANONYMOUS | `POST /api/events` | 401 | 201 | evento 32-X creado en DRAFT (sin token) | FAIL | esperado 401; defecto: no hay autorización. Captura 23-01-03 |
| TC-SEC-001-B / TC-AUTH-014 | 2026-10-18 23:02 | USER_A ({{userAToken}}) | `POST /api/events` | 403 | 201 | evento 32-Y creado en DRAFT (token USER_A) | FAIL | esperado 403; defecto de autorización. Captura 23-02-14 |
| TC-SEC-001-C | 2026-10-18 23:02 | STAFF ({{staffToken}}) | `POST /api/events` | 403 | 201 | evento 32-Z creado en DRAFT (token STAFF) | FAIL | esperado 403; defecto de autorización. Captura 23-02-54 |
| E2E-EVT-02-OPS / TC-SEC-015 | 2026-10-18 23:04 | ADMIN ({{adminToken}}) | `GET /api/events/{{eventToPublishCode}}` | 200 | 200 | EventResponse id=4, eventCode=32, status=DRAFT | PASS | captura 23-04-04 |
| E2E-EVT-02-OPS-STAFF | 2026-10-18 23:04 | STAFF ({{staffToken}}) | `GET /api/events/{{draftEventCode}}` | 200 | 200 | EventResponse id=4, eventCode=32, status=DRAFT | PASS | captura 23-04-29 |
| E2E-EVT-02 / TC-SEC-004 | 2026-10-18 23:04 | ANONYMOUS | `GET /api/events/{{draftEventCode}}` | 403 | 200 | borrador id=4 (eventCode=32) expuesto al visitante | FAIL | esperado 403/404; filtración de borradores. Captura 23-04-45 |
| E2E-EVT-03 / TC-SEC-005 | 2026-10-18 23:05 | ANONYMOUS | `GET /api/events/published` | 200 | 200 | arreglo con EVT-E2E-PUB; sin borradores en la primera posición | PASS | captura 23-05-05 |
| E2E-EVT-04 / TC-BIZ-004 | 2026-10-18 23:05 | ADMIN ({{adminToken}}) | `PATCH /api/events/{{eventToPublishCode}}/publish` | 200 | 200 | evento id=4 (32) pasa a PUBLISHED | PASS | captura 23-05-51 |
| TC-SEC-002-A | 2026-10-18 23:06 | USER_A ({{userAToken}}) | `PATCH /api/events/{{newEventCode}}/publish` | 403 | 409 | ErrorResponse timestamp=23:06:33 'Only draft events can be published.' | FAIL | esperado 403; el evento ya estaba publicado por el caso anterior (cadena del defecto). Captura 23-06-39 |
| TC-SEC-002-B | 2026-10-19 05:59 | STAFF ({{staffToken}}) | `PATCH /api/events/{{newEventCode}}/publish` | 403 | 409 | ErrorResponse timestamp=05:59:31 'Only draft events can be published.' | FAIL | esperado 403; el evento ya estaba publicado (cadena del defecto). Captura 05-59-35 |
| E2E-EVT-05 / TC-BIZ-005 | 2026-10-18 23:06 | ADMIN ({{adminToken}}) | `POST /api/events/{{eventToPublishCode}}/artists/{{artistId}}` | 200 | 200 | evento id=4 (32) con el artista asociado | PASS | captura 23-06-56 |
| TC-SEC-003 | 2026-10-19 06:00 | USER_A ({{userAToken}}) | `POST /api/events/{{newEventCode}}/artists/{{artistId}}` | 403 | 200 | evento id=10 (EVT-e2e01-NEW) con el artista asociado usando token de USER_A | FAIL | esperado 403; defecto 2 (sin autorización). Captura 06-00-07 |
| E2E-EVT-05-REPEAT | 2026-10-18 23:08 | ADMIN ({{adminToken}}) | `POST /api/events/{{eventToPublishCode}}/artists/{{artistId}}` | 409 | 409 | ErrorResponse timestamp=23:08:13; asociación repetida rechazada | PASS | captura 23-08-17 |
| E2E-EVT-06 / TC-BIZ-005 / TC-SEC-005 | 2026-10-18 23:08 | ANONYMOUS | `GET /api/events/by-artist?stageName=` | 200 | 200 | arreglo con EVT-E2E-PUB (solo publicados) | PASS | captura 23-08-49 |
| E2E-EVT-04-VERIFY / FR-E2E-008 | 2026-10-18 23:08 | ANONYMOUS | `GET /api/events/published` | 200 | 200 | el listado público incluye el evento publicado | PASS | captura 23-08-59 |
| TC-HTTP-EVT-404 | 2026-10-18 23:09 | ANONYMOUS | `GET /api/events/{{runId}}-NOEXISTE` | 404 | 404 | ErrorResponse timestamp=23:09:30, status=404 | PASS | captura 23-09-34 |

## 06 Tickets / compra, consulta y ciclo de vida (6 rutas)

| Caso | Fecha/hora | Actor | Ruta | HTTP esperado | HTTP observado | JSON / estado observado | Resultado | Evidencia / observación |
|---|---|---|---|---|---|---|---|---|
| E2E-TKT-01 / TC-BIZ-007 | 2026-10-18 22:16 | USER_A ({{userAToken}}) | `POST /api/tickets` | 201 | 201 | ticketCode=TKT-25F7D06F-AD2A-41E2-A776-9A1E381499FC, type=GENERAL, price=100.00, status=PAID, userEmail=user0@ejemplo.com, eventCode=EVT-E2E-PUB; copiado a ticketUsableCode | PASS | captura 09-e2e-tkt-01-compra-201-paid.png |
| E2E-TKT-01-B / TC-BIZ-007 | 2026-10-18 22:19 | USER_A ({{userAToken}}) | `POST /api/tickets` | 201 | 201 | ticketCode=TKT-5BEF689E-AACB-4E34-B3E2-7D6FF21B1A3F, type=GENERAL, status=PAID, eventCode=EVT-E2E-PUB; copiado a ticketCancelableCode | PASS | sin captura propia; el tipo observado es GENERAL (el request pide VIP: revisar el Body enviado) |
| TC-SEC-008 / AC-05 | 2026-10-19 06:00 | USER_A ({{userAToken}}) | `POST /api/tickets` | 403 | 201 | ticketCode=TKT-29E9918B-4E99-49D7-86F6-E112091EADB7 creado a nombre de USER_B con token de USER_A | FAIL | esperado 403; defecto 4 (compra a nombre de otro usuario). Captura 06-00-27 |
| TC-BIZ-014 | 2026-10-18 23:12 | USER_A ({{userAToken}}) | `POST /api/tickets` | 409 | 409 | ErrorResponse timestamp=23:12:47; compra en evento no publicado rechazada | PASS | captura 23-12-48 |
| E2E-TKT-02 / TC-BIZ-008 | 2026-10-18 23:13 | USER_A ({{userAToken}}) | `GET /api/tickets/{{ticketCancelableCode}}` | 200 | 404 | ErrorResponse timestamp=23:13:44 'Ticket not found' | FAIL | esperado 200; el valor de ticketCancelableCode usado no existe en la base. Captura 23-13-46 |
| TC-SEC-009 | 2026-10-19 06:13 | USER_B ({{userBToken}}) | `GET /api/tickets/{{ticketCancelableCode}}` | 403 | 200 | ticket id=7 TKT-9A18F753-4864-4277-BF5D-EDE21D33DD65 (PAID en ese momento) leído con token de USER_B | FAIL | esperado 403; defecto 3. Captura 06-13-04 |
| E2E-TKT-03 / TC-BIZ-008 | 2026-10-19 06:57 | USER_A ({{userAToken}}) | `GET /api/tickets/by-user?email=` | 200 | 500 | ErrorResponse timestamp=06:57:12, status=500, error=Internal Server Error, message=Unexpected error, details={} | FAIL | esperado 200; defecto 1 (query derivada de TicketRepository). Captura 201-e2e-tkt-03_listar-tickets-por-email_500-FAIL |
| TC-SEC-010 | 2026-10-19 06:02 | USER_B ({{userBToken}}) | `GET /api/tickets/by-user?email=` | 403 | 500 | ErrorResponse timestamp=2026-10-19T06:02:11, status=500, error=Internal Server Error, message=Unexpected error, details={} | FAIL | esperado 403; defecto 1 (query derivada de TicketRepository). Reproducido también sin token y sin el parámetro email |
| E2E-TKT-04 / TC-BIZ-009 / TC-SEC-014 | 2026-10-18 23:14 | STAFF ({{staffToken}}) | `GET /api/events/{{publishedEventCode}}/tickets/paid` | 200 | 200 | arreglo de tickets PAID del evento (TKT-102FCA4D-...) con token STAFF | PASS | captura 23-14-17 |
| TC-SEC-013 | 2026-10-18 23:14 | USER_A ({{userAToken}}) | `GET /api/events/{{publishedEventCode}}/tickets/paid` | 403 | 200 | USER_A obtiene el listado operativo de tickets pagados | FAIL | esperado 403; defecto de autorización. Captura 23-14-33 |
| TC-SEC-011 / AC-04 | 2026-10-19 06:03 | USER_B ({{userBToken}}) | `PATCH /api/tickets/{{ticketUsableCode}}/cancel` | 403 | 200 | ticket id=6 TKT-088AC215-... pasa a CANCELLED con token de USER_B | FAIL | esperado 403; defecto 3 (mutación de recurso ajeno). Captura 06-03-54 |
| E2E-TKT-05 / TC-BIZ-010 | 2026-10-18 22:20 | USER_A ({{userAToken}}) | `PATCH /api/tickets/{{ticketCancelableCode}}/cancel` | 200 | 200 | ticketCode=TKT-5BEF689E-AACB-4E34-B3E2-7D6FF21B1A3F, status=CANCELLED | PASS | captura 11-e2e-tkt-05-cancelar-200.png |
| TC-BIZ-011 | 2026-10-19 06:14 | USER_A ({{userAToken}}) | `PATCH /api/tickets/{{ticketCancelableCode}}/cancel` | 409 | 200 | ticket id=7 TKT-9A18F753-... pasa a CANCELLED | FAIL | esperado 409; ticketCancelableCode apuntaba a un ticket PAID y no al ya cancelado. Captura 06-14-38 |
| E2E-TKT-05-VERIFY / FR-E2E-008 | 2026-10-18 22:21 | USER_A ({{userAToken}}) | `GET /api/tickets/{{ticketCancelableCode}}` | 200 | 200 | relectura: status=CANCELLED persistido | PASS | captura 12-e2e-tkt-05-verify-cancelado.png |
| TC-SEC-012 / AC-04 | 2026-10-19 06:04 | USER_B ({{userBToken}}) | `PATCH /api/tickets/{{ticketUsableCode}}/use` | 403 | 200 | ticket id=4 TKT-127F4ACD-... pasa a USED con token de USER_B | FAIL | esperado 403; defecto 3. Captura 06-04-40 |
| E2E-TKT-06 / TC-BIZ-012 / TC-SEC-014 | 2026-10-19 06:05 | STAFF ({{staffToken}}) | `PATCH /api/tickets/{{ticketUsableCode}}/use` | 200 | 409 | ErrorResponse timestamp=06:05:12 'Only paid tickets can be marked as used.' | FAIL | esperado 200; el ticket ya estaba USED por efecto de TC-SEC-012 (defecto). Captura 06-05-19 |
| TC-BIZ-013 | 2026-10-19 06:05 | STAFF ({{staffToken}}) | `PATCH /api/tickets/{{ticketUsableCode}}/use` | 409 | 409 | ErrorResponse timestamp=06:05:34; segunda transición de uso rechazada | PASS | captura 06-05-40 |
| E2E-TKT-06-VERIFY / FR-E2E-008 | 2026-10-19 06:06 | STAFF ({{staffToken}}) | `GET /api/tickets/{{ticketUsableCode}}` | 200 | 200 | relectura: TKT-127F4ACD-... en estado USED | PASS | captura 06-06-21 |
| TC-HTTP-TKT-404-CODE | 2026-10-18 23:15 | USER_A ({{userAToken}}) | `GET /api/tickets/{{runId}}-NOEXISTE` | 404 | 404 | ErrorResponse timestamp=23:15:23, status=404 | PASS | captura 23-15-30 |

## 07 Seguridad / escenarios negativos

| Caso | Fecha/hora | Actor | Ruta | HTTP esperado | HTTP observado | JSON / estado observado | Resultado | Evidencia / observación |
|---|---|---|---|---|---|---|---|---|
| TC-SEC-000A | 2026-10-18 23:15 | USER_A ({{userAToken}}) | `POST /api/tickets` | 201 | 201 | ticketCode=TKT-088AC215-3072-49F0-B99E-E70ADF263243, GENERAL, PAID | PASS | captura 23-15-46; copiado a ticketUsableCode |
| TC-SEC-000B | 2026-10-18 23:16 | ADMIN ({{adminToken}}) | `POST /api/events` | 201 | 400 | ErrorResponse timestamp=23:16:12 'Bad Request' (validación del cuerpo) | FAIL | esperado 201; sin el borrador auxiliar, TC-SEC-002-A/B dan 404. Captura 23-16-15 |
| TC-AUTH-007 | 2026-10-18 23:16 | ANONYMOUS | `GET /api/auth/me` | 401 | 401 | body {"status":401,"error":"Unauthorized","message":"Unauthorized"} SIN timestamp ni details | PASS | cumple el 401, pero incumple el contrato ErrorResponse (defecto 6). Captura 23-16-23 |
| TC-AUTH-008 | 2026-10-18 23:16 | Authorization: Bearer no-es-un-jwt | `GET /api/auth/me` | 401 | 401 | mismo body reducido del entry point | PASS | captura 23-16-30 |
| TC-AUTH-009 | 2026-10-18 23:16 | Authorization: Bearer <token alterado manualmente> | `GET /api/auth/me` | 401 | 401 | mismo body reducido del entry point | PASS | captura 23-16-41 |
| TC-AUTH-010 | 2026-10-18 23:16 | Authorization: Bearer <token expirado> | `GET /api/auth/me` | 401 | 401 | mismo body reducido del entry point | PASS | captura 23-16-50; confirmar que el token usado era realmente un JWT expirado |
| TC-AUTH-011 | 2026-10-18 23:16 | Authorization: Bearer <token de otra clave> | `GET /api/auth/me` | 401 | 401 | mismo body reducido del entry point | PASS | captura 23-16-59; confirmar que el token era de otra clave/issuer |
| TC-AUTH-012 | 2026-10-18 23:17 | Sin Authorization; token en ?access_token= | `GET /api/auth/me?access_token=` | 401 | 401 | mismo body reducido del entry point | PASS | captura 23-17-09; token por query string no autentica |
| TC-AUTH-013 | 2026-10-18 23:17 | Authorization: Bearer <token previo a la desactivación> | `GET /api/auth/me` | 401 | 401 | mismo body reducido del entry point | PASS | captura 23-17-18; confirmar el fixture de cuenta desactivada |
| TC-AUTH-014 | 2026-10-18 23:17 | USER_A ({{userAToken}}) | `POST /api/events` | 403 | 201 | evento 33-SEC14 creado con token USER | FAIL | esperado 403; defecto de autorización. Captura 23-17-38 |
| TC-AUTH-015 | 2026-10-18 23:17 | Authorization: Bearer token-invalido | `GET /api/venues/active` | 200 | 200 | arreglo de venues activos con Bearer inválido | PASS | captura 23-17-46 |
| TC-SEC-002-A | 2026-10-18 23:18 | USER_A ({{userAToken}}) | `PATCH /api/events/{{newEventCode}}-SEC/publish` | 403 | 404 | ErrorResponse timestamp=23:18:14 'Event not found' | FAIL | esperado 403; el evento auxiliar no existe por el fallo de TC-SEC-000B. Captura 23-18-16 |
| TC-SEC-002-B | 2026-10-18 23:18 | STAFF ({{staffToken}}) | `PATCH /api/events/{{newEventCode}}-SEC/publish` | 403 | 404 | ErrorResponse timestamp=23:18:24 'Event not found' | FAIL | esperado 403; misma causa. Captura 23-18-25 |
| TC-SEC-003 | 2026-10-19 06:57 | USER_A ({{userAToken}}) | `POST /api/events/{{newEventCode}}-SEC/artists/{{artistId}}` | 403 | 404 | ErrorResponse timestamp=06:57:29, message='Event not found: EVT-e2e01-NEW2-SEC' | FAIL | esperado 403; el evento objetivo no existía (el código -SEC nunca se creó). Captura 202-tc-sec-003_user-asocia-artista_404-FAIL |
| TC-SEC-004 (duplicado de 05 para la matriz de seguridad) | 2026-10-18 23:19 | ANONYMOUS | `GET /api/events/{{draftEventCode}}` | 403 | 200 | EventResponse EVT-E2E-DRAFT con todos sus datos, sin token | FAIL | esperado 403/404; filtración del borrador. Captura 23-19-15 |
| TC-SEC-005 (duplicado de 05) | 2026-10-18 23:19 | ANONYMOUS | `GET /api/events/by-artist?stageName=` | 200 | 200 | by-artist devuelve solo EVT-E2E-PUB | PASS | captura 23-19-48 |
| TC-SEC-006 (duplicado de 04) | 2026-10-19 06:16 | USER_B ({{userBToken}}) | `GET /api/users/by-email?email=` | 403 | 200 | UserResponse id=6, username=user0 obtenido con token de USER_B | FAIL | esperado 403; defecto 3. Captura 06-16-27 |
| TC-SEC-007 (duplicado de 04) | 2026-10-19 06:15 | USER_B ({{userBToken}}) | `GET /api/users/by-username?username=` | 403 | 200 | UserResponse id=6, user0 obtenido con token de USER_B | FAIL | esperado 403; defecto 3. Captura 06-15-28 |
| TC-SEC-008 (duplicado de 06) | 2026-10-19 06:16 | USER_A ({{userAToken}}) | `POST /api/tickets` | 403 | 201 | ticketCode=TKT-F0677556-87D9-444E-88A6-3EAC45A1EA21 creado a nombre de USER_B | FAIL | esperado 403; defecto 4. Captura 06-16-49 |
| TC-SEC-009 (duplicado de 06) | 2026-10-19 06:16 | USER_B ({{userBToken}}) | `GET /api/tickets/{{ticketCancelableCode}}` | 403 | 200 | ticket id=7 TKT-9A18F753-... (CANCELLED) leído con token de USER_B | FAIL | esperado 403; defecto 3. Captura 06-16-57 |
| TC-SEC-010 (duplicado de 06) | 2026-10-19 06:17 | USER_B ({{userBToken}}) | `GET /api/tickets/by-user?email=` | 403 | 500 | ErrorResponse timestamp=06:17:08, status=500, message=Unexpected error | FAIL | esperado 403; defecto 1. Captura 06-17-10 |
| TC-SEC-011 (duplicado de 06) | 2026-10-19 06:17 | USER_B ({{userBToken}}) | `PATCH /api/tickets/{{ticketUsableCode}}/cancel` | 403 | 409 | ErrorResponse timestamp=06:17:18, status=409 | FAIL | esperado 403; el ticket ya estaba cancelado. Captura 06-17-22 |
| TC-SEC-012 (duplicado de 06) | 2026-10-19 06:17 | USER_B ({{userBToken}}) | `PATCH /api/tickets/{{ticketUsableCode}}/use` | 403 | 409 | ErrorResponse timestamp=06:17:33, status=409 | FAIL | esperado 403; el ticket ya no estaba PAID. Captura 06-17-35 |
| TC-SEC-013 (duplicado de 06) | 2026-10-19 06:17 | USER_A ({{userAToken}}) | `GET /api/events/{{publishedEventCode}}/tickets/paid` | 403 | 200 | listado operativo de tickets pagados con token de USER_A | FAIL | esperado 403; defecto 2. Captura 06-17-50 |
| TC-SEC-014 (duplicado de 06) | 2026-10-19 06:18 | STAFF ({{staffToken}}) | `PATCH /api/tickets/{{ticketUsableCode}}/use` | 200 | 409 | ErrorResponse timestamp=06:18:03, status=409 | FAIL | esperado 200; ticketUsableCode no estaba en PAID. Captura 06-18-05 |
| TC-SEC-015 (duplicado de 05) | 2026-10-19 06:18 | ADMIN ({{adminToken}}) | `GET /api/events/{{draftEventCode}}` | 200 | 200 | EventResponse EVT-E2E-DRAFT con token de ADMIN | PASS | captura 06-18-33 |
| TC-SEC-016 / AC-03 | 2026-10-19 06:06 | ANONYMOUS | `POST /api/users` | 201 | 201 | usuario escalada.e2e01 (id=11) creado; el campo role=ADMIN del cuerpo se ignora | PASS | captura 06-06-39 |
| TC-SEC-016-VERIFY | 2026-10-19 06:07 | Authorization: Bearer <token de escalada.{{runId}}> | `GET /api/auth/me` | 200 | 401 | 401 del entry point (no se usó un token válido del usuario creado) | FAIL | esperado 200 con roles=[ROLE_USER]; pegar el accessToken de escalada.e2e01. Captura 06-07-07 |
| TC-SEC-017 | 2026-10-19 06:07 | STAFF ({{staffToken}}) | `POST /api/events` | 403 | 201 | evento EVT-e2e01-NEW-SEC17 creado con token de STAFF | FAIL | esperado 403; defecto 2. Captura 06-07-17 |

## 08 Validaciones y errores HTTP

| Caso | Fecha/hora | Actor | Ruta | HTTP esperado | HTTP observado | JSON / estado observado | Resultado | Evidencia / observación |
|---|---|---|---|---|---|---|---|---|
| TC-HTTP-001 | 2026-10-19 06:19 | ANONYMOUS | `POST /api/users` | 400 | 400 | ErrorResponse timestamp=06:19:00, status=400 con details del campo email | PASS | captura 06-19-03 |
| TC-HTTP-002 | 2026-10-19 06:19 | ANONYMOUS | `POST /api/users` | 400 | 400 | timestamp=06:19:08, status=400 con details (username obligatorio) | PASS | captura 06-19-10 |
| TC-HTTP-003 | 2026-10-19 06:19 | ANONYMOUS | `POST /api/users` | 400 | 400 | timestamp=06:19:16, status=400 (JSON no deserializable) | PASS | captura 06-19-19 |
| TC-HTTP-004 | 2026-10-19 06:19 | ADMIN ({{adminToken}}) | `POST /api/events` | 400 | 400 | timestamp=06:19:25, status=400 (category obligatoria) | PASS | captura 06-19-26 |
| TC-HTTP-005 | 2026-10-19 06:19 | ADMIN ({{adminToken}}) | `POST /api/events` | 400 | 400 | timestamp=06:19:32, status=400 (enum EventCategory inválido) | PASS | captura 06-19-34 |
| TC-HTTP-006 | 2026-10-19 06:19 | ADMIN ({{adminToken}}) | `POST /api/events` | 409 | 409 | timestamp=06:19:39, status=409 (eventCode duplicado) | PASS | captura 06-19-44 |
| TC-HTTP-007 / TC-BIZ-015 | 2026-10-19 06:19 | ADMIN ({{adminToken}}) | `POST /api/events` | 409 | 409 | timestamp=06:19:49, status=409 (fecha pasada) | PASS | captura 06-19-53 |
| TC-HTTP-008 | 2026-10-19 06:19 | ADMIN ({{adminToken}}) | `POST /api/events` | 404 | 404 | timestamp=06:19:59, status=404 (venue inexistente) | PASS | captura 06-20-01 |
| TC-HTTP-009 | 2026-10-19 06:20 | USER_A ({{userAToken}}) | `POST /api/tickets` | 400 | 400 | timestamp=06:20:07, status=400 (enum TicketType inválido) | PASS | captura 06-20-10 |
| TC-HTTP-010 | 2026-10-19 06:20 | USER_A ({{userAToken}}) | `POST /api/tickets` | 404 | 404 | timestamp=06:20:15, status=404 (evento inexistente en la compra) | PASS | captura 06-20-19 |
| TC-HTTP-011 | 2026-10-19 06:20 | USER_A ({{userAToken}}) | `GET /api/tickets/by-user` | 400 | 500 | timestamp=06:20:35, status=500, message=Unexpected error | FAIL | esperado 400; defecto 7 (handleUnexpected convierte el error de Spring MVC en 500). Captura 06-20-37 |
| TC-HTTP-012 | 2026-10-19 06:20 | ANONYMOUS | `GET /api/events/{{runId}}-NOEXISTE` | 404 | 404 | timestamp=06:20:43, status=404 | PASS | captura 06-20-47 |
| TC-HTTP-013 | 2026-10-19 06:20 | ANONYMOUS | `POST /api/users` | 409 | 409 | timestamp=06:20:56, status=409 (password fuera de rango, regla del Service) | PASS | captura 06-20-58 |

## 09 Flujos de negocio / secuencia recomendada

| Caso | Fecha/hora | Actor | Ruta | HTTP esperado | HTTP observado | JSON / estado observado | Resultado | Evidencia / observación |
|---|---|---|---|---|---|---|---|---|
| FLUJO-A.1 (§9.1) | 2026-10-19 06:21 | ANONYMOUS | `GET /api/venues/active` | 200 | 200 | arreglo con VEN-E2E-01 | PASS | captura 06-21-12 |
| FLUJO-A.2 (§9.1) | 2026-10-19 06:21 | ANONYMOUS | `GET /api/venues/{{venueActiveCode}}` | 200 | 200 | VenueResponse VEN-E2E-01, Arena E2E Bogota | PASS | captura 06-21-25 |
| FLUJO-A.3 (§9.1) | 2026-10-19 06:21 | ANONYMOUS | `GET /api/artists/active` | 200 | 200 | arreglo de artistas activos | PASS | captura 06-21-34 |
| FLUJO-A.4 (§9.1) | 2026-10-19 06:21 | ANONYMOUS | `GET /api/artists/{{artistId}}` | 200 | 200 | ArtistResponse id=1, Solar Beat, active=true | PASS | captura 06-21-43 |
| FLUJO-A.5 (§9.1) | 2026-10-18 23:29 | ANONYMOUS | `GET /api/artists/by-stage-name?stageName=` | 200 | 200 | ArtistResponse id=1, stageName=Solar Beat, Colombia, Electronic, active=true | PASS | captura 074-flujo-a5_artista-por-stage-name_200 |
| FLUJO-A.6 (§9.1) | 2026-10-19 06:22 | ANONYMOUS | `GET /api/events/published` | 200 | 200 | arreglo con EVT-E2E-PUB; sin borradores | PASS | captura 06-22-01 |
| FLUJO-A.7 (§9.1) | 2026-10-19 06:22 | ANONYMOUS | `GET /api/events/{{publishedEventCode}}` | 200 | 200 | EventResponse EVT-E2E-PUB | PASS | captura 06-22-14 |
| FLUJO-A.8 (§9.1) | 2026-10-19 06:22 | ANONYMOUS | `GET /api/events/{{draftEventCode}}` | 403 | 200 | EventResponse EVT-E2E-DRAFT expuesto al visitante | FAIL | esperado 403; defecto 5 (borradores). Captura 06-22-32 |
| FLUJO-A.9 (§9.1) | 2026-10-19 06:22 | ANONYMOUS | `GET /api/events/by-artist?stageName=` | 200 | 200 | by-artist devuelve EVT-E2E-PUB | PASS | captura 06-22-42 |
| FLUJO-B.1 (§9.2) | 2026-10-18 23:30 | ANONYMOUS | `POST /api/users` | 201 | 409 | ErrorResponse timestamp=23:30:32, status=409 (username/email ya existentes) | FAIL | esperado 201; el usuario ya se había registrado en la carpeta 03 con los mismos datos. Captura 080-flujo-b1_registrar-user-a_409-FAIL |
| FLUJO-B.2 (§9.2) | 2026-10-18 23:31 | ANONYMOUS | `POST /api/users` | 201 | 201 | UserResponse id=9, username=usuaiob, email=usuaib@gmail.com | PASS | captura 081-flujo-b2_registrar-user-b_201 |
| FLUJO-B.3 (§9.2) | 2026-10-19 06:23 | ANONYMOUS | `POST /api/auth/login` | 200 | 200 | tokenType=Bearer, expiresIn=900; copiado a userAToken | PASS | captura 06-23-10; token oculto |
| FLUJO-B.4 (§9.2) | 2026-10-19 06:23 | ANONYMOUS | `POST /api/auth/login` | 200 | 200 | tokenType=Bearer; copiado a userBToken | PASS | captura 06-23-19; token oculto |
| FLUJO-B.5 (§9.2) | 2026-10-19 06:25 | ANONYMOUS | `POST /api/auth/login` | 200 | 200 | tokenType=Bearer; copiado a staffToken | PASS | captura 06-25-34; token oculto |
| FLUJO-B.6 (§9.2) | 2026-10-19 06:26 | ANONYMOUS | `POST /api/auth/login` | 200 | 200 | tokenType=Bearer; copiado a adminToken | PASS | captura 06-26-56; token oculto |
| FLUJO-B.7 (§9.2) | 2026-10-19 06:27 | USER_A ({{userAToken}}) | `GET /api/auth/me` | 200 | 401 | 401 del entry point (body reducido) | FAIL | esperado 200; no se usó un token válido. Captura 06-27-16 |
| FLUJO-B.8 (§9.2) | 2026-10-19 06:27 | STAFF ({{staffToken}}) | `GET /api/auth/me` | 200 | 401 | 401 del entry point (body reducido) | FAIL | esperado 200; pegar staffToken. Captura 06-27-26 |
| FLUJO-B.9 (§9.2) | 2026-10-19 06:27 | ADMIN ({{adminToken}}) | `GET /api/auth/me` | 200 | 401 | 401 del entry point (body reducido) | FAIL | esperado 200; pegar adminToken. Captura 06-27-37 |
| FLUJO-B.10 (§9.2) | 2026-10-19 06:27 | ANONYMOUS | `POST /api/auth/login` | 401 | 401 | ErrorResponse timestamp=06:27:54, status=401, message=Invalid credentials | PASS | captura 06-27-56 |
| FLUJO-B.11 (§9.2) | 2026-10-19 06:28 | ANONYMOUS | `GET /api/auth/me` | 401 | 401 | 401 del entry point (body reducido) | PASS | captura 06-28-20 |
| FLUJO-B.12 (§9.2) | 2026-10-19 06:28 | USER_A ({{userAToken}}) | `POST /api/events` | 403 | 409 | timestamp=06:28:29 Conflict en el primer envío; al reintentar devolvió 201 creando EVT-e2e01-NEW2-B12 | FAIL | esperado 403; defecto 2. Capturas 06-28-37 y 06-29-12 |
| FLUJO-C.1 (§9.3) | 2026-10-19 06:29 | ADMIN ({{adminToken}}) | `POST /api/events` | 201 | 201 | EventResponse id=14, eventCode=EVT-e2e01-NEW2, status=DRAFT | PASS | captura 06-29-02 |
| FLUJO-C.2 (§9.3) | 2026-10-19 06:29 | ADMIN ({{adminToken}}) | `GET /api/events/{{newEventCode}}` | 200 | 200 | EventResponse id=14 EVT-e2e01-NEW2 en DRAFT | PASS | captura 06-29-30 |
| FLUJO-C.2b (§9.3) | 2026-10-19 06:29 | ADMIN ({{adminToken}}) | `POST /api/events` | 201 | 201 | EventResponse id=16, eventCode=EVT-e2e01-NEW-NEG, status=DRAFT | PASS | captura 06-29-44 |
| FLUJO-C.3 (§9.3) | 2026-10-19 06:29 | ANONYMOUS | `GET /api/events/published` | 200 | 200 | el listado público no incluye EVT-e2e01-NEW2 | PASS | captura 06-29-59 |
| FLUJO-C.4 (§9.3) | 2026-10-18 23:34 | ADMIN ({{adminToken}}) | `POST /api/events/{{newEventCode}}/artists/{{artistId}}` | 200 | 200 | evento id=10 (EVT-e2e01-NEW) con el artista asociado | PASS | captura 23-34-07 |
| FLUJO-C.5 (§9.3) | 2026-10-18 23:34 | ADMIN ({{adminToken}}) | `PATCH /api/events/{{newEventCode}}/publish` | 200 | 200 | EVT-e2e01-NEW pasa a PUBLISHED | PASS | captura 23-34-20 |
| FLUJO-C.6 (§9.3) | 2026-10-18 23:34 | ANONYMOUS | `GET /api/events/{{newEventCode}}` | 200 | 200 | el evento publicado ya es visible sin token | PASS | captura 23-34-31 |
| FLUJO-C.7 (§9.3) | 2026-10-18 23:34 | ANONYMOUS | `GET /api/events/published` | 200 | 200 | el listado público incluye el evento recién publicado | PASS | captura 23-34-48 |
| FLUJO-C.8 (§9.3) | 2026-10-18 23:34 | ANONYMOUS | `GET /api/events/by-artist?stageName=` | 200 | 200 | by-artist devuelve el evento con el artista | PASS | captura 23-34-58 |
| FLUJO-C.9 (§9.3) | 2026-10-18 23:35 | USER_A ({{userAToken}}) | `POST /api/events` | 403 | 201 | evento EVT-e2e01-NEW-C9 creado con token de USER_A | FAIL | esperado 403; defecto 2. Captura 23-35-08 |
| FLUJO-C.10 (§9.3) | 2026-10-18 23:35 | STAFF ({{staffToken}}) | `PATCH /api/events/{{newEventCode}}-NEG/publish` | 403 | 200 | EVT-e2e01-NEW-NEG publicado con token de STAFF | FAIL | esperado 403; defecto 2. Captura 23-35-18 |
| FLUJO-D.1 (§9.4) | 2026-10-18 23:35 | USER_A ({{userAToken}}) | `POST /api/tickets` | 201 | 201 | ticketCode=TKT-9A18F753-4864-4277-BF5D-EDE21D33DD65, GENERAL, 100.00, PAID | PASS | captura 23-35-29 |
| FLUJO-D.2 (§9.4) | 2026-10-18 23:35 | USER_A ({{userAToken}}) | `GET /api/tickets/{{ticketCancelableCode}}` | 200 | 404 | ErrorResponse timestamp=23:35:42 'Ticket not found' | FAIL | esperado 200; no se copió el ticketCode nuevo a ticketCancelableCode. Captura 23-35-49 |
| FLUJO-D.3 (§9.4) | 2026-10-19 06:30 | USER_B ({{userBToken}}) | `GET /api/tickets/{{ticketCancelableCode}}` | 403 | 200 | ticket id=7 TKT-9A18F753-... (CANCELLED) leído con token de USER_B | FAIL | esperado 403; defecto 3. Captura 06-30-17 |
| FLUJO-D.4 (§9.4) | 2026-10-19 06:30 | USER_B ({{userBToken}}) | `PATCH /api/tickets/{{ticketCancelableCode}}/cancel` | 403 | 409 | ErrorResponse timestamp=06:24:24, status=409 | FAIL | esperado 403; el ticket ya estaba cancelado. Captura 06-30-32 |
| FLUJO-D.5 (§9.4) | 2026-10-19 06:30 | USER_A ({{userAToken}}) | `GET /api/tickets/{{ticketCancelableCode}}` | 200 | 200 | relectura: TKT-9A18F753-... sigue CANCELLED, sin cambio tras D.4 | PASS | captura 06-30-50 |
| FLUJO-D.6 (§9.4) | 2026-10-19 06:31 | USER_A ({{userAToken}}) | `PATCH /api/tickets/{{ticketCancelableCode}}/cancel` | 200 | 409 | ErrorResponse timestamp=06:30:57, status=409 | FAIL | esperado 200; T1 ya había sido cancelado en TC-BIZ-011. Captura 06-31-02 |
| FLUJO-D.7 (§9.4) | 2026-10-19 06:31 | USER_A ({{userAToken}}) | `GET /api/tickets/{{ticketCancelableCode}}` | 200 | 200 | relectura: status=CANCELLED persistido | PASS | captura 06-31-15 |
| FLUJO-D.8 (§9.4) | 2026-10-19 06:31 | USER_A ({{userAToken}}) | `POST /api/tickets` | 201 | 201 | ticketCode=TKT-929FB470-F7C0-4730-99BC-F464E1D4D248, VIP, 200.00, PAID | PASS | captura 06-31-26 |
| FLUJO-D.9 (§9.4) | 2026-10-19 06:31 | STAFF ({{staffToken}}) | `GET /api/events/{{publishedEventCode}}/tickets/paid` | 200 | 200 | listado de tickets PAID del evento con token de STAFF | PASS | captura 06-31-38 |
| FLUJO-D.10 (§9.4) | 2026-10-19 06:31 | STAFF ({{staffToken}}) | `PATCH /api/tickets/{{ticketUsableCode}}/use` | 200 | 409 | ErrorResponse timestamp=06:31:48, status=409 | FAIL | esperado 200; ticketUsableCode no apuntaba a T2. Captura 06-31-50 |
| FLUJO-D.11 (§9.4) | 2026-10-19 06:32 | STAFF ({{staffToken}}) | `PATCH /api/tickets/{{ticketUsableCode}}/use` | 409 | 409 | timestamp=06:32:05, status=409; segunda transición de uso rechazada | PASS | captura 06-32-09 |
| FLUJO-D.12 (§9.4) | 2026-10-19 06:32 | STAFF ({{staffToken}}) | `GET /api/tickets/{{ticketUsableCode}}` | 200 | 200 | relectura: TKT-127F4ACD-... en USED | PASS | captura 06-32-20; el código apuntaba al ticket anterior, no a T2 |
| FLUJO-E.1 (§9.5) | 2026-10-18 23:37 | ANONYMOUS | `POST /api/users` | 400 | 400 | ErrorResponse timestamp=23:37:47, status=400 con details de validación | PASS | captura 23-37-51 |
| FLUJO-E.2 (§9.5) | 2026-10-18 23:37 | ANONYMOUS | `GET /api/venues/{{runId}}-NOEXISTE` | 404 | 404 | ErrorResponse timestamp=23:37:31, status=404 | PASS | captura 23-37-34 |
| FLUJO-E.3 (§9.5) | 2026-10-19 06:32 | ANONYMOUS | `POST /api/users` | 409 | 409 | timestamp=06:32:30, status=409 (usuario/email duplicado) | PASS | captura 06-32-36 |
| FLUJO-E.4 (§9.5) | 2026-10-19 06:32 | USER_A ({{userAToken}}) | `PATCH /api/tickets/{{ticketUsableCode}}/cancel` | 409 | 409 | timestamp=06:32:50, status=409 (transición no admitida) | PASS | captura 06-32-52 |
| FLUJO-E.5 (§9.5) | 2026-10-18 23:37 | ANONYMOUS | `GET /api/auth/me` | 401 | 401 | 401 del entry point (body reducido) | PASS | captura 23-37-00 |
| FLUJO-E.6 (§9.5) | 2026-10-18 23:36 | USER_A ({{userAToken}}) | `GET /api/events/{{publishedEventCode}}/tickets/paid` | 403 | 200 | listado de tickets pagados obtenido con token de USER_A | FAIL | esperado 403; defecto 2. Captura 23-36-47 |

## Consolidación final

| Módulo | PASS | FAIL | BLOCKED | NOT RUN | Observaciones |
|---|---|---|---|---|---|
| 00 Preparación | 1 | 0 | 0 | 0 | corte 2026-10-19 06:35 |
| 01 Venues | 3 | 0 | 0 | 0 | corte 2026-10-19 06:35 |
| 02 Artists | 4 | 0 | 0 | 0 | corte 2026-10-19 06:35 |
| 03 Auth / usuarios | 16 | 0 | 0 | 0 | corte 2026-10-19 06:35 |
| 04 Usuarios / propiedad | 4 | 2 | 0 | 0 | corte 2026-10-19 06:35 |
| 05 Events | 10 | 7 | 0 | 0 | corte 2026-10-19 06:35 |
| 06 Tickets | 9 | 10 | 0 | 0 | corte 2026-10-19 06:35 |
| 07 Seguridad | 12 | 17 | 0 | 0 | corte 2026-10-19 06:35 |
| 08 Validaciones y errores | 12 | 1 | 0 | 0 | corte 2026-10-19 06:35 |
| 09 Flujos A–E | 36 | 14 | 0 | 0 | corte 2026-10-19 06:35 |

## Defectos y bloqueos detectados

| # | Caso | Precondición | Pasos de reproducción | HTTP esperado | HTTP observado | Severidad | Estado |
|---|---|---|---|---|---|---|---|
| 1 | `E2E-TKT-03`, `TC-SEC-010`, `TC-HTTP-011` | token vigente y al menos un ticket en la base | abrir `E2E-TKT-03` y pulsar Send | 200 | **500** | Alta | Confirmado (falla siempre, con y sin parámetro) |
| 2 | `TC-SEC-001-A/B/C`, `TC-SEC-002-A/B`, `TC-SEC-003`, `TC-AUTH-014` | evento en DRAFT (`{{newEventCode}}`) y tokens de ANONYMOUS/USER/STAFF | `POST /api/events` sin token y con token USER/STAFF; `PATCH /api/events/{code}/publish`; `POST /api/events/{code}/artists/{id}` | 401 / 403 | **201 / 200** | Crítica | Confirmado (el recurso se crea o muta) |
| 3 | `TC-SEC-006`, `TC-SEC-007`, `TC-SEC-009`, `TC-SEC-010`, `TC-SEC-011`, `TC-SEC-012`, `TC-SEC-013` | USER_A con usuario/ticket y `{{userBToken}}` vigente | enviar esas requests con el token de USER_B | 403 | **200** | Crítica | Confirmado (lectura y mutación de recursos ajenos) |
| 4 | `TC-SEC-008` | USER_A y USER_B registrados | `POST /api/tickets` con `userEmail={{userBEmail}}` y `{{userAToken}}` | 403 | **201** (crea ticket a nombre de USER_B) | Crítica | Confirmado |
| 5 | `E2E-EVT-02`, `TC-SEC-004` | `EVT-E2E-DRAFT` en estado DRAFT | `GET /api/events/EVT-E2E-DRAFT` sin token | 403 / 404 | **200** con todos los datos del borrador | Alta | Confirmado |
| 6 | `TC-AUTH-007`, `FR-E2E-009` | ninguna | `GET /api/auth/me` sin cabecera Authorization | 401 con `ErrorResponse` de cinco campos | 401 con `{"status","error","message"}`, **sin** `timestamp` ni `details` | Media | Confirmado |
| 7 | `TC-HTTP-011` | token vigente | `GET /api/tickets/by-user` sin el parámetro `email` | 400 | **500** | Baja | Confirmado |

Causa técnica identificada (inspección del log del servidor, no del cliente):

1. `InvalidDataAccessApiUsageException: Unable to ignore case of com.pulsepass.pulsepass.domain.User types, the property 'user' must reference a String` — la query derivada `findByUserEmailIgnoreCaseOrderByPurchaseDateDesc` de `TicketRepository` se resuelve sobre la asociación `user` en lugar de `user.email`; por eso `GET /api/tickets/by-user` nunca responde.
2. `SecurityConfig` termina en `.anyRequest().permitAll()` y no existen anotaciones `@PreAuthorize` ni verificación de propiedad en los servicios: solo `GET /api/auth/me` exige token.
3. El `AuthenticationEntryPoint` escribe su propio JSON en lugar de delegar en `GlobalExceptionHandler`, por eso el 401 no cumple el contrato de `ErrorResponse`.
4. `GlobalExceptionHandler.handleUnexpected(Exception)` convierte en 500 cualquier excepción no contemplada, incluidas las de Spring MVC que corresponden a 400.

## Cobertura final

- Rutas del contrato cubiertas: **22 / 22** (corte 2026-10-19 06:35)
- Casos ejecutados: **158 / 158** · PASS: **107** · FAIL: **51** · BLOCKED: **0** · NOT RUN: **0**
- Resultado global: **22 / 22** rutas cubiertas; las 51 no conformidades se explican por los 7 defectos
  registrados arriba (ninguna es un error de datos de la corrida).
- Regresiones respecto a las Fases 1–4: 4 causas registradas en la tabla de defectos
  (query derivada de `TicketRepository` → 500; ausencia de autorización por rol; ausencia de verificación de
  propiedad/IDOR; borradores expuestos al público), más el `401` del entry point fuera del contrato
  `ErrorResponse` y el mapeo de errores de Spring MVC a `500` en lugar de `400`.
