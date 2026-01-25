BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] INT NOT NULL IDENTITY(1,1),
    [email] NVARCHAR(1000) NOT NULL,
    [passwordHash] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Department] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Department_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Department_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[Doctor] (
    [id] INT NOT NULL IDENTITY(1,1),
    [fullName] NVARCHAR(1000) NOT NULL,
    [specialization] NVARCHAR(1000),
    [departmentId] INT NOT NULL,
    [userId] INT NOT NULL,
    CONSTRAINT [Doctor_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Doctor_userId_key] UNIQUE NONCLUSTERED ([userId])
);

-- CreateTable
CREATE TABLE [dbo].[Nurse] (
    [id] INT NOT NULL IDENTITY(1,1),
    [fullName] NVARCHAR(1000) NOT NULL,
    [userId] INT NOT NULL,
    CONSTRAINT [Nurse_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Nurse_userId_key] UNIQUE NONCLUSTERED ([userId])
);

-- CreateTable
CREATE TABLE [dbo].[Patient] (
    [id] INT NOT NULL IDENTITY(1,1),
    [fullName] NVARCHAR(1000) NOT NULL,
    [dob] DATETIME2,
    [phone] NVARCHAR(1000),
    [userId] INT NOT NULL,
    CONSTRAINT [Patient_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Patient_userId_key] UNIQUE NONCLUSTERED ([userId])
);

-- CreateTable
CREATE TABLE [dbo].[Appointment] (
    [id] INT NOT NULL IDENTITY(1,1),
    [dateTime] DATETIME2 NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [Appointment_status_df] DEFAULT 'Scheduled',
    [doctorId] INT NOT NULL,
    [patientId] INT NOT NULL,
    CONSTRAINT [Appointment_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Admission] (
    [id] INT NOT NULL IDENTITY(1,1),
    [admitDate] DATETIME2 NOT NULL CONSTRAINT [Admission_admitDate_df] DEFAULT CURRENT_TIMESTAMP,
    [dischargeDate] DATETIME2,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [Admission_status_df] DEFAULT 'Admitted',
    [diagnosis] NVARCHAR(1000),
    [patientId] INT NOT NULL,
    CONSTRAINT [Admission_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Prescription] (
    [id] INT NOT NULL IDENTITY(1,1),
    [date] DATETIME2 NOT NULL CONSTRAINT [Prescription_date_df] DEFAULT CURRENT_TIMESTAMP,
    [medication] NVARCHAR(1000) NOT NULL,
    [notes] NVARCHAR(1000),
    [doctorId] INT NOT NULL,
    [patientId] INT NOT NULL,
    CONSTRAINT [Prescription_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[StaffApplication] (
    [id] INT NOT NULL IDENTITY(1,1),
    [fullName] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [roleAppliedFor] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [StaffApplication_status_df] DEFAULT 'PENDING',
    [appliedAt] DATETIME2 NOT NULL CONSTRAINT [StaffApplication_appliedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [reviewedByAdminUserId] INT,
    CONSTRAINT [StaffApplication_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[Doctor] ADD CONSTRAINT [Doctor_departmentId_fkey] FOREIGN KEY ([departmentId]) REFERENCES [dbo].[Department]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Doctor] ADD CONSTRAINT [Doctor_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Nurse] ADD CONSTRAINT [Nurse_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Patient] ADD CONSTRAINT [Patient_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Appointment] ADD CONSTRAINT [Appointment_doctorId_fkey] FOREIGN KEY ([doctorId]) REFERENCES [dbo].[Doctor]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Appointment] ADD CONSTRAINT [Appointment_patientId_fkey] FOREIGN KEY ([patientId]) REFERENCES [dbo].[Patient]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Admission] ADD CONSTRAINT [Admission_patientId_fkey] FOREIGN KEY ([patientId]) REFERENCES [dbo].[Patient]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Prescription] ADD CONSTRAINT [Prescription_doctorId_fkey] FOREIGN KEY ([doctorId]) REFERENCES [dbo].[Doctor]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Prescription] ADD CONSTRAINT [Prescription_patientId_fkey] FOREIGN KEY ([patientId]) REFERENCES [dbo].[Patient]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[StaffApplication] ADD CONSTRAINT [StaffApplication_reviewedByAdminUserId_fkey] FOREIGN KEY ([reviewedByAdminUserId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
