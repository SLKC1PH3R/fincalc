'use client'
import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'
interface ThemeContextValue { theme: Theme; toggleTheme: () => void; setTheme: (t: Theme) => void }

const ThemeContext = createContext<ThemeContextValue>({ theme: 'light', toggleTheme: () => {}, setTheme: () => {} })

function applyTheme(t: Theme) {
  document.documentElement.classList.remove('dark', 'light')
  document.documentElement.classList.add(t)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')

  useEffect(() => {
    // Apply local cache immediately to avoid flash
    const local = localStorage.getItem('Patrimo-theme') as Theme | null
    const initial = local || 'light'
    setThemeState(initial)
    applyTheme(initial)

    // Then fetch server preference and reconcile (in case user changed on another device)
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const serverTheme = data?.preferredTheme as Theme | undefined
        if (serverTheme === 'dark' || serverTheme === 'light') {
          setThemeState(serverTheme)
          applyTheme(serverTheme)
          localStorage.setItem('Patrimo-theme', serverTheme)
        }
      })
      .catch(() => {})
  }, [])

  const persistTheme = (next: Theme) => {
    setThemeState(next)
    applyTheme(next)
    localStorage.setItem('Patrimo-theme', next)
    // Persist to DB — fire and forget
    fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferredTheme: next }),
    }).catch(() => {})
  }

  const toggleTheme = () => persistTheme(theme === 'dark' ? 'light' : 'dark')

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: persistTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
