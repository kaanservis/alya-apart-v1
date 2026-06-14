import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { bootstrapAppRoute } from './app/appSection'
import './index.css'
import App from './App.tsx'

bootstrapAppRoute()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
