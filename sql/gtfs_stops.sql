-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: gtfs_test
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
  `stop_code` varchar(255) DEFAULT NULL,
  `stop_name` varchar(255) NOT NULL,
  `stop_desc` text,
  `stop_lat` double NOT NULL,
  `stop_lon` double NOT NULL,
  `zone_id` varchar(255) DEFAULT NULL,
  `stop_url` varchar(255) DEFAULT NULL,
  `location_type` int DEFAULT NULL,
  `parent_station` varchar(255) DEFAULT NULL,
  `stop_timezone` varchar(255) DEFAULT NULL,
  `wheelchair_boarding` int DEFAULT NULL,
  PRIMARY KEY (`stop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stops`
--

LOCK TABLES `stops` WRITE;
/*!40000 ALTER TABLE `stops` DISABLE KEYS */;
INSERT INTO `stops` VALUES ('AMV',NULL,'Amargosa Valley (Demo)','',36.641496,-116.40094,'',NULL,NULL,NULL,NULL,NULL),('BEATTY_AIRPORT',NULL,'Nye County Airport (Demo)','',36.868446,-116.784582,'','\r',NULL,NULL,NULL,NULL),('BULLFROG',NULL,'Bullfrog (Demo)','',36.88108,-116.81797,'','\r',NULL,NULL,NULL,NULL),('DADAN',NULL,'Doing Ave / D Ave N (Demo)','',36.909489,-116.768242,'','\r',NULL,NULL,NULL,NULL),('EMSI',NULL,'E Main St / S Irving St (Demo)','',36.905697,-116.76218,'','\r',NULL,NULL,NULL,NULL),('FUR_CREEK_RES',NULL,'Furnace Creek Resort (Demo)','',36.425288,-117.133162,'','\r',NULL,NULL,NULL,NULL),('NADAV',NULL,'North Ave / D Ave N (Demo)','',36.914893,-116.76821,'','\r',NULL,NULL,NULL,NULL),('NANAA',NULL,'North Ave / N A Ave (Demo)','',36.914944,-116.761472,'','\r',NULL,NULL,NULL,NULL),('STAGECOACH',NULL,'Stagecoach Hotel & Casino (Demo)','',36.915682,-116.751677,'','\r',NULL,NULL,NULL,NULL);
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

-- Dump completed on 2025-02-17 14:18:19
