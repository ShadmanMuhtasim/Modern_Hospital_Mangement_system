/* =========================================================
   02_create_tables.sql
   Creates all tables + constraints (MSSQL)
   ========================================================= */
USE ModernHospitalDB;
GO


SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

/* ---------- Drop in reverse dependency order (dev only) ---------- */
IF OBJECT_ID('dbo.NotificationTargets', 'U') IS NOT NULL DROP TABLE dbo.NotificationTargets;
IF OBJECT_ID('dbo.Notifications', 'U') IS NOT NULL DROP TABLE dbo.Notifications;

IF OBJECT_ID('dbo.BloodRequestMatches', 'U') IS NOT NULL DROP TABLE dbo.BloodRequestMatches;
IF OBJECT_ID('dbo.BloodInventoryTransactions', 'U') IS NOT NULL DROP TABLE dbo.BloodInventoryTransactions;
IF OBJECT_ID('dbo.BloodDonations', 'U') IS NOT NULL DROP TABLE dbo.BloodDonations;
IF OBJECT_ID('dbo.DonorAvailability', 'U') IS NOT NULL DROP TABLE dbo.DonorAvailability;
IF OBJECT_ID('dbo.DonorHealthChecks', 'U') IS NOT NULL DROP TABLE dbo.DonorHealthChecks;
IF OBJECT_ID('dbo.DonorProfiles', 'U') IS NOT NULL DROP TABLE dbo.DonorProfiles;
IF OBJECT_ID('dbo.BloodRequests', 'U') IS NOT NULL DROP TABLE dbo.BloodRequests;
IF OBJECT_ID('dbo.BloodInventory', 'U') IS NOT NULL DROP TABLE dbo.BloodInventory;
IF OBJECT_ID('dbo.BloodBanks', 'U') IS NOT NULL DROP TABLE dbo.BloodBanks;

IF OBJECT_ID('dbo.BedAssignments', 'U') IS NOT NULL DROP TABLE dbo.BedAssignments;
IF OBJECT_ID('dbo.Beds', 'U') IS NOT NULL DROP TABLE dbo.Beds;
IF OBJECT_ID('dbo.CareUnits', 'U') IS NOT NULL DROP TABLE dbo.CareUnits;

IF OBJECT_ID('dbo.PrescriptionItems', 'U') IS NOT NULL DROP TABLE dbo.PrescriptionItems;
IF OBJECT_ID('dbo.Prescriptions', 'U') IS NOT NULL DROP TABLE dbo.Prescriptions;
IF OBJECT_ID('dbo.MedicalRecords', 'U') IS NOT NULL DROP TABLE dbo.MedicalRecords;
IF OBJECT_ID('dbo.Admissions', 'U') IS NOT NULL DROP TABLE dbo.Admissions;
IF OBJECT_ID('dbo.Appointments', 'U') IS NOT NULL DROP TABLE dbo.Appointments;

IF OBJECT_ID('dbo.Patients', 'U') IS NOT NULL DROP TABLE dbo.Patients;
IF OBJECT_ID('dbo.Nurses', 'U') IS NOT NULL DROP TABLE dbo.Nurses;
IF OBJECT_ID('dbo.Doctors', 'U') IS NOT NULL DROP TABLE dbo.Doctors;

IF OBJECT_ID('dbo.JobApplications', 'U') IS NOT NULL DROP TABLE dbo.JobApplications;
IF OBJECT_ID('dbo.DepartmentAdmins', 'U') IS NOT NULL DROP TABLE dbo.DepartmentAdmins;
IF OBJECT_ID('dbo.Departments', 'U') IS NOT NULL DROP TABLE dbo.Departments;

IF OBJECT_ID('dbo.RolePermissions', 'U') IS NOT NULL DROP TABLE dbo.RolePermissions;
IF OBJECT_ID('dbo.Permissions', 'U') IS NOT NULL DROP TABLE dbo.Permissions;
IF OBJECT_ID('dbo.UserRoles', 'U') IS NOT NULL DROP TABLE dbo.UserRoles;
IF OBJECT_ID('dbo.Roles', 'U') IS NOT NULL DROP TABLE dbo.Roles;

