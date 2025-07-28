import { eq } from "drizzle-orm";
import { db } from "./config/db.js";
import { usersTable } from "./drizzle/schema.js";

const main = async () => {
  try {
    // ----------Insert Data----------
    const user = {
      name: "Abhishekh Kumar",
      age: 23,
      email: "abhishekhkumar1516@gmail.com",
    };
    const insertResult = await db.insert(usersTable).values(user);
    console.log("New user created: ", insertResult);


    // ----------Read all user data----------
    const users = await db.select().from(usersTable);
    console.log("Getting all users from the database: ", users);


    // ----------Update user data----------
    const updatedUser = await db
      .update(usersTable)
      .set({
        age: 23,
        name: "Abhishekh Kumar",
      })
      .where(eq(usersTable.email, "abhishekhkumar1516@gmail.com"));
    console.log("User data Updated: ", updatedUser);

    
    // ----------Delete user data----------
    const deletedUser = await db
      .delete(usersTable)
      .where(eq(usersTable.age, 23));
    console.log(deletedUser);
  } catch (error) {
    console.error("Error occurred:", error);
  }
};

main();
