import type { Metadata } from "next"

import { RegisterForm } from "@/features/auth/components/register-form"

export const metadata: Metadata = {
  title: "Register as Citizen — Rastro",
}

export default function CitizenRegisterPage() {
  return <RegisterForm role="Citizen" />
}
