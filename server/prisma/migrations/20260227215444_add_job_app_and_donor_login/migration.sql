/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `BloodDonor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[applicantUserId]` on the table `StaffApplication` will be added. If there are existing duplicate values, this will fail.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[BloodDonor] ADD [userId] INT;

-- AlterTable
ALTER TABLE [dbo].[StaffApplication] ADD [applicantUserId] INT;

-- CreateTable
CREATE TABLE [dbo].[ITWorker] (
    [id] INT NOT NULL IDENTITY(1,1),
    [fullName] NVARCHAR(1000) NOT NULL,
    [userId] INT NOT NULL,
    CONSTRAINT [ITWorker_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ITWorker_userId_key] UNIQUE NONCLUSTERED ([userId])
);

-- CreateIndex
ALTER TABLE [dbo].[BloodDonor] ADD CONSTRAINT [BloodDonor_userId_key] UNIQUE NONCLUSTERED ([userId]);

-- CreateIndex
ALTER TABLE [dbo].[StaffApplication] ADD CONSTRAINT [StaffApplication_applicantUserId_key] UNIQUE NONCLUSTERED ([applicantUserId]);

-- AddForeignKey
ALTER TABLE [dbo].[ITWorker] ADD CONSTRAINT [ITWorker_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[StaffApplication] ADD CONSTRAINT [StaffApplication_applicantUserId_fkey] FOREIGN KEY ([applicantUserId]) REFERENCES [dbo].[User]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[BloodDonor] ADD CONSTRAINT [BloodDonor_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
