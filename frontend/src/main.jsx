import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#111827',
            color: '#e2e8f0',
            border: '1px solid #1e2d45',
            fontFamily: "'Manrope', sans-serif",
            fontSize: '13px',
            borderRadius: '10px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#111827' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#111827' } },
        }}
      />
    </BrowserRouter>
  </StrictMode>
)