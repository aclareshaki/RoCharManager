import { useState, useEffect } from "react";
import { User } from "lucide-react";

// Simplified job ID mapping for common classes
// In a real app this would be a comprehensive mapping or API lookup
const JOB_IDS: Record<string, number> = {
  // Novice
  "Novice": 0,
  "Super Novice": 23,
  
  // 1st Class
  "Swordman": 1,
  "Mage": 2,
  "Archer": 3,
  "Acolyte": 4,
  "Merchant": 5,
  "Thief": 6,
  
  // 2nd Class
  "Knight": 7,
  "Priest": 8,
  "Wizard": 9,
  "Blacksmith": 10,
  "Hunter": 11,
  "Assassin": 12,
  "Crusader": 14,
  "Monk": 15,
  "Sage": 16,
  "Rogue": 17,
  "Alchemist": 18,
  "Bard": 19,
  "Dancer": 20,

  // Transcendent
  "Lord Knight": 4008,
  "High Priest": 4009,
  "High Wizard": 4010,
  "Whitesmith": 4011,
  "Sniper": 4012,
  "Assassin Cross": 4013,
  "Paladin": 4015,
  "Champion": 4016,
  "Professor": 4017,
  "Stalker": 4018,
  "Creator": 4019,
  "Clown": 4020,
  "Gypsy": 4021,

  // 3rd Class
  "Rune Knight": 4054,
  "Warlock": 4055,
  "Ranger": 4056,
  "Arch Bishop": 4057,
  "Arc Bishop": 4057,
  "Mechanic": 4058,
  "Guillotine Cross": 4059,
  "Royal Guard": 4060,
  "Sorcerer": 4061,
  "Minstrel": 4062,
  "Wanderer": 4063,
  "Sura": 4064,
  "Genetic": 4065,
  "Shadow Chaser": 4066,
  "Kagerou": 4211,
  "Oboro": 4212,
  "Rebellion": 4215,

  // 4th Class
  "Dragon Knight": 4252,
  "Arch Mage": 4255,
  "Windhawk": 4257,
  "Cardinal": 4256,
  "Meister": 4253,
  "Shadow Cross": 4254,
  "Imperial Guard": 4258,
  "Biolo": 4259,
  "Abyss Chaser": 4260,
  "Elemental Master": 4261,
  "Inquisitor": 4262,
  "Troubadour": 4263,
  "Trouvere": 4264,
  "Hyper Novice": 4302,
  "Spirit Handler": 4303,
  "Shinkiro": 4304,
  "Shiranui": 4305,
  "Night Watch": 4306,
  "Sky Emperor": 4307,
  "Soul Ascetic": 4308
};

