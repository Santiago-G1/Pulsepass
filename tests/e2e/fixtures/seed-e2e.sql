-- ============================================================================
-- PulsePass — Fixtures E2E (Fase 5)
--
-- USO EXCLUSIVO: base de datos de pruebas dedicada (pulsepass_e2e).
-- NUNCA ejecutar sobre desarrollo, QA ni producción.
--
-- Requisitos previos: las migraciones Flyway V1..V4 deben estar aplicadas
-- (arrancar la aplicación una vez con DB_URL apuntando a pulsepass_e2e).
--
-- Aplicación:
--   psql -h localhost -p 5432 -U postgres -d pulsepass_e2e -f seed-e2e.sql
--
-- Contenido:
--   1. Venues activo/inactivo
--   2. Cuentas privilegiadas STAFF/ADMIN y cuenta INACTIVE_USER (BCrypt)
--   3. Roles (el registro público solo produce USER)
--   4. Eventos fixture (publicado, borrador, listo para publicar)
--   5. Asociación publicada <-> artista activo
--
-- Contraseñas de fixture (solo E2E, no son secretos reales):
--   staff.e2e    / StaffE2ePass2026!
--   admin.e2e    / AdminE2ePass2026!
--   inactive.e2e / InactiveE2ePass2026!
-- Los hashes se generaron con el BCryptPasswordEncoder de la aplicación
-- (BCrypt, coste 10) y no se reutilizan fuera de este ambiente.
--
-- El script es idempotente: puede reaplicarse sin duplicar filas.
-- ============================================================================

BEGIN;

-- 1. Venues ------------------------------------------------------------------
INSERT INTO venues (code, name, city, address, capacity, active) VALUES
    ('VEN-E2E-01', 'Arena E2E Bogota', 'Bogota', 'Calle 100 # 20-30', 500, TRUE),
    ('VEN-E2E-02', 'Teatro E2E Medellin', 'Medellin', 'Carrera 40 # 10-20', 120, TRUE),
    ('VEN-E2E-03', 'Bodega Inactiva E2E', 'Cali', 'Avenida 3 # 4-5', 80, FALSE)
ON CONFLICT (code) DO NOTHING;

-- 2. Cuentas de fixture ------------------------------------------------------
INSERT INTO users (username, email, active) VALUES
    ('staff.e2e', 'staff.e2e@example.test', TRUE),
    ('admin.e2e', 'admin.e2e@example.test', TRUE),
    ('inactive.e2e', 'inactive.e2e@example.test', FALSE)
ON CONFLICT (username) DO NOTHING;

INSERT INTO user_profiles (first_name, last_name, phone, city, birth_date, user_id)
SELECT v.first_name, v.last_name, v.phone, v.city, v.birth_date, u.id
FROM (VALUES
    ('Staff', 'E2E', '+573000000010', 'Bogota', DATE '1990-01-01', 'staff.e2e'),
    ('Admin', 'E2E', '+573000000011', 'Bogota', DATE '1988-01-01', 'admin.e2e'),
    ('Inactive', 'E2E', '+573000000012', 'Bogota', DATE '1995-01-01', 'inactive.e2e')
) AS v(first_name, last_name, phone, city, birth_date, username)
JOIN users u ON u.username = v.username
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_credentials (user_id, password_hash, password_changed_at)
SELECT u.id, v.password_hash, NOW()
FROM (VALUES
    ('staff.e2e', '$2a$10$Nqk5KpgTZcu0QoOmEi.XyeX6KFyXOqvBEmfkjgOG2xwA.Yss7QAzO'),
    ('admin.e2e', '$2a$10$fvcepnSZXP/OJs1wrZvVRu3iLFRkEHG8H6VxyiZb0W/YY0NMAqV6u'),
    ('inactive.e2e', '$2a$10$EBft/Dehw/D3eCYVrAbWsO2MS2wIS02cGsKAIR5snQ5WAHN26RmQC')
) AS v(username, password_hash)
JOIN users u ON u.username = v.username
ON CONFLICT (user_id) DO NOTHING;

-- 3. Roles privilegiados (solo E2E; el registro público nunca los asigna) ----
INSERT INTO user_roles (user_id, role)
SELECT u.id, v.role
FROM (VALUES
    ('staff.e2e', 'STAFF'),
    ('admin.e2e', 'ADMIN'),
    ('inactive.e2e', 'USER')
) AS v(username, role)
JOIN users u ON u.username = v.username
ON CONFLICT DO NOTHING;

-- 4. Eventos fixture (fechas futuras; el contrato exige fecha > now) ---------
INSERT INTO events (event_code, name, description, category, status, event_date,
                    minimum_age, venue_id)
SELECT v.event_code, v.name, v.description, v.category, v.status, v.event_date,
       v.minimum_age, ve.id
FROM (VALUES
    ('EVT-E2E-PUB', 'Festival E2E Publicado',
     'Evento publicado para compras y consultas publicas',
     'MUSIC', 'PUBLISHED', TIMESTAMP '2027-02-20 20:00:00', 0, 'VEN-E2E-01'),
    ('EVT-E2E-DRAFT', 'Conferencia E2E Borrador',
     'Evento en borrador que no debe filtrarse al publico',
     'TECHNOLOGY', 'DRAFT', TIMESTAMP '2027-03-15 19:00:00', 18, 'VEN-E2E-01'),
    ('EVT-E2E-TO-PUBLISH', 'Concierto E2E Por Publicar',
     'Evento en borrador listo para PATCH /publish',
     'MUSIC', 'DRAFT', TIMESTAMP '2027-04-10 18:00:00', 0, 'VEN-E2E-02')
) AS v(event_code, name, description, category, status, event_date, minimum_age, venue_code)
JOIN venues ve ON ve.code = v.venue_code
ON CONFLICT (event_code) DO NOTHING;

-- 5. Asociación evento publicado <-> artista activo -------------------------
INSERT INTO event_artists (event_id, artist_id)
SELECT e.id, a.id
FROM events e
JOIN artists a ON a.stage_name = 'Solar Beat'
WHERE e.event_code = 'EVT-E2E-PUB'
ON CONFLICT DO NOTHING;

COMMIT;
