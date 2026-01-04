-- Script para agregar soporte de audio_type sin cambiar la estructura principal

-- Agregar columna audio_type si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='anime' AND column_name='audio_type') THEN
        ALTER TABLE anime ADD COLUMN audio_type VARCHAR(20) DEFAULT 'SUBTITULADO';
        ALTER TABLE anime ADD CONSTRAINT chk_audio_type 
            CHECK (audio_type IN ('LATINO', 'SUBTITULADO'));
    END IF;
END $$;

-- Crear índice para búsquedas rápidas por audio_type
CREATE INDEX IF NOT EXISTS idx_anime_audio_type ON anime(audio_type);

-- Actualizar animes existentes (por defecto SUBTITULADO)
UPDATE anime SET audio_type = 'SUBTITULADO' WHERE audio_type IS NULL;

COMMENT ON COLUMN anime.audio_type IS 'Tipo de audio: LATINO (doblaje latino) o SUBTITULADO (audio original con subtítulos)';
