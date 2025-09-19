-- CreateTable
CREATE TABLE "Batch" (
    "batchId" TEXT NOT NULL PRIMARY KEY,
    "batchNo" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "department" TEXT NOT NULL,
    CONSTRAINT "Batch_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "CourseSubject" ("courseId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Project" (
    "projectId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "studentId" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'Active',
    CONSTRAINT "Project_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("studentId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Project_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "Teacher" ("teacherId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PhdSupervision" (
    "phdId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "researchArea" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "expectedEnd" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'Ongoing',
    CONSTRAINT "PhdSupervision_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("studentId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PhdSupervision_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "Teacher" ("teacherId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Fellowship" (
    "fellowshipId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "duration" INTEGER NOT NULL,
    "studentId" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'Active',
    CONSTRAINT "Fellowship_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("studentId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Fellowship_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "Teacher" ("teacherId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Student" (
    "studentId" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "dob" DATETIME NOT NULL,
    "department" TEXT,
    "currentSemester" INTEGER NOT NULL,
    "batchId" TEXT,
    "parentName" TEXT,
    "parentEmail" TEXT,
    "parentPhone" TEXT,
    "address" TEXT,
    "teacherId" TEXT,
    CONSTRAINT "Student_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("teacherId") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Student_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("batchId") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Student" ("currentSemester", "department", "dob", "email", "name", "phone", "studentId", "teacherId") SELECT "currentSemester", "department", "dob", "email", "name", "phone", "studentId", "teacherId" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
CREATE UNIQUE INDEX "Student_email_key" ON "Student"("email");
CREATE INDEX "Student_teacherId_idx" ON "Student"("teacherId");
CREATE INDEX "Student_batchId_idx" ON "Student"("batchId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Batch_courseId_idx" ON "Batch"("courseId");

-- CreateIndex
CREATE INDEX "Project_studentId_idx" ON "Project"("studentId");

-- CreateIndex
CREATE INDEX "Project_supervisorId_idx" ON "Project"("supervisorId");

-- CreateIndex
CREATE INDEX "PhdSupervision_studentId_idx" ON "PhdSupervision"("studentId");

-- CreateIndex
CREATE INDEX "PhdSupervision_supervisorId_idx" ON "PhdSupervision"("supervisorId");

-- CreateIndex
CREATE INDEX "Fellowship_studentId_idx" ON "Fellowship"("studentId");

-- CreateIndex
CREATE INDEX "Fellowship_supervisorId_idx" ON "Fellowship"("supervisorId");
