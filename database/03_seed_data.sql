/* =========================================================
   03_seed_data.sql
   Inserts starter data: roles, departments, a blood bank,
   some care units + beds, and a demo admin.
   ========================================================= */
USE ModernHospitalDB;
GO

/* Roles */
INSERT INTO dbo.Roles(role_name)
SELECT v.role_name
FROM (VALUES
    ('Admin'),
    ('ITWorker'),
    ('Doctor'),
    ('Nurse'),
    ('Patient'),
    ('Donor'),
    ('Applicant')
) v(role_name)
WHERE NOT EXISTS (SELECT 1 FROM dbo.Roles r WHERE r.role_name = v.role_name);

/* Departments */
INSERT INTO dbo.Departments(dept_name)
SELECT v.dept_name
FROM (VALUES
    ('Cardiology'),
    ('Neurology'),
    ('Orthopedics'),
    ('Pediatrics'),
    ('General Medicine'),
    ('Ophthalmology'),
    ('Dentistry')
) v(dept_name)
WHERE NOT EXISTS (SELECT 1 FROM dbo.Departments d WHERE d.dept_name = v.dept_name);

/* Blood bank */
IF NOT EXISTS (SELECT 1 FROM dbo.BloodBanks WHERE bank_name = 'Main Blood Bank')
BEGIN
    INSERT INTO dbo.BloodBanks(bank_name, location) VALUES ('Main Blood Bank', 'Hospital Campus');
END

/* Initialize BloodInventory rows (0 units) for all groups + components */
DECLARE @bankId INT = (SELECT TOP 1 blood_bank_id FROM dbo.BloodBanks WHERE bank_name='Main Blood Bank');

;WITH BloodGroups AS (
    SELECT bg FROM (VALUES ('A+'),('A-'),('B+'),('B-'),('AB+'),('AB-'),('O+'),('O-')) x(bg)
),
Components AS (
    SELECT ct FROM (VALUES ('WholeBlood'),('Plasma'),('Platelets'),('RBC')) y(ct)
)
INSERT INTO dbo.BloodInventory(blood_bank_id, blood_group, component_type, units_available)
SELECT @bankId, bg.bg, c.ct, 0
FROM BloodGroups bg
CROSS JOIN Components c
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.BloodInventory bi
    WHERE bi.blood_bank_id=@bankId AND bi.blood_group=bg.bg AND bi.component_type=c.ct
);

/* Demo admin user (password_hash is placeholder) */
IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE email='admin@hospital.com')
BEGIN
    INSERT INTO dbo.Users(email, password_hash, full_name, account_status)
    VALUES ('admin@hospital.com', 'CHANGE_THIS_HASH', 'System Admin', 'Active');

    DECLARE @adminId INT = SCOPE_IDENTITY();
    DECLARE @adminRoleId INT = (SELECT role_id FROM dbo.Roles WHERE role_name='Admin');

    INSERT INTO dbo.UserRoles(user_id, role_id, assigned_by_user_id)
    VALUES (@adminId, @adminRoleId, @adminId);
END

/* Create CareUnits + some beds per dept (example minimal setup) */
DECLARE @deptId INT;

DECLARE dept_cursor CURSOR FOR
SELECT department_id FROM dbo.Departments;

OPEN dept_cursor;
FETCH NEXT FROM dept_cursor INTO @deptId;

WHILE @@FETCH_STATUS = 0
BEGIN
    /* Ward */
    IF NOT EXISTS (SELECT 1 FROM dbo.CareUnits WHERE department_id=@deptId AND unit_type='Ward')
        INSERT INTO dbo.CareUnits(department_id, unit_type, floor, unit_name) VALUES (@deptId,'Ward',2,'General Ward');

    /* ICU */
    IF NOT EXISTS (SELECT 1 FROM dbo.CareUnits WHERE department_id=@deptId AND unit_type='ICU')
        INSERT INTO dbo.CareUnits(department_id, unit_type, floor, unit_name) VALUES (@deptId,'ICU',3,'ICU');

    FETCH NEXT FROM dept_cursor INTO @deptId;
END

CLOSE dept_cursor;
DEALLOCATE dept_cursor;

/* Add 3 beds to each Ward and 2 beds to each ICU (simple demo) */
DECLARE @unitId INT;

DECLARE unit_cursor CURSOR FOR
SELECT care_unit_id, unit_type
FROM dbo.CareUnits;

DECLARE @unitType NVARCHAR(10);

OPEN unit_cursor;
FETCH NEXT FROM unit_cursor INTO @unitId, @unitType;

WHILE @@FETCH_STATUS = 0
BEGIN
    IF @unitType = 'Ward'
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM dbo.Beds WHERE care_unit_id=@unitId AND bed_code='W-01')
            INSERT INTO dbo.Beds(care_unit_id, bed_code, status) VALUES (@unitId,'W-01','Available');
        IF NOT EXISTS (SELECT 1 FROM dbo.Beds WHERE care_unit_id=@unitId AND bed_code='W-02')
            INSERT INTO dbo.Beds(care_unit_id, bed_code, status) VALUES (@unitId,'W-02','Available');
        IF NOT EXISTS (SELECT 1 FROM dbo.Beds WHERE care_unit_id=@unitId AND bed_code='W-03')
            INSERT INTO dbo.Beds(care_unit_id, bed_code, status) VALUES (@unitId,'W-03','Available');
    END

    IF @unitType = 'ICU'
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM dbo.Beds WHERE care_unit_id=@unitId AND bed_code='ICU-01')
            INSERT INTO dbo.Beds(care_unit_id, bed_code, status) VALUES (@unitId,'ICU-01','Available');
        IF NOT EXISTS (SELECT 1 FROM dbo.Beds WHERE care_unit_id=@unitId AND bed_code='ICU-02')
            INSERT INTO dbo.Beds(care_unit_id, bed_code, status) VALUES (@unitId,'ICU-02','Available');
    END

    FETCH NEXT FROM unit_cursor INTO @unitId, @unitType;
END

CLOSE unit_cursor;
DEALLOCATE unit_cursor;
GO



IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE email = 'admin@demo.com')
BEGIN
    INSERT INTO dbo.Users (email,password_hash,full_name,phone,date_of_birth,gender,account_status,created_at,updated_at)
    VALUES ('admin@demo.com','$2y$12$y6B0DX5ZSm6MH2ZrDFvcqOdx/62fA31CCnShhFHlQ485PmT1yEYNW','Admin Demo','0000000000','2000-01-01','Male','Active',SYSDATETIME(),SYSDATETIME());
END
GO