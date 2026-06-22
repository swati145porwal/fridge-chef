"use client"

import { useState, useEffect } from 'react'

const DEVICE_ID_KEY = 'fridge_chef_device_id'

// Generate a unique device ID using crypto API with fallback
function generateDeviceId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export function useDeviceId(): string | null {
  const [deviceId, setDeviceId] = useState<string | null>(null)

  useEffect(() => {
    // Check if we already have a device ID
    let id = localStorage.getItem(DEVICE_ID_KEY)
    
    if (!id) {
      // Generate new ID and store it
      id = generateDeviceId()
      localStorage.setItem(DEVICE_ID_KEY, id)
    }
    
    setDeviceId(id)
  }, [])

  return deviceId
}

// Non-hook version for use in callbacks
export function getDeviceId(): string {
  if (typeof window === 'undefined') return ''
  
  let id = localStorage.getItem(DEVICE_ID_KEY)
  
  if (!id) {
    id = generateDeviceId()
    localStorage.setItem(DEVICE_ID_KEY, id)
  }
  
  return id
}
