"use client"

import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  Building03Icon,
  ShieldUserIcon,
  UserIcon,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/shadcn/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu"
import { publicRoutes } from "@/nav"

const OPTIONS = [
  { label: "Citizen", href: publicRoutes.registerCitizen, icon: UserIcon },
  { label: "Officer", href: publicRoutes.registerOfficer, icon: ShieldUserIcon },
  { label: "Agency", href: publicRoutes.registerAgency, icon: Building03Icon },
]

export function RegisterMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="brand" size="lg" className="group/button">
          Register
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            className="transition-transform group-data-[state=open]/button:rotate-180"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Register as</DropdownMenuLabel>
        {OPTIONS.map((option) => (
          <DropdownMenuItem key={option.href} asChild>
            <Link href={option.href}>
              <HugeiconsIcon icon={option.icon} />
              {option.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
