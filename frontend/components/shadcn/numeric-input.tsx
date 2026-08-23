"use client"

import * as React from "react"

import { Input } from "@/components/shadcn/input"

export interface NumericInputProps
  extends Omit<React.ComponentProps<"input">, "type" | "inputMode"> {
  /** Allow a single decimal point (e.g. coordinates). Integers only by default. */
  decimal?: boolean
  /** Allow a leading minus sign. Off by default. */
  allowNegative?: boolean
  /** Hard cap on digits typed, excluding the sign and decimal point. */
  maxDigits?: number
}

/** Strip everything that isn't part of the permitted number shape. */
function sanitize(
  raw: string,
  { decimal, allowNegative, maxDigits }: Required<Pick<NumericInputProps, "decimal" | "allowNegative">> &
    Pick<NumericInputProps, "maxDigits">
): string {
  const negative = allowNegative && raw.trimStart().startsWith("-")

  let digits = ""
  let seenDot = false
  for (const char of raw) {
    if (char >= "0" && char <= "9") {
      digits += char
      continue
    }
    if (decimal && char === "." && !seenDot) {
      seenDot = true
      digits += char
    }
  }

  if (maxDigits !== undefined) {
    // Count only digits against the cap so the decimal point never eats a slot.
    let kept = ""
    let count = 0
    for (const char of digits) {
      if (char === ".") {
        kept += char
        continue
      }
      if (count === maxDigits) break
      kept += char
      count += 1
    }
    digits = kept
  }

  return negative ? `-${digits}` : digits
}

/**
 * Digits-only text field. `<input type="number">` still accepts `e`, `+`, `-`
 * and stray separators (and silently reports an empty value for them), so
 * numeric fields — phone, PIN, amounts, counts — use this instead: a text input
 * with a numeric keypad on mobile that rejects any character it shouldn't hold.
 *
 * Works for both controlled and uncontrolled fields: the DOM value is rewritten
 * before `onChange` fires, so `FormData` and `event.target.value` both see the
 * sanitized text.
 */
function NumericInput({
  decimal = false,
  allowNegative = false,
  maxDigits,
  autoComplete = "off",
  onChange,
  ...props
}: NumericInputProps) {
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const el = event.currentTarget
    const next = sanitize(el.value, { decimal, allowNegative, maxDigits })

    if (next !== el.value) {
      // Keep the caret where the user left it, minus whatever we dropped.
      const caret = el.selectionStart ?? next.length
      const removed = el.value.length - next.length
      el.value = next
      const position = Math.max(0, caret - removed)
      el.setSelectionRange(position, position)
    }

    onChange?.(event)
  }

  return (
    <Input
      type="text"
      inputMode={decimal ? "decimal" : "numeric"}
      autoComplete={autoComplete}
      onChange={handleChange}
      {...props}
    />
  )
}

export { NumericInput }
