# 🚌 GTFS-Project

## 📌 Proje Açıklaması (Türkçe)

Bu proje, toplu taşıma sistemleri için **GTFS (General Transit Feed Specification)** standardına uygun olarak veri yönetimi ve ücretlendirme (Fare V2) yapısını destekleyen bir uygulamadır. Kullanıcılar, kendi GTFS veri setlerini sisteme yükleyebilir, yönetebilir ve rota bazlı ücret hesaplamaları yapabilir.

### 🚀 Özellikler

- Kullanıcı bazlı kimlik doğrulama (JWT)
- GTFS veri seti içe aktarma (agency, routes, trips, stops, shapes, calendar, stoptimes)
- GTFS-Fare V2 uyumlu ücret yapısı:
  - Fare Products (Ürünler)
  - Fare Media (Bilet/kart gibi ödeme yöntemleri)
  - Rider Categories (Öğrenci, tam, yaşlı vb.)
  - Fare Leg Rules (Sabit veya mesafeye dayalı ücretlendirme)
  - Fare Transfer Rules (Ücretsiz veya zaman sınırlı aktarma)
- Rota/trip bazlı ücret hesaplama
- MySQL ile güçlü veri yönetimi

### 🛠️ Kullanılan Teknolojiler

- Node.js & Express.js
- MySQL
- JWT ile kimlik doğrulama
- GTFS veri yapısı ve standartları
- OSRM & OTP


## 📌 Project Description (English)

This project is an application that supports data management and fare structure (Fare V2) in accordance with **GTFS (General Transit Feed Specification)** standard for public transportation systems. Users can upload and manage their own GTFS data sets and perform route-based fare calculations.

### 🚀 Features

- User-based authentication (JWT)
- GTFS data set import (agency, routes, trips, stops, shapes, calendar, stoptimes)
- GTFS-Mouse V2 compatible fee structure:
  - Mouse Products (Products)
  - Mouse Media (Payment methods such as tickets/cards)
  - Rider Categories (Student, full, senior, etc.)
  - Fare Leg Rules (Fixed or distance-based pricing)
  - Fare Transfer Rules (Free or time-limited transfer)
- Route/trip based fare calculation
- Powerful data management with MySQL

### 🛠️ Technologies Used

- Node.js & Express.js
- MySQL
- Authentication with JWT
- GTFS data structure and standards
- OSRM & OTP
