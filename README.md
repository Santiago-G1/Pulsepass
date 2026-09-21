# PulsePass

Proyecto academico de persistencia para eventos, artistas, usuarios y tickets.
Implementa el modelo definido en `PRD_PulsePass(2).md` sin controllers, servicios,
DTOs ni frontend.

## Tecnologias

- Java 21
- Spring Boot 4
- Spring Data JPA / Hibernate
- PostgreSQL
- Flyway
- Testcontainers
- Maven

## Modelo

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

## Estructura

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

## Ejecucion

Configura PostgreSQL o define `DB_URL`, `DB_USER` y `DB_PASSWORD`. Luego ejecuta:

```bash
./mvnw clean test
```

En Windows:

```powershell
.\mvnw.cmd clean test
```

Las pruebas de integracion deben usar PostgreSQL mediante Testcontainers. Hibernate esta configurado con `ddl-auto=validate`; Flyway es responsable de crear y evolucionar el esquema.

Docker Desktop debe estar iniciado para ejecutar la suite de integración.

## Migraciones

- `V1__create_schema.sql`: crea tablas, relaciones, constraints e indices.
- `V2__insert_initial_artists.sql`: inserta los cinco artistas del escenario.
- `V3__add_streaming_url_to_event.sql`: agrega `streaming_url` de forma nullable.

## Consultas implementadas

Los repositories incluyen Query Methods para códigos, estados, navegación de
relaciones, tickets de usuarios y conteo de ventas. `EventRepository` incluye
consultas JPQL para eventos por artista, ciudad y artista, y recomendaciones con
`DISTINCT`, filtro case-insensitive y orden cronológico.