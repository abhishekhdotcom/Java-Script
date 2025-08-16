import { relations } from "drizzle-orm";
import {
  timestamp,
  mysqlTable,
  serial,
  varchar,
  int,
  text,
  boolean,
} from "drizzle-orm/mysql-core";

// -----------User Table-----------
export const usersTable = mysqlTable("users_table", {
  id: serial("id").primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  age: int().notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  isValidEmail: boolean("is_valid_email").notNull().default(false),
  password: varchar({ length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// -----------Session Table-----------
export const sessionsTable = mysqlTable("sessions", {
  sessionId: serial("session_id").primaryKey(),
  userId: int("user_id", { unsigned: true })
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }), // if a user is deleted, their sessions are automatically deleted!
  isValid: boolean("is_valid").notNull().default(true), 
  userAgent: text("user_agent"),
  ip: varchar({ length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// -----------Sessions Relation-----------
export const sessionsRelation = relations(sessionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [sessionsTable.userId], // Foreign Key
    references: [usersTable.id],
  }),
}));
