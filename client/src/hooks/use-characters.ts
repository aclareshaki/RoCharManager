import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertCharacter } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useCharacters(accountId?: number) {
  return useQuery({
    queryKey: accountId ? [api.characters.list.path, accountId] : [api.characters.list.path],
    queryFn: async () => {
      const url = accountId 
        ? `${api.characters.list.path}?accountId=${accountId}` 
        : api.characters.list.path;
        
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch characters");
      return api.characters.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateCharacter() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertCharacter) => {
      const res = await fetch(api.characters.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create character");
      }
      return api.characters.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: [api.characters.list.path, variables.accountId] 
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
      const url = buildUrl(api.characters.update.path, { id });
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update character");
      return api.characters.update.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: [api.characters.list.path, data.accountId] 
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
      const url = buildUrl(api.characters.delete.path, { id });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete character");
      return { id, accountId };
    },
    onSuccess: ({ accountId }) => {
      queryClient.invalidateQueries({ 
        queryKey: [api.characters.list.path, accountId] 
      });
      toast({ title: "Success", description: "Character deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });
}