IF OBJECT_ID('dbo.AuditLogs', 'U') IS NOT NULL DROP TABLE dbo.AuditLogs;
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
GO

/* =========================================================
   Core: Users, Roles, RBAC
   ========================================================= */

CREATE TABLE dbo.Users (
    user_id              INT IDENTITY(1,1) PRIMARY KEY,
    email                NVARCHAR(255) NOT NULL UNIQUE,
    password_hash        NVARCHAR(255) NOT NULL,
    full_name            NVARCHAR(150) NOT NULL,
    phone                NVARCHAR(30) NULL,
    date_of_birth        DATE NULL,
    gender               NVARCHAR(20) NULL,
    account_status       NVARCHAR(20) NOT NULL CONSTRAINT CK_Users_account_status
                         CHECK (account_status IN ('Active','Frozen','Deleted')),
    created_at           DATETIME2 NOT NULL CONSTRAINT DF_Users_created_at DEFAULT SYSUTCDATETIME(),
    updated_at           DATETIME2 NOT NULL CONSTRAINT DF_Users_updated_at DEFAULT SYSUTCDATETIME(),
    frozen_at            DATETIME2 NULL,
    frozen_by_user_id    INT NULL
);
GO

ALTER TABLE dbo.Users
ADD CONSTRAINT FK_Users_frozen_by
FOREIGN KEY (frozen_by_user_id) REFERENCES dbo.Users(user_id);
GO

CREATE TABLE dbo.Roles (
    role_id      INT IDENTITY(1,1) PRIMARY KEY,
    role_name    NVARCHAR(50) NOT NULL UNIQUE
);
GO

CREATE TABLE dbo.UserRoles (
    user_id             INT NOT NULL,
    role_id             INT NOT NULL,
    assigned_at         DATETIME2 NOT NULL CONSTRAINT DF_UserRoles_assigned_at DEFAULT SYSUTCDATETIME(),
    assigned_by_user_id INT NULL,
    CONSTRAINT PK_UserRoles PRIMARY KEY (user_id, role_id),
    CONSTRAINT FK_UserRoles_user FOREIGN KEY (user_id) REFERENCES dbo.Users(user_id),
    CONSTRAINT FK_UserRoles_role FOREIGN KEY (role_id) REFERENCES dbo.Roles(role_id),
    CONSTRAINT FK_UserRoles_assigned_by FOREIGN KEY (assigned_by_user_id) REFERENCES dbo.Users(user_id)
);
GO

CREATE TABLE dbo.Permissions (
    permission_id    INT IDENTITY(1,1) PRIMARY KEY,
    permission_code  NVARCHAR(80) NOT NULL UNIQUE
);
GO

CREATE TABLE dbo.RolePermissions (
    role_id        INT NOT NULL,
    permission_id  INT NOT NULL,
    CONSTRAINT PK_RolePermissions PRIMARY KEY (role_id, permission_id),
    CONSTRAINT FK_RolePermissions_role FOREIGN KEY (role_id) REFERENCES dbo.Roles(role_id),
    CONSTRAINT FK_RolePermissions_perm FOREIGN KEY (permission_id) REFERENCES dbo.Permissions(permission_id)
);
GO

CREATE TABLE dbo.AuditLogs (
    audit_id       INT IDENTITY(1,1) PRIMARY KEY,
    actor_user_id  INT NOT NULL,
    action_type    NVARCHAR(60) NOT NULL,
    entity_name    NVARCHAR(60) NULL,
    entity_id      INT NULL,
    details        NVARCHAR(MAX) NULL,
    created_at     DATETIME2 NOT NULL CONSTRAINT DF_AuditLogs_created_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_AuditLogs_actor FOREIGN KEY (actor_user_id) REFERENCES dbo.Users(user_id)
);
GO

/* =========================================================
   Departments + IT scope + Job Applications
   ========================================================= */

CREATE TABLE dbo.Departments (
    department_id  INT IDENTITY(1,1) PRIMARY KEY,
    dept_name      NVARCHAR(80) NOT NULL UNIQUE,
    is_active      BIT NOT NULL CONSTRAINT DF_Departments_is_active DEFAULT 1
);
GO

