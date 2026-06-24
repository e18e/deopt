import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { H3, serve, html, getQuery } from 'h3'
import { createHighlighterCore } from 'shiki/core'
import { createOnigurumaEngine } from 'shiki/engine/oniguruma'
import js from 'shiki/langs/javascript.mjs'
import jsx from 'shiki/langs/jsx.mjs'
import ts from 'shiki/langs/typescript.mjs'
import tsx from 'shiki/langs/tsx.mjs'
import dracula from 'shiki/themes/dracula.mjs'

import { buildRenderData, serializeRenderData } from './enrich-render-data.js'

const THEME = 'dracula'
const LANG_BY_EXT = {
    js  : 'javascript'
  , mjs : 'javascript'
  , cjs : 'javascript'
  , jsx : 'jsx'
  , ts  : 'typescript'
  , mts : 'typescript'
  , cts : 'typescript'
  , tsx : 'tsx'
}

const appRoot = new URL('./', import.meta.resolve('@e18e/deopt-app/package.json'))
const indexHtml = new URL('static/index.html', appRoot)
const buildDir = new URL('build/', appRoot)

function langFromFileName(fileName) {
  const ext = fileName.slice(fileName.lastIndexOf('.') + 1).toLowerCase()
  return LANG_BY_EXT[ext] || 'javascript'
}

function jsonResponse(value) {
  return new Response(JSON.stringify(value), {
    headers: { 'content-type': 'application/json; charset=utf-8' }
  })
}

async function asset(url, contentType) {
  const body = await fs.readFile(fileURLToPath(url))
  return new Response(body, { headers: { 'content-type': contentType } })
}

export async function startServer({ dataFile }) {
  const parsed = JSON.parse(await fs.readFile(dataFile, 'utf8'))
  const groups = buildRenderData(new Map(parsed))
  const renderData = JSON.stringify(serializeRenderData(groups))

  const highlighter = await createHighlighterCore({
      themes: [ dracula ]
    , langs: [ js, jsx, ts, tsx ]
    , engine: createOnigurumaEngine(import('shiki/wasm'))
  })

  const tokenCache = new Map()
  function tokensForFile(file) {
    if (tokenCache.has(file)) return tokenCache.get(file)
    const group = groups.get(file)
    if (group == null) return null
    const lang = langFromFileName(file)
    const tokens = highlighter.codeToTokens(group.src, { lang, theme: THEME }).tokens
    tokenCache.set(file, tokens)
    return tokens
  }

  const app = new H3()

  app.get('/', async () => html(await fs.readFile(fileURLToPath(indexHtml), 'utf8')))
  app.get('/deopt.js', () =>
    asset(new URL('deopt.js', buildDir), 'text/javascript; charset=utf-8'))
  app.get('/deopt.css', () =>
    asset(new URL('deopt.css', buildDir), 'text/css; charset=utf-8'))
  app.get('/api/data', () =>
    new Response(renderData, { headers: { 'content-type': 'application/json; charset=utf-8' } }))
  app.get('/api/tokens', (event) => {
    const { file } = getQuery(event)
    const tokens = file == null ? null : tokensForFile(file)
    if (tokens == null) return new Response('Unknown file', { status: 404 })
    return jsonResponse(tokens)
  })

  const server = serve(app, { port: 0, silent: true, hostname: '127.0.0.1' })
  await server.ready()
  const { port } = server.node.server.address()

  return {
      url: `http://localhost:${port}`
    , close: () => server.close()
  }
}
