DROP TABLE IF EXISTS `course_application`;
DROP TABLE IF EXISTS `student`;
DROP TABLE IF EXISTS `country`;
DROP TABLE IF EXISTS `building`;
DROP TABLE IF EXISTS `course`;
DROP TABLE IF EXISTS `student_category`;
DROP TABLE IF EXISTS `building_opening_hours`;


CREATE TABLE `building` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `building__NK` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `country` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `timezone` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `country__NK` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `course` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `course__NK` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `student_category` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_category__NK` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `student` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `firstname` varchar(255) NOT NULL,
  `lastname` varchar(255) NOT NULL,
  `year_of_birth` unsigned smallint NOT NULL,
  `national_card_id` varchar(255) NOT NULL,
  `has_scholarship` boolean NOT NULL,
  `country_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student__NK` (`national_card_id`, `country_id`),
  KEY `student__IDX_country_id` (`country_id`),
  CONSTRAINT `student__FK_country_id` FOREIGN KEY (`country_id`) REFERENCES `country` (`id`),
  KEY `student__IDX_category_id` (`category_id`),
  CONSTRAINT `student__FK_category_id` FOREIGN KEY (`category_id`) REFERENCES `student_category` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE `course_application` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `course_application__NK` (`student_id`, `course_id`),
  KEY `course_application__IDX_student_id` (`student_id`),
  CONSTRAINT `course_application__FK_student_id` FOREIGN KEY (`student_id`) REFERENCES `student` (`id`),
  KEY `course_application__IDX_course_id` (`course_id`),
  CONSTRAINT `course_application__FK_course_id` FOREIGN KEY (`course_id`) REFERENCES `course` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `building_opening_hours` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `building_id` int(11) NOT NULL,
  `day` tinyint NOT NULL,
  `start` varchar(5) NOT NULL,
  `end` varchar(5) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `building_opening_hours__IDX_building_id` (`building_id`),
  CONSTRAINT `building_opening_hours__FK_building_id` FOREIGN KEY (`building_id`) REFERENCES `building` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


INSERT INTO `country` (`name`, `timezone`) VALUES
('france', 'Europe/Paris');

INSERT INTO `course` (`name`) VALUES
('Math 101');

INSERT INTO `category` (`name`) VALUES
('Arts'), ('Sports');