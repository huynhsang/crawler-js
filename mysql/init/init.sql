CREATE SCHEMA IF NOT EXISTS crawler;

USE crawler;
CREATE TABLE IF NOT EXISTS contacts
(
    id INT NOT NULL AUTO_INCREMENT,
    phone varchar(20) NOT NULL,
    link varchar(255) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (phone)
);