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
-- Table structure for table `stop_times`
--

DROP TABLE IF EXISTS `stop_times`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stop_times` (
  `trip_id` varchar(255) NOT NULL,
  `arrival_time` varchar(8) NOT NULL,
  `departure_time` varchar(8) NOT NULL,
  `stop_id` varchar(255) NOT NULL,
  `stop_sequence` int NOT NULL,
  `stop_headsign` varchar(255) DEFAULT NULL,
  `pickup_type` tinyint DEFAULT NULL,
  `drop_off_type` int DEFAULT NULL,
  `shape_dist_travelled` float DEFAULT NULL,
  `project_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  PRIMARY KEY (`trip_id`,`stop_sequence`),
  KEY `stop_id` (`stop_id`),
  KEY `project_id` (`project_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_stop_times_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`), 
  CONSTRAINT `stop_times_ibfk_1` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`trip_id`),
  CONSTRAINT `stop_times_ibfk_2` FOREIGN KEY (`stop_id`) REFERENCES `stops` (`stop_id`),
  CONSTRAINT `stop_times_ibfk_3` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stop_times`


/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-02-20 16:57:57
