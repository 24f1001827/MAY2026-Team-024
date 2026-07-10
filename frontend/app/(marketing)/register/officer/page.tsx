import type { Metadata } from "next"

import { RegisterForm } from "@/features/auth/components/register-form"

export const metadata: Metadata = {
  title: "Register as Officer — Rastro",
}

export default function OfficerRegisterPage() {
  return <RegisterForm role="Officer" />
}
