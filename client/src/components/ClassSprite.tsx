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
  "Elemental Master": 4264
};

export function ClassSprite({ className: jobClass, alt }: { className: string, alt: string }) {
  const [error, setError] = useState(false);
  
  const jobId = JOB_IDS[jobClass] ?? JOB_IDS["Novice"]; // Default to Novice
  // Using divine-pride static asset server
  const spriteUrl = `https://static.divine-pride.net/images/jobs/png/male/${jobId}.png`;

  if (error || !jobClass) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0a1018]/50 rounded-lg border border-[#2b4e6b] border-dashed">
        <User className="w-8 h-8 text-[#2b4e6b]" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Glow effect behind sprite */}
      <div className="absolute w-12 h-12 bg-[#5a8bbd]/10 blur-xl rounded-full" />
      <img 
        src={spriteUrl} 
        alt={alt}
        className="relative z-10 max-h-full object-contain drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]"
        onError={() => setError(true)}
      />
    </div>
  );
}

export const CLASS_OPTIONS = Object.keys(JOB_IDS).sort();
