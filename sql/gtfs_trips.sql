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
-- Table structure for table `trips`
--

DROP TABLE IF EXISTS `trips`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trips` (
  `route_id` varchar(255) NOT NULL,
  `service_id` varchar(255) NOT NULL,
  `trip_id` varchar(255) NOT NULL,
  `trip_headsign` varchar(255) DEFAULT NULL,
  `trip_short_name` varchar(255) DEFAULT NULL,
  `direction_id` tinyint DEFAULT NULL,
  `block_id` varchar(255) DEFAULT NULL,
  `shape_id` varchar(255) DEFAULT NULL,
  `wheelchair_accessible` tinyint DEFAULT NULL,
  `bikes_allowed` tinyint DEFAULT NULL,
  `import_id` int DEFAULT NULL,
  PRIMARY KEY (`trip_id`),
  KEY `route_id` (`route_id`),
  KEY `service_id` (`service_id`),
  KEY `shape_id` (`shape_id`),
  KEY `fk_trips_imported_data` (`import_id`),
  CONSTRAINT `fk_trips_imported_data` FOREIGN KEY (`import_id`) REFERENCES `imported_data` (`import_id`) ON DELETE CASCADE,
  CONSTRAINT `trips_ibfk_1` FOREIGN KEY (`route_id`) REFERENCES `routes` (`route_id`),
  CONSTRAINT `trips_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `calendar` (`service_id`),
  CONSTRAINT `trips_ibfk_3` FOREIGN KEY (`shape_id`) REFERENCES `shapes` (`shape_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trips`
--

LOCK TABLES `trips` WRITE;
/*!40000 ALTER TABLE `trips` DISABLE KEYS */;
INSERT INTO `trips` VALUES ('AAMV','WE','AAMV1','to Amargosa Valley',NULL,0,NULL,NULL,NULL,NULL,15),('AAMV','WE','AAMV2','to Airport',NULL,1,NULL,NULL,NULL,NULL,15),('AAMV','WE','AAMV3','to Amargosa Valley',NULL,0,NULL,NULL,NULL,NULL,15),('AAMV','WE','AAMV4','to Airport',NULL,1,NULL,NULL,NULL,NULL,15),('AB','FULLW','AB1','to Bullfrog',NULL,0,'1',NULL,NULL,NULL,15),('AB','FULLW','AB2','to Airport',NULL,1,'2',NULL,NULL,NULL,15),('BFC','FULLW','BFC1','to Furnace Creek Resort',NULL,0,'1',NULL,NULL,NULL,15),('BFC','FULLW','BFC2','to Bullfrog',NULL,1,'2',NULL,NULL,NULL,15),('CITY','FULLW','CITY1',NULL,NULL,0,NULL,NULL,NULL,NULL,15),('CITY','FULLW','CITY2',NULL,NULL,1,NULL,NULL,NULL,NULL,15),('STBA','FULLW','STBA','Shuttle',NULL,NULL,NULL,NULL,NULL,NULL,15);
/*!40000 ALTER TABLE `trips` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-02-20 16:57:56
