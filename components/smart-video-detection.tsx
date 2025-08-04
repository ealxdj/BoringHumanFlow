"use client"

import { useRef, useEffect, useState } from 'react'
import { usePersonDetection } from '@/hooks/use-person-detection'
import { YouTubeDetectionNotice } from './youtube-detection-notice'
interface SmartVideoDetectionProps {
  streamUrl?: string
  isAIDetectionEnabled: boolean
  onToggle: () => void
  onSwitchToWebcam: () => void
  className?: string
}

export const SmartVideoDetection = ({ 
  streamUrl, 
  isAIDetectionEnabled, 
  onToggle, 
  onSwitchToWebcam,
  className = "" 
}: SmartVideoDetectionProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isYouTubeVideo, setIsYouTubeVideo] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)

  const {
    isLoading,
    detections,
    error,
    createCanvas,
    clearCanvas,
    getPerformanceStats
  } = usePersonDetection({
    videoRef,
    isEnabled: isAIDetectionEnabled && !isYouTubeVideo,
    detectionInterval: 300,
    confidenceThreshold: 0.5,
    enableTracking: true
  })

  // Detectar si es un video de YouTube
  useEffect(() => {
    if (streamUrl && streamUrl.includes('youtube')) {
      setIsYouTubeVideo(true)
    } else {
      setIsYouTubeVideo(false)
    }
  }, [streamUrl])

  // Crear canvas cuando se necesite
  useEffect(() => {
    if (isAIDetectionEnabled && !isYouTubeVideo && containerRef.current) {
      createCanvas(containerRef)
    } else {
      clearCanvas()
    }
  }, [isAIDetectionEnabled, isYouTubeVideo, createCanvas, clearCanvas])

  const handleVideoError = () => {
    setVideoError('Error al cargar el video. Verifique la URL del stream.')
  }

  const handleVideoLoad = () => {
    setVideoError(null)
  }

  if (isYouTubeVideo && streamUrl) {
    const videoId = streamUrl.match(/embed\/([^?]+)/)?.[1]
    
    return (
      <div ref={containerRef} className={`relative w-full h-full overflow-hidden ai-detection-container ${className}`}>
        {videoId && (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1`}
            className="w-full h-full rounded-lg border-none"
            allow="autoplay; encrypted-media"
            allowFullScreen
            title="YouTube Live Stream"
          />
        )}
        
        {/* Indicador de stream en vivo */}
        <div className="absolute top-4 left-4 flex items-center space-x-2 z-10">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-white text-sm font-medium bg-black/50 backdrop-blur-sm px-2 py-1 rounded">LIVE</span>
        </div>
        
        {/* Información sobre detección AI */}
        {isAIDetectionEnabled && (
          <YouTubeDetectionNotice 
            onSwitchToWebcam={onSwitchToWebcam}
            className="rounded-lg"
          />
        )}
        
        {/* Información de stream cuando no hay detección AI */}
        {!isAIDetectionEnabled && (
          <div className="absolute bottom-4 right-4 z-10">
            <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm">
              YouTube Stream • Detección AI deshabilitada
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div ref={containerRef} className={`relative w-full h-full overflow-hidden ai-detection-container ${className}`}>
      {streamUrl && !isYouTubeVideo && (
        <video
          ref={videoRef}
          src={streamUrl}
          className="w-full h-full rounded-lg border-none object-cover"
          autoPlay
          muted
          loop
          controls={false}
          playsInline
          crossOrigin="anonymous"
          onError={handleVideoError}
          onLoadedData={handleVideoLoad}
        />
      )}
      
      {/* Indicador de video local */}
      {!isYouTubeVideo && streamUrl && (
        <div className="absolute top-4 left-4 flex items-center space-x-2 z-10">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="text-white text-sm font-medium bg-black/50 backdrop-blur-sm px-2 py-1 rounded">
            LOCAL VIDEO
          </span>
        </div>
      )}
      
      {videoError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg">
          <div className="text-center space-y-2">
            <p className="text-red-400">{videoError}</p>
            <button 
              onClick={onToggle}
              className="text-blue-400 hover:text-blue-300 text-sm underline"
            >
              Desactivar detección AI
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute top-4 left-4 right-4 z-10">
          <div className="bg-red-900/90 border border-red-500/50 rounded-lg p-3 text-red-100">
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-white">Cargando modelo de detección...</div>
        </div>
      )}

      {isAIDetectionEnabled && detections.length > 0 && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-black/70 rounded-lg px-3 py-2 text-white text-sm">
            {detections.length} persona{detections.length !== 1 ? 's' : ''} detectada{detections.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Indicador de estado de detección AI */}
      {!isYouTubeVideo && streamUrl && (
        <div className="absolute bottom-4 right-4 z-10">
          <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm">
            Video Local • AI {isAIDetectionEnabled ? "Activo" : "Deshabilitado"}
          </div>
        </div>
      )}
    </div>
  )
}
