import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type InsertAccount } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import * as localStorage from "@/lib/localStorage";
import { t } from "@/lib/i18n";

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: () => localStorage.getAccounts(),
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertAccount) => {
      return Promise.resolve(localStorage.createAccount(data));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast({ title: t("accountCreated"), description: t("accountCreated") });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertAccount>) => {
      return Promise.resolve(localStorage.updateAccount(id, data));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["characters"] });
      toast({ title: t("accountUpdated"), description: t("accountUpdated") });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      localStorage.deleteAccount(id);
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["characters"] });
      toast({ title: t("accountDeleted"), description: t("accountDeleted") });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });
}

export function useDeleteAllAccounts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      localStorage.deleteAllAccounts();
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["characters"] });
      toast({ 
        title: t("allDataCleared"), 
        description: t("allDataClearedDesc"),
        variant: "destructive"
      });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });
}
