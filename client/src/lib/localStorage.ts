import type { Account, Character, InsertAccount, InsertCharacter } from "@shared/schema";

const STORAGE_KEYS = {
  ACCOUNTS: "rochardb_accounts",
  CHARACTERS: "rochardb_characters",
} as const;

// Helper para generar IDs únicos
let nextAccountId = 1;
let nextCharacterId = 1;

function initIds() {
  const accounts = getAccounts();
  const characters = getCharacters();
  
  if (accounts.length > 0) {
    nextAccountId = Math.max(...accounts.map(a => a.id)) + 1;
  }
  if (characters.length > 0) {
    nextCharacterId = Math.max(...characters.map(c => c.id)) + 1;
  }
}

// Inicializar IDs al cargar
if (typeof window !== "undefined") {
  initIds();
}

// Accounts
export function getAccounts(): Account[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveAccounts(accounts: Account[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
}

export function createAccount(data: InsertAccount): Account {
  const accounts = getAccounts();
  const newAccount: Account = {
    id: nextAccountId++,
    name: data.name,
    sortOrder: data.sortOrder ?? 0,
  };
  accounts.push(newAccount);
  saveAccounts(accounts);
  return newAccount;
}

export function updateAccount(id: number, data: Partial<InsertAccount>): Account {
  const accounts = getAccounts();
  const index = accounts.findIndex(a => a.id === id);
  if (index === -1) throw new Error("Account not found");
  
  accounts[index] = { ...accounts[index], ...data };
  saveAccounts(accounts);
  return accounts[index];
}

export function deleteAccount(id: number): void {
  const accounts = getAccounts();
  const filtered = accounts.filter(a => a.id !== id);
  saveAccounts(filtered);
  
  // También eliminar personajes asociados
  const characters = getCharacters();
  const filteredCharacters = characters.filter(c => c.accountId !== id);
  saveCharacters(filteredCharacters);
}

export function deleteAllAccounts(): void {
  saveAccounts([]);
  saveCharacters([]);
}

// Characters
export function getCharacters(accountId?: number): Character[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEYS.CHARACTERS);
  if (!data) return [];
  try {
    const characters = JSON.parse(data);
    if (accountId !== undefined) {
      return characters.filter((c: Character) => c.accountId === accountId);
    }
    return characters;
  } catch {
    return [];
  }
}

export function saveCharacters(characters: Character[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(characters));
}

export function createCharacter(data: InsertCharacter): Character {
  const characters = getCharacters();
  const newCharacter: Character = {
    id: nextCharacterId++,
    accountId: data.accountId,
    name: data.name,
    class: data.class,
    lvl: data.lvl,
  };
  characters.push(newCharacter);
  saveCharacters(characters);
  return newCharacter;
}

export function updateCharacter(id: number, data: Partial<InsertCharacter>): Character {
  const characters = getCharacters();
  const index = characters.findIndex(c => c.id === id);
  if (index === -1) throw new Error("Character not found");
  
  characters[index] = { ...characters[index], ...data };
  saveCharacters(characters);
  return characters[index];
}

export function deleteCharacter(id: number): void {
  const characters = getCharacters();
  const filtered = characters.filter(c => c.id !== id);
  saveCharacters(filtered);
}

// Import/Export
export function exportData(): { accounts: Account[]; characters: Character[] } {
  return {
    accounts: getAccounts(),
    characters: getCharacters(),
  };
}

export function importData(data: { accounts?: Account[]; characters?: Character[] }): void {
  if (data.accounts) {
    // Mapear IDs antiguos a nuevos
    const accountIdMap = new Map<number, number>();
    const existingAccounts = getAccounts();
    const maxId = existingAccounts.length > 0 
      ? Math.max(...existingAccounts.map(a => a.id)) 
      : 0;
    
    let newId = maxId + 1;
    
    for (const account of data.accounts) {
      const oldId = account.id;
      const newAccount: Account = {
        id: newId,
        name: account.name,
        sortOrder: account.sortOrder ?? 0,
      };
      existingAccounts.push(newAccount);
      accountIdMap.set(oldId, newId);
      newId++;
    }
    
    saveAccounts(existingAccounts);
    
    // Importar personajes con IDs de cuenta mapeados
    if (data.characters) {
      const existingCharacters = getCharacters();
      const maxCharId = existingCharacters.length > 0
        ? Math.max(...existingCharacters.map(c => c.id))
        : 0;
      
      let newCharId = maxCharId + 1;
      
      for (const character of data.characters) {
        const newAccountId = accountIdMap.get(character.accountId) ?? character.accountId;
        const newCharacter: Character = {
          id: newCharId++,
          accountId: newAccountId,
          name: character.name,
          class: character.class,
          lvl: character.lvl,
        };
        existingCharacters.push(newCharacter);
      }
      
      saveCharacters(existingCharacters);
    }
  } else if (data.characters) {
    // Solo personajes, sin cuentas
    const existingCharacters = getCharacters();
    const maxCharId = existingCharacters.length > 0
      ? Math.max(...existingCharacters.map(c => c.id))
      : 0;
    
    let newCharId = maxCharId + 1;
    
    for (const character of data.characters) {
      const newCharacter: Character = {
        id: newCharId++,
        accountId: character.accountId,
        name: character.name,
        class: character.class,
        lvl: character.lvl,
      };
      existingCharacters.push(newCharacter);
    }
    
    saveCharacters(existingCharacters);
  }
  
  // Reinicializar IDs
  initIds();
}

export function hasData(): boolean {
  const accounts = getAccounts();
  const characters = getCharacters();
  return accounts.length > 0 || characters.length > 0;
}
