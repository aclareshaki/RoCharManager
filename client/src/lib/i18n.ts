// Detectar idioma del navegador
const getBrowserLanguage = (): string => {
  if (typeof window === "undefined") return "en";
  const lang = navigator.language || (navigator as any).userLanguage;
  return lang.startsWith("es") ? "es" : "en";
};

export type Language = "es" | "en";

export const translations = {
  es: {
    // Header
    title: "Ragnarok Online Char Manager",
    subtitle: "Sistema de Gestión de Personajes",
    
    // Buttons
    import: "Importar",
    export: "Exportar",
    demo: "Ver Demo con mis personajes",
    clearAll: "Borrar todos los datos",
    newAccount: "Nueva Cuenta",
    addCharacter: "Añadir Personaje",
    delete: "Eliminar",
    cancel: "Cancelar",
    confirm: "Confirmar",
    
    // Panels
    accounts: "Cuentas",
    characters: "Personajes",
    selectAccount: "Selecciona una cuenta",
    
    // Messages
    welcomeMessage: "Sube tu archivo JSON de MuhRo para empezar",
    noAccounts: "No se encontraron cuentas",
    noCharacters: "No se han creado personajes aún",
    selectAccountToView: "Selecciona una cuenta para ver los personajes",
    noCharactersMatch: "No hay personajes que coincidan con tu búsqueda",
    loadingAccounts: "Cargando cuentas...",
    loadingCharacters: "Convocando personajes...",
    
    // Search
    searchPlaceholder: "BUSCAR CUENTA, PERSONAJE, CLASE, NIVEL (ej. >250)...",
    searchHelpTitle: "Ejemplos de búsqueda",
    searchHelpExamples: [
      "Clase: Elemental master",
      "Nivel: >250 o <100",
      "Instancia no completada: -LOF, -HOL",
      "Combinado: Elemental master + >250 + -LOF",
      "Múltiples: Biolo >200 -NGH -HGH",
    ],
    
    // Instance mode
    instanceMode: "Modo Instancias",
    resetTicks: "Reiniciar ticks",
    resetAllTicks: "Reiniciar todos los ticks",
    resetAccountTicks: "Reiniciar ticks de esta cuenta",
    
    // Delete confirmations
    deleteAccountTitle: "¿Eliminar cuenta?",
    deleteAccountMessage: "Esto eliminará permanentemente",
    deleteAccountMessage2: "y todos los personajes asociados.",
    deleteCharacterTitle: "¿Eliminar personaje?",
    deleteCharacterMessage: "¿Estás seguro de que quieres eliminar",
    deleteCharacterConfirm: "Eliminar",
    deleteAllTitle: "¿Borrar todos los datos?",
    deleteAllMessage: "Esta acción eliminará permanentemente todas las cuentas y personajes guardados.",
    deleteAllWarning: "Esta acción no se puede deshacer.",
    deleteAllConfirm: "Borrar Todo",
    deleteAllAccountsTitle: "¿Eliminar todas las cuentas?",
    deleteAllAccountsMessage: "Esta acción eliminará permanentemente",
    deleteAllAccountsMessage2: "y todos los personajes asociados.",
    deleteAllAccountsConfirm: "Eliminar Todo",
    
    // Dialog forms
    editAccount: "Editar Cuenta",
    createAccount: "Crear Nueva Cuenta",
    accountName: "Nombre de Cuenta",
    enterAccountName: "Ingresa el nombre de la cuenta...",
    editCharacter: "Editar Personaje",
    createCharacter: "Crear Nuevo Personaje",
    characterName: "Nombre del Personaje",
    enterCharacterName: "Ingresa el nombre del personaje...",
    baseLevel: "Nivel Base",
    selectClass: "Seleccionar clase",
    saving: "Guardando...",
    saveAccount: "Guardar Cuenta",
    saveCharacter: "Guardar Personaje",
    
    // Toasts
    accountCreated: "Cuenta creada exitosamente",
    accountUpdated: "Cuenta actualizada exitosamente",
    accountDeleted: "Cuenta eliminada exitosamente",
    characterCreated: "Personaje creado exitosamente",
    characterUpdated: "Personaje actualizado exitosamente",
    characterDeleted: "Personaje eliminado exitosamente",
    importSuccess: "Importación exitosa",
    importError: "Error al importar",
    exportSuccess: "Exportación exitosa",
    demoLoaded: "Demo cargada",
    allDataCleared: "Datos eliminados",
    allDataClearedDesc: "Todos los datos han sido eliminados",
    ticksReset: "Ticks reseteados",
    ticksResetDesc: "Todos los ticks de instancias han sido eliminados.",
    
    // Instance names (these will be in English as per requirement)
    instanceNGH: "Glast heim normal",
    instanceHGH: "Glast heim hard",
    instanceCOGH: "Glast Heim challenge",
    instanceLOF: "Lake of fire",
    instanceHOL: "Hall of life (Semanal por cuenta maestra - se marca para todos los personajes)",
    instanceCT: "Constellation tower",
    
    // Errors
    error: "Error",
    errorImport: "Error al importar",
    errorExport: "Error al exportar",
    errorLoadDemo: "Error al cargar demo",
    noValidData: "No se encontraron datos válidos en el archivo JSON",
    errorReadFile: "Error al leer el archivo JSON",
    
    // Welcome screen
    welcome: "¡Bienvenido!",
    welcomeDescription: "Para comenzar, importa tu archivo JSON de MuhRo. Puedes exportar tus datos desde la aplicación original y cargarlos aquí para gestionar tus personajes de forma local.",
    loadExample: "Cargar Ejemplo",
    importJSON: "Importar JSON",
    dataPrivacy: "Tus datos se guardarán localmente en tu navegador. Nadie más tendrá acceso a ellos.",
  },
  en: {
    // Header
    title: "Ragnarok Online Char Manager",
    subtitle: "Character Management System",
    
    // Buttons
    import: "Import",
    export: "Export",
    demo: "View Demo with my characters",
    clearAll: "Clear all data",
    newAccount: "New Account",
    addCharacter: "Add Character",
    delete: "Delete",
    cancel: "Cancel",
    confirm: "Confirm",
    
    // Panels
    accounts: "Accounts",
    characters: "Characters",
    selectAccount: "Select an Account",
    
    // Messages
    welcomeMessage: "Upload your MuhRo JSON file to get started",
    noAccounts: "No accounts found",
    noCharacters: "No characters created yet",
    selectAccountToView: "Select an account to view characters",
    noCharactersMatch: "No characters match your search",
    loadingAccounts: "Loading accounts...",
    loadingCharacters: "Summoning characters...",
    
    // Search
    searchPlaceholder: "SEARCH ACCOUNT, CHARACTER, CLASS, LEVEL (e.g. >250)...",
    searchHelpTitle: "Search examples",
    searchHelpExamples: [
      "Class: Elemental master",
      "Level: >250 or <100",
      "Instance not completed: -LOF, -HOL",
      "Combined: Elemental master + >250 + -LOF",
      "Multiple: Biolo >200 -NGH -HGH",
    ],
    
    // Instance mode
    instanceMode: "Instance Mode",
    resetTicks: "Reset ticks",
    resetAllTicks: "Reset all ticks",
    resetAccountTicks: "Reset ticks for this account only",
    
    // Delete confirmations
    deleteAccountTitle: "Delete Account?",
    deleteAccountMessage: "This will permanently delete",
    deleteAccountMessage2: "and all associated characters.",
    deleteCharacterTitle: "Delete Character?",
    deleteCharacterMessage: "Are you sure you want to delete",
    deleteCharacterConfirm: "Delete",
    deleteAllTitle: "Clear all data?",
    deleteAllMessage: "This action will permanently delete all saved accounts and characters.",
    deleteAllWarning: "This action cannot be undone.",
    deleteAllConfirm: "Clear All",
    deleteAllAccountsTitle: "Delete all accounts?",
    deleteAllAccountsMessage: "This action will permanently delete",
    deleteAllAccountsMessage2: "and all associated characters.",
    deleteAllAccountsConfirm: "Delete All",
    
    // Dialog forms
    editAccount: "Edit Account",
    createAccount: "Create New Account",
    accountName: "Account Name",
    enterAccountName: "Enter account name...",
    editCharacter: "Edit Character",
    createCharacter: "Create New Character",
    characterName: "Character Name",
    enterCharacterName: "Enter character name...",
    baseLevel: "Base Level",
    selectClass: "Select class",
    saving: "Saving...",
    saveAccount: "Save Account",
    saveCharacter: "Save Character",
    
    // Toasts
    accountCreated: "Account created successfully",
    accountUpdated: "Account updated successfully",
    accountDeleted: "Account deleted successfully",
    characterCreated: "Character created successfully",
    characterUpdated: "Character updated successfully",
    characterDeleted: "Character deleted successfully",
    importSuccess: "Import successful",
    importError: "Import error",
    exportSuccess: "Export successful",
    demoLoaded: "Demo loaded",
    allDataCleared: "Data cleared",
    allDataClearedDesc: "All data has been cleared",
    ticksReset: "Ticks reset",
    ticksResetDesc: "All instance ticks have been cleared.",
    
    // Instance names (always in English)
    instanceNGH: "Glast heim normal",
    instanceHGH: "Glast heim hard",
    instanceCOGH: "Glast Heim challenge",
    instanceLOF: "Lake of fire",
    instanceHOL: "Hall of life (Weekly per master account - marks for all characters)",
    instanceCT: "Constellation tower",
    
    // Errors
    error: "Error",
    errorImport: "Import error",
    errorExport: "Export error",
    errorLoadDemo: "Error loading demo",
    noValidData: "No valid data found in JSON file",
    errorReadFile: "Error reading JSON file",
    
    // Welcome screen
    welcome: "Welcome!",
    welcomeDescription: "To get started, import your MuhRo JSON file. You can export your data from the original application and load it here to manage your characters locally.",
    loadExample: "Load Example",
    importJSON: "Import JSON",
    dataPrivacy: "Your data will be stored locally in your browser. No one else will have access to it.",
  },
};

let currentLanguage: Language = getBrowserLanguage();

export const setLanguage = (lang: Language) => {
  currentLanguage = lang;
  if (typeof window !== "undefined") {
    localStorage.setItem("rochardb_language", lang);
  }
};

export const getLanguage = (): Language => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("rochardb_language");
    if (saved === "es" || saved === "en") {
      return saved;
    }
  }
  return currentLanguage;
};

export const t = (key: keyof typeof translations.en): string => {
  const lang = getLanguage();
  return translations[lang][key] || translations.en[key] || key;
};

// Inicializar idioma desde localStorage si existe
if (typeof window !== "undefined") {
  const saved = localStorage.getItem("rochardb_language");
  if (saved === "es" || saved === "en") {
    currentLanguage = saved;
  }
}
