import React from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css' // 1. Import Bootstrap CSS here
import './index.css' // 2. Optional: Keep this if you have custom global styles
import App from './App.jsx' // 3. Import your main App component

// 4. Mount the App to the DOM
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)