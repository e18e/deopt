import open from 'tiny-open'

import { logToJSON } from './log.js'
import { saveData } from './save-parts.js'
import { startServer } from './server.js'

export async function openLog(v8log, head) {
    const json = await logToJSON(v8log, { root: process.cwd() })
    const dataFile = saveData(json)

    // Data-only mode writes the render data and exits without starting the
    // server, so the data can be generated non-interactively (e.g. in tests).
    if (process.env.DEOPTIGATE_NO_SERVE) {
      console.error(`${head}: Wrote render data to ${dataFile}`)
      return
    }

    const { url } = await startServer({ dataFile })

      console.error(`
${head}: Successfully generated deoptimization visualization  🎉 ⚡ ✨
${head}: Serving at ${url}
${head}: Opening now in your default browser (Ctrl-C to stop the server).
    `)
    open(url, { wait: false })
}
