import { accounts, characters, type Account, type InsertAccount, type Character, type InsertCharacter } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getAccounts(): Promise<Account[]>;
  getAccount(id: number): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, account: InsertAccount): Promise<Account | undefined>;
  deleteAccount(id: number): Promise<void>;

  getCharacters(accountId?: number): Promise<Character[]>;
  getCharacter(id: number): Promise<Character | undefined>;
  createCharacter(character: InsertCharacter): Promise<Character>;
  updateCharacter(id: number, character: Partial<InsertCharacter>): Promise<Character | undefined>;
  deleteCharacter(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getAccounts(): Promise<Account[]> {
    return await db.select().from(accounts).orderBy(accounts.id);
  }

  async getAccount(id: number): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account;
  }

  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    const [account] = await db.insert(accounts).values(insertAccount).returning();
    return account;
  }

  async updateAccount(id: number, insertAccount: InsertAccount): Promise<Account | undefined> {
    const [account] = await db
      .update(accounts)
      .set(insertAccount)
      .where(eq(accounts.id, id))
      .returning();
    return account;
  }

  async deleteAccount(id: number): Promise<void> {
    await db.delete(characters).where(eq(characters.accountId, id)); // Cascade delete characters
    await db.delete(accounts).where(eq(accounts.id, id));
  }

  async getCharacters(accountId?: number): Promise<Character[]> {
    if (accountId) {
      return await db.select().from(characters).where(eq(characters.accountId, accountId)).orderBy(characters.id);
    }
    return await db.select().from(characters).orderBy(characters.id);
  }

  async getCharacter(id: number): Promise<Character | undefined> {
    const [character] = await db.select().from(characters).where(eq(characters.id, id));
    return character;
  }

  async createCharacter(insertCharacter: InsertCharacter): Promise<Character> {
    const [character] = await db.insert(characters).values(insertCharacter).returning();
    return character;
  }

  async updateCharacter(id: number, insertCharacter: Partial<InsertCharacter>): Promise<Character | undefined> {
    const [character] = await db
      .update(characters)
      .set(insertCharacter)
      .where(eq(characters.id, id))
      .returning();
    return character;
  }

  async deleteCharacter(id: number): Promise<void> {
    await db.delete(characters).where(eq(characters.id, id));
  }
}

export const storage = new DatabaseStorage();
