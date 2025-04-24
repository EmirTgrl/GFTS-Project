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
-- Table structure for table `fare_leg_join_rules`
--

DROP TABLE IF EXISTS `fare_leg_join_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fare_leg_join_rules` (
  `from_network_id` varchar(100) NOT NULL,
  `to_network_id` varchar(100) NOT NULL,
  `from_stop_id` varchar(100) NOT NULL,
  `to_stop_id` varchar(100) NOT NULL,
  `user_id` int NOT NULL,
  `project_id` int NOT NULL,
  KEY `from_network_id` (`from_network_id`),
  KEY `to_network_id` (`to_network_id`),
  KEY `from_stop_id` (`from_stop_id`),
  KEY `to_stop_id` (`to_stop_id`),
  KEY `project_id` (`project_id`),
  KEY `idx_fare_leg_join_rules_user_project` (`user_id`,`project_id`),
  CONSTRAINT `fare_leg_join_rules_ibfk_1` FOREIGN KEY (`from_network_id`) REFERENCES `networks` (`network_id`) ON DELETE CASCADE,
  CONSTRAINT `fare_leg_join_rules_ibfk_2` FOREIGN KEY (`to_network_id`) REFERENCES `networks` (`network_id`) ON DELETE CASCADE,
  CONSTRAINT `fare_leg_join_rules_ibfk_3` FOREIGN KEY (`from_stop_id`) REFERENCES `stops` (`stop_id`) ON DELETE CASCADE,
  CONSTRAINT `fare_leg_join_rules_ibfk_4` FOREIGN KEY (`to_stop_id`) REFERENCES `stops` (`stop_id`) ON DELETE CASCADE,
  CONSTRAINT `fare_leg_join_rules_ibfk_5` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fare_leg_join_rules_ibfk_6` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fare_leg_join_rules`
--

LOCK TABLES `fare_leg_join_rules` WRITE;
/*!40000 ALTER TABLE `fare_leg_join_rules` DISABLE KEYS */;
/*!40000 ALTER TABLE `fare_leg_join_rules` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-04-23  0:05:02
