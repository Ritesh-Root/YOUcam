import { createContext, useContext } from 'react'

export type Tab = 'home' | 'routine' | 'progress' | 'profile'

type AppActions = {
  navigate: (tab: Tab) => void
  notify: (message: string) => void
}

export const AppContext = createContext<AppActions>({
  navigate: () => {},
  notify: () => {},
})

export const useApp = () => useContext(AppContext)
