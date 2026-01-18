import { useState, useEffect } from "react";
import { useAccounts, useDeleteAccount, useDeleteAllAccounts } from "@/hooks/use-accounts";
import { useCharacters, useDeleteCharacter } from "@/hooks/use-characters";
import { ROPanel, ROButton, ROInput } from "@/components/ROPanel";
import { ClassSprite } from "@/components/ClassSprite";
import { AccountDialog } from "@/components/AccountDialog";
import { CharacterDialog } from "@/components/CharacterDialog";
import { Search, Trash2, User, Users, Download, Upload, Edit, GripVertical, Grid3x3, List, Skull, RotateCcw, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useQueryClient } from "@tanstack/react-query";
import * as localStorage from "@/lib/localStorage";

export default function Dashboard() {
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("");
  const [classFilter, setClassFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [instanceMode, setInstanceMode] = useState(false);
  
  // Instancias disponibles con sus nombres completos
  const instances = ["NGH", "HGH", "COGH", "LOF", "HOL", "CT"];
  const instanceNames: Record<string, string> = {
    "NGH": "Glast heim normal",
    "HGH": "Glast heim hard",
    "COGH": "Glast Heim challenge",
    "LOF": "Lake of fire",
    "HOL": "Hall of life",
    "CT": "Constellation tower"
  };
  
  // Estado de instancias por personaje (characterId -> instanceName -> checked)
  const [instanceStatus, setInstanceStatus] = useState<Record<number, Record<string, boolean>>>({});
  
  const queryClient = useQueryClient();
  const { data: accounts, isLoading: isLoadingAccounts } = useAccounts();
  const { data: allCharactersData } = useCharacters();
  const [localAccounts, setLocalAccounts] = useState<any[]>([]);
  const [hasData, setHasData] = useState(false);
  const deleteAllAccountsMutation = useDeleteAllAccounts();
  const deleteAccountMutation = useDeleteAccount();

  useEffect(() => {
    setHasData(localStorage.hasData());
  }, [accounts, allCharactersData]);

  useEffect(() => {
    if (accounts) {
      setLocalAccounts(accounts);
    }
  }, [accounts]);

  const { data: characters } = useCharacters(selectedAccountId || undefined);
  const isLoadingCharacters = selectedAccountId && !characters;
  
  // Función helper para verificar si un personaje cumple todas las condiciones
  const matchesAllConditions = (char: any, conditions: string[]): boolean => {
    return conditions.every(condition => {
      const cond = condition.trim();
      if (!cond) return true; // Condición vacía siempre se cumple
      
      // Verificar si es una condición de instancia negada (-LOF, -NGH, etc.)
      // Significa: nivel >= 250 Y NO tener el tick marcado para esa instancia
      const instanceMatch = cond.match(/^-([A-Z]+)$/i);
      if (instanceMatch) {
        const instanceName = instanceMatch[1].toUpperCase();
        // Verificar que la instancia existe en nuestra lista
        if (instances.includes(instanceName)) {
          // Debe tener nivel >= 250
          if (char.lvl < 250) return false;
          // Y NO debe tener el tick marcado para esa instancia
          const hasTick = instanceStatus[char.id]?.[instanceName] || false;
          return !hasTick;
        }
        return false;
      }
      
      // Verificar si es una condición de nivel (>99, <50, =100)
      const levelMatch = cond.match(/^([><=])\s*(\d+)$/);
      if (levelMatch) {
        const operator = levelMatch[1];
        const levelValue = parseInt(levelMatch[2]);
        
        if (isNaN(levelValue)) return false;
        
        switch (operator) {
          case '>': return char.lvl > levelValue;
          case '<': return char.lvl < levelValue;
          case '=': return char.lvl === levelValue;
          default: return false;
        }
      }
      
      // Si no es condición de nivel, buscar en nombre o clase
      const condLower = cond.toLowerCase();
      const matchesCharName = char.name.toLowerCase().includes(condLower);
      const matchesClass = char.class.toLowerCase().includes(condLower);
      
      return matchesCharName || matchesClass;
    });
  };

  // Filtrar personajes por la búsqueda actual con soporte para múltiples condiciones con +
  const filteredCharacters = characters?.filter(char => {
    const searchLower = searchQuery.trim();
    if (searchLower === "") return true;
    
    // Dividir por + para obtener múltiples condiciones
    const conditions = searchLower.split('+').map(c => c.trim()).filter(c => c !== '');
    
    // Todas las condiciones deben cumplirse (AND)
    return matchesAllConditions(char, conditions);
  }) || [];
  
  const deleteCharacterMutation = useDeleteCharacter();
  const { toast } = useToast();

  const filteredAccounts = localAccounts.filter(acc => {
    const searchLower = searchQuery.trim();
    
    // Si no hay búsqueda, mostrar todas las cuentas
    if (searchLower === "") return true;
    
    // Dividir por + para obtener múltiples condiciones
    const conditions = searchLower.split('+').map(c => c.trim()).filter(c => c !== '');
    
    // Buscar personajes de esta cuenta
    const accountChars = allCharactersData?.filter(c => c.accountId === acc.id) || [];
    
    // La cuenta se muestra si tiene algún personaje que cumpla TODAS las condiciones
    const hasMatchingChars = accountChars.some(char => matchesAllConditions(char, conditions));
    
    // También verificar si el nombre de la cuenta coincide con alguna condición de texto
    const matchesAccountName = conditions.some(cond => {
      const levelMatch = cond.match(/^([><=])\s*(\d+)$/);
      if (levelMatch) return false; // Si es condición de nivel, no aplica al nombre de cuenta
      return acc.name.toLowerCase().includes(cond.toLowerCase());
    });
    
    return hasMatchingChars || matchesAccountName;
  });

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(localAccounts);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setLocalAccounts(items);

    // Update sortOrder based on new position
    const updatedAccounts = items.map((acc, index) => ({
      ...acc,
      sortOrder: index,
    }));

    // Save to localStorage
    localStorage.saveAccounts(updatedAccounts);
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
  };

  const handleExport = () => {
    const data = localStorage.exportData();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "ro_manager_export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    toast({
      title: "Exportación exitosa",
      description: `Se exportaron ${data.accounts.length} cuentas y ${data.characters.length} personajes`,
    });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const jsonData = JSON.parse(text);

        // Handle different JSON formats
        let accountsToImport: any[] = [];
        let charactersToImport: any[] = [];

        // Format 1: Array of accounts (current export format)
        if (Array.isArray(jsonData)) {
          accountsToImport = jsonData.map((acc: any) => ({
            id: acc.id,
            name: acc.name,
            sortOrder: acc.sortOrder || 0,
          }));

          // If accounts have characters embedded
          for (const acc of jsonData) {
            if (acc.characters && Array.isArray(acc.characters)) {
              charactersToImport.push(...acc.characters.map((char: any) => ({
                accountId: acc.id,
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
                  id: acc.id,
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
          accountsToImport = Object.values(accountsObj).map((acc: any, index: number) => ({
            id: index + 1,
            name: acc.name || acc,
            sortOrder: 0,
          }));
        }

        if (accountsToImport.length === 0 && charactersToImport.length === 0) {
          toast({
            title: "Error",
            description: "No se encontraron datos válidos en el archivo JSON",
            variant: "destructive",
          });
          return;
        }

        // Import data
        localStorage.importData({
          accounts: accountsToImport.length > 0 ? accountsToImport : undefined,
          characters: charactersToImport.length > 0 ? charactersToImport : undefined,
        });

        toast({
          title: "Importación exitosa",
          description: `Se importaron ${accountsToImport.length} cuentas y ${charactersToImport.length} personajes`,
        });

        // Refresh data
        queryClient.invalidateQueries({ queryKey: ["accounts"] });
        queryClient.invalidateQueries({ queryKey: ["characters"] });
        setHasData(true);

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

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    queryClient.invalidateQueries({ queryKey: ["characters"] });
    setHasData(localStorage.hasData());
  };

  const handleLoadDemo = async () => {
    try {
      const response = await fetch("/example-data.json");
      if (!response.ok) {
        throw new Error("No se pudo cargar el archivo de ejemplo");
      }
      const jsonData = await response.json();
      
      // Procesar el JSON igual que en handleImport
      let accountsToImport: any[] = [];
      let charactersToImport: any[] = [];

      if (Array.isArray(jsonData)) {
        accountsToImport = jsonData.map((acc: any) => ({
          id: acc.id,
          name: acc.name,
          sortOrder: acc.sortOrder || 0,
        }));

        for (const acc of jsonData) {
          if (acc.characters && Array.isArray(acc.characters)) {
            charactersToImport.push(...acc.characters.map((char: any) => ({
              accountId: acc.id,
              name: char.name,
              class: char.class,
              lvl: char.lvl,
            })));
          }
        }
      }

      localStorage.importData({
        accounts: accountsToImport.length > 0 ? accountsToImport : undefined,
        characters: charactersToImport.length > 0 ? charactersToImport : undefined,
      });

      toast({
        title: "Demo cargada",
        description: `Se cargaron ${accountsToImport.length} cuentas y ${charactersToImport.length} personajes de ejemplo`,
      });

      handleRefresh();
    } catch (error) {
      console.error("Error loading demo:", error);
      toast({
        title: "Error al cargar demo",
        description: error instanceof Error ? error.message : "Error al cargar los datos de ejemplo",
        variant: "destructive",
      });
    }
  };

  const handleClearAll = () => {
    localStorage.clearAllData();
    setSelectedAccountId(null);
    handleRefresh();
    toast({
      title: "Datos eliminados",
      description: "Todos los datos han sido eliminados",
    });
  };

  return (
    <div className="min-h-screen p-6 md:p-10 lg:p-12">
      <div className="w-full max-w-[95%] 2xl:max-w-[90%] mx-auto flex flex-col gap-8 lg:gap-10">
      {/* Header Area */}
      <header className="flex flex-col gap-6 lg:gap-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4 lg:gap-5">
            <div className="w-20 h-20 lg:w-24 lg:h-24 flex items-center justify-center bg-[#1c2b3a] rounded-full border-2 border-[#5a8bbd] shadow-[0_0_15px_rgba(90,139,189,0.3)] overflow-hidden">
              <img src="/assets/cow_logo_final.png" alt="Ragnarok Online Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#cedce7] tracking-tight">
                Ragnarok Online <span className="text-[#5a8bbd]">Char Manager</span>
              </h1>
              <p className="text-[#a0c0e0] text-base md:text-lg uppercase tracking-widest opacity-70 mt-1">Character Management System</p>
            </div>
          </div>
        </div>

        {/* Search bar and Import/Export buttons */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-4 flex items-center gap-0 bg-[#0a1018]/80 border border-[#2b4e6b]/50 rounded-lg overflow-hidden shadow-2xl h-14 lg:h-16">
            <div className="flex-1 flex items-center relative h-full">
              <Search className="absolute left-5 lg:left-6 top-1/2 -translate-y-1/2 w-5 h-5 lg:w-6 lg:h-6 text-[#5a8bbd]/40 pointer-events-none z-10" />
              <ROInput 
                placeholder="SEARCH ACCOUNT, CHARACTER, CLASS, LEVEL (e.g. >250)..." 
                className="w-full h-full border-0 bg-[#0a1018]/80 pl-14 lg:pl-16 pr-5 lg:pr-6 text-base lg:text-lg text-left placeholder:text-[#2b4e6b]/40 placeholder:uppercase placeholder:text-xs lg:text-sm placeholder:tracking-widest focus:outline-none focus:ring-0"
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  // El filtrado se hace automáticamente a través de filteredAccounts y filteredCharacters
                  
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
          </div>
          
          <div className="lg:col-span-8 flex items-center justify-end gap-3 lg:gap-4 flex-wrap">
            {/* Reset all ticks button */}
            {hasData && (
              <ROButton
                variant="icon"
                size="md"
                onClick={() => {
                  setInstanceStatus({});
                  toast({
                    title: "Ticks reseteados",
                    description: "Todos los ticks de instancias han sido eliminados.",
                  });
                }}
                className="text-[#5a8bbd] hover:text-white hover:border-[#5a8bbd] w-12 h-12 lg:w-14 lg:h-14"
                title="Reset all ticks for all accounts"
              >
                <RotateCcw className="w-5 h-5 lg:w-6 lg:h-6" />
              </ROButton>
            )}
            
            {/* Botón de Demo (solo si no hay datos) */}
            {!hasData && (
              <button
                onClick={handleLoadDemo}
                className="flex items-center justify-center px-6 lg:px-8 h-14 lg:h-16 bg-[#5a8bbd]/20 border-2 border-[#5a8bbd]/50 rounded-lg hover:bg-[#5a8bbd]/30 hover:border-[#5a8bbd] transition-all text-sm lg:text-base font-semibold text-[#cedce7]"
              >
                Ver Demo con mis personajes
              </button>
            )}
            
            {/* Botón de Limpiar (solo si hay datos) */}
            {hasData && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <ROButton
                    variant="icon"
                    size="md"
                    className="w-12 h-12 lg:w-14 lg:h-14 hover:border-red-500 hover:text-red-400"
                    title="Borrar todos los datos"
                  >
                    <Trash2 className="w-5 h-5 lg:w-6 lg:h-6" />
                  </ROButton>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-[#102030] border-[#2b4e6b] text-[#a0c0e0]">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white text-lg lg:text-xl">
                      ¿Borrar todos los datos?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-[#a0c0e0] text-base lg:text-lg">
                      Esta acción eliminará permanentemente todas las cuentas y personajes guardados.
                      <br />
                      <br />
                      <strong className="text-red-400">Esta acción no se puede deshacer.</strong>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-3">
                    <AlertDialogCancel className="bg-transparent border-[#2b4e6b] text-[#a0c0e0] hover:bg-white/5 hover:text-white px-6 py-2 text-base">
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleClearAll}
                      className="bg-red-900/50 border border-red-500 text-red-200 hover:bg-red-800 px-6 py-2 text-base"
                    >
                      Borrar Todo
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              id="import-file-input"
            />
            <label
              htmlFor="import-file-input"
              className="flex items-center justify-center px-8 lg:px-10 w-auto min-w-[140px] lg:min-w-[160px] h-14 lg:h-16 bg-[#1c2b3a]/40 border border-[#2b4e6b]/30 rounded-lg hover:bg-[#1c2b3a]/60 hover:border-[#5a8bbd]/50 transition-colors group cursor-pointer"
            >
              <Upload className="w-5 h-5 lg:w-6 lg:h-6 text-[#5a8bbd]/60 group-hover:text-[#5a8bbd] mr-3" />
              <span className="text-sm lg:text-base font-bold text-[#5a8bbd] tracking-widest uppercase group-hover:text-white transition-colors">Import</span>
            </label>
            {hasData && (
              <button 
                onClick={handleExport}
                className="flex items-center justify-center px-8 lg:px-10 w-auto min-w-[140px] lg:min-w-[160px] h-14 lg:h-16 bg-[#1c2b3a]/40 border border-[#2b4e6b]/30 rounded-lg hover:bg-[#5a8bbd]/10 transition-colors group"
              >
                <Download className="w-5 h-5 lg:w-6 lg:h-6 text-[#5a8bbd]/60 group-hover:text-[#5a8bbd] mr-3" />
                <span className="text-sm lg:text-base font-bold text-[#5a8bbd] tracking-widest uppercase group-hover:text-white transition-colors">Export</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 flex-1 min-h-[70vh] lg:min-h-[75vh]">
        
        {/* Left Panel: Accounts List */}
        <ROPanel 
          title="Accounts" 
          className="lg:col-span-4 h-[70vh] lg:h-[75vh]"
          headerAction={
            <div className="flex items-center gap-2 lg:gap-3">
              {accounts && accounts.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <ROButton
                      variant="icon"
                      size="md"
                      className="w-10 h-10 lg:w-12 lg:h-12 hover:border-red-500 hover:text-red-400"
                      title="Eliminar todas las cuentas"
                    >
                      <Trash className="w-5 h-5 lg:w-6 lg:h-6" />
                    </ROButton>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[#102030] border-[#2b4e6b] text-[#a0c0e0]">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white text-lg lg:text-xl">
                        ¿Eliminar todas las cuentas?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-[#a0c0e0] text-base lg:text-lg">
                        Esta acción eliminará permanentemente <strong>todas las {accounts.length} cuentas</strong> y todos los personajes asociados.
                        <br />
                        <br />
                        <strong className="text-red-400">Esta acción no se puede deshacer.</strong>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3">
                      <AlertDialogCancel className="bg-transparent border-[#2b4e6b] text-[#a0c0e0] hover:bg-white/5 hover:text-white px-6 py-2 text-base">
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => {
                          deleteAllAccountsMutation.mutate();
                          setSelectedAccountId(null);
                        }}
                        className="bg-red-900/50 border border-red-500 text-red-200 hover:bg-red-800 px-6 py-2 text-base"
                      >
                        Eliminar Todo
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <AccountDialog />
            </div>
          }
        >
          {isLoadingAccounts ? (
            <div className="flex justify-center items-center h-full text-[#5a8bbd]">Loading crystals...</div>
          ) : filteredAccounts.length === 0 && !hasData ? (
            <div className="flex flex-col items-center justify-center h-full text-[#5a8bbd]/50 gap-6">
              <User className="w-20 h-20 lg:w-24 lg:h-24 opacity-50" />
              <p className="text-xl lg:text-2xl font-semibold">Sube tu archivo JSON de MuhRo para empezar</p>
              <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
                <button
                  onClick={handleLoadDemo}
                  className="flex items-center justify-center gap-2 px-6 lg:px-8 py-3 lg:py-4 bg-[#5a8bbd]/20 border-2 border-[#5a8bbd]/50 rounded-lg hover:bg-[#5a8bbd]/30 hover:border-[#5a8bbd] transition-all text-base lg:text-lg font-semibold text-[#cedce7]"
                >
                  Ver Demo con mis personajes
                </button>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                  id="import-file-input-empty"
                />
                <label
                  htmlFor="import-file-input-empty"
                  className="flex items-center justify-center gap-2 px-6 lg:px-8 py-3 lg:py-4 bg-[#1c2b3a]/40 border-2 border-[#2b4e6b]/50 rounded-lg hover:bg-[#1c2b3a]/60 hover:border-[#5a8bbd]/50 transition-all cursor-pointer text-base lg:text-lg font-semibold text-[#cedce7]"
                >
                  <Upload className="w-5 h-5 lg:w-6 lg:h-6" />
                  Importar JSON
                </label>
              </div>
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-[#5a8bbd]/50 gap-4">
              <User className="w-16 h-16 lg:w-20 lg:h-20 opacity-50" />
              <p className="text-lg lg:text-xl">No accounts found</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="accounts">
                {(provided) => (
                  <div 
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-4 lg:space-y-5 pr-3"
                  >
                    {filteredAccounts.map((account, index) => {
                      const allAccountCharacters = allCharactersData?.filter(c => c.accountId === account.id) || [];
                      
                      // Filtrar personajes por la búsqueda actual con soporte para múltiples condiciones
                      const accountCharacters = allAccountCharacters.filter(char => {
                        const searchLower = searchQuery.trim();
                        if (searchLower === "") return true;
                        
                        // Dividir por + para obtener múltiples condiciones
                        const conditions = searchLower.split('+').map(c => c.trim()).filter(c => c !== '');
                        
                        // Todas las condiciones deben cumplirse (AND)
                        return matchesAllConditions(char, conditions);
                      });
                      
                      return (
                        <Draggable key={account.id} draggableId={account.id.toString()} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`
                                group relative flex flex-col p-4 lg:p-5 rounded-lg cursor-pointer transition-all border
                                ${selectedAccountId === account.id 
                                  ? "bg-[#1c2b3a] border-[#5a8bbd] shadow-[inset_0_0_10px_rgba(90,139,189,0.2)]" 
                                  : "bg-transparent border-transparent hover:bg-[#1c2b3a]/50 hover:border-[#2b4e6b]"
                                }
                                ${snapshot.isDragging ? "opacity-50 scale-105 z-50 bg-[#1c2b3a] border-[#5a8bbd]" : ""}
                              `}
                              onClick={() => setSelectedAccountId(account.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 lg:gap-4 flex-1">
                                  <div {...provided.dragHandleProps} className="p-1.5 cursor-grab active:cursor-grabbing text-[#2b4e6b] hover:text-[#5a8bbd]">
                                    <GripVertical className="w-5 h-5 lg:w-6 lg:h-6" />
                                  </div>
                                  <div className="pl-1">
                                    <h3 className={`font-bold text-base lg:text-lg leading-tight ${selectedAccountId === account.id ? "text-white" : "text-[#a0c0e0] group-hover:text-white"}`}>
                                      {account.name}
                                    </h3>
                                    <p className="text-xs lg:text-sm text-[#5a8bbd] opacity-70 mt-0.5">ID: {account.id}</p>
                                  </div>
                                </div>

                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <AccountDialog 
                                    account={account} 
                                    trigger={
                                      <ROButton variant="icon" size="md" onClick={(e) => e.stopPropagation()} className="w-9 h-9 lg:w-10 lg:h-10">
                                        <Edit className="w-4 h-4 lg:w-5 lg:h-5" />
                                      </ROButton>
                                    } 
                                  />
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <ROButton variant="icon" size="md" className="hover:border-red-500 hover:text-red-400 w-9 h-9 lg:w-10 lg:h-10" onClick={(e) => e.stopPropagation()}>
                                        <Trash2 className="w-4 h-4 lg:w-5 lg:h-5" />
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
                              <div className="mt-2 lg:mt-3 flex flex-col gap-2 lg:gap-3 pl-9 lg:pl-11 min-h-[28px] lg:min-h-[32px]">
                                {accountCharacters && accountCharacters.length > 0 ? (
                                  accountCharacters.map(char => (
                                    <div key={char.id} className="flex items-center gap-2 lg:gap-2.5 bg-[#0a1018]/60 px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg border border-[#5a8bbd]/20 hover:border-[#5a8bbd]/40 transition-colors shadow-sm">
                                      <div className="w-6 h-6 lg:w-7 lg:h-7 flex items-center justify-center flex-shrink-0">
                                        <ClassSprite className={char.class} alt={char.name} isIconOnly />
                                      </div>
                                      <span className="text-xs lg:text-sm font-bold text-white leading-none">{char.name}</span>
                                      <span className="text-[10px] lg:text-xs font-mono text-[#5a8bbd] leading-none">Lv. {char.lvl}</span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="flex items-center gap-2 opacity-30">
                                    <div className="w-6 h-6 lg:w-7 lg:h-7 rounded bg-[#0a1018]/40 border border-[#2b4e6b]/30" />
                                    <span className="text-xs text-[#2b4e6b] italic">Empty</span>
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
          className="lg:col-span-8 min-h-[70vh] lg:min-h-[75vh]"
          headerAction={selectedAccountId ? (
            <div className="flex items-center gap-3 lg:gap-4">
              {/* Instance mode toggle button */}
              <ROButton
                variant="icon"
                size="md"
                onClick={() => setInstanceMode(!instanceMode)}
                className={`w-10 h-10 lg:w-12 lg:h-12 ${instanceMode ? "bg-[#2b4e6b] text-white" : "text-[#5a8bbd] hover:text-white"}`}
                title="Instance Mode"
              >
                <Skull className="w-5 h-5 lg:w-6 lg:h-6" />
              </ROButton>
              
              {/* Reset ticks for current account only */}
              {instanceMode && (
                <ROButton
                  variant="icon"
                  size="md"
                  onClick={() => {
                    if (characters) {
                      const updatedStatus = { ...instanceStatus };
                      characters.forEach(char => {
                        if (updatedStatus[char.id]) {
                          updatedStatus[char.id] = {};
                        }
                      });
                      setInstanceStatus(updatedStatus);
                    }
                  }}
                  className="w-10 h-10 lg:w-12 lg:h-12 text-[#5a8bbd] hover:text-white hover:border-[#5a8bbd]"
                  title="Reset ticks for this account only"
                >
                  <RotateCcw className="w-5 h-5 lg:w-6 lg:h-6" />
                </ROButton>
              )}
              
              {/* Vista toggle buttons */}
              {!instanceMode && (
                <div className="flex items-center gap-1.5 bg-[#0a1018] border border-[#2b4e6b] rounded-lg p-1.5">
                  <ROButton
                    variant="icon"
                    size="md"
                    onClick={() => setViewMode("grid")}
                    className={`w-10 h-10 lg:w-12 lg:h-12 ${viewMode === "grid" ? "bg-[#2b4e6b] text-white" : "text-[#5a8bbd] hover:text-white"}`}
                  >
                    <Grid3x3 className="w-5 h-5 lg:w-6 lg:h-6" />
                  </ROButton>
                  <ROButton
                    variant="icon"
                    size="md"
                    onClick={() => setViewMode("list")}
                    className={`w-10 h-10 lg:w-12 lg:h-12 ${viewMode === "list" ? "bg-[#2b4e6b] text-white" : "text-[#5a8bbd] hover:text-white"}`}
                  >
                    <List className="w-5 h-5 lg:w-6 lg:h-6" />
                  </ROButton>
                </div>
              )}
              <CharacterDialog accountId={selectedAccountId} />
            </div>
          ) : null}
        >
          {!selectedAccountId ? (
            <div className="h-full flex flex-col items-center justify-center text-[#5a8bbd]/40 gap-6">
              <div className="w-40 h-40 lg:w-48 lg:h-48 rounded-full border-4 border-[#2b4e6b] border-dashed flex items-center justify-center">
                <Users className="w-16 h-16 lg:w-20 lg:h-20" />
              </div>
              <p className="text-xl lg:text-2xl">
                {hasData ? "Select an account to view characters" : "Sube tu archivo JSON de MuhRo para empezar"}
              </p>
              {!hasData && (
                <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
                  <button
                    onClick={handleLoadDemo}
                    className="flex items-center justify-center gap-2 px-6 lg:px-8 py-3 lg:py-4 bg-[#5a8bbd]/20 border-2 border-[#5a8bbd]/50 rounded-lg hover:bg-[#5a8bbd]/30 hover:border-[#5a8bbd] transition-all text-base lg:text-lg font-semibold text-[#cedce7]"
                  >
                    Ver Demo con mis personajes
                  </button>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                    id="import-file-input-characters"
                  />
                  <label
                    htmlFor="import-file-input-characters"
                    className="flex items-center justify-center gap-2 px-6 lg:px-8 py-3 lg:py-4 bg-[#1c2b3a]/40 border-2 border-[#2b4e6b]/50 rounded-lg hover:bg-[#1c2b3a]/60 hover:border-[#5a8bbd]/50 transition-all cursor-pointer text-base lg:text-lg font-semibold text-[#cedce7]"
                  >
                    <Upload className="w-5 h-5 lg:w-6 lg:h-6" />
                    Importar JSON
                  </label>
                </div>
              )}
            </div>
          ) : isLoadingCharacters ? (
            <div className="h-full flex items-center justify-center text-[#5a8bbd] text-lg lg:text-xl">Summoning characters...</div>
          ) : !characters?.length ? (
            <div className="h-full flex flex-col items-center justify-center text-[#5a8bbd]/50 gap-6">
              <p className="text-lg lg:text-xl">No characters created yet.</p>
              <CharacterDialog accountId={selectedAccountId} />
            </div>
          ) : filteredCharacters.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#5a8bbd]/50 gap-4">
              <p className="text-lg lg:text-xl">No characters match your search.</p>
              {searchQuery && (
                <p className="text-sm lg:text-base text-[#5a8bbd]/30">Try a different search term or clear the search.</p>
              )}
            </div>
          ) : instanceMode ? (
            <div className="w-full overflow-auto">
              <div className="inline-block min-w-full">
                {/* Header con nombres de instancias */}
                <div className="flex border-b-2 border-[#2b4e6b] mb-3">
                  <div className="w-56 lg:w-64 flex-shrink-0 p-4 lg:p-5 border-r-2 border-[#2b4e6b] font-bold text-base lg:text-lg text-[#cedce7]">
                    Character
                  </div>
                  {instances.map((instance) => (
                    <Tooltip key={instance}>
                      <TooltipTrigger asChild>
                        <div
                          className="flex-1 min-w-[140px] lg:min-w-[160px] p-4 lg:p-5 text-center font-bold text-base lg:text-lg text-[#cedce7] border-r-2 last:border-r-0 border-[#2b4e6b] cursor-help"
                        >
                          {instance}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm lg:text-base">{instanceNames[instance]}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
                
                {/* Filas de personajes con checkboxes */}
                <div className="flex flex-col">
                  {filteredCharacters.map((char) => (
                    <div key={char.id} className="flex border-b border-[#2b4e6b]/50 hover:bg-[#0a1018]/50 transition-colors">
                      {/* Columna de personaje */}
                      <div className="w-56 lg:w-64 flex-shrink-0 p-4 lg:p-5 border-r-2 border-[#2b4e6b] flex items-center gap-3 lg:gap-4">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center flex-shrink-0">
                          <ClassSprite className={char.class} alt={char.name} isIconOnly />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-base lg:text-lg font-bold text-white leading-none">{char.name}</div>
                          <div className="text-sm lg:text-base text-[#5a8bbd] leading-none mt-2">
                            {char.class} Lv.{char.lvl}
                          </div>
                        </div>
                      </div>
                      
                      {/* Checkboxes de instancias */}
                      {instances.map((instance) => (
                        <div
                          key={instance}
                          className="flex-1 min-w-[140px] lg:min-w-[160px] p-4 lg:p-5 flex items-center justify-center border-r-2 last:border-r-0 border-[#2b4e6b]"
                        >
                          <input
                            type="checkbox"
                            checked={instanceStatus[char.id]?.[instance] || false}
                            className="w-5 h-5 lg:w-6 lg:h-6 cursor-pointer"
                            onChange={(e) => {
                              setInstanceStatus((prev) => ({
                                ...prev,
                                [char.id]: {
                                  ...(prev[char.id] || {}),
                                  [instance]: e.target.checked,
                                },
                              }));
                            }}
                            className="w-5 h-5 cursor-pointer accent-[#5a8bbd] rounded border-[#2b4e6b] bg-[#0a1018] checked:bg-[#5a8bbd]"
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8">
              <AnimatePresence>
                {filteredCharacters.map((char) => (
                  <motion.div
                    key={char.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="group relative bg-[#0a1018] border border-[#2b4e6b] rounded-lg transition-colors overflow-hidden">
                      {/* Character Card Header */}
                      <div className="flex justify-between items-start p-4 lg:p-5 bg-gradient-to-b from-[#1c2b3a] to-[#121c26] border-b border-[#2b4e6b]">
                        <div>
                          <h4 className="font-bold text-white text-base lg:text-lg">{char.name}</h4>
                          <span className="text-sm lg:text-base text-[#5a8bbd] block mt-2">{char.class}</span>
                        </div>
                        <div className="bg-[#0a1018] px-3 py-1.5 rounded-lg border border-[#2b4e6b] text-sm lg:text-base font-mono text-[#cedce7]">
                          Lv. {char.lvl}
                        </div>
                      </div>

                      {/* Character Sprite Area */}
                      <div className="relative h-48 lg:h-56 p-5 lg:p-6 flex items-center justify-center bg-[#0a1018] pointer-events-none">
                        <ClassSprite className={char.class} alt={char.name} />
                      </div>

                      {/* Actions Overlay */}
                      <div className="absolute inset-x-0 bottom-0 p-3 lg:p-4 bg-[#0a1018]/90 backdrop-blur border-t border-[#2b4e6b] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex justify-end gap-3 z-50 pointer-events-none group-hover:pointer-events-auto">
                        <CharacterDialog 
                          accountId={selectedAccountId} 
                          character={char} 
                          trigger={
                            <ROButton variant="icon" size="md" type="button" className="w-10 h-10 lg:w-12 lg:h-12 cursor-pointer pointer-events-auto">
                              <Edit className="w-5 h-5 lg:w-6 lg:h-6" />
                            </ROButton>
                          }
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <ROButton variant="icon" size="md" type="button" className="w-10 h-10 lg:w-12 lg:h-12 hover:border-red-500 hover:text-red-400 cursor-pointer pointer-events-auto">
                              <Trash2 className="w-5 h-5 lg:w-6 lg:h-6" />
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
          ) : (
            <div className="flex flex-col gap-3 lg:gap-4">
              <AnimatePresence>
                {filteredCharacters.map((char) => (
                  <motion.div
                    key={char.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="group flex items-center gap-4 lg:gap-5 bg-[#0a1018]/60 px-4 lg:px-6 py-3 lg:py-4 rounded-lg border border-[#5a8bbd]/20 hover:border-[#5a8bbd]/40 transition-colors shadow-sm">
                      {/* Icon */}
                      <div className="w-14 h-14 lg:w-16 lg:h-16 flex items-center justify-center flex-shrink-0">
                        <ClassSprite className={char.class} alt={char.name} isIconOnly />
                      </div>
                      
                      {/* Name and Class */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="text-base lg:text-lg font-bold text-white leading-none">{char.name}</span>
                          <span className="text-sm lg:text-base font-mono text-[#5a8bbd] leading-none">Lv. {char.lvl}</span>
                        </div>
                        <span className="text-sm lg:text-base text-[#5a8bbd] block leading-none mt-2">{char.class}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <CharacterDialog 
                          accountId={selectedAccountId} 
                          character={char} 
                          trigger={
                            <ROButton variant="icon" size="md" type="button" className="w-10 h-10 lg:w-12 lg:h-12">
                              <Edit className="w-5 h-5 lg:w-6 lg:h-6" />
                            </ROButton>
                          }
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <ROButton variant="icon" size="md" type="button" className="w-10 h-10 lg:w-12 lg:h-12 hover:border-red-500 hover:text-red-400">
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
    </div>
  );
}
