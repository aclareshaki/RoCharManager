import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAccountSchema, type InsertAccount, type Account } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useCreateAccount, useUpdateAccount } from "@/hooks/use-accounts";
import { ROButton, ROInput } from "./ROPanel";
import { useState } from "react";
import { Plus, Edit } from "lucide-react";
import { t } from "@/lib/i18n";

interface AccountDialogProps {
  account?: Account;
  trigger?: React.ReactNode;
}

export function AccountDialog({ account, trigger }: AccountDialogProps) {
  const [open, setOpen] = useState(false);
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();
  const isEditing = !!account;

  const form = useForm<InsertAccount>({
    resolver: zodResolver(insertAccountSchema),
    defaultValues: {
      name: account?.name || "",
    },
  });

  const onSubmit = async (data: InsertAccount) => {
    if (isEditing) {
      await updateMutation.mutateAsync({ id: account.id, ...data });
    } else {
      await createMutation.mutateAsync(data);
    }
    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <ROButton variant={isEditing ? "icon" : "primary"} size={isEditing ? "sm" : "md"} className={!isEditing ? "min-w-[140px] flex items-center justify-center" : ""}>
            {isEditing ? <Edit className="w-4 h-4" /> : <><Plus className="w-4 h-4 mr-2" /> {t("newAccount")}</>}
          </ROButton>
        )}
      </DialogTrigger>
      <DialogContent className="bg-[#102030] border-[#2b4e6b] text-[#a0c0e0]">
        <DialogHeader>
          <DialogTitle className="text-[#cedce7] font-bold">
            {isEditing ? t("editAccount") : t("createAccount")}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#5a8bbd]">{t("accountName")}</FormLabel>
                  <FormControl>
                    <ROInput placeholder={t("enterAccountName")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end pt-4">
              <ROButton type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? t("saving") : t("saveAccount")}
              </ROButton>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
