// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
import { io } from 'socket.io-client'

function App() {
  const socket = io('http://localhost:3000/', {
    withCredentials: true,
  })

  socket.on('connect', () => {
    console.log('Connected to server')
  })

  return <></>
}

export default App
