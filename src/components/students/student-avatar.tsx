import type { AvatarOptions } from "@/src/domain/avatar";

const skinColors = {
  light: "#F6C7A7",
  "medium-light": "#DFA06E",
  medium: "#A9653F",
  deep: "#663A2A",
} as const;

const outfitColors = {
  ocean: ["#2DAFD0", "#1769E0"],
  violet: ["#8B6BE8", "#5B43BD"],
  coral: ["#F47C69", "#C94F55"],
  mint: ["#3CBF91", "#178A68"],
  sunset: ["#F5A13D", "#E2673F"],
} as const;

const hairColors = {
  dark: "#272437",
  brown: "#5A382C",
  auburn: "#8A3F32",
  golden: "#B77724",
  blue: "#315AA8",
} as const;

function Hair({ style, color }: { style: AvatarOptions["hairStyle"]; color: string }) {
  if (style === "short") return <path d="M70 88c2-32 22-51 51-51 31 0 50 18 52 49-20-17-77-18-103 2Z" fill={color} />;
  if (style === "waves") return <><path d="M67 91c-2-34 21-58 54-58 35 0 57 22 53 60-12-11-19-18-27-32-11 15-24 18-37 7-11 14-24 21-43 23Z" fill={color} /><path d="M76 66c13-12 24-15 39-6m-28 18c14-12 28-13 42-4m7-18c13 4 22 12 29 23" fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth="5" strokeLinecap="round" /></>;
  if (style === "braids") return <><path d="M69 88c1-34 22-55 53-55 33 0 53 23 52 58-24-17-78-19-105-3Z" fill={color} /><path d="M73 77c-8 21-9 45-1 67m96-66c8 21 8 44 1 67" fill="none" stroke={color} strokeWidth="11" strokeLinecap="round" /><circle cx="71" cy="146" r="7" fill={color} /><circle cx="170" cy="147" r="7" fill={color} /></>;
  const circles = style === "coily"
    ? [[77, 74, 19], [91, 51, 20], [119, 43, 22], [147, 51, 20], [165, 74, 19], [68, 96, 17], [174, 97, 17]]
    : [[78, 72, 20], [99, 48, 22], [128, 44, 24], [154, 59, 22], [169, 85, 19], [70, 97, 18]];
  return <g fill={color}>{circles.map(([cx, cy, r], index) => <circle key={index} cx={cx} cy={cy} r={r} />)}</g>;
}

export function StudentAvatar({ avatar, className = "size-full", label }: { avatar: AvatarOptions; className?: string; label?: string }) {
  const skin = skinColors[avatar.skinTone];
  const [outfit, secondary] = outfitColors[avatar.outfitColor];
  const hair = hairColors[avatar.hairColor];
  return <svg viewBox="0 0 240 240" className={className} role={label ? "img" : undefined} aria-hidden={label ? undefined : true} aria-label={label}>
    <ellipse cx="121" cy="220" rx="69" ry="12" fill="#172033" opacity=".09" />
    <path d="M73 232c2-49 17-77 48-77s48 28 50 77Z" fill={secondary} />
    <path d="M82 226c1-39 13-64 39-64s39 25 40 64Z" fill={outfit} />
    <path d="M106 151v23h30v-23" fill={skin} />
    <ellipse cx="121" cy="105" rx="50" ry="58" fill={skin} />
    <ellipse cx="73" cy="111" rx="9" ry="13" fill={skin} /><ellipse cx="169" cy="111" rx="9" ry="13" fill={skin} />
    <Hair style={avatar.hairStyle} color={hair} />
    <ellipse cx="102" cy="108" rx="4" ry="5" fill="#242238" /><ellipse cx="141" cy="108" rx="4" ry="5" fill="#242238" />
    <circle cx="103" cy="106" r="1.4" fill="#fff" /><circle cx="142" cy="106" r="1.4" fill="#fff" />
    <path d="M109 129c8 7 17 7 25 0" fill="none" stroke="#7B3F45" strokeWidth="3.5" strokeLinecap="round" />
    <ellipse cx="91" cy="123" rx="10" ry="5" fill="#F27786" opacity=".28" /><ellipse cx="152" cy="123" rx="10" ry="5" fill="#F27786" opacity=".28" />
    <path d="M87 176c-18 7-26 25-27 48h25l14-43m56-5c18 7 26 25 27 48h-25l-14-43" fill={secondary} />
    <path d="M115 176h13l7 12-14 13-14-13Z" fill="#fff" opacity=".92" />
  </svg>;
}
