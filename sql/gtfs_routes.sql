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
-- Table structure for table `routes`
--

DROP TABLE IF EXISTS `routes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `routes` (
  `route_id` varchar(255) NOT NULL,
  `agency_id` varchar(255) DEFAULT NULL,
  `route_short_name` varchar(255) DEFAULT NULL,
  `route_long_name` varchar(255) DEFAULT NULL,
  `route_desc` text,
  `route_type` tinyint NOT NULL,
  `route_url` varchar(255) DEFAULT NULL,
  `route_color` varchar(6) DEFAULT NULL,
  `route_text_color` varchar(6) DEFAULT NULL,
  `route_sort_order` int DEFAULT NULL,
  `continuous_pickup` tinyint DEFAULT NULL,
  `continuous_drop_off` tinyint DEFAULT NULL,
  `import_id` int DEFAULT NULL,
  PRIMARY KEY (`route_id`),
  KEY `fk_routes_agency` (`agency_id`),
  KEY `fk_routes_imported_data` (`import_id`),
  CONSTRAINT `fk_routes_imported_data` FOREIGN KEY (`import_id`) REFERENCES `imported_data` (`import_id`) ON DELETE CASCADE,
  CONSTRAINT `routes_ibfk_1` FOREIGN KEY (`agency_id`) REFERENCES `agency` (`agency_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `routes`
--

LOCK TABLES `routes` WRITE;
/*!40000 ALTER TABLE `routes` DISABLE KEYS */;
INSERT INTO `routes` VALUES ('AAMV','DTA','50','Airport - Amargosa Valley',NULL,3,NULL,NULL,NULL,NULL,NULL,NULL,15),('AB','DTA','10','Airport - Bullfrog',NULL,3,NULL,NULL,NULL,NULL,NULL,NULL,15),('BFC','DTA','20','Bullfrog - Furnace Creek Resort',NULL,3,NULL,NULL,NULL,NULL,NULL,NULL,15),('CITY','DTA','40','City',NULL,3,NULL,NULL,NULL,NULL,NULL,NULL,15),('STBA','DTA','30','Stagecoach - Airport Shuttle',NULL,3,NULL,NULL,NULL,NULL,NULL,NULL,15);
/*!40000 ALTER TABLE `routes` ENABLE KEYS */;
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
