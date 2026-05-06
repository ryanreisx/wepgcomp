-- CreateEnum
CREATE TYPE "profile" AS ENUM ('DoctoralStudent', 'Professor', 'Listener');

-- CreateEnum
CREATE TYPE "user_level" AS ENUM ('Superadmin', 'Admin', 'Default');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('Submitted', 'UnderReview', 'Accepted', 'Rejected', 'Withdrawn');

-- CreateEnum
CREATE TYPE "PresentationBlockType" AS ENUM ('Presentation', 'Keynote', 'Break', 'Other');

-- CreateEnum
CREATE TYPE "PresentationStatus" AS ENUM ('Scheduled', 'Completed', 'Cancelled');

-- CreateEnum
CREATE TYPE "PanelistStatus" AS ENUM ('Confirmed', 'Declined', 'Pending');

-- CreateEnum
CREATE TYPE "committee_level" AS ENUM ('Committee', 'Coordinator');

-- CreateEnum
CREATE TYPE "CommitteeRole" AS ENUM ('Organizer', 'Reviewer', 'Evaluator');

-- CreateTable
CREATE TABLE "UserAccount" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "registrationNumber" VARCHAR(20),
    "photoFilePath" VARCHAR(255),
    "profile" "profile" NOT NULL DEFAULT 'DoctoralStudent',
    "level" "user_level" NOT NULL DEFAULT 'Default',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailVerificationToken" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),
    "emailVerificationSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventEdition" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "callForPapersText" TEXT NOT NULL,
    "partnersText" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "submissionStartDate" TIMESTAMP(3) NOT NULL,
    "submissionDeadline" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isEvaluationRestrictToLoggedUsers" BOOLEAN NOT NULL DEFAULT true,
    "presentationDuration" INTEGER NOT NULL DEFAULT 20,
    "presentationsPerPresentationBlock" INTEGER NOT NULL DEFAULT 6,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventEdition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "advisorId" TEXT NOT NULL,
    "mainAuthorId" TEXT NOT NULL,
    "eventEditionId" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "abstract" TEXT NOT NULL,
    "pdfFile" VARCHAR(255) NOT NULL,
    "phoneNumber" VARCHAR(20) NOT NULL,
    "proposed_presentation_block_id" TEXT,
    "proposedPositionWithinBlock" INTEGER,
    "coAdvisor" VARCHAR(255),
    "status" "SubmissionStatus" NOT NULL DEFAULT 'Submitted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationCriteria" (
    "id" TEXT NOT NULL,
    "eventEditionId" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "weightRadio" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvaluationCriteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "evaluationCriteriaId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "comments" TEXT,
    "name" VARCHAR(255),
    "email" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "eventEditionId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PresentationBlock" (
    "id" TEXT NOT NULL,
    "eventEditionId" TEXT NOT NULL,
    "roomId" TEXT,
    "type" "PresentationBlockType" NOT NULL,
    "title" VARCHAR(255),
    "speakerName" VARCHAR(255),
    "startTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PresentationBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Presentation" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "presentationBlockId" TEXT NOT NULL,
    "positionWithinBlock" INTEGER NOT NULL,
    "status" "PresentationStatus" NOT NULL DEFAULT 'Scheduled',
    "publicAverageScore" DOUBLE PRECISION,
    "evaluatorsAverageScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Presentation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Panelist" (
    "id" TEXT NOT NULL,
    "presentationBlockId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "PanelistStatus" NOT NULL DEFAULT 'Confirmed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Panelist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AwardedPanelist" (
    "eventEditionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AwardedPanelist_pkey" PRIMARY KEY ("eventEditionId","userId")
);

-- CreateTable
CREATE TABLE "CommitteeMember" (
    "id" TEXT NOT NULL,
    "eventEditionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "level" "committee_level" NOT NULL,
    "role" "CommitteeRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommitteeMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "eventEditionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "isEmailSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guidance" (
    "id" TEXT NOT NULL,
    "eventEditionId" TEXT NOT NULL,
    "summary" TEXT,
    "authorGuidance" TEXT,
    "reviewerGuidance" TEXT,
    "audienceGuidance" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guidance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserAccount_email_key" ON "UserAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserAccount_registrationNumber_key" ON "UserAccount"("registrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerification_userId_key" ON "EmailVerification"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerification_emailVerificationToken_key" ON "EmailVerification"("emailVerificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "Presentation_submissionId_key" ON "Presentation"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "CommitteeMember_eventEditionId_userId_key" ON "CommitteeMember"("eventEditionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Guidance_eventEditionId_key" ON "Guidance"("eventEditionId");

-- AddForeignKey
ALTER TABLE "EmailVerification" ADD CONSTRAINT "EmailVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "UserAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_mainAuthorId_fkey" FOREIGN KEY ("mainAuthorId") REFERENCES "UserAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_eventEditionId_fkey" FOREIGN KEY ("eventEditionId") REFERENCES "EventEdition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_proposed_presentation_block_id_fkey" FOREIGN KEY ("proposed_presentation_block_id") REFERENCES "PresentationBlock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationCriteria" ADD CONSTRAINT "EvaluationCriteria_eventEditionId_fkey" FOREIGN KEY ("eventEditionId") REFERENCES "EventEdition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_evaluationCriteriaId_fkey" FOREIGN KEY ("evaluationCriteriaId") REFERENCES "EvaluationCriteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_eventEditionId_fkey" FOREIGN KEY ("eventEditionId") REFERENCES "EventEdition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresentationBlock" ADD CONSTRAINT "PresentationBlock_eventEditionId_fkey" FOREIGN KEY ("eventEditionId") REFERENCES "EventEdition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresentationBlock" ADD CONSTRAINT "PresentationBlock_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presentation" ADD CONSTRAINT "Presentation_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presentation" ADD CONSTRAINT "Presentation_presentationBlockId_fkey" FOREIGN KEY ("presentationBlockId") REFERENCES "PresentationBlock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Panelist" ADD CONSTRAINT "Panelist_presentationBlockId_fkey" FOREIGN KEY ("presentationBlockId") REFERENCES "PresentationBlock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Panelist" ADD CONSTRAINT "Panelist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AwardedPanelist" ADD CONSTRAINT "AwardedPanelist_eventEditionId_fkey" FOREIGN KEY ("eventEditionId") REFERENCES "EventEdition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AwardedPanelist" ADD CONSTRAINT "AwardedPanelist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeMember" ADD CONSTRAINT "CommitteeMember_eventEditionId_fkey" FOREIGN KEY ("eventEditionId") REFERENCES "EventEdition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeMember" ADD CONSTRAINT "CommitteeMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_eventEditionId_fkey" FOREIGN KEY ("eventEditionId") REFERENCES "EventEdition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guidance" ADD CONSTRAINT "Guidance_eventEditionId_fkey" FOREIGN KEY ("eventEditionId") REFERENCES "EventEdition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
