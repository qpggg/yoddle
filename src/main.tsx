import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import GlobalStyles from './styles/GlobalStyles'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GlobalStyles />
    <App />
  </React.StrictMode>,
) 