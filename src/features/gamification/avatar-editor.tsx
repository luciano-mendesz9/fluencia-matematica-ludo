"use client";

import { useActionState, useState } from "react";
import {
  HAIR_COLORS,
  HAIR_STYLES,
  OUTFIT_COLORS,
  SKIN_TONES,
  type AvatarOptions,
} from "@/src/domain/avatar";
import { StudentAvatar } from "@/src/components/students/student-avatar";
import { updateAvatarAction, type AvatarActionState } from "./actions";

const initialState: AvatarActionState = { status: "idle" };
const labels = {
  skinTone: { light: "Clara", "medium-light": "Média clara", medium: "Média", deep: "Escura" },
  outfitColor: { ocean: "Oceano", violet: "Violeta", coral: "Coral", mint: "Menta", sunset: "Pôr do sol" },
  hairStyle: { short: "Curto", curly: "Cacheado", coily: "Crespo", braids: "Tranças", waves: "Ondulado" },
  hairColor: { dark: "Preto", brown: "Castanho", auburn: "Ruivo", golden: "Dourado", blue: "Azul" },
} as const;

const swatches = {
  light: "#F6C7A7", "medium-light": "#DFA06E", medium: "#A9653F", deep: "#663A2A",
  ocean: "#2DAFD0", violet: "#8B6BE8", coral: "#F47C69", mint: "#3CBF91", sunset: "#F5A13D",
  dark: "#272437", brown: "#5A382C", auburn: "#8A3F32", golden: "#B77724", blue: "#315AA8",
} as const;

function ChoiceGroup<T extends string>({ legend, name, values, value, onChange, color = false }: { legend: string; name: string; values: readonly T[]; value: T; onChange: (value: T) => void; color?: boolean }) {
  const groupLabels = labels[name as keyof typeof labels] as Record<string, string>;
  return <fieldset className="avatar-choice-group"><legend>{legend}</legend><div className="flex flex-wrap gap-2.5">{values.map((option) => <label key={option} className={`avatar-choice ${value === option ? "is-selected" : ""}`} title={groupLabels[option]}>
    <input type="radio" name={name} value={option} checked={value === option} onChange={() => onChange(option)} />
    {color ? <span className="avatar-swatch" style={{ background: swatches[option as keyof typeof swatches] }} /> : <span>{groupLabels[option]}</span>}
    <span className="sr-only">{groupLabels[option]}</span>
  </label>)}</div></fieldset>;
}

export function AvatarEditor({ initial, studentName }: { initial: AvatarOptions & { revision: number }; studentName: string }) {
  const [avatar, setAvatar] = useState<AvatarOptions>(initial);
  const [state, formAction, pending] = useActionState(updateAvatarAction, initialState);
  const revision = state.revision ?? initial.revision;
  return <div className="grid gap-6 lg:grid-cols-[minmax(250px,.75fr)_minmax(0,1.25fr)]">
    <div className="avatar-preview-panel"><div className="mx-auto aspect-square w-full max-w-[260px]"><StudentAvatar avatar={avatar} label={`Prévia do avatar de ${studentName}`} /></div><p className="mt-2 text-center text-sm font-extrabold text-muted">Sua prévia muda antes de salvar.</p></div>
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="revision" value={revision} />
      <ChoiceGroup legend="Tom de pele" name="skinTone" values={SKIN_TONES} value={avatar.skinTone} onChange={(skinTone) => setAvatar((current) => ({ ...current, skinTone }))} color />
      <ChoiceGroup legend="Cor da roupa" name="outfitColor" values={OUTFIT_COLORS} value={avatar.outfitColor} onChange={(outfitColor) => setAvatar((current) => ({ ...current, outfitColor }))} color />
      <ChoiceGroup legend="Cabelo" name="hairStyle" values={HAIR_STYLES} value={avatar.hairStyle} onChange={(hairStyle) => setAvatar((current) => ({ ...current, hairStyle }))} />
      <ChoiceGroup legend="Cor do cabelo" name="hairColor" values={HAIR_COLORS} value={avatar.hairColor} onChange={(hairColor) => setAvatar((current) => ({ ...current, hairColor }))} color />
      <button type="submit" disabled={pending} className="student-primary w-full px-5">{pending ? "Salvando..." : "Salvar meu avatar"}</button>
      <p aria-live="polite" role="status" className={`min-h-6 text-sm font-extrabold ${state.status === "error" ? "text-danger" : "text-success"}`}>{state.message}</p>
    </form>
  </div>;
}
