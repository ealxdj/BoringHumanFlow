import React, { useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Camera, CameraOff, Video, VideoOff, AlertTriangle } from 'lucide-react'
import PersonDetectionOverlay from './person-detection-overlay'

interface WebcamDetectionProps {
  isEnabled: boolean
  onToggle: () => void
  className?: string
}

export const WebcamDetection: React.FC<WebcamDetectionProps> = ({
  isEnabled,
  onToggle,
  className = ''
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isWebcamActive, setIsWebcamActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAIEnabled, setIsAIEnabled] = useState(false)

  // Iniciar la webcam
  const startWebcam = async () => {
    try {
      setError(null)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
      }
      
      setStream(mediaStream)
      setIsWebcamActive(true)
    } catch (err) {
      console.error('Error accessing webcam:', err)
      setError('No se pudo acceder a la cámara. Verifique los permisos.')
    }
  }

  // Detener la webcam
  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setIsWebcamActive(false)
    setIsAIEnabled(false)
  }

  // Limpiar al desmontar el componente
  useEffect(() => {
    return () => {
      stopWebcam()
    }
  }, [])

  const handleWebcamToggle = () => {
    if (isWebcamActive) {
      stopWebcam()
    } else {
      startWebcam()
    }
  }

  const handleAIToggle = () => {
    if (!isWebcamActive) {
      setError('Primero debe activar la cámara')
      return
    }
    setIsAIEnabled(!isAIEnabled)
  }

  return (
    <div className={`relative overflow-hidden ai-detection-container ${className}`}>
      {/* Controles principales */}
      <div className="absolute top-4 left-4 z-20 flex items-center space-x-2">
        {/* Control de webcam */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleWebcamToggle}
          className={`text-white border border-white/20 ${
            isWebcamActive 
              ? 'bg-green-500/20 hover:bg-green-500/30' 
              : 'bg-gray-800/50 hover:bg-gray-700/50'
          }`}
        >
          {isWebcamActive ? (
            <>
              <VideoOff className="w-4 h-4 mr-2" />
              Stop Camera
            </>
          ) : (
            <>
              <Video className="w-4 h-4 mr-2" />
              Start Camera
            </>
          )}
        </Button>

        {/* Estado de la webcam */}
        {isWebcamActive && (
          <Badge variant="secondary" className="bg-green-500/20 text-green-400">
            <Camera className="w-3 h-3 mr-1" />
            Live
          </Badge>
        )}

        {error && (
          <Badge variant="destructive" className="bg-red-500/20 text-red-400">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        )}
      </div>

      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover rounded-lg"
        playsInline
        muted
        style={{ 
          transform: 'scaleX(-1)', // Efecto espejo
          display: isWebcamActive ? 'block' : 'none'
        }}
      />

      {/* Overlay de detección de personas */}
      {isWebcamActive && (
        <PersonDetectionOverlay
          isEnabled={isAIEnabled}
          onToggle={handleAIToggle}
          videoElement={videoRef.current}
          className="absolute inset-0"
        />
      )}

      {/* Mensaje cuando no hay webcam activa */}
      {!isWebcamActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg">
          <div className="text-center text-gray-400">
            <Camera className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">Camera Not Active</h3>
            <p className="text-gray-500 mb-4">Click "Start Camera" to begin person detection</p>
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default WebcamDetection
