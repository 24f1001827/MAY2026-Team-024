import type { Metadata } from "next"

import { RegisterRolePicker } from "@/features/auth/components/register-role-picker"

export const metadata: Metadata = {
  title: "Register — Rastro",
}

export default function RegisterPage() {
  return <RegisterRolePicker />
}
