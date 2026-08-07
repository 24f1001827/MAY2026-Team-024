/**
 * HTTP API client
 *
 * A lightweight `fetch` wrapper (ported from echno-web) with:
 * - request timeout via AbortController
 * - automatic retry for transient network errors (exponential backoff)
 * - centralized non-2xx handling as a typed `ApiError`
 * - typed JSON parsing
 *
 * In THIS app the client talks to our own same-origin route handlers under
 * `/api/*` (not the Flask backend directly): those handlers forward to Flask
 * server-side and manage the httpOnly session cookies. Because calls are
 * same-origin, the session cookies are sent automatically — the browser never
 * holds the JWT, so there's no Authorization header to set here.
 */

/** Standard success envelope some endpoints use (`{ success, message, data }`). */
export interface ApiResponse<T = unknown> {
  data: T
  message?: string
  success: boolean
}

/** Standardized error payload the backend returns on failure. */
export interface ApiErrorData {
  message: string
  status: number
  details?: string
  errors?: Record<string, string[]>
}

/** Error thrown for non-2xx responses and network/timeout failures. */
export class ApiError extends Error {
  status: number
  details?: string
  isAuthError: boolean
  isNotFound: boolean
  isServerError: boolean
  isTimeout: boolean
  errors?: Record<string, string[]>

  constructor(
    message: string,
    status: number,
    details?: string,
    errors?: Record<string, string[]>,
  ) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.details = details
    this.errors = errors
    this.isAuthError = status === 401 || status === 403
    this.isNotFound = status === 404
    this.isServerError = status >= 500
    this.isTimeout = false
  }

  static timeout(message = "Request timeout"): ApiError {
    const error = new ApiError(message, 504)
    error.isTimeout = true
    return error
  }

  static network(message = "Network error"): ApiError {
    return new ApiError(message, 0)
  }
}

/** Optional per-request settings. */
interface RequestOptions {
  timeout?: number
  retries?: number
}

const DEFAULT_TIMEOUT_MS = 30_000 // 30 seconds
const UPLOAD_TIMEOUT_MS = 120_000 // 2 minutes for file uploads
const DEFAULT_RETRIES = 2
const RETRY_DELAY_MS = 1000

// Error names that indicate a transient network failure worth retrying.
const RETRYABLE_ERRORS = new Set(["TypeError", "AbortError"])

class ApiClient {
  private baseURL: string
  private headers: HeadersInit = {
    "Content-Type": "application/json",
  }

