import * as React from "react"

import { Button as BaseButton, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type BaseButtonProps = React.ComponentProps<typeof BaseButton>

/**
 * Project Button wrapper.
 *
 * Wraps the shadcn Button and adds Rastro-specific variants. Import this
 * (`@/components/shadcn/button`) in app code instead of the raw shadcn Button.
 */
type ButtonVariant = NonNullable<BaseButtonProps["variant"]> | "brand"

const brandClass =
  "bg-brand text-brand-foreground hover:bg-brand/90 focus-visible:ring-brand/30"

function Button({
  variant = "default",
  className,
  ...props
}: Omit<BaseButtonProps, "variant"> & { variant?: ButtonVariant }) {
  if (variant === "brand") {
    return (
      <BaseButton
        variant="default"
        className={cn(brandClass, className)}
        {...props}
      />
    )
  }

  return <BaseButton variant={variant} className={className} {...props} />
}

export { Button, buttonVariants }
export type { ButtonVariant }
