-- CreateTable
CREATE TABLE "MentalHealthAssessment" (
    "assessmentId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" TEXT NOT NULL,
    "assessmentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stressLevel" INTEGER NOT NULL,
    "anxietyLevel" INTEGER NOT NULL,
    "depressionLevel" INTEGER NOT NULL,
    "sleepQuality" INTEGER NOT NULL,
    "academicPressure" INTEGER NOT NULL,
    "socialSupport" INTEGER NOT NULL,
    "overallWellness" INTEGER NOT NULL,
    "notes" TEXT,
    "riskScore" REAL,
    CONSTRAINT "MentalHealthAssessment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("studentId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CounselingAppointment" (
    "appointmentId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" TEXT NOT NULL,
    "counselorName" TEXT NOT NULL,
    "appointmentDate" DATETIME NOT NULL,
    "duration" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Scheduled',
    "notes" TEXT,
    "followUpNeeded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CounselingAppointment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("studentId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WellnessChallenge" (
    "challengeId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" TEXT NOT NULL,
    "challengeType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targetValue" INTEGER NOT NULL,
    "currentProgress" INTEGER NOT NULL DEFAULT 0,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "points" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "WellnessChallenge_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("studentId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "ticketId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "resolvedAt" DATETIME,
    "assignedTo" TEXT,
    "response" TEXT,
    CONSTRAINT "SupportTicket_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("studentId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MentalHealthAssessment_studentId_idx" ON "MentalHealthAssessment"("studentId");

-- CreateIndex
CREATE INDEX "MentalHealthAssessment_assessmentDate_idx" ON "MentalHealthAssessment"("assessmentDate");

-- CreateIndex
CREATE INDEX "CounselingAppointment_studentId_idx" ON "CounselingAppointment"("studentId");

-- CreateIndex
CREATE INDEX "CounselingAppointment_appointmentDate_idx" ON "CounselingAppointment"("appointmentDate");

-- CreateIndex
CREATE INDEX "WellnessChallenge_studentId_idx" ON "WellnessChallenge"("studentId");

-- CreateIndex
CREATE INDEX "WellnessChallenge_challengeType_idx" ON "WellnessChallenge"("challengeType");

-- CreateIndex
CREATE INDEX "SupportTicket_studentId_idx" ON "SupportTicket"("studentId");

-- CreateIndex
CREATE INDEX "SupportTicket_status_idx" ON "SupportTicket"("status");

-- CreateIndex
CREATE INDEX "SupportTicket_priority_idx" ON "SupportTicket"("priority");
