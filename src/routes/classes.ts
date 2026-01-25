import express from "express";
import { db } from "../db/index.js";
import { classes } from "../db/schema/app.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    // 1. Generate the code correctly
    const generatedInviteCode = Math.random()
      .toString(36)
      .substring(2, 9)
      .toUpperCase();

    const [createdClass] = await db
      .insert(classes)
      .values({
        ...req.body,
        inviteCode: generatedInviteCode, // Fixed the typo here
        schedules: req.body.schedules || [], // Ensure it defaults to empty array if not in body
      })
      .returning({ id: classes.id });

    if (!createdClass) {
      return res.status(400).json({ message: "Failed to create class" });
    }

    res.status(201).json({ data: createdClass });
  } catch (error) {
    // Log the actual error to see if it's a Foreign Key issue (Subject/Teacher ID)
    console.error(`Error creating class:`, error);

    // Check for specific Postgres Error codes
    if ((error as any).code === "23503") {
      return res
        .status(400)
        .json({ message: "Invalid Teacher ID or Subject ID" });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
});
export default router;
