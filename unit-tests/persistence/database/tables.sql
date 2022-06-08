DROP TABLE IF EXISTS `course_applications`;
DROP TABLE IF EXISTS `building_opening_hours`;
DROP TABLE IF EXISTS `building_pictures`;
DROP TABLE IF EXISTS `building_sponsors`;
DROP TABLE IF EXISTS `student_categories`;
DROP TABLE IF EXISTS `students`;
DROP TABLE IF EXISTS `countries`;
DROP TABLE IF EXISTS `buildings`;
DROP TABLE IF EXISTS `sponsors`;
DROP TABLE IF EXISTS `courses`;
DROP TABLE IF EXISTS `pictures`;


CREATE TABLE `sponsors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sponsors__NK` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `buildings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `buildings__NK` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `countries` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `timezone` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `countries__NK` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `courses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `courses__NK` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `student_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_categories__NK` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `firstname` varchar(255) NOT NULL,
  `lastname` varchar(255) NOT NULL,
  `year_of_birth` smallint unsigned  NOT NULL,
  `national_card_id` varchar(255) NOT NULL,
  `has_scholarship` boolean NOT NULL,
  `id_country` int(11) NOT NULL,
  `id_category` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `students__NK` (`national_card_id`, `id_country`),
  KEY `students__IDX_country_id` (`id_country`),
  CONSTRAINT `students__FK_country_id` FOREIGN KEY (`id_country`) REFERENCES `countries` (`id`),
  KEY `students__IDX_category_id` (`id_category`),
  CONSTRAINT `students__FK_category_id` FOREIGN KEY (`id_category`) REFERENCES `student_categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE `course_applications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_student` int(11) NOT NULL,
  `id_course` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `course_applications__NK` (`id_student`, `id_course`),
  KEY `id_course_applications__IDX_student` (`id_student`),
  CONSTRAINT `id_course_applications__FK_student` FOREIGN KEY (`id_student`) REFERENCES `students` (`id`),
  KEY `course_applications__IDX_course_id` (`id_course`),
  CONSTRAINT `course_applications__FK_course_id` FOREIGN KEY (`id_course`) REFERENCES `courses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `building_opening_hours` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_building` int(11) NOT NULL,
  `day` tinyint NOT NULL,
  `start` varchar(5) NOT NULL,
  `end` varchar(5) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `building_opening_hours__IDX_building_id` (`id_building`),
  CONSTRAINT `building_opening_hours__FK_building_id` FOREIGN KEY (`id_building`) REFERENCES `buildings` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `building_sponsors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_building` int(11) NOT NULL,
  `id_sponsor` int(11) NOT NULL,
  `contribution` int(5) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `building_sponsors__IDX_building_id` (`id_building`),
  CONSTRAINT `building_sponsors__FK_building_id` FOREIGN KEY (`id_building`) REFERENCES `buildings` (`id`),
  KEY `building_sponsors__IDX_sponsor_id` (`id_sponsor`),
  CONSTRAINT `building_sponsors__FK_sponsor_id` FOREIGN KEY (`id_sponsor`) REFERENCES `sponsors` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE `pictures` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL,
  `description` varchar(200) NOT NULL,
  `url` varchar(200) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `building_pictures` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_building` int(11) NOT NULL,
  `id_picture` int(11) NOT NULL,
  `status` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `building_pictures__IDX_building_id` (`id_building`),
  CONSTRAINT `building_pictures__FK_building_id` FOREIGN KEY (`id_building`) REFERENCES `buildings` (`id`),
  KEY `building_pictures__IDX_picture_id` (`id_picture`),
  CONSTRAINT `building_pictures__FK_picture_id` FOREIGN KEY (`id_picture`) REFERENCES `pictures` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



INSERT INTO `sponsors` (`name`) VALUES
('Rockefeller'),
('Carnegie');

INSERT INTO `buildings` (`name`, `status`) VALUES
('A', 'opened'),
('B', 'closed'),
('C', 'opened'),
('D', 'work in progress');

