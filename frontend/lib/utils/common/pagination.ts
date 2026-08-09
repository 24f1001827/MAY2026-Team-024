/**
 * lib/utils/common/pagination.ts
 *
 * Small shared pagination helpers.
 */

/**
 * Bind a page setter to build a `resetPage` wrapper. Wrapping a filter's
 * setter sends the list back to page one whenever that filter changes, so
 * narrowing the results can never strand the user on a now-empty page.
 *
 *   const resetPage = createResetPage(setPage)
 *   <Input onChange={(e) => resetPage(setSearch)(e.target.value)} />
 */
export function createResetPage(setPage: (page: number) => void) {
  return <T>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value)
      setPage(1)
    }
}
