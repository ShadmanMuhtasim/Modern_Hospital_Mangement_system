BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[BloodInventory] (
    [id] INT NOT NULL IDENTITY(1,1),
    [bloodGroup] NVARCHAR(1000) NOT NULL,
    [unitsAvailable] INT NOT NULL CONSTRAINT [BloodInventory_unitsAvailable_df] DEFAULT 0,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [BloodInventory_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [BloodInventory_bloodGroup_key] UNIQUE NONCLUSTERED ([bloodGroup])
);

-- CreateTable
CREATE TABLE [dbo].[BloodRequest] (
    [id] INT NOT NULL IDENTITY(1,1),
    [bloodGroup] NVARCHAR(1000) NOT NULL,
    [unitsRequested] INT NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [BloodRequest_status_df] DEFAULT 'PENDING',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [BloodRequest_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [patientId] INT NOT NULL,
    CONSTRAINT [BloodRequest_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[BloodDonation] (
    [id] INT NOT NULL IDENTITY(1,1),
    [bloodGroup] NVARCHAR(1000) NOT NULL,
    [unitsDonated] INT NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [BloodDonation_status_df] DEFAULT 'APPROVED',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [BloodDonation_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [patientId] INT NOT NULL,
    CONSTRAINT [BloodDonation_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[BloodRequest] ADD CONSTRAINT [BloodRequest_patientId_fkey] FOREIGN KEY ([patientId]) REFERENCES [dbo].[Patient]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[BloodDonation] ADD CONSTRAINT [BloodDonation_patientId_fkey] FOREIGN KEY ([patientId]) REFERENCES [dbo].[Patient]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
