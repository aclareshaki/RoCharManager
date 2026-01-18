import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { InsertCharacter } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import * as localStorage from "@/lib/localStorage";

export function useCharacters(accountId?: number) {
  return useQuery({
    queryKey: accountId ? ["characters", accountId] : ["characters"],
    queryFn: () => localStorage.getCharacters(accountId),
  });
}

export function useCreateCharacter() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertCharacter) => {
      return Promise.resolve(localStorage.createCharacter(data));
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["characters", variables.accountId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["characters"] 
      });
      toast({ title: "Success", description: "Character created successfully" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });
}

export function useUpdateCharacter() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertCharacter>) => {
      const character = localStorage.getCharacters().find(c => c.id === id);
      if (!character) throw new Error("Character not found");
      
      const updated = localStorage.updateCharacter(id, data);
      return Promise.resolve(updated);
    },
    onSuccess: (data: { id: number; accountId: number; name: string; class: string; lvl: number }) => {
      queryClient.invalidateQueries({ 
        queryKey: ["characters", data.accountId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["characters"] 
      });
      toast({ title: "Success", description: "Character updated successfully" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });
}

export function useDeleteCharacter() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, accountId }: { id: number, accountId: number }) => {
      localStorage.deleteCharacter(id);
      return Promise.resolve({ id, accountId });
    },
    onSuccess: (data: { id: number; accountId: number }) => {
      const { accountId } = data;
      queryClient.invalidateQueries({ 
        queryKey: ["characters", accountId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["characters"] 
      });
      toast({ title: "Success", description: "Character deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });
}
