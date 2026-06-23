import open from 'tiny-open'
import { logToJSON } from '../deoptigate.log.js'

import { createPage } from '../lib/create-page.js'
import { savePage, saveEntry } from '../lib/save-parts.js'

export async function openLog(v8log, head) {
    const json = await logToJSON(v8log, { root: process.cwd() })
    const html = createPage()
    const indexHtmlFile = savePage(html)
    saveEntry(json)

      console.error(`
${head}: Successfully generated deoptimization visualization  🎉 ⚡ ✨
  Saved to:
    ${indexHtmlFile}
${head}: Opening now in your default browser.
    `)
    open(indexHtmlFile, { wait: false })
}
