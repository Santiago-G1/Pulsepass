# PulsePass

Proyecto académico para descubrir eventos y gestionar entradas. Incluye el
modelo de persistencia, una capa de servicios que aplica reglas de negocio y
coordina transacciones, y una capa de controladores REST que expone los casos
de uso mediante HTTP sin filtrar entidades JPA.

## Tecnologías

- Java 21 y Spring Boot 4
- Spring Data JPA, Hibernate y PostgreSQL
- Flyway
- MapStruct
- Spring MVC y Bean Validation
- JUnit 5, Mockito, AssertJ, MockMvc y Testcontainers

## Arquitectura

```text
domain/      Entidades y enums
repository/  Acceso a datos Spring Data
dto/         Records request/response
mapper/      Mapeo MapStruct de entidades a DTOs
exception/   Errores de negocio, recursos y GlobalExceptionHandler
service/     Contratos, reglas y transacciones
controller/  Endpoints REST que delegan en los servicios
```

Los servicios incluidos son `VenueService`, `EventService`, `ArtistService`,
`UserService` y `TicketService`. La compra verifica usuario, estado/fecha del
evento, edad mínima y capacidad; guarda un ticket `PAID` y marca el evento
`SOLD_OUT` al alcanzar el aforo. La política de precios queda centralizada en
`TicketPricingPolicy`: GENERAL 100.00, STUDENT 80.00, VIP 200.00 y BACKSTAGE
300.00.

## API REST

Los controladores son delgados: validan con Bean Validation y delegan en los
servicios. Los errores se unifican en `ErrorResponse` mediante
`@RestControllerAdvice` (`GlobalExceptionHandler`): 400 para request inválido,
404 para recurso inexistente, 409 para conflicto o regla de negocio y 500 para
error inesperado.

| Método | Endpoint | Servicio |
| --- | --- | --- |
| GET | `/api/venues/{code}` | `VenueService.findByCode(code)` |
| GET | `/api/venues/active` | `VenueService.findActiveVenues()` |
| POST | `/api/events` | `EventService.create(request)` |
| GET | `/api/events/{eventCode}` | `EventService.findByCode(eventCode)` |
| GET | `/api/events/published` | `EventService.findPublishedEvents()` |
| PATCH | `/api/events/{eventCode}/publish` | `EventService.publish(eventCode)` |
| POST | `/api/events/{eventCode}/artists/{artistId}` | `EventService.addArtist(eventCode, artistId)` |
| GET | `/api/events/by-artist?stageName=...` | `EventService.findByArtist(stageName)` |
| GET | `/api/artists/{id}` | `ArtistService.findById(id)` |
| GET | `/api/artists/by-stage-name?stageName=...` | `ArtistService.findByStageName(stageName)` |
| GET | `/api/artists/active` | `ArtistService.findActiveArtists()` |
| POST | `/api/users` | `UserService.register(request)` |
| GET | `/api/users/by-email?email=...` | `UserService.findByEmail(email)` |
| GET | `/api/users/by-username?username=...` | `UserService.findByUsername(username)` |
| POST | `/api/tickets` | `TicketService.purchase(request)` |
| GET | `/api/tickets/{ticketCode}` | `TicketService.findByCode(ticketCode)` |
| GET | `/api/tickets/by-user?email=...` | `TicketService.findByUserEmail(email)` |
| GET | `/api/events/{eventCode}/tickets/paid` | `TicketService.findPaidTicketsByEvent(eventCode)` |
| PATCH | `/api/tickets/{ticketCode}/cancel` | `TicketService.cancel(ticketCode)` |
| PATCH | `/api/tickets/{ticketCode}/use` | `TicketService.markAsUsed(ticketCode)` |

## Ejecución

Define `DB_URL`, `DB_USER` y `DB_PASSWORD` si PostgreSQL no está en la
configuración local predeterminada. Las pruebas unitarias de servicios no
requieren base de datos ni Spring ApplicationContext:

```powershell
.\mvnw.cmd '-Dtest=*ServiceImplTest' test
```

Las pruebas de controladores usan `@WebMvcTest` con `MockMvc` y servicios
reemplazados por `@MockitoBean`; no requieren base de datos:

```powershell
.\mvnw.cmd '-Dtest=*ControllerTest' test
```

Para ejecutar todas las pruebas, incluidas las de persistencia con PostgreSQL
mediante Testcontainers, inicia Docker Desktop y ejecuta:

```powershell
.\mvnw.cmd clean test
```

Hibernate valida el esquema (`ddl-auto: validate`); Flyway crea y evoluciona
las tablas mediante las migraciones versionadas en `src/main/resources/db/migration`.
