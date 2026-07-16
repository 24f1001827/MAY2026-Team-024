import type { Metadata } from "next"

import { RegisterForm } from "@/features/auth/components/register-form"

export const metadata: Metadata = {
  title: "Agency Registration— Rastro",
}

export default function AgencyRegisterPage() {
  return <RegisterForm role="Agency" />
}
