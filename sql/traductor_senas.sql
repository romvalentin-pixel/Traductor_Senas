-- =====================================================
-- Base de datos: traductor_senas
-- PostgreSQL
-- =====================================================


-- =====================================================
-- TABLA: usuario
-- =====================================================

CREATE TABLE IF NOT EXISTS usuario (
    id_usuario INTEGER GENERATED ALWAYS AS IDENTITY,
    nombre VARCHAR(45) NOT NULL,
    email VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    pais VARCHAR(30),
    provincia VARCHAR(45),

    CONSTRAINT pk_usuario
        PRIMARY KEY (id_usuario)
);


-- =====================================================
-- TABLA: modelo_ia
-- =====================================================

CREATE TABLE IF NOT EXISTS modelo_ia (
    id_modelo INTEGER GENERATED ALWAYS AS IDENTITY,
    nombre_modelo VARCHAR(45) NOT NULL,
    version VARCHAR(20) NOT NULL,

    CONSTRAINT pk_modelo_ia
        PRIMARY KEY (id_modelo)
);


-- =====================================================
-- TABLA: sesion
-- =====================================================

CREATE TABLE IF NOT EXISTS sesion (
    id_sesion INTEGER GENERATED ALWAYS AS IDENTITY,
    id_usuario INTEGER NOT NULL,
    id_modelo INTEGER NOT NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME,
    confianza DECIMAL(5,2),
    texto_generado VARCHAR(255),

    CONSTRAINT pk_sesion
        PRIMARY KEY (id_sesion),

    CONSTRAINT fk_sesion_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_sesion_modelo
        FOREIGN KEY (id_modelo)
        REFERENCES modelo_ia(id_modelo)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


-- Índices para las claves foráneas
CREATE INDEX IF NOT EXISTS idx_sesion_usuario
    ON sesion(id_usuario);

CREATE INDEX IF NOT EXISTS idx_sesion_modelo
    ON sesion(id_modelo);


-- =====================================================
-- TABLA: sena
-- =====================================================

CREATE TABLE IF NOT EXISTS sena (
    id_sena INTEGER GENERATED ALWAYS AS IDENTITY,
    nombre_sena VARCHAR(45) NOT NULL,

    CONSTRAINT pk_sena
        PRIMARY KEY (id_sena)
);


-- =====================================================
-- TABLA: categoria
-- =====================================================

CREATE TABLE IF NOT EXISTS categoria (
    id_categoria INTEGER GENERATED ALWAYS AS IDENTITY,
    nombre_categoria VARCHAR(45) NOT NULL,

    CONSTRAINT pk_categoria
        PRIMARY KEY (id_categoria)
);


-- =====================================================
-- TABLA INTERMEDIA: sesion_sena
-- Relación N:M entre sesion y sena
-- =====================================================

CREATE TABLE IF NOT EXISTS sesion_sena (
    id_sesion INTEGER NOT NULL,
    id_sena INTEGER NOT NULL,

    CONSTRAINT pk_sesion_sena
        PRIMARY KEY (id_sesion, id_sena),

    CONSTRAINT fk_sesion_sena_sesion
        FOREIGN KEY (id_sesion)
        REFERENCES sesion(id_sesion)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_sesion_sena_sena
        FOREIGN KEY (id_sena)
        REFERENCES sena(id_sena)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


CREATE INDEX IF NOT EXISTS idx_sesion_sena_sena
    ON sesion_sena(id_sena);


-- =====================================================
-- TABLA INTERMEDIA: sena_categoria
-- Relación N:M entre sena y categoria
-- =====================================================

CREATE TABLE IF NOT EXISTS sena_categoria (
    id_sena INTEGER NOT NULL,
    id_categoria INTEGER NOT NULL,

    CONSTRAINT pk_sena_categoria
        PRIMARY KEY (id_sena, id_categoria),

    CONSTRAINT fk_sena_categoria_sena
        FOREIGN KEY (id_sena)
        REFERENCES sena(id_sena)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_sena_categoria_categoria
        FOREIGN KEY (id_categoria)
        REFERENCES categoria(id_categoria)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


CREATE INDEX IF NOT EXISTS idx_sena_categoria_categoria
    ON sena_categoria(id_categoria);