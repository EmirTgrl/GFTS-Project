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
  `import_id` int DEFAULT NULL,
  PRIMARY KEY (`stop_id`),
  KEY `parent_station` (`parent_station`),
  KEY `fk_stops_imported_data` (`import_id`),
  CONSTRAINT `fk_stops_imported_data` FOREIGN KEY (`import_id`) REFERENCES `imported_data` (`import_id`) ON DELETE CASCADE,
  CONSTRAINT `stops_ibfk_1` FOREIGN KEY (`parent_station`) REFERENCES `stops` (`stop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stops`
--

LOCK TABLES `stops` WRITE;
/*!40000 ALTER TABLE `stops` DISABLE KEYS */;
INSERT INTO `stops` VALUES ('AMV',NULL,'Amargosa Valley (Demo)',NULL,36.641496,-116.400940,NULL,NULL,NULL,NULL,NULL,NULL,NULL,15),('BEATTY_AIRPORT',NULL,'Nye County Airport (Demo)',NULL,36.868446,-116.784582,NULL,NULL,NULL,NULL,NULL,NULL,NULL,15),('BULLFROG',NULL,'Bullfrog (Demo)',NULL,36.881080,-116.817970,NULL,NULL,NULL,NULL,NULL,NULL,NULL,15),('DADAN',NULL,'Doing Ave / D Ave N (Demo)',NULL,36.909489,-116.768242,NULL,NULL,NULL,NULL,NULL,NULL,NULL,15),('EMSI',NULL,'E Main St / S Irving St (Demo)',NULL,36.905697,-116.762180,NULL,NULL,NULL,NULL,NULL,NULL,NULL,15),('FUR_CREEK_RES',NULL,'Furnace Creek Resort (Demo)',NULL,36.425288,-117.133162,NULL,NULL,NULL,NULL,NULL,NULL,NULL,15),('NADAV',NULL,'North Ave / D Ave N (Demo)',NULL,36.914893,-116.768210,NULL,NULL,NULL,NULL,NULL,NULL,NULL,15),('NANAA',NULL,'North Ave / N A Ave (Demo)',NULL,36.914944,-116.761472,NULL,NULL,NULL,NULL,NULL,NULL,NULL,15),('STAGECOACH',NULL,'Stagecoach Hotel & Casino (Demo)',NULL,36.915682,-116.751677,NULL,NULL,NULL,NULL,NULL,NULL,NULL,15);
/*!40000 ALTER TABLE `stops` ENABLE KEYS */;
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
