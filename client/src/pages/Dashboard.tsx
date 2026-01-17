import { useState, useEffect } from "react";
import { useAccounts, useDeleteAccount } from "@/hooks/use-accounts";
import { useCharacters, useDeleteCharacter } from "@/hooks/use-characters";
import { ROPanel, ROButton, ROInput } from "@/components/ROPanel";
import { ClassSprite } from "@/components/ClassSprite";
import { AccountDialog } from "@/components/AccountDialog";
import { CharacterDialog } from "@/components/CharacterDialog";
import { Search, Trash2, User, Users, Download, Upload, Edit, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Dashboard() {
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("");
  const [classFilter, setClassFilter] = useState<string>("");
  
  const { data: accounts, isLoading: isLoadingAccounts } = useAccounts();
  const { data: allCharactersData } = useCharacters();
  const [localAccounts, setLocalAccounts] = useState<any[]>([]);

  useEffect(() => {
    if (accounts) {
      setLocalAccounts(accounts);
    }
  }, [accounts]);

  const { data: characters } = useCharacters(selectedAccountId || undefined);
  const isLoadingCharacters = selectedAccountId && !characters;
  
  const deleteAccountMutation = useDeleteAccount();
  const deleteCharacterMutation = useDeleteCharacter();
  const { toast } = useToast();

  const filteredAccounts = localAccounts.filter(acc => {
    const searchLower = searchQuery.toLowerCase();
    
    // Heuristic Level Detection from single bar
    let levelFromSearch = levelFilter;
    let queryWithoutLevel = searchLower;
    const levelMatch = searchLower.match(/([><])\s*(\d+)/);
    if (levelMatch) {
      levelFromSearch = levelMatch[0].replace(/\s/g, "");
      queryWithoutLevel = searchLower.replace(levelMatch[0], "").trim();
    }

    const matchesAccountName = acc.name.toLowerCase().includes(queryWithoutLevel);
    
    // Find characters for this account to check against character filters
    const accountChars = allCharactersData?.filter(c => c.accountId === acc.id) || [];
    
    const matchesCharName = queryWithoutLevel === "" || accountChars.some(c => 
      c.name.toLowerCase().includes(queryWithoutLevel)
    );

    // If query matches account name or character name or class, we continue
    // Check if the current search query (minus level stuff) contains a class name
    const matchesClass = classFilter === "" || accountChars.some(c => 
      c.class.toLowerCase().includes(classFilter.toLowerCase())
    );

    if (!(matchesAccountName || matchesCharName || matchesClass)) return false;
    
    let matchesLevel = true;
    if (levelFromSearch !== "") {
      const isGreater = levelFromSearch.startsWith(">");
      const isLess = levelFromSearch.startsWith("<");
      const levelValue = parseInt(levelFromSearch.replace(/[><]/g, "").trim());
      
      if (!isNaN(levelValue)) {
        matchesLevel = accountChars.some(c => {
          if (isGreater) return c.lvl > levelValue;
          if (isLess) return c.lvl < levelValue;
          return c.lvl === levelValue;
        });
      }
    }

    return matchesClass && matchesLevel;
  });

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

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const jsonData = JSON.parse(text);

        // Handle different JSON formats from Replit export
        let accountsToImport: any[] = [];
        let charactersToImport: any[] = [];

        // Format 1: Array of accounts (current export format)
        if (Array.isArray(jsonData)) {
          accountsToImport = jsonData.map((acc: any) => ({
            name: acc.name,
            sortOrder: acc.sortOrder || 0,
            oldId: acc.id, // Keep old ID for mapping
          }));

          // If accounts have characters embedded
          for (const acc of jsonData) {
            if (acc.characters && Array.isArray(acc.characters)) {
              // Map characters with old account ID for remapping
              charactersToImport.push(...acc.characters.map((char: any) => ({
                accountId: acc.id, // Will be mapped in backend using oldAccountId
                oldAccountId: acc.id, // Old account ID for mapping
                name: char.name,
                class: char.class,
                lvl: char.lvl,
              })));
            }
          }
        }
        // Format 2: Object with accounts and characters keys
        else if (jsonData.accounts || jsonData.characters) {
          if (jsonData.accounts) {
            accountsToImport = Array.isArray(jsonData.accounts) 
              ? jsonData.accounts.map((acc: any) => ({
                  name: acc.name,
                  sortOrder: acc.sortOrder || 0,
                }))
              : [];
          }
          if (jsonData.characters) {
            charactersToImport = Array.isArray(jsonData.characters)
              ? jsonData.characters.map((char: any) => ({
                  accountId: char.accountId,
                  name: char.name,
                  class: char.class,
                  lvl: char.lvl,
                }))
              : [];
          }
        }
        // Format 3: Replit old format - object with accounts array
        else if (jsonData.accounts && typeof jsonData.accounts === 'object') {
          const accountsObj = jsonData.accounts;
          accountsToImport = Object.values(accountsObj).map((acc: any) => ({
            name: acc.name || acc,
            sortOrder: 0,
          }));
        }

        if (accountsToImport.length === 0 && charactersToImport.length === 0) {
          toast({
            title: "Error",
            description: "No valid data found in JSON file",
            variant: "destructive",
          });
          return;
        }

        // Import data
        try {
          const response = await fetch("/api/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              accounts: accountsToImport.length > 0 ? accountsToImport : undefined,
              characters: charactersToImport.length > 0 ? charactersToImport : undefined,
            }),
            credentials: "include",
          });

          const contentType = response.headers.get("content-type");
          if (!response.ok) {
            let errorMessage = `HTTP ${response.status}`;
            if (contentType && contentType.includes("application/json")) {
              try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
              } catch {
                errorMessage = await response.text().catch(() => errorMessage);
              }
            } else {
              errorMessage = `El servidor devolvió un error. Verifica que el servidor esté funcionando correctamente.`;
            }
            throw new Error(errorMessage);
          }

          if (!contentType || !contentType.includes("application/json")) {
            throw new Error("El servidor no devolvió una respuesta JSON válida");
          }

          const result = await response.json();
          
          toast({
            title: "Importación exitosa",
            description: `Se importaron ${result.imported.accounts} cuentas y ${result.imported.characters} personajes`,
          });

          // Refresh data
          queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
          queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
        } catch (apiError) {
          console.error("Import API error:", apiError);
          let errorMessage = "Error al importar los datos";
          if (apiError instanceof Error) {
            errorMessage = apiError.message;
          }
          toast({
            title: "Error al importar",
            description: errorMessage,
            variant: "destructive",
          });
        }

        // Reset file input
        event.target.value = '';
      } catch (error) {
        console.error("File read error:", error);
        toast({
          title: "Error al importar",
          description: error instanceof Error ? error.message : "Error al leer el archivo JSON",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6">
      {/* Header Area */}
      <header className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 flex items-center justify-center bg-[#1c2b3a] rounded-full border-2 border-[#5a8bbd] shadow-[0_0_15px_rgba(90,139,189,0.3)] overflow-hidden">
              <img src="/assets/cow_logo_final.png" alt="MuhRO Cow Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-[family-name:var(--font-pixel)] text-[#cedce7] tracking-tight">
                MUH RO <span className="text-[#5a8bbd]">KAFRA CORP</span>
              </h1>
              <p className="text-[#a0c0e0] text-xs uppercase tracking-widest opacity-70">Account Management System</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AccountDialog trigger={
              <ROButton className="h-10 px-4 bg-[#2b4e6b] hover:bg-[#3a6a8e] text-white border-0 shadow-lg">
                <span className="text-xs font-bold">+ NEW ACCOUNT</span>
              </ROButton>
            } />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-0 bg-[#0a1018]/80 border border-[#2b4e6b]/50 rounded overflow-hidden shadow-2xl h-11">
          <div className="flex-1 flex items-center relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a8bbd]/40 pointer-events-none" />
            <ROInput 
              placeholder="SEARCH ACCOUNT, CHARACTER, CLASS, LEVEL (e.g. >250)..." 
              className="h-full border-0 bg-transparent pl-11 pr-4 text-left placeholder:text-[#2b4e6b]/40 placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                
                // Reset sub-filters if clearing
                if (val === "") {
                   setLevelFilter("");
                   setClassFilter("");
                   return;
                }

                // Heuristic parsing for level
                const levelMatch = val.match(/([><])\s*(\d+)/);
                if (levelMatch) {
                   setLevelFilter(levelMatch[0].replace(/\s/g, ""));
                } else {
                   setLevelFilter("");
                }

                // Heuristic parsing for class
                const words = val.split(" ");
                const commonClasses = ["biolo", "cardinal", "inquisitor", "meister", "abyss", "chaser", "dragon", "knight", "imperial", "guard", "shadow", "cross", "arch", "bishop", "warlock", "sorcerer", "ranger", "minstrel", "wanderer", "shura", "genetic", "mechanic", "royal", "guard", "sura", "guillotine", "cross"];
                const foundClass = words.find(w => commonClasses.includes(w.toLowerCase()));
                if (foundClass) {
                   setClassFilter(foundClass);
                } else {
                   setClassFilter("");
                }
              }}
            />
          </div>

          <div className="flex items-center">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              id="import-file-input"
            />
            <label
              htmlFor="import-file-input"
              className="flex items-center px-4 h-full bg-[#1c2b3a]/40 border-l border-[#2b4e6b]/30 hover:bg-[#5a8bbd]/10 transition-colors group cursor-pointer"
            >
              <Upload className="w-4 h-4 text-[#5a8bbd]/60 group-hover:text-[#5a8bbd] mr-2" />
              <span className="text-[10px] font-bold text-[#5a8bbd] tracking-widest uppercase group-hover:text-white transition-colors">Import</span>
            </label>
            <button 
              onClick={handleExport}
              className="flex items-center px-4 h-full bg-[#1c2b3a]/40 border-l border-[#2b4e6b]/30 hover:bg-[#5a8bbd]/10 transition-colors group"
            >
              <Download className="w-4 h-4 text-[#5a8bbd]/60 group-hover:text-[#5a8bbd] mr-2" />
              <span className="text-[10px] font-bold text-[#5a8bbd] tracking-widest uppercase group-hover:text-white transition-colors">Export</span>
            </button>
          </div>
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
                                {accountCharacters && accountCharacters.length > 0 ? (
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
                                  <div className="flex items-center gap-1.5 opacity-30">
                                    <div className="w-5 h-5 rounded bg-[#0a1018]/40 border border-[#2b4e6b]/30" />
                                    <span className="text-[9px] text-[#2b4e6b] italic">Empty</span>
                                  </div>
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
