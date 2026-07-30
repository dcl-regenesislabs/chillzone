/**
 * Fuente de datos para el board de tipo BLOG.
 *
 * En Genesis Plaza esto venía de `src/modules/dclNews/dclNews.ts`, que a su vez leía
 * de una Google Sheet. Ese módulo NO se incluye acá (arrastraba media escena).
 *
 * Si vas a usar EVENT_BOARD_TYPE.BLOG, llamá a `setBlogEntries([...])` antes de
 * `initEventBoard(...)` con tus propias entradas. Si no lo usás, ignorá este archivo:
 * los boards LIVE / UPCOMING / CALENDAR no lo tocan.
 */

export type BlogEntry = {
    title: string
    description: string
    imageUrl: string
    date: string
    url: string
}

export let blogEntries: BlogEntry[] = []

export function setBlogEntries(entries: BlogEntry[]) {
    blogEntries = entries
}
