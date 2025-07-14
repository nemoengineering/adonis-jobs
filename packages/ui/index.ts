import { join } from 'node:path'
import { readFile } from 'node:fs/promises'

export async function renderJobsUi(options: { baseUrl: string }) {
  const htmlLocation = join(import.meta.dirname, 'index.html')
  let html = await readFile(htmlLocation, 'utf8')
  html = html.replace('$__jobsDashboardOptsPlaceholder__', JSON.stringify(options))

  return html
}
