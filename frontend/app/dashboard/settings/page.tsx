import { SettingsForm } from "@/features/settings/components/settings-form"
import { requireUser } from "@/lib/auth/current-user"

export default async function SettingsPage() {
  const user = await requireUser()

  return (
    <SettingsForm
      user={{
        name: user.name,
        email: user.email,
        // The session snapshot doesn't carry phone; populate once a profile
        // endpoint is integrated.
        phone: "",
        role: user.role,
      }}
    />
  )
}