CREATE TABLE dbo.DepartmentAdmins (
    user_id        INT NOT NULL,
    department_id  INT NOT NULL,
    assigned_at    DATETIME2 NOT NULL CONSTRAINT DF_DepartmentAdmins_assigned_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_DepartmentAdmins PRIMARY KEY (user_id, department_id),
    CONSTRAINT FK_DepartmentAdmins_user FOREIGN KEY (user_id) REFERENCES dbo.Users(user_id),
    CONSTRAINT FK_DepartmentAdmins_dept FOREIGN KEY (department_id) REFERENCES dbo.Departments(department_id)
);
GO

CREATE TABLE dbo.JobApplications (
    application_id         INT IDENTITY(1,1) PRIMARY KEY,
    user_id                INT NOT NULL,
    applied_role_id        INT NOT NULL,
    applied_department_id  INT NULL,
    status                 NVARCHAR(20) NOT NULL CONSTRAINT CK_JobApplications_status
                           CHECK (status IN ('Pending','Approved','Rejected')),
    applied_at             DATETIME2 NOT NULL CONSTRAINT DF_JobApplications_applied_at DEFAULT SYSUTCDATETIME(),
    reviewed_by_user_id    INT NULL,
    reviewed_at            DATETIME2 NULL,
    review_notes           NVARCHAR(400) NULL,
    CONSTRAINT FK_JobApplications_user FOREIGN KEY (user_id) REFERENCES dbo.Users(user_id),
    CONSTRAINT FK_JobApplications_role FOREIGN KEY (applied_role_id) REFERENCES dbo.Roles(role_id),
    CONSTRAINT FK_JobApplications_dept FOREIGN KEY (applied_department_id) REFERENCES dbo.Departments(department_id),
    CONSTRAINT FK_JobApplications_reviewer FOREIGN KEY (reviewed_by_user_id) REFERENCES dbo.Users(user_id)
);
GO

/* =========================================================
   Staff + Patients
   ========================================================= */

CREATE TABLE dbo.Doctors (
    doctor_id       INT PRIMARY KEY, -- FK to Users.user_id
    department_id   INT NOT NULL,
    specialization  NVARCHAR(80) NOT NULL,
    license_number  NVARCHAR(60) NOT NULL UNIQUE,
    is_active       BIT NOT NULL CONSTRAINT DF_Doctors_is_active DEFAULT 1,
    CONSTRAINT FK_Doctors_user FOREIGN KEY (doctor_id) REFERENCES dbo.Users(user_id),
    CONSTRAINT FK_Doctors_dept FOREIGN KEY (department_id) REFERENCES dbo.Departments(department_id)
);
GO

CREATE TABLE dbo.Nurses (
    nurse_id              INT PRIMARY KEY, -- FK to Users.user_id
    department_id         INT NOT NULL,
    ward_assignment_note  NVARCHAR(120) NULL,
    is_active             BIT NOT NULL CONSTRAINT DF_Nurses_is_active DEFAULT 1,
    CONSTRAINT FK_Nurses_user FOREIGN KEY (nurse_id) REFERENCES dbo.Users(user_id),
    CONSTRAINT FK_Nurses_dept FOREIGN KEY (department_id) REFERENCES dbo.Departments(department_id)
);
GO

CREATE TABLE dbo.Patients (
    patient_id               INT PRIMARY KEY, -- FK to Users.user_id
    blood_group              NVARCHAR(3) NOT NULL CONSTRAINT CK_Patients_blood
                             CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
    emergency_contact_name   NVARCHAR(120) NULL,
    emergency_contact_phone  NVARCHAR(30) NULL,
    is_active                BIT NOT NULL CONSTRAINT DF_Patients_is_active DEFAULT 1,
    CONSTRAINT FK_Patients_user FOREIGN KEY (patient_id) REFERENCES dbo.Users(user_id)
);
GO

/* =========================================================
   Appointments + Admissions + Records + Prescriptions
   ========================================================= */