INSERT INTO `building_sponsors` (`id_building`, `id_sponsor`, `contribution`) VALUES
((SELECT id FROM buildings WHERE `name`='A'), (SELECT id FROM sponsors WHERE `name`='Rockefeller'), 100),
((SELECT id FROM buildings WHERE `name`='A'), (SELECT id FROM sponsors WHERE `name`='Carnegie'), 200),
((SELECT id FROM buildings WHERE `name`='B'), (SELECT id FROM sponsors WHERE `name`='Carnegie'), 500);

INSERT INTO `countries` (`name`, `timezone`) VALUES
('france', 'Europe/Paris'),
('espagne', 'Europe/Madrid');

INSERT INTO `student_categories` (`name`) VALUES
('Arts'),
('Sports');

INSERT INTO `courses` (`name`) VALUES
('Math 101'),
('Arts'),
('History');

INSERT INTO `students` (`firstname`, `lastname`, `year_of_birth`, `national_card_id`, `has_scholarship`, `id_country`, `id_category`) VALUES
('pierre', 'dupont', 1970, '12340', 1, (SELECT id FROM countries WHERE name = 'france'), (SELECT id FROM student_categories WHERE name = 'Sports')),
('jeanne', 'durant', 1971, '12345', 0, (SELECT id FROM countries WHERE name = 'france'), (SELECT id FROM student_categories WHERE name = 'Arts'));

INSERT INTO `building_opening_hours` (`id_building`, `day`, `start`, `end`) VALUES
((SELECT id FROM buildings WHERE name = "A"), 1, '10:00', '14:00'),
((SELECT id FROM buildings WHERE name = "A"), 1, '15:00', '23:00'),
((SELECT id FROM buildings WHERE name = "A"), 3, '8:00', '20:00'),
((SELECT id FROM buildings WHERE name = "C"), 1, '10:00', '14:00');

INSERT INTO `course_applications` (`id_student`, `id_course`) VALUES
((SELECT id FROM students WHERE national_card_id='12340' AND id_country=(SELECT id FROM countries WHERE name = 'france')), (SELECT id FROM courses WHERE name='Math 101')),
((SELECT id FROM students WHERE national_card_id='12345' AND id_country=(SELECT id FROM countries WHERE name = 'france')), (SELECT id FROM courses WHERE name='Math 101')),
((SELECT id FROM students WHERE national_card_id='12340' AND id_country=(SELECT id FROM countries WHERE name = 'france')), (SELECT id FROM courses WHERE name='Arts')),
((SELECT id FROM students WHERE national_card_id='12340' AND id_country=(SELECT id FROM countries WHERE name = 'france')), (SELECT id FROM courses WHERE name='History'));


INSERT INTO `pictures` (`name`, `description`, `url`) VALUES
('A', 'bla', 'https://harvardplanning.emuseum.com/internal/media/dispatcher/145625/preview'),
('B', 'bla', 'https://static.independent.co.uk/s3fs-public/thumbnails/image/2015/11/16/18/harvard.jpg?quality=75&width=990&auto=webp&crop=982:726,smart'),
('C', 'bla', 'https://blog.prepscholar.com/hs-fs/hubfs/feature_harvardbuilding2-1.jpg'),
('D', 'bla', 'https://i1.wp.com/www.thefrontdoorproject.com/wp-content/uploads/2016/03/IMG_4910.jpg');

INSERT INTO building_pictures (id_building, id_picture, status) VALUES
((SELECT id FROM buildings WHERE name = "A"), (SELECT id FROM pictures WHERE name = "A"), 'on' ),
((SELECT id FROM buildings WHERE name = "B"), (SELECT id FROM pictures WHERE name = "B"), 'on' ),
((SELECT id FROM buildings WHERE name = "C"), (SELECT id FROM pictures WHERE name = "C"), 'on' ),
((SELECT id FROM buildings WHERE name = "D"), (SELECT id FROM pictures WHERE name = "D"), 'on' )