## Packages
framer-motion | For smooth panel transitions and dialog animations
lucide-react | Icons (already in base stack, but emphasizing usage)
clsx | Utility for conditional classes
tailwind-merge | Utility for merging tailwind classes

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  sans: ["Verdana", "sans-serif"],
  display: ["'Press Start 2P'", "cursive"], // Pixel art font for headers if available, or fallback
}
Background is a dark radial gradient typical of RO login screens.
Panels use glassmorphism with blue tints.
Sprite URLs: `https://static.divine-pride.net/images/jobs/png/male/${jobId}.png`
