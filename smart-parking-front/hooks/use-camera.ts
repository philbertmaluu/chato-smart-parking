import { useState, useRef, useCallback } from 'react'

export function useCamera() {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const isMediaDevicesSupported = useCallback(() => {
    return typeof window !== 'undefined' && 
           navigator && 
           navigator.mediaDevices && 
           navigator.mediaDevices.getUserMedia
  }, [])

  const startCamera = useCallback(async () => {
    if (!isMediaDevicesSupported()) {
      setError('Camera not supported in this browser')
      return false
    }

    setIsScanning(true)
    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      
      return true
    } catch (err) {
      console.error("Camera access denied:", err)
      setError('Camera access denied. Please allow camera permissions.')
      setIsScanning(false)
      return false
    }
  }, [isMediaDevicesSupported])

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
    setError(null)
  }, [])

  return {
    isScanning,
    error,
    videoRef,
    startCamera,
    stopCamera,
    isMediaDevicesSupported: isMediaDevicesSupported()
  }
} 