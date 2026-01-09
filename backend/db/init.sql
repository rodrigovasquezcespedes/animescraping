-- ======================================================
-- SERVIDORES DE EPISODIO
-- ======================================================

CREATE TABLE IF NOT EXISTS episode_server (
  id SERIAL PRIMARY KEY,
  episode_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (episode_id, url),
  FOREIGN KEY (episode_id) REFERENCES episode(id) ON DELETE CASCADE
);
-- ======================================================
-- PROYECTO: ANIME SCRAPING
-- MOTOR: PostgreSQL
-- ESQUEMA NORMALIZADO (3FN)
-- ======================================================

-- ---------- CREAR BASE DE DATOS ----------
-- Ejecutar como superusuario
-- CREATE DATABASE animescraping;
-- \c animescraping;

-- ---------- EXTENSIÓN PARA UUID ----------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ======================================================
-- CATÁLOGOS
-- ======================================================

-- ---------- ESTADOS DE ANIME ----------
CREATE TABLE IF NOT EXISTS anime_status (
  id SERIAL PRIMARY KEY,
  name VARCHAR(20) UNIQUE NOT NULL,
  CONSTRAINT chk_anime_status
    CHECK (name IN ('EN_EMISION', 'FINALIZADO'))
);

-- ======================================================
-- ENTIDADES PRINCIPALES
-- ======================================================

-- ---------- ANIME ----------
CREATE TABLE IF NOT EXISTS anime (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  image_url VARCHAR(500),
  rating DECIMAL(3,1) CHECK (rating BETWEEN 0 AND 10),
  episodes_count INT,
  status_id INT NOT NULL,
  release_date VARCHAR(32),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_anime_status
    FOREIGN KEY (status_id)
    REFERENCES anime_status(id)
);

-- ---------- GÉNEROS ----------
CREATE TABLE IF NOT EXISTS genre (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

-- ---------- RELACIÓN ANIME - GÉNERO ----------
CREATE TABLE IF NOT EXISTS anime_genre (
  anime_id INT NOT NULL,
  genre_id INT NOT NULL,
  PRIMARY KEY (anime_id, genre_id),
  FOREIGN KEY (anime_id) REFERENCES anime(id) ON DELETE CASCADE,
  FOREIGN KEY (genre_id) REFERENCES genre(id) ON DELETE CASCADE
);

-- ---------- EPISODIOS ----------
CREATE TABLE IF NOT EXISTS episode (
  id SERIAL PRIMARY KEY,
  anime_id INT NOT NULL,
  episode_number INT NOT NULL,
  title VARCHAR(255),
  description TEXT,
  url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_episode UNIQUE (anime_id, episode_number),
  FOREIGN KEY (anime_id) REFERENCES anime(id) ON DELETE CASCADE
);

-- ======================================================
-- USUARIOS
-- ======================================================

CREATE TABLE IF NOT EXISTS app_user (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ======================================================
-- FAVORITOS CON USUARIO
-- ======================================================

CREATE TABLE IF NOT EXISTS favorite (
  user_id INT NOT NULL,
  anime_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, anime_id),
  FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE,
  FOREIGN KEY (anime_id) REFERENCES anime(id) ON DELETE CASCADE
);

-- ======================================================
-- SESIONES ANÓNIMAS
-- ======================================================

CREATE TABLE IF NOT EXISTS anonymous_session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS anonymous_favorite (
  session_id UUID NOT NULL,
  anime_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (session_id, anime_id),
  FOREIGN KEY (session_id) REFERENCES anonymous_session(id) ON DELETE CASCADE,
  FOREIGN KEY (anime_id) REFERENCES anime(id) ON DELETE CASCADE
);

-- ======================================================
-- ÍNDICES
-- ======================================================

CREATE INDEX IF NOT EXISTS idx_anime_title ON anime(title);
CREATE INDEX IF NOT EXISTS idx_anime_rating ON anime(rating);
CREATE INDEX IF NOT EXISTS idx_episode_anime ON episode(anime_id);
CREATE INDEX IF NOT EXISTS idx_anime_genre_genre ON anime_genre(genre_id);
CREATE INDEX IF NOT EXISTS idx_favorite_user ON favorite(user_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_favorite_session ON anonymous_favorite(session_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_favorite_anime ON anonymous_favorite(anime_id);
