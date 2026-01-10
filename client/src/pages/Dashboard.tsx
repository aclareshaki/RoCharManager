import { useState, useEffect } from "react";
import { useAccounts, useDeleteAccount } from "@/hooks/use-accounts";
import { useCharacters, useDeleteCharacter } from "@/hooks/use-characters";
import { ROPanel, ROButton, ROInput } from "@/components/ROPanel";
import { ClassSprite } from "@/components/ClassSprite";
import { AccountDialog } from "@/components/AccountDialog";
import { CharacterDialog } from "@/components/CharacterDialog";
import { Search, Trash2, User, Users, Download, Upload, Edit, GripVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Dashboard() {
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: accounts, isLoading: isLoadingAccounts } = useAccounts();
  const { data: allCharactersData } = useCharacters(); // Fetch all characters for summaries
  const [localAccounts, setLocalAccounts] = useState<any[]>([]);

  useEffect(() => {
    if (accounts) {
      setLocalAccounts(accounts);
    }
  }, [accounts]);

  const { data: characters, isLoading: isLoadingCharacters } = useCharacters(selectedAccountId || undefined);
  
  const deleteAccountMutation = useDeleteAccount();
  const deleteCharacterMutation = useDeleteCharacter();

  const filteredAccounts = localAccounts.filter(acc => 
    acc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(localAccounts);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setLocalAccounts(items);

    try {
      await apiRequest("POST", "/api/accounts/reorder", {
        ids: items.map(a => a.id)
      });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
    } catch (error) {
      setLocalAccounts(accounts || []);
    }
  };

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
      <header className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#1c2b3a] rounded-full border-2 border-[#5a8bbd] shadow-[0_0_15px_rgba(90,139,189,0.3)]">
            <Users className="w-6 h-6 text-[#5a8bbd]" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-[family-name:var(--font-pixel)] text-[#cedce7] tracking-tight">
              MUH RO <span className="text-[#5a8bbd]">KAFRA CORP</span>
            </h1>
            <p className="text-[#a0c0e0] text-xs uppercase tracking-widest opacity-70">Account Management System</p>
          </div>
        </div>

        <div className="flex items-center gap-0 w-full lg:w-auto flex-1 max-w-2xl bg-[#0a1018]/60 border border-[#2b4e6b] rounded-md p-1 shadow-inner h-11">
          <div className="relative flex-1 h-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a8bbd]/40 pointer-events-none" />
            <ROInput 
              placeholder="SEARCH ACCOUNTS..." 
              className="h-full border-0 bg-transparent pl-11 pr-4 text-left placeholder:text-[#2b4e6b]/60 placeholder:uppercase placeholder:tracking-widest"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-[1px] h-6 bg-[#2b4e6b]/30 mx-1" />
          <ROButton 
            variant="ghost" 
            onClick={handleExport} 
            title="Export Data"
            className="h-full w-12 hover:bg-[#5a8bbd]/10 text-[#5a8bbd]/60 hover:text-[#5a8bbd] transition-colors border-0 flex items-center justify-center p-0"
          >
            <Download className="w-5 h-5" />
          </ROButton>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[600px]">
        
        {/* Left Panel: Accounts List */}
        <ROPanel 
          title="Accounts" 
          className="lg:col-span-4 h-[600px]"
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
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="accounts">
                {(provided) => (
                  <div 
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-3 pr-2"
                  >
                    {filteredAccounts.map((account, index) => {
                      const accountCharacters = allCharactersData?.filter(c => c.accountId === account.id) || [];
                      
                      return (
                        <Draggable key={account.id} draggableId={account.id.toString()} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`
                                group relative flex flex-col p-3 rounded cursor-pointer transition-all border
                                ${selectedAccountId === account.id 
                                  ? "bg-[#1c2b3a] border-[#5a8bbd] shadow-[inset_0_0_10px_rgba(90,139,189,0.2)]" 
                                  : "bg-transparent border-transparent hover:bg-[#1c2b3a]/50 hover:border-[#2b4e6b]"
                                }
                                ${snapshot.isDragging ? "opacity-50 scale-105 z-50 bg-[#1c2b3a] border-[#5a8bbd]" : ""}
                              `}
                              onClick={() => setSelectedAccountId(account.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-1">
                                  <div {...provided.dragHandleProps} className="p-1 cursor-grab active:cursor-grabbing text-[#2b4e6b] hover:text-[#5a8bbd]">
                                    <GripVertical className="w-4 h-4" />
                                  </div>
                                  <div className="pl-1">
                                    <h3 className={`font-bold text-sm leading-tight ${selectedAccountId === account.id ? "text-white" : "text-[#a0c0e0] group-hover:text-white"}`}>
                                      {account.name}
                                    </h3>
                                    <p className="text-[10px] text-[#5a8bbd] opacity-70">ID: {account.id}</p>
                                  </div>
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
                                          This will permanently delete <strong>{account.name}</strong> and all associated characters.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel className="bg-transparent border-[#2b4e6b] text-[#a0c0e0]">Cancel</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => {
                                            deleteAccountMutation.mutate(account.id);
                                            if (selectedAccountId === account.id) setSelectedAccountId(null);
                                          }}
                                          className="bg-red-900/50 border border-red-500 text-red-200"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>

                              {/* Quick Glance Characters - Displayed below name/ID */}
                              <div className="mt-1 flex flex-wrap gap-2 pl-7 min-h-[24px]">
                                {accountCharacters.length > 0 ? (
                                  accountCharacters.map(char => (
                                    <div key={char.id} className="flex items-center gap-1.5 bg-[#0a1018]/60 px-2 py-1 rounded border border-[#5a8bbd]/20 hover:border-[#5a8bbd]/40 transition-colors shadow-sm">
                                      <div className="w-5 h-5 flex items-center justify-center">
                                        <ClassSprite className={char.class} alt={char.name} isIconOnly />
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-white leading-none">{char.name}</span>
                                        <span className="text-[9px] font-mono text-[#5a8bbd] leading-none">Lv. {char.lvl}</span>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-[9px] text-[#2b4e6b] italic flex items-center h-full">No characters found</span>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
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
