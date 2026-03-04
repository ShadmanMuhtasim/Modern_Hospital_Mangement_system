/* =========================================================
   04_test_queries.sql
   Teacher-friendly queries to verify features
   ========================================================= */
USE ModernHospitalDB;
GO

/* 1) Show all departments */
SELECT * FROM dbo.Departments;

/* 2) Show all roles */
SELECT * FROM dbo.Roles;

/* 3) List active users + their roles */
SELECT u.user_id, u.full_name, u.email, u.account_status,
       STRING_AGG(r.role_name, ', ') AS roles
FROM dbo.Users u
LEFT JOIN dbo.UserRoles ur ON ur.user_id = u.user_id
LEFT JOIN dbo.Roles r ON r.role_id = ur.role_id
GROUP BY u.user_id, u.full_name, u.email, u.account_status
ORDER BY u.user_id;

/* 4) Available beds by department and unit type */
SELECT d.dept_name, cu.unit_type,
       SUM(CASE WHEN b.status='Available' THEN 1 ELSE 0 END) AS available_beds,
       COUNT(*) AS total_beds
FROM dbo.Beds b
JOIN dbo.CareUnits cu ON cu.care_unit_id = b.care_unit_id
JOIN dbo.Departments d ON d.department_id = cu.department_id
GROUP BY d.dept_name, cu.unit_type
ORDER BY d.dept_name, cu.unit_type;

/* 5) Example: Create a patient user + patient profile (demo) */
IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE email='patient1@demo.com')
BEGIN
    INSERT INTO dbo.Users(email, password_hash, full_name, account_status)
    VALUES ('patient1@demo.com','HASH','Patient One','Active');

    DECLARE @uid INT = SCOPE_IDENTITY();
    DECLARE @patientRole INT = (SELECT role_id FROM dbo.Roles WHERE role_name='Patient');

    INSERT INTO dbo.UserRoles(user_id, role_id) VALUES (@uid, @patientRole);

    INSERT INTO dbo.Patients(patient_id, blood_group, emergency_contact_name, emergency_contact_phone)
    VALUES (@uid, 'O+', 'Father', '01700000000');
END
GO

/* 6) Admit the patient into Cardiology needing ICU (demo) */
DECLARE @patientId INT = (SELECT TOP 1 user_id FROM dbo.Users WHERE email='patient1@demo.com');
DECLARE @cardioId INT  = (SELECT TOP 1 department_id FROM dbo.Departments WHERE dept_name='Cardiology');

INSERT INTO dbo.Admissions(patient_id, department_id, status, care_level_requested, diagnosis_initial)
VALUES (@patientId, @cardioId, 'Admitted', 'ICU', 'Chest pain');

/* 7) Assign an available ICU bed in Cardiology to the latest admission (demo) */
DECLARE @admId INT = (SELECT TOP 1 admission_id FROM dbo.Admissions WHERE patient_id=@patientId ORDER BY admission_id DESC);

DECLARE @bedId INT =
(
    SELECT TOP 1 b.bed_id
    FROM dbo.Beds b
    JOIN dbo.CareUnits cu ON cu.care_unit_id = b.care_unit_id
    WHERE cu.department_id=@cardioId AND cu.unit_type='ICU' AND b.status='Available'
    ORDER BY b.bed_id
);

DECLARE @adminId INT = (SELECT TOP 1 user_id FROM dbo.Users WHERE email='admin@hospital.com');

IF @bedId IS NOT NULL
BEGIN
    INSERT INTO dbo.BedAssignments(admission_id, bed_id, assigned_by_user_id)
    VALUES (@admId, @bedId, @adminId);

    UPDATE dbo.Beds SET status='Occupied' WHERE bed_id=@bedId;
END
ELSE
BEGIN
    PRINT 'No available ICU bed found in Cardiology.';
END

/* 8) Show admitted patients in Cardiology + their bed (department filter requirement) */
SELECT a.admission_id, u.full_name AS patient_name, d.dept_name,
       a.status, a.care_level_requested,
       b.bed_code, cu.unit_type
FROM dbo.Admissions a
JOIN dbo.Patients p ON p.patient_id = a.patient_id
JOIN dbo.Users u ON u.user_id = p.patient_id
JOIN dbo.Departments d ON d.department_id = a.department_id
LEFT JOIN dbo.BedAssignments ba ON ba.admission_id = a.admission_id AND ba.released_at IS NULL
LEFT JOIN dbo.Beds b ON b.bed_id = ba.bed_id
LEFT JOIN dbo.CareUnits cu ON cu.care_unit_id = b.care_unit_id
WHERE d.dept_name='Cardiology' AND a.status='Admitted'
ORDER BY a.admission_id DESC;