CREATE TABLE dbo.Appointments (
    appointment_id         INT IDENTITY(1,1) PRIMARY KEY,
    patient_id             INT NOT NULL,
    department_id          INT NOT NULL,
    doctor_id              INT NULL,
    appointment_datetime   DATETIME2 NOT NULL,
    status                 NVARCHAR(20) NOT NULL CONSTRAINT CK_Appointments_status
                           CHECK (status IN ('Booked','Cancelled','Completed','NoShow')),
    created_at             DATETIME2 NOT NULL CONSTRAINT DF_Appointments_created_at DEFAULT SYSUTCDATETIME(),
    cancelled_by_user_id   INT NULL,
    cancel_reason          NVARCHAR(200) NULL,
    CONSTRAINT FK_Appointments_patient FOREIGN KEY (patient_id) REFERENCES dbo.Patients(patient_id),
    CONSTRAINT FK_Appointments_dept FOREIGN KEY (department_id) REFERENCES dbo.Departments(department_id),
    CONSTRAINT FK_Appointments_doctor FOREIGN KEY (doctor_id) REFERENCES dbo.Doctors(doctor_id),
    CONSTRAINT FK_Appointments_cancelled_by FOREIGN KEY (cancelled_by_user_id) REFERENCES dbo.Users(user_id)
);
GO

CREATE TABLE dbo.Admissions (
    admission_id           INT IDENTITY(1,1) PRIMARY KEY,
    patient_id             INT NOT NULL,
    department_id          INT NOT NULL,
    admitted_by_doctor_id  INT NULL,
    admit_date             DATETIME2 NOT NULL CONSTRAINT DF_Admissions_admit_date DEFAULT SYSUTCDATETIME(),
    discharge_date         DATETIME2 NULL,
    status                 NVARCHAR(20) NOT NULL CONSTRAINT CK_Admissions_status
                           CHECK (status IN ('Admitted','Discharged','Transferred','Cancelled')),
    diagnosis_initial      NVARCHAR(250) NULL,
    care_level_requested   NVARCHAR(12) NOT NULL CONSTRAINT CK_Admissions_care_req
                           CHECK (care_level_requested IN ('General','ICU','NICU','CCU')),
    care_level_assigned    NVARCHAR(12) NULL CONSTRAINT CK_Admissions_care_assigned
                           CHECK (care_level_assigned IN ('General','ICU','NICU','CCU')),
    notes                  NVARCHAR(400) NULL,
    CONSTRAINT FK_Admissions_patient FOREIGN KEY (patient_id) REFERENCES dbo.Patients(patient_id),
    CONSTRAINT FK_Admissions_dept FOREIGN KEY (department_id) REFERENCES dbo.Departments(department_id),
    CONSTRAINT FK_Admissions_doctor FOREIGN KEY (admitted_by_doctor_id) REFERENCES dbo.Doctors(doctor_id)
);
GO

CREATE TABLE dbo.MedicalRecords (
    record_id          INT IDENTITY(1,1) PRIMARY KEY,
    patient_id         INT NOT NULL,
    admission_id       INT NULL,
    created_by_user_id INT NOT NULL,
    record_datetime    DATETIME2 NOT NULL CONSTRAINT DF_MedicalRecords_dt DEFAULT SYSUTCDATETIME(),
    diagnosis          NVARCHAR(250) NOT NULL,
    treatment_plan     NVARCHAR(400) NOT NULL,
    notes              NVARCHAR(400) NULL,
    CONSTRAINT FK_MedicalRecords_patient FOREIGN KEY (patient_id) REFERENCES dbo.Patients(patient_id),
    CONSTRAINT FK_MedicalRecords_adm FOREIGN KEY (admission_id) REFERENCES dbo.Admissions(admission_id),
    CONSTRAINT FK_MedicalRecords_creator FOREIGN KEY (created_by_user_id) REFERENCES dbo.Users(user_id)
);
GO

