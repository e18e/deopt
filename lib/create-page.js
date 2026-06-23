import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const mainCss = fs.readFileSync(
  fileURLToPath(new URL('../app/build/deoptigate.css', import.meta.url)), 'utf8'
)
const mainJs = fs.readFileSync(
  fileURLToPath(new URL('../app/build/deoptigate.js', import.meta.url)), 'utf8'
)

export function createPage() {
return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <title>deoptigate</title>
    <style async type="text/css" media="screen">
      ${mainCss}
    </style>
    <script async type="text/javascript" charset="utf-8">
      ${mainJs}
    </script>
  </head>
  <body>
    <script async src="deoptigate.render-data.js"></script>
  </body>
</html>
`
}
