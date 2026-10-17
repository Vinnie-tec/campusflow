
import { sql } from "drizzle-orm";
import { connection } from "next/server";
import db from "@/lib/db";

// -------------------------------------------------------------
// GET /api/health/db
// -------------------------------------------------------------
// Temporary development endpoint used to verify that our
// application can execute a query against PostgreSQL.
export async function GET() {
  await connection();

  try {
    // Execute a simple SQL query.
    // SELECT 1 does not create, update, or delete any data.
    await db.execute(sql`SELECT 1`);

    // Return only a generic success message.
    // Never return credentials or internal database errors.
    return Response.json({
      success: true,
      message: "PostgreSQL connection successful.",
    });
  } catch (error) {
    // Log the actual error on the server for debugging.
    console.error("Database connection check failed:", error);

    // Return a generic response to the caller.
    return Response.json(
      {
        success: false,
        message: "Unable to connect to the database.",
      },
      { status: 500 },
    );
  }
}