/* 9) Blood Inventory check (O+ whole blood) */
DECLARE @bankId INT = (SELECT TOP 1 blood_bank_id FROM dbo.BloodBanks WHERE bank_name='Main Blood Bank');
SELECT * FROM dbo.BloodInventory
WHERE blood_bank_id=@bankId AND blood_group='O+' AND component_type='WholeBlood';

/* 10) Add a donation (+3 bags O+ whole blood) and reflect transaction */
-- create donor user if missing
IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE email='donor1@demo.com')
BEGIN
    INSERT INTO dbo.Users(email, password_hash, full_name, account_status)
    VALUES ('donor1@demo.com','HASH','Donor One','Active');

    DECLARE @duid INT = SCOPE_IDENTITY();
    DECLARE @donorRole INT = (SELECT role_id FROM dbo.Roles WHERE role_name='Donor');
    INSERT INTO dbo.UserRoles(user_id, role_id) VALUES (@duid, @donorRole);

    INSERT INTO dbo.DonorProfiles(donor_id, blood_group) VALUES (@duid, 'O+');
END
GO

DECLARE @donorId INT = (SELECT TOP 1 user_id FROM dbo.Users WHERE email='donor1@demo.com');
DECLARE @adminId2 INT = (SELECT TOP 1 user_id FROM dbo.Users WHERE email='admin@hospital.com');
DECLARE @bankId2 INT = (SELECT TOP 1 blood_bank_id FROM dbo.BloodBanks WHERE bank_name='Main Blood Bank');

INSERT INTO dbo.BloodDonations(donor_id, blood_bank_id, blood_group, component_type, units_donated, recorded_by_user_id)
VALUES (@donorId, @bankId2, 'O+', 'WholeBlood', 3, @adminId2);

DECLARE @donationId INT = SCOPE_IDENTITY();

INSERT INTO dbo.BloodInventoryTransactions(blood_bank_id, donation_id, blood_group, component_type, units_change, reason, created_by_user_id)
VALUES (@bankId2, @donationId, 'O+', 'WholeBlood', 3, 'Donation', @adminId2);

-- update inventory row
UPDATE dbo.BloodInventory
SET units_available = units_available + 3,
    last_updated_at = SYSUTCDATETIME()
WHERE blood_bank_id=@bankId2 AND blood_group='O+' AND component_type='WholeBlood';

SELECT * FROM dbo.BloodInventory
WHERE blood_bank_id=@bankId2 AND blood_group='O+' AND component_type='WholeBlood';

/* 11) Create a blood request from patient (O+ whole blood) */
DECLARE @patientUserId INT = (SELECT TOP 1 user_id FROM dbo.Users WHERE email='patient1@demo.com');
DECLARE @deptId INT = (SELECT TOP 1 department_id FROM dbo.Departments WHERE dept_name='Cardiology');

INSERT INTO dbo.BloodRequests(patient_id, department_id, requested_by_user_id, blood_group_needed, component_type, units_required, urgency, status)
VALUES (@patientUserId, @deptId, @patientUserId, 'O+', 'WholeBlood', 2, 'Urgent', 'Pending');

SELECT TOP 10 * FROM dbo.BloodRequests ORDER BY request_id DESC;

/* 12) Donor match candidates (same blood group and available this week) */
-- For demo: mark donor available this week
DECLARE @weekStart DATE = DATEADD(DAY, 1 - DATEPART(WEEKDAY, CAST(GETDATE() AS DATE)), CAST(GETDATE() AS DATE));
IF NOT EXISTS (SELECT 1 FROM dbo.DonorAvailability WHERE donor_id=@donorId AND week_start_date=@weekStart)
BEGIN
    INSERT INTO dbo.DonorAvailability(donor_id, week_start_date, is_available, max_bags_possible)
    VALUES (@donorId, @weekStart, 1, 3);
END

SELECT u.full_name, dp.blood_group, da.week_start_date, da.max_bags_possible
FROM dbo.DonorProfiles dp
JOIN dbo.Users u ON u.user_id = dp.donor_id
JOIN dbo.DonorAvailability da ON da.donor_id = dp.donor_id
WHERE dp.blood_group='O+' AND da.is_available=1
ORDER BY u.full_name;
GO