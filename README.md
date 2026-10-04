# PulsePass

Proyecto académico para descubrir eventos y gestionar entradas. Incluye el
modelo de persistencia y una capa de servicios que aplica reglas de negocio,
coordina transacciones y expone DTOs sin filtrar entidades JPA.

## Tecnologías

- Java 21 y Spring Boot 4
- Spring Data JPA, Hibernate y PostgreSQL
- Flyway
- MapStruct
- JUnit 5, Mockito, AssertJ y Testcontainers

## Arquitectura

```text
domain/      Entidades y enums
repository/  Acceso a datos Spring Data
dto/         Records request/response
mapper/      Mapeo MapStruct de entidades a DTOs
exception/   Errores de negocio y recursos
service/     Contratos, reglas y transacciones
```

Los servicios incluidos son `VenueService`, `EventService`, `ArtistService`,
`UserService` y `TicketService`. La compra verifica usuario, estado/fecha del
evento, edad mínima y capacidad; guarda un ticket `PAID` y marca el evento
`SOLD_OUT` al alcanzar el aforo. La política de precios queda centralizada en
`TicketPricingPolicy`: GENERAL 100.00, STUDENT 80.00, VIP 200.00 y BACKSTAGE
300.00.

## Ejecución

Define `DB_URL`, `DB_USER` y `DB_PASSWORD` si PostgreSQL no está en la
configuración local predeterminada. Las pruebas unitarias de servicios no
requieren base de datos ni Spring ApplicationContext:

```powershell
.\mvnw.cmd '-Dtest=*ServiceImplTest' test
```

Para ejecutar todas las pruebas, incluidas las de persistencia con PostgreSQL
mediante Testcontainers, inicia Docker Desktop y ejecuta:

```powershell
.\mvnw.cmd clean test
```

Hibernate valida el esquema (`ddl-auto: validate`); Flyway crea y evoluciona
las tablas mediante las migraciones versionadas en `src/main/resources/db/migration`.
