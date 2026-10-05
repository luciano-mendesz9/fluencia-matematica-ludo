"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/src/components/ui/button";
import { logoutAction } from "./actions";

function LogoutButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" variant="secondary" busy={pending} className="px-3 py-2 text-sm">Sair</Button>;
}

export function LogoutForm() {
  return <form action={logoutAction}><LogoutButton /></form>;
}
