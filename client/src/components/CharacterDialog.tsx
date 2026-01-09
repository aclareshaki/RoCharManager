import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCharacterSchema, type InsertCharacter, type Character } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateCharacter, useUpdateCharacter } from "@/hooks/use-characters";
import { ROButton, ROInput } from "./ROPanel";
import { CLASS_OPTIONS } from "./ClassSprite";
import { useState } from "react";
import { Plus, Edit } from "lucide-react";

interface CharacterDialogProps {
  accountId: number;
  character?: Character;
  trigger?: React.ReactNode;
}

export function CharacterDialog({ accountId, character, trigger }: CharacterDialogProps) {
  const [open, setOpen] = useState(false);
  const createMutation = useCreateCharacter();
  const updateMutation = useUpdateCharacter();
  const isEditing = !!character;

  const form = useForm<InsertCharacter>({
    resolver: zodResolver(insertCharacterSchema),
    defaultValues: {
      name: character?.name || "",
      class: character?.class || "Novice",
      lvl: character?.lvl || 1,
      accountId: accountId,
    },
  });

  const onSubmit = async (data: InsertCharacter) => {
    // Force accountId to match prop (security/consistency)
    const payload = { ...data, accountId };
    
    if (isEditing) {
      await updateMutation.mutateAsync({ id: character.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setOpen(false);
    if (!isEditing) form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <ROButton variant={isEditing ? "icon" : "primary"} size="md">
            {isEditing ? <Edit className="w-4 h-4" /> : <><Plus className="w-4 h-4 mr-2" /> Add Character</>}
          </ROButton>
        )}
      </DialogTrigger>
      <DialogContent className="bg-[#102030] border-[#2b4e6b] text-[#a0c0e0]">
        <DialogHeader>
          <DialogTitle className="text-[#cedce7] font-bold">
            {isEditing ? "Edit Character" : "Create New Character"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#5a8bbd]">Character Name</FormLabel>
                  <FormControl>
                    <ROInput placeholder="Enter character name..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="class"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#5a8bbd]">Class</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-[#0a1018] border-[#2b4e6b] text-[#a0c0e0]">
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#0a1018] border-[#2b4e6b] text-[#a0c0e0] max-h-[300px]">
                        {CLASS_OPTIONS.map((job) => (
                          <SelectItem key={job} value={job} className="focus:bg-[#1c2b3a] focus:text-white">
                            {job}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lvl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#5a8bbd]">Base Level</FormLabel>
                    <FormControl>
                      <ROInput 
                        type="number" 
                        min={1} 
                        max={999} 
                        {...field} 
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end pt-4">
              <ROButton type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Character"}
              </ROButton>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
