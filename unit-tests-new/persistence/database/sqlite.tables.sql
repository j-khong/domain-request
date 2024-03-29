DROP TABLE IF EXISTS `course_applications`;
DROP TABLE IF EXISTS `building_opening_hours`;
DROP TABLE IF EXISTS `building_pictures`;
DROP TABLE IF EXISTS `building_sponsors`;
DROP TABLE IF EXISTS `student_categories`;
DROP TABLE IF EXISTS `students`;
DROP TABLE IF EXISTS `countries`;
DROP TABLE IF EXISTS `buildings`;
DROP TABLE IF EXISTS `building_categories`;
DROP TABLE IF EXISTS `architects`;
DROP TABLE IF EXISTS `ratings`;
DROP TABLE IF EXISTS `raters`;
DROP TABLE IF EXISTS `sponsors`;
DROP TABLE IF EXISTS `courses`;
DROP TABLE IF EXISTS `pictures`;


CREATE TABLE `sponsors` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  UNIQUE (`name`)
);


CREATE TABLE `raters` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  UNIQUE (`name`)
);

CREATE TABLE `ratings` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  `rate` varchar(255) NOT NULL,
  `id_rater` int(11) NOT NULL,
  UNIQUE (`rate`, `id_rater`),
  CONSTRAINT `ratings__FK_rater_id` FOREIGN KEY (`id_rater`) REFERENCES `raters` (`id`)
);

CREATE TABLE `architects` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `id_rating` int(11) NOT NULL,
  UNIQUE (`name`),
  CONSTRAINT `architects__FK_rating_id` FOREIGN KEY (`id_rating`) REFERENCES `ratings` (`id`)
);

CREATE TABLE `building_categories` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  UNIQUE (`name`)
);

CREATE TABLE `buildings` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `status` TEXT CHECK( status IN ('o','wip','c')) NOT NULL DEFAULT 'wip',
  `confidential` varchar(255) NOT NULL,
  `id_category` int(11) NOT NULL,
  `id_architect` int(11) NOT NULL,
  UNIQUE (`name`),
  CONSTRAINT `buildings__FK_category_id` FOREIGN KEY (`id_category`) REFERENCES `building_categories` (`id`),
  CONSTRAINT `buildings__FK_architect_id` FOREIGN KEY (`id_architect`) REFERENCES `architects` (`id`)
);

CREATE TABLE `countries` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `timezone` varchar(255) NOT NULL,
  UNIQUE (`name`)
);

CREATE TABLE `courses` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `published` date NOT NULL,
  `is_multilanguage` boolean NOT NULL,
  `status` TEXT CHECK( status IN ('o','p','c','v')) NOT NULL DEFAULT 'p',
  `seats_max` smallint unsigned NOT NULL,
  UNIQUE (`name`)
);

CREATE TABLE `student_categories` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `other_data` varchar(255) NOT NULL,
  UNIQUE (`name`)
);

CREATE TABLE `students` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  `firstname` varchar(255) NOT NULL,
  `lastname` varchar(255) NOT NULL,
  `year_of_birth` smallint unsigned NOT NULL,
  `national_card_id` varchar(255) NOT NULL,
  `has_scholarship` boolean NOT NULL,
  `id_country` int(11) NOT NULL,
  `id_category` int(11) NOT NULL,
  UNIQUE (`national_card_id`, `id_country`),
  CONSTRAINT `students__FK_country_id` FOREIGN KEY (`id_country`) REFERENCES `countries` (`id`),
  CONSTRAINT `students__FK_category_id` FOREIGN KEY (`id_category`) REFERENCES `student_categories` (`id`)
);

CREATE TABLE `course_applications` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  `id_student` int(11) NOT NULL,
  `id_course` int(11) NOT NULL,
  UNIQUE (`id_student`, `id_course`),
  CONSTRAINT `id_course_applications__FK_student` FOREIGN KEY (`id_student`) REFERENCES `students` (`id`),
  CONSTRAINT `course_applications__FK_course_id` FOREIGN KEY (`id_course`) REFERENCES `courses` (`id`)
);

