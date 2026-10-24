import { createRequire } from 'node:module'
import { mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const runtime = join(process.env.HOME, '.local/share/omgithub-playwright')
const require = createRequire(join(runtime, 'package.json'))
const { chromium } = require('playwright')
const config = JSON.parse(readFileSync(join(runtime, process.platform === 'darwin' ? 'metal.json' : 'linux.json'), 'utf8'))
if (process.platform === 'linux') process.env.DISPLAY ||= ':' + readFileSync(join(runtime, 'display'), 'utf8').trim()

const url = process.env.CAPTURE_URL
const output = process.env.CAPTURE_DIR
if (!url || !output) throw new Error('Set CAPTURE_URL and CAPTURE_DIR.')
mkdirSync(output, { recursive: true })

const browser = await chromium.launch({ ...config.browser.launchOptions, timeout: 30000 })
try {
  for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height } })
    page.setDefaultTimeout(30000)
    page.on('pageerror', error => console.error(error.message))
    const response = await page.goto(url, { waitUntil: 'load', timeout: 45000 })
    if (!response?.ok()) throw new Error(`HTTP ${response?.status()} loading preview`)
    await page.locator('.btn-play').waitFor({ state: 'visible' })
    await page.locator('.btn-play').click({ timeout: 15000, noWaitAfter: true })
    await page.locator('#battle-ui').waitFor({ state: 'visible', timeout: 20000 })
    await page.waitForTimeout(1500)
    await page.evaluate(() => document.getElementById('announce')?.classList.remove('show'))
    await page.waitForTimeout(500)
    await page.screenshot({ path: join(output, `final-${name}.png`), timeout: 30000 })
    await page.close()
  }
} finally {
  await browser.close()
}
