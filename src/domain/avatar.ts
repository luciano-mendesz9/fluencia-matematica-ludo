export const SKIN_TONES = ["light", "medium-light", "medium", "deep"] as const;
export const OUTFIT_COLORS = ["ocean", "violet", "coral", "mint", "sunset"] as const;
export const HAIR_STYLES = ["short", "curly", "coily", "braids", "waves"] as const;
export const HAIR_COLORS = ["dark", "brown", "auburn", "golden", "blue"] as const;

export type SkinTone = (typeof SKIN_TONES)[number];
export type OutfitColor = (typeof OUTFIT_COLORS)[number];
export type HairStyle = (typeof HAIR_STYLES)[number];
export type HairColor = (typeof HAIR_COLORS)[number];

export type AvatarOptions = {
  skinTone: SkinTone;
  outfitColor: OutfitColor;
  hairStyle: HairStyle;
  hairColor: HairColor;
};

export const DEFAULT_AVATAR: AvatarOptions = {
  skinTone: "medium",
  outfitColor: "ocean",
  hairStyle: "curly",
  hairColor: "dark",
};

export function isAvatarOption<T extends string>(values: readonly T[], value: string): value is T {
  return values.includes(value as T);
}

export function normalizeAvatar(value: { skinTone: string; outfitColor: string; hairStyle: string; hairColor: string } | null | undefined): AvatarOptions {
  if (value
    && isAvatarOption(SKIN_TONES, value.skinTone)
    && isAvatarOption(OUTFIT_COLORS, value.outfitColor)
    && isAvatarOption(HAIR_STYLES, value.hairStyle)
    && isAvatarOption(HAIR_COLORS, value.hairColor)) return {
      skinTone: value.skinTone as SkinTone,
      outfitColor: value.outfitColor as OutfitColor,
      hairStyle: value.hairStyle as HairStyle,
      hairColor: value.hairColor as HairColor,
    };
  return { ...DEFAULT_AVATAR };
}
