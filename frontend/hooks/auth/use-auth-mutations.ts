"use client"

import { useMutation } from "@tanstack/react-query"

import { authService } from "@/services/auth-service"
import type { LoginCredentials, RegisterInput } from "@/types/auth"

/**
 * Auth mutation hooks. They own the request lifecycle (pending/error) only;
 * navigation and toasts stay in the calling component via `mutate(vars, {
 * onSuccess, onError })`, since those depend on router/UI context.
 */

/** Sign in with email + password. `mutateAsync` resolves to the session user. */
export function useLogin() {
  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
  })
}

/** Register a new citizen/officer/agency account. */
export function useRegister() {
  return useMutation({
    mutationFn: (input: RegisterInput) => authService.register(input),
  })
}

/** Clear the current session. */
export function useLogout() {
  return useMutation({
    mutationFn: () => authService.logout(),
  })
}