CREATE TABLE dbo.Prescriptions (
    prescription_id  INT IDENTITY(1,1) PRIMARY KEY,
    patient_id       INT NOT NULL,
    admission_id     INT NULL,
    doctor_id        INT NOT NULL,
    created_at       DATETIME2 NOT NULL CONSTRAINT DF_Prescriptions_created DEFAULT SYSUTCDATETIME(),
    status           NVARCHAR(20) NOT NULL CONSTRAINT CK_Prescriptions_status
                     CHECK (status IN ('Active','Stopped','Completed')),
    CONSTRAINT FK_Prescriptions_patient FOREIGN KEY (patient_id) REFERENCES dbo.Patients(patient_id),
    CONSTRAINT FK_Prescriptions_adm FOREIGN KEY (admission_id) REFERENCES dbo.Admissions(admission_id),
    CONSTRAINT FK_Prescriptions_doc FOREIGN KEY (doctor_id) REFERENCES dbo.Doctors(doctor_id)
);
GO

CREATE TABLE dbo.PrescriptionItems (
    item_id          INT IDENTITY(1,1) PRIMARY KEY,
    prescription_id  INT NOT NULL,
    medication_name  NVARCHAR(120) NOT NULL,
    dosage           NVARCHAR(60) NOT NULL,
    frequency        NVARCHAR(60) NOT NULL,
    duration_days    INT NOT NULL CHECK (duration_days > 0),
    instructions     NVARCHAR(200) NULL,
    CONSTRAINT FK_PrescriptionItems_rx FOREIGN KEY (prescription_id) REFERENCES dbo.Prescriptions(prescription_id)
);
GO

/* =========================================================
   Care Units + Beds + BedAssignments
   ========================================================= */

CREATE TABLE dbo.CareUnits (
    care_unit_id   INT IDENTITY(1,1) PRIMARY KEY,
    department_id  INT NOT NULL,
    unit_type      NVARCHAR(10) NOT NULL CONSTRAINT CK_CareUnits_type
                   CHECK (unit_type IN ('Ward','ICU','NICU','CCU')),
    floor          INT NULL,
    unit_name      NVARCHAR(80) NULL,
    is_active      BIT NOT NULL CONSTRAINT DF_CareUnits_active DEFAULT 1,
    CONSTRAINT FK_CareUnits_dept FOREIGN KEY (department_id) REFERENCES dbo.Departments(department_id)
);
GO

CREATE TABLE dbo.Beds (
    bed_id       INT IDENTITY(1,1) PRIMARY KEY,
    care_unit_id INT NOT NULL,
    bed_code     NVARCHAR(20) NOT NULL,
    status       NVARCHAR(20) NOT NULL CONSTRAINT CK_Beds_status
                 CHECK (status IN ('Available','Occupied','Maintenance','Reserved')),
    is_active    BIT NOT NULL CONSTRAINT DF_Beds_active DEFAULT 1,
    CONSTRAINT FK_Beds_unit FOREIGN KEY (care_unit_id) REFERENCES dbo.CareUnits(care_unit_id),
    CONSTRAINT UQ_Beds_unit_code UNIQUE (care_unit_id, bed_code)
);
GO

CREATE TABLE dbo.BedAssignments (
    assignment_id        INT IDENTITY(1,1) PRIMARY KEY,
    admission_id         INT NOT NULL,
    bed_id               INT NOT NULL,
    assigned_by_user_id  INT NOT NULL,
    assigned_at          DATETIME2 NOT NULL CONSTRAINT DF_BedAssignments_assigned_at DEFAULT SYSUTCDATETIME(),
    released_at          DATETIME2 NULL,
    released_by_user_id  INT NULL,
    release_reason       NVARCHAR(20) NULL CONSTRAINT CK_BedAssignments_reason
                         CHECK (release_reason IN ('Discharge','Transfer','Cancel','Maintenance')),
    CONSTRAINT FK_BedAssignments_adm FOREIGN KEY (admission_id) REFERENCES dbo.Admissions(admission_id),
    CONSTRAINT FK_BedAssignments_bed FOREIGN KEY (bed_id) REFERENCES dbo.Beds(bed_id),
    CONSTRAINT FK_BedAssignments_assigner FOREIGN KEY (assigned_by_user_id) REFERENCES dbo.Users(user_id),
    CONSTRAINT FK_BedAssignments_releaser FOREIGN KEY (released_by_user_id) REFERENCES dbo.Users(user_id)
);
GO

