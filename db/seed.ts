import { getDb } from "../api/queries/connection";
import { users } from "./schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../api/auth-utils";

async function seed() {
  const db = getDb();

  const existing = db.select().from(users).where(eq(users.email, "conpascual5@gmail.com")).all();
  if (existing.length > 0) {
    console.log("Admin user already exists");
    return;
  }

  const passwordHash = await hashPassword("admin123");
  db.insert(users).values({
    email: "conpascual5@gmail.com",
    passwordHash,
    name: "BC AI Admin",
    isActive: true,
    isAdmin: true,
  }).run();

  console.log("Admin user created: conpascual5@gmail.com / admin123");
}

seed().catch(console.error);