export function ClassSprite({ className: jobClass, alt, isIconOnly = false }: { className: string, alt: string, isIconOnly?: boolean }) {
  const [spriteError, setSpriteError] = useState(false);
  const [iconError, setIconError] = useState(false);
  const [iconSrc, setIconSrc] = useState<string | null>(null);
  const [spriteSrc, setSpriteSrc] = useState<string | null>(null);
  const [spriteLoaded, setSpriteLoaded] = useState(false);
  
  // Normalize class name (trim, find case-insensitive match)
  const normalizedClass = jobClass?.trim() || "Novice";
  const jobIdKey = Object.keys(JOB_IDS).find(
    key => key.toLowerCase() === normalizedClass.toLowerCase()
  ) || "Novice";
  const jobId = JOB_IDS[jobIdKey] ?? JOB_IDS["Novice"]; // Default to Novice
  // Using locally downloaded assets
  const spriteUrl = `/images/jobs/sprites/jobs_${jobId}.png`;
  const remoteSpriteUrl = `https://www.rocalc.cc/assets/demo/images/jobs/jobs_${jobId}.png`;
  const localIconUrl = `/images/jobs/icons/icon_jobs_${jobId}.png`;
  const remoteIconUrl = `https://www.rocalc.cc/assets/demo/images/jobs/icon_jobs_${jobId}.png`;
  
  // Reset states when jobClass or jobId changes
  useEffect(() => {
    setIconSrc(null);
    setSpriteSrc(null);
    setIconError(false);
    setSpriteError(false);
    setSpriteLoaded(false);
    
    // Timeout: si el sprite no carga en 1 segundo, mostrar icono de clase
    const timeout = setTimeout(() => {
      setSpriteError((prev) => {
        if (!prev && !spriteLoaded) {
          return true; // Mostrar icono si el sprite no ha cargado
        }
        return prev;
      });
    }, 1000);
    
    return () => clearTimeout(timeout);
  }, [jobClass, jobId]);
  
  // Use state to track which source to try
  const currentIconUrl = iconSrc || localIconUrl;
  const currentSpriteUrl = spriteSrc || spriteUrl;

  if (isIconOnly) {
    if (iconError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-[#0a1018]/40 border border-[#2b4e6b]/30 rounded">
          <User className="w-4 h-4 text-[#5a8bbd]/40" />
        </div>
      );
    }
    
    return (
      <img 
        key={`icon-${jobId}-${iconSrc ? 'remote' : 'local'}`}
        src={currentIconUrl} 
        alt={`${jobClass} icon`}
        className="w-full h-full object-contain pixelated drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
        onError={(e) => {
          console.warn(`Icon failed to load: ${jobClass} (ID: ${jobId}) from ${currentIconUrl}`);
          if (iconSrc === null) {
            // Try remote fallback
            setIconSrc(remoteIconUrl);
          } else {
            // Both local and remote failed
            setIconError(true);
          }
        }}
        onLoad={() => {
          // Reset error state if image loads successfully
          setIconError(false);
        }}
      />
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center min-h-[160px]">
      {/* Intentar mostrar sprite primero, si falla mostrar icono de clase */}
      {!spriteError && spriteLoaded ? (
        <img 
          src={currentSpriteUrl} 
          alt={alt}
          className="relative z-10 w-auto h-full max-h-full object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] mx-auto pixelated"
          style={{ imageRendering: 'pixelated' }}
        />
      ) : !spriteError ? (
        <>
          <img 
            src={currentSpriteUrl} 
            alt={alt}
            className="relative z-10 w-auto h-full max-h-full object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] mx-auto pixelated"
            style={{ imageRendering: 'pixelated' }}
            onError={(e) => {
              // Fallback to remote sprite if local fails
              if (spriteSrc === null) {
                setSpriteSrc(remoteSpriteUrl);
              } else {
                // Si el sprite remoto también falla, mostrar icono de clase inmediatamente
                setSpriteError(true);
              }
            }}
            onLoad={(e) => {
              // Verificar que la imagen realmente se cargó y tiene dimensiones válidas
              const img = e.currentTarget;
              if (img.naturalWidth === 0 || img.naturalHeight === 0) {
                // Imagen inválida, mostrar icono
                setSpriteError(true);
              } else {
                setSpriteLoaded(true);
                setSpriteError(false);
              }
            }}
          />
          {/* Mostrar icono de clase mientras carga el sprite (fallback visual) */}
          <img 
            key={`icon-loading-${jobId}-${iconSrc ? 'remote' : 'local'}`}
            src={currentIconUrl} 
            alt={`${jobClass} icon`}
            className="absolute inset-0 w-28 h-28 m-auto object-contain pixelated opacity-0 pointer-events-none"
            style={{ imageRendering: 'pixelated' }}
            onError={(e) => {
              if (iconSrc === null) {
                setIconSrc(remoteIconUrl);
              }
            }}
          />
        </>
      ) : (
        // Fallback: mostrar icono de clase si el sprite falla
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          {iconError ? (
            <User className="w-20 h-20 text-[#5a8bbd]/50" />
          ) : (
            <img 
              key={`icon-fallback-${jobId}-${iconSrc ? 'remote' : 'local'}`}
              src={currentIconUrl} 
              alt={`${jobClass} icon`}
              className="w-28 h-28 object-contain pixelated drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
              style={{ imageRendering: 'pixelated' }}
              onError={(e) => {
                if (iconSrc === null) {
                  // Intentar remoto si local falla
                  setIconSrc(remoteIconUrl);
                } else {
                  // Ambos fallaron
                  setIconError(true);
                }
              }}
              onLoad={() => {
                setIconError(false);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

export const CLASS_OPTIONS = Object.keys(JOB_IDS).sort();
