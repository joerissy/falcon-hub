import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Use createRoot with concurrent features for better performance
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);