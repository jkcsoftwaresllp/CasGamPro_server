import { db } from "../../config/db.js";
import { users } from "../../database/schema.js";

export const getUserById = async (userId) => {
  return await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then((rows) => rows[0]);
};
