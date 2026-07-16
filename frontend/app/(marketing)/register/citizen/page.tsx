import type { Metadata } from "next"

import { RegisterForm } from "@/features/auth/components/register-form"

export const metadata: Metadata = {
  title: "Citizen Registration— Rastro",
}

export default function CitizenRegisterPage() {
  return <RegisterForm role="Citizen" />
}
