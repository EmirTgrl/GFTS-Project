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
-- Table structure for table `fare_leg_rules`
--

DROP TABLE IF EXISTS `fare_leg_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fare_leg_rules` (
  `leg_group_id` varchar(100) NOT NULL,
  `network_id` varchar(100) DEFAULT NULL,
  `from_area_id` varchar(100) DEFAULT NULL,
  `to_area_id` varchar(100) DEFAULT NULL,
  `from_timeframe_group_id` varchar(100) DEFAULT NULL,
  `to_timeframe_group_id` varchar(100) DEFAULT NULL,
  `fare_product_id` varchar(100) NOT NULL,
  `user_id` int NOT NULL,
  `project_id` int NOT NULL,
  KEY `network_id` (`network_id`),
  KEY `from_area_id` (`from_area_id`),
  KEY `to_area_id` (`to_area_id`),
  KEY `from_timeframe_group_id` (`from_timeframe_group_id`),
  KEY `to_timeframe_group_id` (`to_timeframe_group_id`),
  KEY `project_id` (`project_id`),
  KEY `idx_fare_leg_rules_user_project` (`user_id`,`project_id`),
  KEY `idx_fare_leg_rules_fare_product` (`fare_product_id`,`project_id`),
  KEY `idx_leg_group_id` (`leg_group_id`),
  CONSTRAINT `fare_leg_rules_ibfk_1` FOREIGN KEY (`network_id`) REFERENCES `networks` (`network_id`) ON DELETE SET NULL,
  CONSTRAINT `fare_leg_rules_ibfk_2` FOREIGN KEY (`from_area_id`) REFERENCES `areas` (`area_id`) ON DELETE SET NULL,
  CONSTRAINT `fare_leg_rules_ibfk_3` FOREIGN KEY (`to_area_id`) REFERENCES `areas` (`area_id`) ON DELETE SET NULL,
  CONSTRAINT `fare_leg_rules_ibfk_4` FOREIGN KEY (`from_timeframe_group_id`) REFERENCES `timeframes` (`timeframe_group_id`) ON DELETE SET NULL,
  CONSTRAINT `fare_leg_rules_ibfk_5` FOREIGN KEY (`to_timeframe_group_id`) REFERENCES `timeframes` (`timeframe_group_id`) ON DELETE SET NULL,
  CONSTRAINT `fare_leg_rules_ibfk_6` FOREIGN KEY (`fare_product_id`) REFERENCES `fare_products` (`fare_product_id`) ON DELETE CASCADE,
  CONSTRAINT `fare_leg_rules_ibfk_7` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fare_leg_rules_ibfk_8` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fare_leg_rules`
--

LOCK TABLES `fare_leg_rules` WRITE;
/*!40000 ALTER TABLE `fare_leg_rules` DISABLE KEYS */;
/*!40000 ALTER TABLE `fare_leg_rules` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-04-23  0:05:00
