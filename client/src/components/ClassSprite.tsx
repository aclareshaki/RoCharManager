import { useState } from "react";
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
  "Arch Mage": 4253,
  "Windhawk": 4254,
  "Cardinal": 4255,
  "Meister": 4256,
  "Shadow Cross": 4257,
  "Imperial Guard": 4258,
  "Biolo": 4259,
  "Troubadour": 4260,
  "Trouvere": 4261,
  "Inquisitor": 4262,
  "Abyss Chaser": 4263,
  "Elemental Master": 4264,
  "Hyper Novice": 4302,
  "Spirit Handler": 4303,
  "Shinkiro": 4304,
  "Shiranui": 4305,
  "Night Watch": 4306,
  "Sky Emperor": 4307,
  "Soul Ascetic": 4308
};

export function ClassSprite({ className: jobClass, alt }: { className: string, alt: string }) {
  const [error, setError] = useState(false);
  
  const jobId = JOB_IDS[jobClass] ?? JOB_IDS["Novice"]; // Default to Novice
  // Fixed paths based on ROCalc asset structure
  const spriteUrl = `https://www.rocalc.cc/assets/jobs/male/${jobId}.png`;
  const iconUrl = `https://www.rocalc.cc/assets/jobs/icons/${jobId}.png`;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden gap-2 bg-[#0a1018]/30">
      {/* Glow effect behind sprite */}
      <div className="absolute w-24 h-24 bg-[#5a8bbd]/5 blur-2xl rounded-full" />
      
      {/* Sprite Image - No error state to allow background to show if missing */}
      <img 
        src={spriteUrl} 
        alt={alt}
        className="relative z-10 max-h-[120px] object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] transition-opacity duration-300"
        loading="lazy"
        onError={(e) => {
          e.currentTarget.style.opacity = '0';
          // Fallback to a placeholder icon if sprite fails
        }}
      />

      {/* Class Icon */}
      <div className="relative z-20 bg-[#1c2b3a] p-1 rounded border border-[#5a8bbd]/40 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
        <img 
          src={iconUrl} 
          alt={`${jobClass} icon`}
          className="w-8 h-8 object-contain pixelated"
          onError={(e) => {
            e.currentTarget.src = "https://www.rocalc.cc/assets/Poporing.png"; // Fallback to mascot if icon fails
          }}
        />
      </div>
    </div>
  );
}

export const CLASS_OPTIONS = Object.keys(JOB_IDS).sort();
