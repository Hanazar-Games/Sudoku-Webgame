import { test, expect, type Page } from '@playwright/test'

async function getFirstEmptyCell(page: Page) {
  const emptyCell = page.locator('[data-empty="true"]').first()
  const testId = await emptyCell.getAttribute('data-testid')
  return { emptyCell, testId }
}

test.describe('Sudoku Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('sudoku-onboarding-v1', 'true')
    })
    await page.goto('/')
  })

  test('renders 81 board cells', async ({ page }) => {
    const cells = page.locator('[role="grid"] [role="button"]')
    await expect(cells).toHaveCount(81)
  })

  test('renders title and controls', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Sudoku' })).toBeVisible()
    await expect(page.getByRole('button', { name: '新游戏' })).toBeVisible()
    await expect(page.getByRole('button', { name: '笔记' })).toBeVisible()
    await expect(page.getByRole('button', { name: '提示' })).toBeVisible()
  })

  test('selects a cell on click', async ({ page }) => {
    const cell = page.locator('[role="grid"] [role="button"]').first()
    await cell.click()
    await expect(cell).toHaveAttribute('aria-pressed', 'true')
  })

  test('fills a cell with virtual keypad', async ({ page }) => {
    const { emptyCell, testId } = await getFirstEmptyCell(page)
    await emptyCell.click()

    await page.getByRole('button', { name: '输入 5' }).click()
    const filledCell = page.locator(`[data-testid="${testId}"]`)
    await expect(filledCell).toHaveText('5')
  })

  test('clears a cell with virtual keypad', async ({ page }) => {
    const { emptyCell, testId } = await getFirstEmptyCell(page)
    await emptyCell.click()

    await page.getByRole('button', { name: '输入 3' }).click()
    const filledCell = page.locator(`[data-testid="${testId}"]`)
    await expect(filledCell).toHaveText('3')

    await page.getByRole('button', { name: '清除' }).click()
    await expect(filledCell).toHaveText('')
  })

  test('keyboard number input fills selected cell', async ({ page }) => {
    const { emptyCell, testId } = await getFirstEmptyCell(page)
    await emptyCell.click()

    await page.keyboard.press('7')
    const filledCell = page.locator(`[data-testid="${testId}"]`)
    await expect(filledCell).toHaveText('7')
  })

  test('keyboard arrow moves selection', async ({ page }) => {
    const cells = page.locator('[role="grid"] [role="button"]')
    const first = cells.nth(0)
    const second = cells.nth(1)

    await first.click()
    await expect(first).toHaveAttribute('aria-pressed', 'true')

    await page.keyboard.press('ArrowRight')
    await expect(second).toHaveAttribute('aria-pressed', 'true')
  })

  test('ESC toggles pause overlay', async ({ page }) => {
    await page.locator('[role="grid"] [role="button"]').first().click()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: '游戏已暂停' })).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: '游戏已暂停' })).not.toBeVisible()
  })

  test('new game resets the board', async ({ page }) => {
    const { emptyCell, testId } = await getFirstEmptyCell(page)
    await emptyCell.click()
    await page.keyboard.press('5')
    const filledCell = page.locator(`[data-testid="${testId}"]`)
    await expect(filledCell).toHaveText('5')

    await page.getByRole('button', { name: '新游戏' }).click()
    // New puzzle may place a fixed number at this cell; verify the old user input is gone
    await expect(filledCell).not.toHaveText('5')
  })

  test('note mode toggle changes button state', async ({ page }) => {
    const noteButton = page.getByRole('button', { name: '笔记' })
    await expect(noteButton).toHaveAttribute('aria-pressed', 'false')

    await noteButton.click()
    await expect(noteButton).toHaveAttribute('aria-pressed', 'true')

    await noteButton.click()
    await expect(noteButton).toHaveAttribute('aria-pressed', 'false')
  })

  test('hint fills correct value', async ({ page }) => {
    const { emptyCell, testId } = await getFirstEmptyCell(page)
    await emptyCell.click()

    await page.getByRole('button', { name: '提示' }).click()
    const hintedCell = page.locator(`[data-testid="${testId}"]`)
    const value = await hintedCell.textContent()
    expect(value).toMatch(/^[1-9]$/)
  })

  test('undo and redo work', async ({ page }) => {
    const { emptyCell, testId } = await getFirstEmptyCell(page)
    await emptyCell.click()

    await page.keyboard.press('4')
    const filledCell = page.locator(`[data-testid="${testId}"]`)
    await expect(filledCell).toHaveText('4')

    await page.getByRole('button', { name: '撤销' }).click()
    await expect(filledCell).toHaveText('')

    await page.getByRole('button', { name: '重做' }).click()
    await expect(filledCell).toHaveText('4')
  })

  test('theme toggle changes data-theme attribute', async ({ page }) => {
    const html = page.locator('html')
    const initial = await html.getAttribute('data-theme')

    const themeButton = page.getByRole('button', { name: /深色模式|浅色模式/ })
    await themeButton.click()

    const after = await html.getAttribute('data-theme')
    expect(after).not.toBe(initial)
  })
})
