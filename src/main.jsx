import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Route, Routes } from 'react-router'
import ChatHome from './pages/ChatHome'
import Chat from './pages/Chat'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="" element={<ChatHome />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    
    </BrowserRouter>
  </StrictMode>,
)
