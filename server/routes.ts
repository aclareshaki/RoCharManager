import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Accounts
  app.get(api.accounts.list.path, async (req, res) => {
    const accounts = await storage.getAccounts();
    res.json(accounts);
  });

  app.post(api.accounts.create.path, async (req, res) => {
    try {
      const input = api.accounts.create.input.parse(req.body);
      const account = await storage.createAccount(input);
      res.status(201).json(account);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.accounts.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.accounts.update.input.parse(req.body);
      const account = await storage.updateAccount(id, input);
      if (!account) return res.status(404).json({ message: "Account not found" });
      res.json(account);
    } catch (err) {
      if (err instanceof z.ZodError) {
         return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.accounts.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    await storage.deleteAccount(id);
    res.status(204).send();
  });

  app.post("/api/accounts/reorder", async (req, res) => {
    try {
      const { ids } = z.object({ ids: z.array(z.number()) }).parse(req.body);
      await storage.updateAccountOrder(ids);
      res.status(204).send();
    } catch (err) {
      res.status(400).json({ message: "Invalid request body" });
    }
  });

  // Characters
  app.get(api.characters.list.path, async (req, res) => {
    const accountId = req.query.accountId ? Number(req.query.accountId) : undefined;
    const characters = await storage.getCharacters(accountId);
    res.json(characters);
  });

  app.post(api.characters.create.path, async (req, res) => {
    try {
      const input = api.characters.create.input.parse(req.body);
      const character = await storage.createCharacter(input);
      res.status(201).json(character);
    } catch (err) {
      if (err instanceof z.ZodError) {
         return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.characters.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.characters.update.input.parse(req.body);
      const character = await storage.updateCharacter(id, input);
      if (!character) return res.status(404).json({ message: "Character not found" });
      res.json(character);
    } catch (err) {
      if (err instanceof z.ZodError) {
         return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.characters.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    await storage.deleteCharacter(id);
    res.status(204).send();
  });

  // Import data
  app.post("/api/import", async (req, res) => {
    try {
      const data = z.object({
        accounts: z.array(z.object({
          name: z.string(),
          sortOrder: z.number().optional().default(0),
          oldId: z.number().optional(),
        })).optional(),
        characters: z.array(z.object({
          accountId: z.number(),
          oldAccountId: z.number().optional(),
          name: z.string(),
          class: z.string(),
          lvl: z.number(),
        })).optional(),
      }).parse(req.body);

      const result = await storage.importData({
        accounts: data.accounts,
        characters: data.characters,
      });

      res.status(200).json({
        message: "Data imported successfully",
        imported: {
          accounts: result.accounts.length,
          characters: result.characters.length,
        },
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      
      // Ensure we always return JSON, not HTML
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      console.error("Import error:", err);
      return res.status(500).json({
        message: "Failed to import data",
        error: errorMessage,
      });
    }
  });

  // Seed data
  const accountsList = await storage.getAccounts();
  if (accountsList.length === 0) {
    const acc1 = await storage.createAccount({ name: "Kolanthes" });
    await storage.createCharacter({ accountId: acc1.id, name: "SalmonHaki", class: "Biolo", lvl: 250 });
    await storage.createCharacter({ accountId: acc1.id, name: "AkumaNoMi", class: "Novice", lvl: 10 });
    
    await storage.createAccount({ name: "Kuma" });
    await storage.createAccount({ name: "akeruh" });
  }

  return httpServer;
}