CREATE TABLE `building_opening_hours` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  `id_building` int(11) NOT NULL,
  `day` tinyint NOT NULL,
  `start` varchar(5) NOT NULL,
  `end` varchar(5) NOT NULL,
  CONSTRAINT `building_opening_hours__FK_building_id` FOREIGN KEY (`id_building`) REFERENCES `buildings` (`id`)
);

CREATE TABLE `building_sponsors` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  `id_building` int(11) NOT NULL,
  `id_sponsor` int(11) NOT NULL,
  `contribution` int(5) NOT NULL,
  CONSTRAINT `building_sponsors__FK_building_id` FOREIGN KEY (`id_building`) REFERENCES `buildings` (`id`),
  CONSTRAINT `building_sponsors__FK_sponsor_id` FOREIGN KEY (`id_sponsor`) REFERENCES `sponsors` (`id`)
);


CREATE TABLE `pictures` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` varchar(20) NOT NULL,
  `description` varchar(200) NOT NULL,
  `url` varchar(200) NOT NULL
);

CREATE TABLE `building_pictures` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  `id_building` int(11) NOT NULL,
  `id_picture` int(11) NOT NULL,
  `status` varchar(255) NOT NULL,
  CONSTRAINT `building_pictures__FK_building_id` FOREIGN KEY (`id_building`) REFERENCES `buildings` (`id`),
  CONSTRAINT `building_pictures__FK_picture_id` FOREIGN KEY (`id_picture`) REFERENCES `pictures` (`id`)
);

INSERT INTO `sponsors` (`name`) VALUES
('Rockefeller'),
('Carnegie'),
('Ford'),
('Vanderbilt'),
('JP Morgan');

INSERT INTO `building_categories` (`name`) VALUES
('Colonial'),
('Rococco'),
('New Age');

INSERT INTO `raters` (`name`) VALUES
('S&P'),
('Moodys'),
('Fitch');

INSERT INTO `ratings` (`rate`, `id_rater`) VALUES
('A', (SELECT id FROM raters WHERE `name`='S&P')),
('A', (SELECT id FROM raters WHERE `name`='Moodys')),
('A', (SELECT id FROM raters WHERE `name`='Fitch')),
('B', (SELECT id FROM raters WHERE `name`='S&P')),
('B', (SELECT id FROM raters WHERE `name`='Moodys')),
('B', (SELECT id FROM raters WHERE `name`='Fitch')),
('C', (SELECT id FROM raters WHERE `name`='S&P')),
('C', (SELECT id FROM raters WHERE `name`='Moodys')),
('C', (SELECT id FROM raters WHERE `name`='Fitch'));
  
INSERT INTO `architects` (`name`, `id_rating`) VALUES
('Roberto', (SELECT id FROM ratings WHERE `rate`='A' AND `id_rater` = (SELECT id FROM raters WHERE `name`='S&P'))),
('Ricardo', (SELECT id FROM ratings WHERE `rate`='C' AND `id_rater` = (SELECT id FROM raters WHERE `name`='Fitch'))),
('Rodrigo', (SELECT id FROM ratings WHERE `rate`='A' AND `id_rater` = (SELECT id FROM raters WHERE `name`='Fitch'))),
('Armando', (SELECT id FROM ratings WHERE `rate`='B' AND `id_rater` = (SELECT id FROM raters WHERE `name`='Moodys')));


INSERT INTO `buildings` (`name`, `status`, `id_category`, `confidential`, `id_architect`) VALUES
('A', 'o', (SELECT id FROM building_categories WHERE `name`='Colonial'), 'confidential data', (SELECT id FROM architects WHERE `name`='Roberto')),
('B', 'c', (SELECT id FROM building_categories WHERE `name`='Rococco'), 'confidential data', (SELECT id FROM architects WHERE `name`='Ricardo')),
('C', 'o', (SELECT id FROM building_categories WHERE `name`='New Age'), 'confidential data', (SELECT id FROM architects WHERE `name`='Armando')),
('D', 'wip', (SELECT id FROM building_categories WHERE `name`='Colonial'), 'confidential data',(SELECT id FROM architects WHERE `name`='Rodrigo'));

INSERT INTO `building_sponsors` (`id_building`, `id_sponsor`, `contribution`) VALUES
((SELECT id FROM buildings WHERE `name`='A'), (SELECT id FROM sponsors WHERE `name`='Rockefeller'), 100),
((SELECT id FROM buildings WHERE `name`='A'), (SELECT id FROM sponsors WHERE `name`='Carnegie'), 200),
((SELECT id FROM buildings WHERE `name`='B'), (SELECT id FROM sponsors WHERE `name`='Carnegie'), 500);

INSERT INTO `countries` (`name`, `timezone`) VALUES
('france', 'Europe/Paris'),
('espagne', 'Europe/Madrid');

INSERT INTO `student_categories` (`name`, `other_data`) VALUES
('Arts', 'other_data'),
('Sports', 'other_data');

INSERT INTO `courses` (`name`, `published`, `is_multilanguage`, `status`, `seats_max`) VALUES
('Math 101', '2020-01-01', true, 'o', 200),
('Arts', '2020-02-01', false, 'c', 400),
('History', '2020-03-01', true, 'v', 500);
 
INSERT INTO `students` (`firstname`, `lastname`, `year_of_birth`, `national_card_id`, `has_scholarship`, `id_country`, `id_category`) VALUES
('pierre', 'dupont', 1970, '12340', 1, (SELECT id FROM countries WHERE name = 'france'), (SELECT id FROM student_categories WHERE name = 'Sports')),
('jeanne', 'durant', 1971, '12345', 0, (SELECT id FROM countries WHERE name = 'france'), (SELECT id FROM student_categories WHERE name = 'Arts'));

INSERT INTO `building_opening_hours` (`id_building`, `day`, `start`, `end`) VALUES
((SELECT id FROM buildings WHERE name = 'A'), 1, '10:00', '14:00'),
((SELECT id FROM buildings WHERE name = 'A'), 1, '15:00', '23:00'),
((SELECT id FROM buildings WHERE name = 'A'), 3, '8:00', '20:00'),
((SELECT id FROM buildings WHERE name = 'C'), 1, '10:00', '14:00');

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
((SELECT id FROM buildings WHERE name = 'A'), (SELECT id FROM pictures WHERE name = 'A'), 'on' ),
((SELECT id FROM buildings WHERE name = 'A'), (SELECT id FROM pictures WHERE name = 'B'), 'on' ),
((SELECT id FROM buildings WHERE name = 'A'), (SELECT id FROM pictures WHERE name = 'C'), 'on' ),
((SELECT id FROM buildings WHERE name = 'A'), (SELECT id FROM pictures WHERE name = 'D'), 'on' ),
((SELECT id FROM buildings WHERE name = 'B'), (SELECT id FROM pictures WHERE name = 'B'), 'on' ),
((SELECT id FROM buildings WHERE name = 'B'), (SELECT id FROM pictures WHERE name = 'C'), 'on' ),
((SELECT id FROM buildings WHERE name = 'B'), (SELECT id FROM pictures WHERE name = 'D'), 'on' ),
((SELECT id FROM buildings WHERE name = 'C'), (SELECT id FROM pictures WHERE name = 'C'), 'on' ),
((SELECT id FROM buildings WHERE name = 'C'), (SELECT id FROM pictures WHERE name = 'D'), 'on' ),
((SELECT id FROM buildings WHERE name = 'D'), (SELECT id FROM pictures WHERE name = 'D'), 'on' );