/* One active bed assignment per admission */
CREATE UNIQUE INDEX UX_BedAssignments_Admission_Active
ON dbo.BedAssignments(admission_id)
WHERE released_at IS NULL;
GO

/* One active assignment per bed */
CREATE UNIQUE INDEX UX_BedAssignments_Bed_Active
ON dbo.BedAssignments(bed_id)
WHERE released_at IS NULL;
GO

/* =========================================================
   Blood Bank Module
   ========================================================= */

CREATE TABLE dbo.BloodBanks (
    blood_bank_id  INT IDENTITY(1,1) PRIMARY KEY,
    bank_name      NVARCHAR(120) NOT NULL,
    location       NVARCHAR(120) NULL,
    is_active      BIT NOT NULL CONSTRAINT DF_BloodBanks_active DEFAULT 1
);
GO

CREATE TABLE dbo.BloodInventory (
    inventory_id    INT IDENTITY(1,1) PRIMARY KEY,
    blood_bank_id   INT NOT NULL,
    blood_group     NVARCHAR(3) NOT NULL CONSTRAINT CK_BloodInventory_blood
                    CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
    component_type  NVARCHAR(20) NOT NULL CONSTRAINT CK_BloodInventory_component
                    CHECK (component_type IN ('WholeBlood','Plasma','Platelets','RBC')),
    units_available INT NOT NULL CONSTRAINT CK_BloodInventory_units CHECK (units_available >= 0),
    last_updated_at DATETIME2 NOT NULL CONSTRAINT DF_BloodInventory_updated DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_BloodInventory_bank FOREIGN KEY (blood_bank_id) REFERENCES dbo.BloodBanks(blood_bank_id),
    CONSTRAINT UQ_BloodInventory UNIQUE (blood_bank_id, blood_group, component_type)
);
GO

