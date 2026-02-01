import { and, desc, eq, getTableColumns, ilike, or, sql } from "drizzle-orm";
import express from "express";
import { departments, subjects } from "../db/schema/app.js";
import { db } from "../db/index.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { search, department, page = 1, limit = 10 } = req.query;
    const currentPage = Math.max(1, +page);
    const limitPerPage = Math.max(1, +limit);
    const offset = (currentPage - 1) * limitPerPage;
    const filterConditions = [];
    if (search) {
      filterConditions.push(
        or(
          ilike(subjects.name, `%${search}%`),
          ilike(subjects.code, `%${search}%`),
        ),
      );
    }
    if (department) {
      filterConditions.push(ilike(departments.name, `%${department}%`));
    }
    const whereClause =
      filterConditions.length > 0 ? and(...filterConditions) : undefined;
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(subjects)
      .leftJoin(departments, eq(subjects.departmentId, departments.id))
      .where(whereClause);
    const totalCount = countResult[0]?.count ?? 0;
    const subjectsList = await db
      .select({
        ...getTableColumns(subjects),
        department: { ...getTableColumns(departments) },
      })
      .from(subjects)
      .leftJoin(departments, eq(subjects.departmentId, departments.id))
      .orderBy(desc(subjects.createdAt))
      .limit(limitPerPage)
      .offset(offset);
    res.status(200).json({
      data: subjectsList,
      pagination: {
        page: currentPage,
        limit: limitPerPage,
        total: totalCount,
      },
    });
  } catch (error) {
    console.error(`Error fetching subjects: ${error}`);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Create subject
router.post("/", async (req, res) => {
  try {
    console.log("POST /subjects - Request body:", req.body);
    const { departmentId, name, code, description } = req.body;

    // Validate required fields
    if (!departmentId || !name || !code || !description) {
      return res.status(400).json({ 
        error: "departmentId, name, code, and description are required" 
      });
    }

    // Check if department exists
    const [department] = await db
      .select()
      .from(departments)
      .where(eq(departments.id, departmentId))
      .limit(1);

    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }

    // Check if subject code already exists
    const [existingCode] = await db
      .select()
      .from(subjects)
      .where(eq(subjects.code, code))
      .limit(1);

    if (existingCode) {
      return res.status(409).json({ error: "Subject code already exists" });
    }

    // Insert subject
    const [newSubject] = await db
      .insert(subjects)
      .values({
        departmentId,
        name,
        code,
        description,
      })
      .returning();

    console.log("POST /subjects - Success, subject created:", newSubject);
    res.status(201).json({ data: newSubject });

  } catch (error) {
    console.error("POST /subjects error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;