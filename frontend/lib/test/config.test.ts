import { describe, expect, it } from "bun:test"

import { apiUrl } from "../api/config"

// These assume the default API_BASE_URL ("http://localhost:5000") and
// API_PREFIX ("/api/v1"). They pin the slash-normalization contract.
describe("apiUrl", () => {
  it("joins a normal leading-slash path", () => {
    expect(apiUrl("/auth/login")).toBe("http://localhost:5000/api/v1/auth/login")
  })

  it("adds the separator when the path has no leading slash", () => {
    expect(apiUrl("auth/login")).toBe("http://localhost:5000/api/v1/auth/login")
  })

  it("collapses duplicate leading slashes on the path", () => {
    expect(apiUrl("//admin/departments")).toBe(
      "http://localhost:5000/api/v1/admin/departments",
    )
  })

  it("preserves the protocol's double slash", () => {
    expect(apiUrl("/x")).toStartWith("http://")
  })

  it("handles an empty path (prefix only, no trailing slash)", () => {
    expect(apiUrl("")).toBe("http://localhost:5000/api/v1")
  })
})