CREATE TABLE dbo.BloodRequests (
    request_id           INT IDENTITY(1,1) PRIMARY KEY,
    patient_id           INT NOT NULL,
    admission_id         INT NULL,
    department_id        INT NOT NULL,
    requested_by_user_id INT NOT NULL,
    blood_group_needed   NVARCHAR(3) NOT NULL CONSTRAINT CK_BloodRequests_blood
                         CHECK (blood_group_needed IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
    component_type       NVARCHAR(20) NOT NULL CONSTRAINT CK_BloodRequests_component
                         CHECK (component_type IN ('WholeBlood','Plasma','Platelets','RBC')),
    units_required       INT NOT NULL CHECK (units_required > 0),
    urgency              NVARCHAR(15) NOT NULL CONSTRAINT CK_BloodRequests_urgency
                         CHECK (urgency IN ('Normal','Urgent','Emergency')),
    status               NVARCHAR(20) NOT NULL CONSTRAINT CK_BloodRequests_status
                         CHECK (status IN ('Pending','Matched','Approved','Fulfilled','Rejected','Cancelled')),
    request_date         DATETIME2 NOT NULL CONSTRAINT DF_BloodRequests_date DEFAULT SYSUTCDATETIME(),
    notes                NVARCHAR(400) NULL,
    CONSTRAINT FK_BloodRequests_patient FOREIGN KEY (patient_id) REFERENCES dbo.Patients(patient_id),
    CONSTRAINT FK_BloodRequests_adm FOREIGN KEY (admission_id) REFERENCES dbo.Admissions(admission_id),
    CONSTRAINT FK_BloodRequests_dept FOREIGN KEY (department_id) REFERENCES dbo.Departments(department_id),
    CONSTRAINT FK_BloodRequests_requester FOREIGN KEY (requested_by_user_id) REFERENCES dbo.Users(user_id)
);
GO

CREATE TABLE dbo.DonorProfiles (
    donor_id          INT PRIMARY KEY, -- FK to Users.user_id
    blood_group       NVARCHAR(3) NOT NULL CONSTRAINT CK_DonorProfiles_blood
                     CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
    last_donation_date DATE NULL,
    is_eligible       BIT NOT NULL CONSTRAINT DF_DonorProfiles_eligible DEFAULT 1,
    notes             NVARCHAR(300) NULL,
    CONSTRAINT FK_DonorProfiles_user FOREIGN KEY (donor_id) REFERENCES dbo.Users(user_id)
);
GO

CREATE TABLE dbo.DonorHealthChecks (
    check_id          INT IDENTITY(1,1) PRIMARY KEY,
    donor_id          INT NOT NULL,
    check_datetime    DATETIME2 NOT NULL CONSTRAINT DF_DonorHealthChecks_dt DEFAULT SYSUTCDATETIME(),
    weight_kg         DECIMAL(5,2) NOT NULL CHECK (weight_kg > 0),
    temperature_c     DECIMAL(4,2) NOT NULL CHECK (temperature_c > 0),
    hemoglobin        DECIMAL(4,2) NULL,
    notes             NVARCHAR(300) NULL,
    checked_by_user_id INT NULL,
    CONSTRAINT FK_DonorHealthChecks_donor FOREIGN KEY (donor_id) REFERENCES dbo.DonorProfiles(donor_id),
    CONSTRAINT FK_DonorHealthChecks_checkedby FOREIGN KEY (checked_by_user_id) REFERENCES dbo.Users(user_id)
);
GO

CREATE TABLE dbo.DonorAvailability (
    availability_id   INT IDENTITY(1,1) PRIMARY KEY,
    donor_id          INT NOT NULL,
    week_start_date   DATE NOT NULL,
    is_available      BIT NOT NULL,
    max_bags_possible INT NOT NULL CHECK (max_bags_possible >= 0),
    updated_at        DATETIME2 NOT NULL CONSTRAINT DF_DonorAvailability_updated DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_DonorAvailability_donor FOREIGN KEY (donor_id) REFERENCES dbo.DonorProfiles(donor_id),
    CONSTRAINT UQ_DonorAvailability UNIQUE (donor_id, week_start_date)
);
GO

CREATE TABLE dbo.BloodDonations (
    donation_id         INT IDENTITY(1,1) PRIMARY KEY,
    donor_id            INT NOT NULL,
    blood_bank_id       INT NOT NULL,
    donation_datetime   DATETIME2 NOT NULL CONSTRAINT DF_BloodDonations_dt DEFAULT SYSUTCDATETIME(),
    blood_group         NVARCHAR(3) NOT NULL CONSTRAINT CK_BloodDonations_blood
                        CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
    component_type      NVARCHAR(20) NOT NULL CONSTRAINT CK_BloodDonations_component
                        CHECK (component_type IN ('WholeBlood','Plasma','Platelets','RBC')),
    units_donated       INT NOT NULL CHECK (units_donated > 0),
    recorded_by_user_id INT NOT NULL,
    linked_request_id   INT NULL,
    CONSTRAINT FK_BloodDonations_donor FOREIGN KEY (donor_id) REFERENCES dbo.DonorProfiles(donor_id),
    CONSTRAINT FK_BloodDonations_bank FOREIGN KEY (blood_bank_id) REFERENCES dbo.BloodBanks(blood_bank_id),
    CONSTRAINT FK_BloodDonations_recorder FOREIGN KEY (recorded_by_user_id) REFERENCES dbo.Users(user_id),
    CONSTRAINT FK_BloodDonations_request FOREIGN KEY (linked_request_id) REFERENCES dbo.BloodRequests(request_id)
);
GO

CREATE TABLE dbo.BloodInventoryTransactions (
    txn_id            INT IDENTITY(1,1) PRIMARY KEY,
    blood_bank_id     INT NOT NULL,
    donation_id       INT NULL,
    request_id        INT NULL,
    blood_group       NVARCHAR(3) NOT NULL CONSTRAINT CK_BloodInvTxn_blood
                      CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
    component_type    NVARCHAR(20) NOT NULL CONSTRAINT CK_BloodInvTxn_component
                      CHECK (component_type IN ('WholeBlood','Plasma','Platelets','RBC')),
    units_change      INT NOT NULL, -- + / -
    reason            NVARCHAR(20) NOT NULL CONSTRAINT CK_BloodInvTxn_reason
                      CHECK (reason IN ('Donation','Fulfillment','Adjustment','Expired')),
    created_at        DATETIME2 NOT NULL CONSTRAINT DF_BloodInvTxn_dt DEFAULT SYSUTCDATETIME(),
    created_by_user_id INT NOT NULL,
    CONSTRAINT FK_BloodInvTxn_bank FOREIGN KEY (blood_bank_id) REFERENCES dbo.BloodBanks(blood_bank_id),
    CONSTRAINT FK_BloodInvTxn_donation FOREIGN KEY (donation_id) REFERENCES dbo.BloodDonations(donation_id),
    CONSTRAINT FK_BloodInvTxn_request FOREIGN KEY (request_id) REFERENCES dbo.BloodRequests(request_id),
    CONSTRAINT FK_BloodInvTxn_creator FOREIGN KEY (created_by_user_id) REFERENCES dbo.Users(user_id)
);
GO

CREATE TABLE dbo.BloodRequestMatches (
    match_id      INT IDENTITY(1,1) PRIMARY KEY,
    request_id    INT NOT NULL,
    donor_id      INT NOT NULL,
    match_score   INT NULL,
    status        NVARCHAR(20) NOT NULL CONSTRAINT CK_BloodRequestMatches_status
                  CHECK (status IN ('Suggested','Notified','Accepted','Declined','Completed')),
    created_at    DATETIME2 NOT NULL CONSTRAINT DF_BloodRequestMatches_dt DEFAULT SYSUTCDATETIME(),
    responded_at  DATETIME2 NULL,
    CONSTRAINT FK_BloodRequestMatches_req FOREIGN KEY (request_id) REFERENCES dbo.BloodRequests(request_id),
    CONSTRAINT FK_BloodRequestMatches_donor FOREIGN KEY (donor_id) REFERENCES dbo.DonorProfiles(donor_id)
);
GO

/* =========================================================
   Notifications
   ========================================================= */

CREATE TABLE dbo.Notifications (
    notification_id     INT IDENTITY(1,1) PRIMARY KEY,
    title               NVARCHAR(120) NOT NULL,
    message             NVARCHAR(600) NOT NULL,
    target_type         NVARCHAR(20) NOT NULL CONSTRAINT CK_Notifications_target
                        CHECK (target_type IN ('Role','Department','BloodType','SpecificUser')),
    created_by_user_id  INT NOT NULL,
    created_at          DATETIME2 NOT NULL CONSTRAINT DF_Notifications_dt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Notifications_creator FOREIGN KEY (created_by_user_id) REFERENCES dbo.Users(user_id)
);
GO

CREATE TABLE dbo.NotificationTargets (
    notification_id  INT NOT NULL,
    user_id          INT NOT NULL,
    CONSTRAINT PK_NotificationTargets PRIMARY KEY (notification_id, user_id),
    CONSTRAINT FK_NotificationTargets_notif FOREIGN KEY (notification_id) REFERENCES dbo.Notifications(notification_id),
    CONSTRAINT FK_NotificationTargets_user FOREIGN KEY (user_id) REFERENCES dbo.Users(user_id)
);
GO

/* =========================================================
   Helpful indexes (performance)
   ========================================================= */

CREATE INDEX IX_Admissions_dept_status ON dbo.Admissions(department_id, status);
CREATE INDEX IX_Admissions_patient_status ON dbo.Admissions(patient_id, status);

CREATE INDEX IX_BloodRequests_dept_status ON dbo.BloodRequests(department_id, status);
CREATE INDEX IX_BloodRequests_blood ON dbo.BloodRequests(blood_group_needed, component_type);

CREATE INDEX IX_BloodInventory_lookup ON dbo.BloodInventory(blood_bank_id, blood_group, component_type);

CREATE INDEX IX_Appointments_dept_date ON dbo.Appointments(department_id, appointment_datetime);
GO