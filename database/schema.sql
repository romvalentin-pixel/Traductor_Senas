-- =====================================================================
--  Sistema de Traducción de Lenguaje de Señas
--  Base de datos PostgreSQL
--  Archivo: database/schema.sql
--  Uso:     psql -U postgres -d sign_language < schema.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tabla: users
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id                     SERIAL PRIMARY KEY,
    nombre                 VARCHAR(100) NOT NULL,
    email                  VARCHAR(255) NOT NULL UNIQUE,
    password_hash          VARCHAR(255) NOT NULL,
    password_reset_token   VARCHAR(128),
    password_reset_expires TIMESTAMPTZ,
    created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT users_email_format CHECK (
        email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    )
);

-- ---------------------------------------------------------------------
-- Tabla: signs (catálogo de señas; one row per vocabulary word/idioma)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS signs (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    language    VARCHAR(10)  NOT NULL DEFAULT 'es-AR',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT signs_name_language_unique UNIQUE (name, language)
);

-- ---------------------------------------------------------------------
-- Tabla: translations (historial)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS translations (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sign_detected   VARCHAR(100) NOT NULL,
    translated_text TEXT         NOT NULL,
    confidence      DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    language        VARCHAR(10)  NOT NULL DEFAULT 'es-AR',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT translations_confidence_check CHECK (
        confidence >= 0 AND confidence <= 1
    )
);

-- ---------------------------------------------------------------------
-- Índices para consultas frecuentes
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_email            ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_reset_token       ON users (password_reset_token);
CREATE INDEX IF NOT EXISTS idx_translations_user_date ON translations (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_translations_language  ON translations (language);
CREATE INDEX IF NOT EXISTS idx_signs_language         ON signs (language);
CREATE INDEX IF NOT EXISTS idx_signdetected_name      ON translations (sign_detected);