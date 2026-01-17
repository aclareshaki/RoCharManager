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
    return await db.select().from(accounts).orderBy(accounts.sortOrder, accounts.id);
  }

  async getAccount(id: number): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account;
  }

  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    const [account] = await db.insert(accounts).values(insertAccount).returning();
    return account;
  }

  async updateAccount(id: number, insertAccount: Partial<InsertAccount>): Promise<Account | undefined> {
    const [account] = await db
      .update(accounts)
      .set(insertAccount)
      .where(eq(accounts.id, id))
      .returning();
    return account;
  }

  async updateAccountOrder(reorderedIds: number[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (let i = 0; i < reorderedIds.length; i++) {
        await tx
          .update(accounts)
          .set({ sortOrder: i })
          .where(eq(accounts.id, reorderedIds[i]));
      }
    });
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

  async importData(data: { 
    accounts?: Array<InsertAccount & { oldId?: number }>, 
    characters?: Array<InsertCharacter & { oldAccountId?: number }> 
  }): Promise<{ accounts: Account[], characters: Character[] }> {
    const importedAccounts: Account[] = [];
    const importedCharacters: Character[] = [];
    const accountIdMap = new Map<number, number>(); // oldId -> newId

    await db.transaction(async (tx) => {
      // Import accounts
      if (data.accounts && data.accounts.length > 0) {
        for (const accountData of data.accounts) {
          const { oldId, ...accountInsert } = accountData;
          const [account] = await tx.insert(accounts).values(accountInsert).returning();
          importedAccounts.push(account);
          // Map old ID to new ID if provided
          if (oldId !== undefined) {
            accountIdMap.set(oldId, account.id);
          }
        }
      }

      // Import characters
      if (data.characters && data.characters.length > 0) {
        for (const charData of data.characters) {
          const { oldAccountId, accountId: oldAccountIdFromData, ...charInsert } = charData;
          
          // Priority: Use oldAccountId for mapping if provided
          let finalAccountId: number | undefined;
          
          if (oldAccountId !== undefined) {
            // Try to map oldAccountId to new ID
            if (accountIdMap.has(oldAccountId)) {
              finalAccountId = accountIdMap.get(oldAccountId)!;
            } else {
              // Skip characters with oldAccountId that couldn't be mapped
              console.warn(`Skipping character ${charData.name}: account ID ${oldAccountId} not found in imported accounts`);
              continue;
            }
          } else if (oldAccountIdFromData !== undefined) {
            // If no oldAccountId but we have accountId, try to map it
            if (accountIdMap.has(oldAccountIdFromData)) {
              finalAccountId = accountIdMap.get(oldAccountIdFromData)!;
            } else {
              // Use the accountId as-is (might be an existing account)
              finalAccountId = oldAccountIdFromData;
            }
          }
          
          // Verify accountId exists before inserting
          if (finalAccountId !== undefined) {
            const accountExists = await tx.select().from(accounts).where(eq(accounts.id, finalAccountId)).limit(1);
            if (accountExists.length === 0) {
              console.warn(`Skipping character ${charData.name}: account ID ${finalAccountId} does not exist`);
              continue;
            }
            charInsert.accountId = finalAccountId;
          } else {
            // No valid accountId found
            console.warn(`Skipping character ${charData.name}: no valid accountId found`);
            continue;
          }
          
          const [character] = await tx.insert(characters).values(charInsert).returning();
          importedCharacters.push(character);
        }
      }
    });

    return { accounts: importedAccounts, characters: importedCharacters };
  }
}

export const storage = new DatabaseStorage();
