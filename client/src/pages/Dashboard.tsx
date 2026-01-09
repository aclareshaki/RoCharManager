import { useState } from "react";
import { useAccounts, useDeleteAccount } from "@/hooks/use-accounts";
import { useCharacters, useDeleteCharacter } from "@/hooks/use-characters";
import { ROPanel, ROButton, ROInput } from "@/components/ROPanel";
import { ClassSprite } from "@/components/ClassSprite";
import { AccountDialog } from "@/components/AccountDialog";
import { CharacterDialog } from "@/components/CharacterDialog";
import { Search, Trash2, User, Users, Download, Upload, Edit } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function Dashboard() {
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: accounts, isLoading: isLoadingAccounts } = useAccounts();
  const { data: characters, isLoading: isLoadingCharacters } = useCharacters(selectedAccountId || undefined);
  
  const deleteAccountMutation = useDeleteAccount();
  const deleteCharacterMutation = useDeleteCharacter();

  const filteredAccounts = accounts?.filter(acc => 
    acc.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleExport = () => {
    if (!accounts) return;
    // In a real app we'd fetch EVERYTHING, here we just dump accounts 
    // Character dump would require fetching all chars for all accounts or a specific export endpoint
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(accounts));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "ro_manager_export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6">
      {/* Header Area */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#1c2b3a] rounded-full border-2 border-[#5a8bbd] shadow-[0_0_15px_rgba(90,139,189,0.3)]">
            <Users className="w-6 h-6 text-[#5a8bbd]" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-[family-name:var(--font-pixel)] text-[#cedce7] tracking-tight">
              KAFRA <span className="text-[#5a8bbd]">CORP</span>
            </h1>
            <p className="text-[#a0c0e0] text-xs uppercase tracking-widest opacity-70">Account Management System</p>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2b4e6b]" />
            <ROInput 
              placeholder="Search accounts..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <ROButton variant="icon" onClick={handleExport} title="Export Data">
            <Download className="w-4 h-4" />
          </ROButton>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[600px]">
        
        {/* Left Panel: Accounts List */}
        <ROPanel 
          title="Accounts" 
          className="lg:col-span-4 h-[500px] lg:h-auto"
          headerAction={<AccountDialog />}
        >
          {isLoadingAccounts ? (
            <div className="flex justify-center items-center h-full text-[#5a8bbd]">Loading crystals...</div>
          ) : filteredAccounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-[#5a8bbd]/50 gap-2">
              <User className="w-12 h-12 opacity-50" />
              <p>No accounts found</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {filteredAccounts.map((account) => (
                  <motion.div
                    key={account.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div 
                      onClick={() => setSelectedAccountId(account.id)}
                      className={`
                        group relative flex items-center justify-between p-3 rounded cursor-pointer transition-all border
                        ${selectedAccountId === account.id 
                          ? "bg-[#1c2b3a] border-[#5a8bbd] shadow-[inset_0_0_10px_rgba(90,139,189,0.2)]" 
                          : "bg-transparent border-transparent hover:bg-[#1c2b3a]/50 hover:border-[#2b4e6b]"
                        }
                      `}
                    >
                      {/* Active Indicator */}
                      {selectedAccountId === account.id && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2/3 bg-[#5a8bbd] rounded-r" />
                      )}

                      <div className="pl-3">
                        <h3 className={`font-bold text-sm ${selectedAccountId === account.id ? "text-white" : "text-[#a0c0e0] group-hover:text-white"}`}>
                          {account.name}
                        </h3>
                        <p className="text-[10px] text-[#5a8bbd] opacity-70">ID: {account.id}</p>
                      </div>

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <AccountDialog 
                          account={account} 
                          trigger={
                            <ROButton variant="icon" size="sm" onClick={(e) => e.stopPropagation()}>
                              <Edit className="w-3 h-3" />
                            </ROButton>
                          } 
                        />
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <ROButton variant="icon" size="sm" className="hover:border-red-500 hover:text-red-400" onClick={(e) => e.stopPropagation()}>
                              <Trash2 className="w-3 h-3" />
                            </ROButton>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-[#102030] border-[#2b4e6b] text-[#a0c0e0]">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Delete Account?</AlertDialogTitle>
                              <AlertDialogDescription className="text-[#a0c0e0]">
                                This will permanently delete <strong>{account.name}</strong> and all associated characters. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-transparent border-[#2b4e6b] text-[#a0c0e0] hover:bg-white/5 hover:text-white">Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => {
                                  deleteAccountMutation.mutate(account.id);
                                  if (selectedAccountId === account.id) setSelectedAccountId(null);
                                }}
                                className="bg-red-900/50 border border-red-500 text-red-200 hover:bg-red-800"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ROPanel>

        {/* Right Panel: Characters Grid */}
        <ROPanel 
          title={selectedAccountId ? `Characters [${accounts?.find(a => a.id === selectedAccountId)?.name}]` : "Select an Account"} 
          className="lg:col-span-8 min-h-[500px]"
          headerAction={selectedAccountId ? <CharacterDialog accountId={selectedAccountId} /> : null}
        >
          {!selectedAccountId ? (
            <div className="h-full flex flex-col items-center justify-center text-[#5a8bbd]/40 gap-4">
              <div className="w-32 h-32 rounded-full border-4 border-[#2b4e6b] border-dashed flex items-center justify-center">
                <Users className="w-12 h-12" />
              </div>
              <p className="text-lg">Select an account to view characters</p>
            </div>
          ) : isLoadingCharacters ? (
            <div className="h-full flex items-center justify-center text-[#5a8bbd]">Summoning characters...</div>
          ) : !characters?.length ? (
            <div className="h-full flex flex-col items-center justify-center text-[#5a8bbd]/50 gap-4">
              <p>No characters created yet.</p>
              <CharacterDialog accountId={selectedAccountId} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <AnimatePresence>
                {characters.map((char) => (
                  <motion.div
                    key={char.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="group relative bg-[#0a1018] border border-[#2b4e6b] rounded hover:border-[#5a8bbd] transition-colors overflow-hidden">
                      {/* Character Card Header */}
                      <div className="flex justify-between items-start p-3 bg-gradient-to-b from-[#1c2b3a] to-[#121c26] border-b border-[#2b4e6b]">
                        <div>
                          <h4 className="font-bold text-white text-sm">{char.name}</h4>
                          <span className="text-xs text-[#5a8bbd] block">{char.class}</span>
                        </div>
                        <div className="bg-[#0a1018] px-2 py-1 rounded border border-[#2b4e6b] text-xs font-mono text-[#cedce7]">
                          Lv. {char.lvl}
                        </div>
                      </div>

                      {/* Character Sprite Area */}
                      <div className="relative h-40 p-4 flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a1018]/80" />
                        <ClassSprite className={char.class} alt={char.name} />
                      </div>

                      {/* Actions Overlay */}
                      <div className="absolute inset-x-0 bottom-0 p-2 bg-[#0a1018]/90 backdrop-blur border-t border-[#2b4e6b] translate-y-full group-hover:translate-y-0 transition-transform flex justify-end gap-2">
                        <CharacterDialog 
                          accountId={selectedAccountId} 
                          character={char} 
                          trigger={
                            <ROButton variant="icon" size="sm">
                              <Edit className="w-3 h-3" />
                            </ROButton>
                          }
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <ROButton variant="icon" size="sm" className="hover:border-red-500 hover:text-red-400">
                              <Trash2 className="w-3 h-3" />
                            </ROButton>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-[#102030] border-[#2b4e6b] text-[#a0c0e0]">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Delete Character?</AlertDialogTitle>
                              <AlertDialogDescription className="text-[#a0c0e0]">
                                Are you sure you want to delete <strong>{char.name}</strong>? (Lv. {char.lvl} {char.class})
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-transparent border-[#2b4e6b] text-[#a0c0e0] hover:bg-white/5 hover:text-white">Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteCharacterMutation.mutate({ id: char.id, accountId: selectedAccountId })}
                                className="bg-red-900/50 border border-red-500 text-red-200 hover:bg-red-800"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ROPanel>
      </div>
    </div>
  );
}
