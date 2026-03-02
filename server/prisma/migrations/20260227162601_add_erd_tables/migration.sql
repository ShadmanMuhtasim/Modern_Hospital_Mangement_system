BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[WardUnit] (
    [id] INT NOT NULL IDENTITY(1,1),
    [unitType] NVARCHAR(1000) NOT NULL,
    [floor] INT,
    [capacity] INT,
    CONSTRAINT [WardUnit_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Bed] (
    [id] INT NOT NULL IDENTITY(1,1),
    [bedNumber] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [Bed_status_df] DEFAULT 'AVAILABLE',
    [unitId] INT NOT NULL,
    CONSTRAINT [Bed_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Bed_unitId_bedNumber_key] UNIQUE NONCLUSTERED ([unitId],[bedNumber])
);

-- CreateTable
CREATE TABLE [dbo].[MedicalRecord] (
    [id] INT NOT NULL IDENTITY(1,1),
    [recordNo] NVARCHAR(1000) NOT NULL,
    [recordDate] DATETIME2 NOT NULL CONSTRAINT [MedicalRecord_recordDate_df] DEFAULT CURRENT_TIMESTAMP,
    [diagnosis] NVARCHAR(1000),
    [treatment] NVARCHAR(1000),
    [notes] NVARCHAR(1000),
    [patientId] INT NOT NULL,
    CONSTRAINT [MedicalRecord_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [MedicalRecord_recordNo_key] UNIQUE NONCLUSTERED ([recordNo])
);

-- CreateTable
CREATE TABLE [dbo].[BloodBank] (
    [id] INT NOT NULL IDENTITY(1,1),
    [bankName] NVARCHAR(1000) NOT NULL,
    [location] NVARCHAR(1000),
    CONSTRAINT [BloodBank_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[BloodDonor] (
    [id] INT NOT NULL IDENTITY(1,1),
    [fullName] NVARCHAR(1000) NOT NULL,
    [phone] NVARCHAR(1000),
    [dob] DATETIME2,
    [bloodGroup] NVARCHAR(1000) NOT NULL,
    [lastDonationDate] DATETIME2,
    CONSTRAINT [BloodDonor_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[BankBloodInventory] (
    [id] INT NOT NULL IDENTITY(1,1),
    [bloodGroup] NVARCHAR(1000) NOT NULL,
    [unitsAvailable] INT NOT NULL CONSTRAINT [BankBloodInventory_unitsAvailable_df] DEFAULT 0,
    [updatedAt] DATETIME2 NOT NULL,
    [bankId] INT NOT NULL,
    CONSTRAINT [BankBloodInventory_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [BankBloodInventory_bankId_bloodGroup_key] UNIQUE NONCLUSTERED ([bankId],[bloodGroup])
);

-- CreateTable
CREATE TABLE [dbo].[BankBloodRequest] (
    [id] INT NOT NULL IDENTITY(1,1),
    [bloodGroup] NVARCHAR(1000) NOT NULL,
    [unitsRequested] INT NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [BankBloodRequest_status_df] DEFAULT 'PENDING',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [BankBloodRequest_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [patientId] INT NOT NULL,
    [bankId] INT NOT NULL,
    CONSTRAINT [BankBloodRequest_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[BankDonation] (
    [id] INT NOT NULL IDENTITY(1,1),
    [bloodGroup] NVARCHAR(1000) NOT NULL,
    [unitsDonated] INT NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [BankDonation_status_df] DEFAULT 'APPROVED',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [BankDonation_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [donorId] INT NOT NULL,
    [bankId] INT NOT NULL,
    CONSTRAINT [BankDonation_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[BloodIssue] (
    [id] INT NOT NULL IDENTITY(1,1),
    [issuedAt] DATETIME2 NOT NULL CONSTRAINT [BloodIssue_issuedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [unitsIssued] INT NOT NULL,
    [issuedGroup] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [BloodIssue_status_df] DEFAULT 'ISSUED',
    [requestId] INT NOT NULL,
    [bankId] INT NOT NULL,
    CONSTRAINT [BloodIssue_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[Bed] ADD CONSTRAINT [Bed_unitId_fkey] FOREIGN KEY ([unitId]) REFERENCES [dbo].[WardUnit]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[MedicalRecord] ADD CONSTRAINT [MedicalRecord_patientId_fkey] FOREIGN KEY ([patientId]) REFERENCES [dbo].[Patient]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[BankBloodInventory] ADD CONSTRAINT [BankBloodInventory_bankId_fkey] FOREIGN KEY ([bankId]) REFERENCES [dbo].[BloodBank]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[BankBloodRequest] ADD CONSTRAINT [BankBloodRequest_patientId_fkey] FOREIGN KEY ([patientId]) REFERENCES [dbo].[Patient]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[BankBloodRequest] ADD CONSTRAINT [BankBloodRequest_bankId_fkey] FOREIGN KEY ([bankId]) REFERENCES [dbo].[BloodBank]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[BankDonation] ADD CONSTRAINT [BankDonation_donorId_fkey] FOREIGN KEY ([donorId]) REFERENCES [dbo].[BloodDonor]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[BankDonation] ADD CONSTRAINT [BankDonation_bankId_fkey] FOREIGN KEY ([bankId]) REFERENCES [dbo].[BloodBank]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[BloodIssue] ADD CONSTRAINT [BloodIssue_requestId_fkey] FOREIGN KEY ([requestId]) REFERENCES [dbo].[BankBloodRequest]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[BloodIssue] ADD CONSTRAINT [BloodIssue_bankId_fkey] FOREIGN KEY ([bankId]) REFERENCES [dbo].[BloodBank]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
