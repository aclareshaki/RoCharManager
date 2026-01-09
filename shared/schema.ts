import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const characters = pgTable("characters", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull(),
  name: text("name").notNull(),
  class: text("class").notNull(),
  lvl: integer("lvl").notNull(),
});

export const accountsRelations = relations(accounts, ({ many }) => ({
  characters: many(characters),
}));

export const charactersRelations = relations(characters, ({ one }) => ({
  account: one(accounts, {
    fields: [characters.accountId],
    references: [accounts.id],
  }),
}));

export const insertAccountSchema = createInsertSchema(accounts).omit({ id: true });
export const insertCharacterSchema = createInsertSchema(characters).omit({ id: true });

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Character = typeof characters.$inferSelect;
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
