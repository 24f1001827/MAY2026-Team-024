import type { Metadata } from "next"

import { RegisterForm } from "@/features/auth/components/register-form"

export const metadata: Metadata = {
  title: "Officer Registration— Rastro",
}

export default function OfficerRegisterPage() {
  return <RegisterForm role="Officer" />
}
