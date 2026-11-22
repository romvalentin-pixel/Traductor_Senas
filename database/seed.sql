-- =====================================================================
--  Sistema de Traducción de Lenguaje de Señas
--  Datos iniciales (demo) — database/seed.sql
--  Uso:     psql -U postgres -d sign_language -f seed.sql
-- =====================================================================

-- Vocabulario del modo demostración (español rioplatense / LSA básico)
INSERT INTO signs (name, description, language) VALUES
    ('HOLA',         'Saludo estándar.',                         'es-AR'),
    ('GRACIAS',      'Expresión de agradecimiento.',             'es-AR'),
    ('SI',           'Afirmación.',                              'es-AR'),
    ('NO',           'Negación.',                                'es-AR'),
    ('ADIOS',        'Despedida.',                               'es-AR'),
    ('POR_FAVOR',    'Pedido cortés.',                           'es-AR'),
    ('BUENOS_DIAS',  'Saludo al comenzar el día.',               'es-AR'),
    ('BUENAS_TARDES','Saludo por la tarde.',                     'es-AR'),
    ('AYUDA',        'Pedido de asistencia o ayuda.',            'es-AR')
ON CONFLICT (name, language) DO NOTHING;

-- ---------------------------------------------------------------------
--  Catálogo ampliado (referencia: "Señario LSA Volumen 1", CAS, 2019)
--  Fuente del material: docs/material/Libro PDF Señario LSA Volumen 1.pdf
--  Nota: catálogo para consulta/listado. El reconocimiento por cámara en
--  tiempo real requiere muestras y entrenamiento (ver docs/como-agregar-mas-senas.md).
-- ---------------------------------------------------------------------

-- Saludos y comunicación básica
INSERT INTO signs (name, description, language) VALUES
    ('BUENAS_NOCHES','Saludo nocturno (Señario LSA Vol. 1).',          'es-AR'),
    ('CHAU',         'Despedida informal (Señario LSA Vol. 1).',       'es-AR'),
    ('DE_NADA',      'Respuesta cortés (Señario LSA Vol. 1).',         'es-AR'),
    ('NOMBRE',       'Consulta o expresión de nombre (Señario LSA Vol. 1).', 'es-AR'),
    ('APELLIDO',     'Apellido (Señario LSA Vol. 1).',                 'es-AR'),
    ('SENA_PERSONAL','Seña personal / nombre señado (Señario LSA Vol. 1).', 'es-AR'),
    ('SORDO',        'Identidad: persona sorda (Señario LSA Vol. 1).', 'es-AR'),
    ('OYENTE',       'Persona oyente (Señario LSA Vol. 1).',           'es-AR'),
    ('INTERPRETE',   'Intérprete de lengua de señas (Señario LSA Vol. 1).', 'es-AR'),
    ('TE_QUIERO',    'Expresión afectiva (Señario LSA Vol. 1).',       'es-AR'),
    ('TE_AMO',       'Expresión afectiva (Señario LSA Vol. 1).',       'es-AR')
ON CONFLICT (name, language) DO NOTHING;

-- Familia
INSERT INTO signs (name, description, language) VALUES
    ('FAMILIA',      'Familia (Señario LSA Vol. 1).',                  'es-AR'),
    ('MAMA',         'Mamá (Señario LSA Vol. 1).',                     'es-AR'),
    ('PAPA',         'Papá (Señario LSA Vol. 1).',                     'es-AR'),
    ('PADRES',       'Padres (Señario LSA Vol. 1).',                   'es-AR'),
    ('HIJO',         'Hijo/a (Señario LSA Vol. 1).',                   'es-AR'),
    ('HERMANO',      'Hermano/a (Señario LSA Vol. 1).',                'es-AR'),
    ('ABUELO',       'Abuelo/a (Señario LSA Vol. 1).',                 'es-AR'),
    ('BISABUELO',    'Bisabuelo/a (Señario LSA Vol. 1).',              'es-AR'),
    ('NIETO',        'Nieto/a (Señario LSA Vol. 1).',                  'es-AR'),
    ('TIO',          'Tío (Señario LSA Vol. 1).',                      'es-AR'),
    ('TIA',          'Tía (Señario LSA Vol. 1).',                      'es-AR'),
    ('PRIMO',        'Primo/a (Señario LSA Vol. 1).',                  'es-AR'),
    ('SOBRINO',      'Sobrino/a (Señario LSA Vol. 1).',                'es-AR'),
    ('PADRINO',      'Padrino (Señario LSA Vol. 1).',                  'es-AR'),
    ('MADRINA',      'Madrina (Señario LSA Vol. 1).',                  'es-AR'),
    ('ESPOSO',       'Esposo/a (Señario LSA Vol. 1).',                 'es-AR'),
    ('NOVIO',        'Novio/a (Señario LSA Vol. 1).',                  'es-AR'),
    ('CUNADO',       'Cuñado/a (Señario LSA Vol. 1).',                 'es-AR'),
    ('HIJASTRO',     'Hijastro/a (Señario LSA Vol. 1).',               'es-AR'),
    ('MADRASTRA',    'Madrastra (Señario LSA Vol. 1).',                'es-AR'),
    ('PADRASTRO',    'Padrastro (Señario LSA Vol. 1).',                'es-AR')
ON CONFLICT (name, language) DO NOTHING;

