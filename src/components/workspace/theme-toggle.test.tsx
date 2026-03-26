// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { act } from 'react'

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: vi.fn(),
}))

import { useTheme } from 'next-themes'
import { ThemeToggle } from './theme-toggle'

const mockUseTheme = useTheme as ReturnType<typeof vi.fn>

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a button with aria-label containing "mode"', async () => {
    mockUseTheme.mockReturnValue({
      resolvedTheme: 'light',
      setTheme: vi.fn(),
    })

    await act(async () => {
      render(<ThemeToggle />)
    })

    const button = screen.getByRole('button', { name: /mode/i })
    expect(button).toBeDefined()
  })

  it('clicking the button calls setTheme', async () => {
    const setTheme = vi.fn()
    mockUseTheme.mockReturnValue({
      resolvedTheme: 'light',
      setTheme,
    })

    await act(async () => {
      render(<ThemeToggle />)
    })

    const button = screen.getByRole('button', { name: /mode/i })
    await act(async () => {
      fireEvent.click(button)
    })

    expect(setTheme).toHaveBeenCalledTimes(1)
  })

  it('when resolvedTheme is "dark", clicking calls setTheme("light")', async () => {
    const setTheme = vi.fn()
    mockUseTheme.mockReturnValue({
      resolvedTheme: 'dark',
      setTheme,
    })

    await act(async () => {
      render(<ThemeToggle />)
    })

    const button = screen.getByRole('button', { name: /mode/i })
    await act(async () => {
      fireEvent.click(button)
    })

    expect(setTheme).toHaveBeenCalledWith('light')
  })

  it('when resolvedTheme is "light", clicking calls setTheme("dark")', async () => {
    const setTheme = vi.fn()
    mockUseTheme.mockReturnValue({
      resolvedTheme: 'light',
      setTheme,
    })

    await act(async () => {
      render(<ThemeToggle />)
    })

    const button = screen.getByRole('button', { name: /mode/i })
    await act(async () => {
      fireEvent.click(button)
    })

    expect(setTheme).toHaveBeenCalledWith('dark')
  })
})
