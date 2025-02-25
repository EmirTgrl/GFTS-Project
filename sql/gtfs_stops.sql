-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: gtfs
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `stops`
--

DROP TABLE IF EXISTS `stops`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stops` (
  `stop_id` varchar(255) NOT NULL,
  `stop_code` varchar(50) DEFAULT NULL,
  `stop_name` varchar(255) NOT NULL,
  `stop_desc` text,
  `stop_lat` decimal(10,6) NOT NULL,
  `stop_lon` decimal(10,6) NOT NULL,
  `zone_id` varchar(255) DEFAULT NULL,
  `stop_url` varchar(255) DEFAULT NULL,
  `location_type` tinyint DEFAULT NULL,
  `parent_station` varchar(255) DEFAULT NULL,
  `stop_timezone` varchar(50) DEFAULT NULL,
  `wheelchair_boarding` tinyint DEFAULT NULL,
  `platform_code` varchar(255) DEFAULT NULL,
  `project_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  PRIMARY KEY (`stop_id`),
  KEY `parent_station` (`parent_station`),
  KEY `fk_stops_projects` (`project_id`),
  KEY `fk_stops_users` (`user_id`),
  CONSTRAINT `fk_stops_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_stops_projects` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `stops_ibfk_1` FOREIGN KEY (`parent_station`) REFERENCES `stops` (`stop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;



/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-02-20 16:57:56
