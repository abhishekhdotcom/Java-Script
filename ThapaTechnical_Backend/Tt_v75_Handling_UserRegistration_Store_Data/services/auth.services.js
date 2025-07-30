import { db } from "../config/db.js";
import { eq } from "drizzle-orm";
import { usersTable } from "../drizzle/schema.js";

// --------------Get User from DB by Email---------------
export const getUserByEmail = async (email) => {
  // Get user from DB
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  return user;
};

// --------------Create User store data in DB---------------
export const createUser = async ({ name, age, email, password }) => {
  // Insert data in DB
  return await db
    .insert(usersTable)
    .values({ name, age, email, password })
    .$returningId();
};
