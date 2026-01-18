import { Upload, FileJson, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as localStorage from "@/lib/localStorage";
import { useState } from "react";

interface WelcomeScreenProps {
  onImport: () => void;
}

export function WelcomeScreen({ onImport }: WelcomeScreenProps) {
  const { toast } = useToast();
  const [isLoadingExample, setIsLoadingExample] = useState(false);

  const processJsonData = (jsonData: any) => {
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
      throw new Error("No se encontraron datos válidos en el archivo JSON");
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

    // Trigger refresh
    onImport();
  };

  const handleLoadExample = async () => {
    setIsLoadingExample(true);
    try {
      const response = await fetch("/example-data.json");
      if (!response.ok) {
        throw new Error("No se pudo cargar el archivo de ejemplo");
      }
      const jsonData = await response.json();
      processJsonData(jsonData);
    } catch (error) {
      console.error("Error loading example:", error);
      toast({
        title: "Error al cargar ejemplo",
        description: error instanceof Error ? error.message : "Error al cargar los datos de ejemplo",
        variant: "destructive",
      });
    } finally {
      setIsLoadingExample(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const jsonData = JSON.parse(text);
        processJsonData(jsonData);
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
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-gradient-to-br from-[#0a1018] via-[#1c2b3a] to-[#0a1018]">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center bg-[#1c2b3a] rounded-full border-2 border-[#5a8bbd] shadow-[0_0_30px_rgba(90,139,189,0.4)] overflow-hidden">
            <img src="/assets/cow_logo_final.png" alt="Ragnarok Online Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#cedce7] mb-4 tracking-tight">
            Ragnarok Online <span className="text-[#5a8bbd]">Char Manager</span>
          </h1>
          <p className="text-[#a0c0e0] text-lg uppercase tracking-widest opacity-70 mb-2">
            Character Management System
          </p>
        </div>

        <div className="bg-[#1c2b3a]/60 border border-[#2b4e6b]/50 rounded-lg p-8 md:p-12 shadow-2xl backdrop-blur-sm">
          <div className="mb-8">
            <FileJson className="w-16 h-16 mx-auto mb-4 text-[#5a8bbd]/60" />
            <h2 className="text-2xl font-bold text-[#cedce7] mb-3">
              ¡Bienvenido!
            </h2>
            <p className="text-[#a0c0e0] text-base leading-relaxed mb-6">
              Para comenzar, importa tu archivo JSON de MuhRo. Puedes exportar tus datos desde la aplicación original
              y cargarlos aquí para gestionar tus personajes de forma local.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleLoadExample}
              disabled={isLoadingExample}
              className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-[#5a8bbd]/20 border-2 border-[#5a8bbd]/50 rounded-lg hover:bg-[#5a8bbd]/30 hover:border-[#5a8bbd] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <Sparkles className={`w-5 h-5 text-[#5a8bbd] group-hover:text-white transition-colors ${isLoadingExample ? 'animate-spin' : ''}`} />
              <span className="text-lg font-semibold text-[#cedce7] group-hover:text-white transition-colors">
                {isLoadingExample ? "Cargando..." : "Cargar Ejemplo"}
              </span>
            </button>

            <div className="relative flex items-center justify-center my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#2b4e6b]/50"></div>
              </div>
              <div className="relative bg-[#1c2b3a]/60 px-4">
                <span className="text-sm text-[#a0c0e0]/40 uppercase tracking-widest">O</span>
              </div>
            </div>

            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
              id="welcome-import-file"
            />
            <label
              htmlFor="welcome-import-file"
              className="flex items-center justify-center gap-3 px-8 py-4 bg-[#1c2b3a]/40 border-2 border-[#2b4e6b]/50 rounded-lg hover:bg-[#1c2b3a]/60 hover:border-[#5a8bbd]/50 transition-all cursor-pointer group"
            >
              <Upload className="w-5 h-5 text-[#5a8bbd]/60 group-hover:text-[#5a8bbd] transition-colors" />
              <span className="text-lg font-semibold text-[#cedce7] group-hover:text-white transition-colors">
                Importar archivo JSON de MuhRo
              </span>
            </label>

            <p className="text-sm text-[#a0c0e0]/60 mt-6">
              Tus datos se guardarán localmente en tu navegador. Nadie más tendrá acceso a ellos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