-- Escuela
INSERT INTO signs (name, description, language) VALUES
    ('ESCUELA',      'Escuela (Señario LSA Vol. 1).',                  'es-AR'),
    ('ALUMNO',       'Alumno/a (Señario LSA Vol. 1).',                 'es-AR'),
    ('PROFESOR',     'Profesor/a / maestro/a (Señario LSA Vol. 1).',   'es-AR'),
    ('CLASE',        'Clase (Señario LSA Vol. 1).',                    'es-AR'),
    ('AULA',         'Aula (Señario LSA Vol. 1).',                     'es-AR'),
    ('RECREO',       'Recreo (Señario LSA Vol. 1).',                   'es-AR'),
    ('LIBRO',        'Libro (Señario LSA Vol. 1).',                    'es-AR'),
    ('CUADERNO',     'Cuaderno (Señario LSA Vol. 1).',                 'es-AR'),
    ('LAPIZ',        'Lápiz (Señario LSA Vol. 1).',                    'es-AR'),
    ('LAPICES_DE_COLORES','Lápices de colores (Señario LSA Vol. 1).',   'es-AR'),
    ('GOMA_DE_BORRAR','Goma de borrar (Señario LSA Vol. 1).',           'es-AR'),
    ('REGLA',        'Regla (Señario LSA Vol. 1).',                    'es-AR'),
    ('MOCHILA',      'Mochila/carpeta (Señario LSA Vol. 1).',          'es-AR'),
    ('PIZARRON',     'Pizarrón (Señario LSA Vol. 1).',                 'es-AR'),
    ('TIZA',         'Tiza (Señario LSA Vol. 1).',                     'es-AR'),
    ('SILLA',        'Silla (Señario LSA Vol. 1).',                    'es-AR'),
    ('COMPUTADORA',  'Computadora/CPU (Señario LSA Vol. 1).',          'es-AR')
ON CONFLICT (name, language) DO NOTHING;

-- Colores
INSERT INTO signs (name, description, language) VALUES
    ('ROJO',         'Color rojo (Señario LSA Vol. 1).',               'es-AR'),
    ('VERDE',        'Color verde (Señario LSA Vol. 1).',              'es-AR'),
    ('AZUL',         'Color azul (Señario LSA Vol. 1).',               'es-AR'),
    ('AMARILLO',     'Color amarillo (Señario LSA Vol. 1).',           'es-AR'),
    ('NARANJA',      'Color naranja (Señario LSA Vol. 1).',            'es-AR'),
    ('ROSA',         'Color rosa (Señario LSA Vol. 1).',               'es-AR'),
    ('VIOLETA',      'Color violeta (Señario LSA Vol. 1).',            'es-AR'),
    ('NEGRO',        'Color negro (Señario LSA Vol. 1).',              'es-AR'),
    ('BLANCO',       'Color blanco (Señario LSA Vol. 1).',             'es-AR')
ON CONFLICT (name, language) DO NOTHING;

-- Clima
INSERT INTO signs (name, description, language) VALUES
    ('SOL',          'Sol (Señario LSA Vol. 1).',                      'es-AR'),
    ('LLUVIA',       'Lluvia (Señario LSA Vol. 1).',                   'es-AR'),
    ('NUBE',         'Nube / nublado (Señario LSA Vol. 1).',           'es-AR'),
    ('VIENTO',       'Viento (Señario LSA Vol. 1).',                   'es-AR'),
    ('NIEVE',        'Nieve (Señario LSA Vol. 1).',                    'es-AR'),
    ('TORMENTA',     'Tormenta / rayo (Señario LSA Vol. 1).',          'es-AR'),
    ('FRIO',         'Frío (Señario LSA Vol. 1).',                     'es-AR'),
    ('CALOR',        'Calor (Señario LSA Vol. 1).',                    'es-AR')
ON CONFLICT (name, language) DO NOTHING;

-- Deportes y juegos (selección)
INSERT INTO signs (name, description, language) VALUES
    ('FUTBOL',       'Fútbol (Señario LSA Vol. 1).',                   'es-AR'),
    ('BASQUET',      'Básquetbol (Señario LSA Vol. 1).',               'es-AR'),
    ('NATACION',     'Natación (Señario LSA Vol. 1).',                 'es-AR'),
    ('TENIS',        'Tenis (Señario LSA Vol. 1).',                    'es-AR'),
    ('VOLEIBOL',     'Vóleibol (Señario LSA Vol. 1).',                 'es-AR'),
    ('CICLISMO',     'Ciclismo (Señario LSA Vol. 1).',                 'es-AR'),
    ('JUGAR',        'Jugar / juegos (Señario LSA Vol. 1).',           'es-AR')
ON CONFLICT (name, language) DO NOTHING;

-- Tiempo / cortesía frecuente (complemento útil)
INSERT INTO signs (name, description, language) VALUES
    ('PERDON',       'Disculpa / perdón (complemento LSA frecuente).', 'es-AR'),
    ('BIEN',         'Bien (complemento LSA frecuente).',              'es-AR'),
    ('MAL',          'Mal (complemento LSA frecuente).',               'es-AR'),
    ('COMO_ESTAS',   '¿Cómo estás? (complemento LSA frecuente).',      'es-AR')
ON CONFLICT (name, language) DO NOTHING;