  /**
   * @param baseURL - Prefix for all endpoints. Defaults to `/api` (this app's
   *   route handlers). May be an absolute URL if ever pointed elsewhere.
   */
  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || "/api") {
    this.baseURL = baseURL
  }

  /**
   * Set/update a default header sent with every JSON request. Mutates shared
   * state on the `apiClient` singleton, so it affects all subsequent calls.
   *
   * Does NOT reach the multipart methods (`postMultipart`/`postFormData`/
   * `putFormData`) — they deliberately omit `headers` so fetch can set the
   * multipart boundary. Never set "Content-Type" here expecting uploads to
   * pick it up, and never make those methods spread `this.headers`.
   */
  setDefaultHeader(key: string, value: string): void {
    ;(this.headers as Record<string, string>)[key] = value
  }

  /** Build an absolute URL, tolerating both relative (`/api`) and absolute baseURLs, on client or server. */
  private buildUrl(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
  ): string {
    const origin =
      typeof window === "undefined" ? "http://localhost" : window.location.origin
    const url = new URL(`${this.baseURL}${endpoint}`, origin)

    if (params) {
      for (const key of Object.keys(params)) {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key].toString())
        }
      }
    }
    return url.toString()
  }

  /** Throw on non-ok responses; otherwise parse JSON as `T`. */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData: ApiErrorData = await response.json().catch(() => ({
        message: this.getDefaultErrorMessage(response.status),
        status: response.status,
      }))

      throw new ApiError(
        errorData.message || this.getDefaultErrorMessage(response.status),
        response.status,
        errorData.details,
        errorData.errors,
      )
    }

    // 204 No Content and empty bodies parse to null.
    return response.json().catch(() => null as T)
  }

  /** User-friendly fallback message when the backend doesn't supply one. */
  private getDefaultErrorMessage(status: number): string {
    switch (status) {
      case 400:
        return "Invalid request. Please check your input."
      case 401:
        return "Please sign in to continue."
      case 403:
        return "You do not have permission to perform this action."
      case 404:
        return "The requested resource was not found."
      case 408:
        return "Request timeout. Please try again."
      case 409:
        return "This action conflicts with existing data."
      case 422:
        return "Invalid data provided."
      case 429:
        return "Too many requests. Please wait and try again."
      case 500:
        return "Server error. Please try again later."
      case 502:
        return "Service temporarily unavailable."
      case 503:
        return "Service is currently unavailable."
      case 504:
        return "Request timeout. Please try again."
      default:
        return `An error occurred (${status})`
    }
  }

  /** `fetch` with an AbortController-enforced timeout. */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number,
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      return await fetch(url, { ...options, signal: controller.signal })
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /** Retry only transient network errors (never non-2xx responses or timeouts). */
  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    { timeout = DEFAULT_TIMEOUT_MS, retries = DEFAULT_RETRIES }: RequestOptions = {},
  ): Promise<Response> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.fetchWithTimeout(url, options, timeout)
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          throw ApiError.timeout()
        }

        lastError = error instanceof Error ? error : new Error(String(error))

        const isRetryable =
          RETRYABLE_ERRORS.has(lastError.name) ||
          lastError.message.includes("network") ||
          lastError.message.includes("fetch")

        if (!isRetryable || attempt === retries) {
          throw lastError instanceof ApiError
            ? lastError
            : ApiError.network(lastError.message)
        }

        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY_MS * Math.pow(2, attempt)),
        )
      }
    }

    // Unreachable on the normal path (the final attempt always returns or throws
    // an ApiError in the catch above). Reached only if the loop never ran — e.g.
    // retries < 0 — leaving lastError null. Normalize to ApiError so every exit
    // from this method is an ApiError, the invariant every call site relies on
    // (`error instanceof ApiError`); never let a raw Error or null escape.
    throw lastError instanceof ApiError
      ? lastError
      : ApiError.network(lastError?.message ?? "Request failed")
  }

  async get<T = unknown>(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
    options?: RequestOptions,
  ): Promise<T> {
    const response = await this.fetchWithRetry(
      this.buildUrl(endpoint, params),
      { method: "GET", headers: this.headers },
      options,
    )
    return this.handleResponse<T>(response)
  }

  async post<T = unknown>(
    endpoint: string,
    data?: unknown,
    params?: Record<string, string | number | boolean>,
    options?: RequestOptions,
  ): Promise<T> {
    const response = await this.fetchWithRetry(
      this.buildUrl(endpoint, params),
      {
        method: "POST",
        headers: this.headers,
        body: data ? JSON.stringify(data) : undefined,
      },
      options,
    )
    return this.handleResponse<T>(response)
  }

  async put<T = unknown>(
    endpoint: string,
    data?: unknown,
    params?: Record<string, string | number | boolean>,
    options?: RequestOptions,
  ): Promise<T> {
    const response = await this.fetchWithRetry(
      this.buildUrl(endpoint, params),
      {
        method: "PUT",
        headers: this.headers,
        body: data ? JSON.stringify(data) : undefined,
      },
      options,
    )
    return this.handleResponse<T>(response)
  }

  async patch<T = unknown>(
    endpoint: string,
    data?: unknown,
    params?: Record<string, string | number | boolean>,
    options?: RequestOptions,
  ): Promise<T> {
    const response = await this.fetchWithRetry(
      this.buildUrl(endpoint, params),
      {
        method: "PATCH",
        headers: this.headers,
        body: data ? JSON.stringify(data) : undefined,
      },
      options,
    )
    return this.handleResponse<T>(response)
  }

  async delete<T = unknown>(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
    options?: RequestOptions,
  ): Promise<T> {
    const response = await this.fetchWithRetry(
      this.buildUrl(endpoint, params),
      { method: "DELETE", headers: this.headers },
      options,
    )
    return this.handleResponse<T>(response)
  }

  /**
   * POST multipart/form-data with a JSON `data` field plus files. Used for
   * uploads (e.g. complaint images). The browser sets the multipart boundary,
   * so no Content-Type header here.
   */
  async postMultipart<T = unknown>(
    endpoint: string,
    data: unknown,
    files?: Record<string, File[]>,
    options?: RequestOptions,
  ): Promise<T> {
    const formData = new FormData()
    formData.append("data", JSON.stringify(data))

    if (files) {
      for (const [fieldName, fileList] of Object.entries(files)) {
        for (const file of fileList) {
          formData.append(fieldName, file)
        }
      }
    }

    const response = await this.fetchWithRetry(
      this.buildUrl(endpoint),
      { method: "POST", body: formData },
      { timeout: UPLOAD_TIMEOUT_MS, retries: 0, ...options },
    )
    return this.handleResponse<T>(response)
  }

  /** POST raw FormData (simple uploads without an extra JSON field). */
  async postFormData<T = unknown>(
    endpoint: string,
    formData: FormData,
    options?: RequestOptions,
  ): Promise<T> {
    const response = await this.fetchWithRetry(
      this.buildUrl(endpoint),
      { method: "POST", body: formData },
      { timeout: UPLOAD_TIMEOUT_MS, retries: 0, ...options },
    )
    return this.handleResponse<T>(response)
  }

  /** PUT raw FormData (multipart updates, e.g. replacing complaint images). */
  async putFormData<T = unknown>(
    endpoint: string,
    formData: FormData,
    options?: RequestOptions,
  ): Promise<T> {
    const response = await this.fetchWithRetry(
      this.buildUrl(endpoint),
      { method: "PUT", body: formData },
      { timeout: UPLOAD_TIMEOUT_MS, retries: 0, ...options },
    )
    return this.handleResponse<T>(response)
  }
}

export const apiClient = new ApiClient()

/** Bound convenience methods for the common HTTP verbs. */
export const api = {
  get: apiClient.get.bind(apiClient),
  post: apiClient.post.bind(apiClient),
  put: apiClient.put.bind(apiClient),
  patch: apiClient.patch.bind(apiClient),
  delete: apiClient.delete.bind(apiClient),
  postMultipart: apiClient.postMultipart.bind(apiClient),
  postFormData: apiClient.postFormData.bind(apiClient),
  putFormData: apiClient.putFormData.bind(apiClient),
}
