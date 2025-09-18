-- CreateTable
DROP TABLE IF EXISTS Teacher;
DROP TABLE IF EXISTS Attendance;
DROP TABLE IF EXISTS Student;
DROP TABLE IF EXISTS CourseSubject;
DROP TABLE IF EXISTS TestScore;
DROP TABLE IF EXISTS Backlog;
DROP TABLE IF EXISTS FeePayment;
DROP TABLE IF EXISTS RiskFlag;
DROP TABLE IF EXISTS Notification;

CREATE TABLE "Teacher" (
    "teacherId" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "department" TEXT,
    "password" TEXT,
    "googleId" TEXT,
    "picture" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Student" (
    "studentId" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "dob" DATETIME NOT NULL,
    "department" TEXT,
    "currentSemester" INTEGER NOT NULL,
    "teacherId" TEXT,
    CONSTRAINT "Student_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("teacherId") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CourseSubject" (
    "courseId" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "department" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Attendance" (
    "attendanceId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "month" DATETIME NOT NULL,
    "attendancePercent" REAL NOT NULL,
    CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("studentId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Attendance_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "CourseSubject" ("courseId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TestScore" (
    "testId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "testDate" DATETIME NOT NULL,
    "score" REAL NOT NULL,
    CONSTRAINT "TestScore_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("studentId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TestScore_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "CourseSubject" ("courseId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Backlog" (
    "backlogId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL,
    "cleared" BOOLEAN NOT NULL,
    CONSTRAINT "Backlog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("studentId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Backlog_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "CourseSubject" ("courseId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FeePayment" (
    "paymentId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" TEXT NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "paidDate" DATETIME,
    "status" TEXT NOT NULL,
    "dueMonths" INTEGER NOT NULL,
    CONSTRAINT "FeePayment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("studentId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RiskFlag" (
    "riskId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "flagDate" DATETIME NOT NULL,
    CONSTRAINT "RiskFlag_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("studentId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "notificationId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "sentDate" DATETIME NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Notification_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("studentId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_email_key" ON "Teacher"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_googleId_key" ON "Teacher"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_email_key" ON "Student"("email");

-- CreateIndex
CREATE INDEX "Student_teacherId_idx" ON "Student"("teacherId");

-- CreateIndex
CREATE INDEX "Attendance_studentId_idx" ON "Attendance"("studentId");

-- CreateIndex
CREATE INDEX "Attendance_courseId_idx" ON "Attendance"("courseId");

-- CreateIndex
CREATE INDEX "TestScore_studentId_idx" ON "TestScore"("studentId");

-- CreateIndex
CREATE INDEX "TestScore_courseId_idx" ON "TestScore"("courseId");

-- CreateIndex
CREATE INDEX "Backlog_studentId_idx" ON "Backlog"("studentId");

-- CreateIndex
CREATE INDEX "Backlog_courseId_idx" ON "Backlog"("courseId");

-- CreateIndex
CREATE INDEX "FeePayment_studentId_idx" ON "FeePayment"("studentId");

-- CreateIndex
CREATE INDEX "RiskFlag_studentId_idx" ON "RiskFlag"("studentId");

-- CreateIndex
CREATE INDEX "Notification_studentId_idx" ON "Notification"("studentId");
