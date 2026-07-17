import { SettingsForm } from "@/features/settings/components/settings-form"
import { mockAppSettings } from "@/components/shared/mock-data"
import { requireUser } from "@/lib/auth/current-user"

export default async function SettingsPage() {
  const user = await requireUser()

  return (
    <SettingsForm
      user={{
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      }}
      manualAllotment={mockAppSettings.manualAllotment}
    />
  )
}
