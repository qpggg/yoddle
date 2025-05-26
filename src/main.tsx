import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import GlobalStyles from './styles/GlobalStyles'
import './styles/index.css'
import { UserProvider } from './hooks/useUser'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UserProvider>
      <GlobalStyles />
      <App />
    </UserProvider>
  </React.StrictMode>,
) 