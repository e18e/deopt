export function createPage() {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <title>deoptigate</title>
    <link rel="stylesheet" href="deoptigate.css">
  </head>
  <body>
    <script type="module">
      import { deoptigateRender } from './deoptigate.js'
      const res = await fetch('./deoptigate.render-data.json')
      deoptigateRender(await res.json())
    </script>
  </body>
</html>
`
}
