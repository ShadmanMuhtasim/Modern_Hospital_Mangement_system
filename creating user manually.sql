CREATE LOGIN hospital_user WITH PASSWORD = 'Hosp!tal2026Strong#Pass';
GO
USE ModernHospitalDB;
GO
CREATE USER hospital_user FOR LOGIN hospital_user;
GO
EXEC sp_addrolemember 'db_owner', 'hospital_user';
GO