export function createQueueDashHtml(baseUrl: string) {
  return `<!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>QueueDash App</title>
      </head>
      <body>
        <div id="root"></div>
        <script>
          window.__INITIAL_STATE__ = {
            apiUrl: '${baseUrl}/trpc',
            basename: '${baseUrl}',
          }
        </script>
        <link rel="stylesheet" href="${baseUrl}/styles.css" />
        <script type="module" src="${baseUrl}/main.mjs"></script>
      </body>
    </html>`
}
