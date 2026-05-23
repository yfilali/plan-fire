import React from 'react'
import ReactDOM from 'react-dom/client'
import { StateProvider } from './usePersistedState.jsx'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StateProvider>
      <App />
    </StateProvider>
  </React.StrictMode>,
)
