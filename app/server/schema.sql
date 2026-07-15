CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  daily_goal INT NOT NULL DEFAULT 50,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS courses (
  id VARCHAR(20) PRIMARY KEY,
  subject VARCHAR(60) NOT NULL,
  subject_tone ENUM('blue','cyan','violet','amber') NOT NULL,
  title VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  order_index INT NOT NULL,
  prereq_course_id VARCHAR(20) NULL,
  CONSTRAINT fk_courses_prereq FOREIGN KEY (prereq_course_id) REFERENCES courses(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS units (
  id VARCHAR(30) PRIMARY KEY,
  course_id VARCHAR(20) NOT NULL,
  name VARCHAR(120) NOT NULL,
  order_index INT NOT NULL,
  CONSTRAINT fk_units_course FOREIGN KEY (course_id) REFERENCES courses(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS lessons (
  id VARCHAR(30) PRIMARY KEY,
  unit_id VARCHAR(30) NOT NULL,
  title VARCHAR(120) NOT NULL,
  mins INT NOT NULL,
  order_index INT NOT NULL,
  content JSON NOT NULL,
  CONSTRAINT fk_lessons_unit FOREIGN KEY (unit_id) REFERENCES units(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS lesson_completions (
  user_id INT NOT NULL,
  lesson_id VARCHAR(30) NOT NULL,
  completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, lesson_id),
  CONSTRAINT fk_lc_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_lc_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS xp_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  lesson_id VARCHAR(30) NULL,
  amount INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_xp_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_xp_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS exercises (
  id VARCHAR(40) PRIMARY KEY,
  lesson_id VARCHAR(30) NOT NULL,
  order_index INT NOT NULL,
  type ENUM('choice','blanks','order','match') NOT NULL,
  prompt TEXT NOT NULL,
  payload JSON NOT NULL,
  answer JSON NOT NULL,
  explain_ok TEXT NOT NULL,
  explain_bad TEXT NOT NULL,
  CONSTRAINT fk_ex_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS answer_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  exercise_id VARCHAR(40) NOT NULL,
  context ENUM('lesson','review') NOT NULL DEFAULT 'lesson',
  correct TINYINT(1) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_aa_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_aa_exercise FOREIGN KEY (exercise_id) REFERENCES exercises(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS quiz_questions;

CREATE TABLE IF NOT EXISTS streak_shields (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  protected_day DATE NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_shield (user_id, protected_day),
  CONSTRAINT fk_shield_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
