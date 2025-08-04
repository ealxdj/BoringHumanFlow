import React, { useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, EyeOff, Users, Brain, AlertTriangle, Activity, Zap } from 'lucide-react'
import { usePersonDetection } from '@/hooks/use-person-detection'

interface PersonDetectionOverlayProps {
  isEnabled: boolean
  onToggle: () => void
  videoElement?: HTMLVideoElement | null
  className?: string
}

export const PersonDetectionOverlay: React.FC<PersonDetectionOverlayProps> = ({
  isEnabled,
  onToggle,
  videoElement,
  className = ''
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [showStats, setShowStats] = useState(false)

  // Usar el hook de detección de personas con configuración optimizada
  const {
    model,
    isLoading,
    detections,
    error,
    createCanvas,
    clearCanvas,
    canvasRef,
    getPerformanceStats
  } = usePersonDetection({
    videoRef: videoRef,
    isEnabled,
    detectionInterval: 200, // Más frecuente para mejor respuesta
    confidenceThreshold: 0.4, // Threshold más bajo para capturar más detecciones
    enableTracking: true // Habilitar tracking avanzado
  })

  // Sincronizar con el elemento de video externo
  useEffect(() => {
    if (videoElement && videoRef.current !== videoElement) {
      videoRef.current = videoElement
    }
  }, [videoElement])

  // Crear el canvas cuando el contenedor esté listo
  useEffect(() => {
    if (containerRef.current && isEnabled && model) {
      const canvas = createCanvas(containerRef)
      return () => {
        if (canvas && containerRef.current?.contains(canvas)) {
          containerRef.current.removeChild(canvas)
        }
      }
    }
  }, [createCanvas, isEnabled, model])

  // Limpiar canvas cuando se deshabilite
  useEffect(() => {
    if (!isEnabled) {
      clearCanvas()
    }
  }, [isEnabled, clearCanvas])

  const handleToggle = () => {
    onToggle()
    if (!isEnabled) {
      clearCanvas()
    }
  }

  const performanceStats = getPerformanceStats()

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Controles de detección mejorados */}
      <div className="absolute top-4 right-4 z-20 flex items-center space-x-2">
        {/* Estado del modelo */}
        {isLoading && (
          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 animate-pulse">
            <Brain className="w-3 h-3 mr-1 animate-spin" />
            Loading AI...
          </Badge>
        )}
        
        {error && (
          <Badge variant="destructive" className="bg-red-500/20 text-red-400 cursor-pointer" 
                 onClick={() => window.location.reload()}>
            <AlertTriangle className="w-3 h-3 mr-1" />
            Error - Click to reload
          </Badge>
        )}
        
        {model && !error && !isLoading && (
          <>
            <Badge 
              variant="secondary" 
              className={isEnabled ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}
            >
              <Brain className="w-3 h-3 mr-1" />
              AI {performanceStats.backend.toUpperCase()}
            </Badge>
            
            {/* Botón de estadísticas */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowStats(!showStats)}
              className="text-white border border-white/20 bg-gray-800/50 hover:bg-gray-700/50"
            >
              <Activity className="w-4 h-4" />
            </Button>
          </>
        )}

        {/* Botón de toggle principal */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          disabled={isLoading || !!error || !model}
          className={`text-white border border-white/20 ${
            isEnabled 
              ? 'bg-red-500/20 hover:bg-red-500/30' 
              : 'bg-gray-800/50 hover:bg-gray-700/50'
          }`}
        >
          {isEnabled ? (
            <>
              <EyeOff className="w-4 h-4 mr-2" />
              Disable AI
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              Enable AI
            </>
          )}
        </Button>
      </div>

      {/* Panel de estadísticas avanzadas */}
      {showStats && isEnabled && (
        <div className="absolute top-20 right-4 z-20 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white min-w-64">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Performance Stats</h3>
            <Zap className="w-4 h-4 text-yellow-400" />
          </div>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-300">Backend:</span>
              <span className="text-green-400">{performanceStats.backend}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Detections:</span>
              <span className="text-blue-400">{performanceStats.detectionCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Avg Confidence:</span>
              <span className="text-yellow-400">
                {(performanceStats.averageConfidence * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Tracking:</span>
              <span className={performanceStats.trackingEnabled ? "text-green-400" : "text-gray-400"}>
                {performanceStats.trackingEnabled ? "ON" : "OFF"}
              </span>
            </div>
            {performanceStats.lastUpdate && (
              <div className="flex justify-between">
                <span className="text-gray-300">Last Update:</span>
                <span className="text-purple-400">
                  {performanceStats.lastUpdate.toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Estadísticas de detección principales */}
      {isEnabled && detections.length > 0 && (
        <div className="absolute bottom-4 left-4 z-20 bg-black/70 backdrop-blur-sm rounded-lg p-3 text-white">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium">
                {detections.length} person{detections.length !== 1 ? 's' : ''} detected
              </span>
            </div>
            <div className="text-xs text-gray-300">
              Avg: {(performanceStats.averageConfidence * 100).toFixed(0)}%
            </div>
          </div>
          
          {/* Lista de detecciones detallada con tracking */}
          <div className="mt-2 space-y-1">
            {detections.slice(0, 5).map((detection, index) => (
              <div key={detection.id} className="text-xs text-gray-300 flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <span>Person #{detection.trackingId || index + 1}</span>
                  {detection.velocity && (
                    <span className="text-purple-400">
                      ↗{Math.sqrt(detection.velocity.x ** 2 + detection.velocity.y ** 2).toFixed(0)}px/s
                    </span>
                  )}
                </span>
                <span className="text-green-400">{(detection.confidence * 100).toFixed(0)}%</span>
              </div>
            ))}
            {detections.length > 5 && (
              <div className="text-xs text-gray-500">
                +{detections.length - 5} more...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay detecciones pero está habilitado */}
      {isEnabled && detections.length === 0 && model && !isLoading && (
        <div className="absolute bottom-4 left-4 z-20 bg-black/50 backdrop-blur-sm rounded-lg p-2 text-gray-400 text-sm">
          <div className="flex items-center space-x-2">
            <Brain className="w-4 h-4" />
            <span>AI scanning for people...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default PersonDetectionOverlay
