import express from "express";
import { and, eq } from "drizzle-orm";

import { db } from "../db/index.js";
// Added .js extension for ESM compatibility
import {
  classes,
  departments,
  enrollments,
  subjects,
  user,
} from "../db/schema/index.js";

const router = express.Router();

const getEnrollmentDetails = async (classId: number, studentId: string) => {
  const results = await db
    .select({
      enrollment: enrollments,
      class: classes,
      subject: subjects,
      department: departments,
      teacher: user,
    })
    .from(enrollments)
    .leftJoin(classes, eq(enrollments.classId, classes.id))
    .leftJoin(subjects, eq(classes.subjectId, subjects.id))
    .leftJoin(departments, eq(subjects.departmentId, departments.id))
    .leftJoin(user, eq(classes.teacherId, user.id))
    .where(
      and(
        eq(enrollments.classId, classId),
        eq(enrollments.studentId, studentId)
      )
    )
    .limit(1);

  return results[0] ?? null;
};

// Create enrollment
router.post("/", async (req, res) => {
  try {
    console.log("POST /enrollments - Request body:", req.body);
    const { classId, studentId } = req.body;

    if (!classId || !studentId) {
      return res.status(400).json({ error: "classId and studentId are required" });
    }

    // 1. Verify Class exists
    console.log("Step 1: Checking if class exists...");
    const [classRecord] = await db.select().from(classes).where(eq(classes.id, classId)).limit(1);
    console.log("Step 1 complete: Class found?", !!classRecord);
    if (!classRecord) return res.status(404).json({ error: "Class not found" });

    // 2. Verify Student exists
    console.log("Step 2: Checking if student exists...");
    const [student] = await db.select().from(user).where(eq(user.id, studentId)).limit(1);
    console.log("Step 2 complete: Student found?", !!student);
    if (!student) return res.status(404).json({ error: "Student not found" });

    // 3. Check for existing enrollment
    console.log("Step 3: Checking for existing enrollment...");
    const [existing] = await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.classId, classId), eq(enrollments.studentId, studentId)))
      .limit(1);
    console.log("Step 3 complete: Existing enrollment?", !!existing);

    if (existing) return res.status(409).json({ error: "Student already enrolled" });

    // 4. Perform Insert
    console.log("Step 4: Inserting enrollment...");
    await db.insert(enrollments).values({ classId, studentId });
    console.log("Step 4 complete: Enrollment inserted");

    // 5. Fetch enriched data
    console.log("Step 5: Fetching enrollment details...");
    const enrollment = await getEnrollmentDetails(classId, studentId);
    console.log("Step 5 complete: Enrollment details fetched");
    console.log("POST /enrollments - Success, enrollment created:", enrollment);
    res.status(201).json({ data: enrollment });

  } catch (error) {
    console.error("POST /enrollments error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Join class by invite code
router.post("/join", async (req, res) => {
  try {
    const { inviteCode, studentId } = req.body;

    if (!inviteCode || !studentId) {
      return res.status(400).json({ error: "inviteCode and studentId are required" });
    }

    // 1. Find class by code
    const [classRecord] = await db.select().from(classes).where(eq(classes.inviteCode, inviteCode)).limit(1);
    if (!classRecord) return res.status(404).json({ error: "Invalid invite code" });

    // 2. Check existing enrollment
    const [existing] = await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.classId, classRecord.id), eq(enrollments.studentId, studentId)))
      .limit(1);

    if (existing) return res.status(409).json({ error: "Already enrolled" });

    // 3. Insert and return details
    await db.insert(enrollments).values({ classId: classRecord.id, studentId });
    const enrollment = await getEnrollmentDetails(classRecord.id, studentId);

    res.status(201).json({ data: enrollment });

  } catch (error) {
    console.error("POST /enrollments/join error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;