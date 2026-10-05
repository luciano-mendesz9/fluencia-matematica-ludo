import { createHash } from "node:crypto";

export function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function throttleKey(kind: "identifier" | "ip" | "reset-identifier" | "reset-ip", value: string) {
  return sha256(`${kind}:${value}`);
}
