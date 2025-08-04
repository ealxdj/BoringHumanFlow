"use client"

import React, { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Brain, 
  Camera, 
  Activity, 
  Users, 
  Zap, 
  Target,
  TrendingUp,
  Clock
} from 'lucide-react'
import { usePersonDetection } from '@/hooks/use-person-detection'

export const AIDetectionDemo: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isEnabled, setIsEnabled] = useState(false)
  const [streamUrl, setStreamUrl] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  // Usar el hook de detección avanzado
  const {
    model,
    isLoading,
    detections,
    error,
    createCanvas,
    clearCanvas,
    getPerformanceStats
  } = usePersonDetection({
    videoRef,
    isEnabled,
    detectionInterval: 150, // Muy responsivo
    confidenceThreshold: 0.3, // Bajo para capturar más detecciones
    enableTracking: true
  })

  const performanceStats = getPerformanceStats()

  // Streams de ejemplo para probar
  const testStreams = [
    {
      name: "Times Square Live",
      url: "https://www.youtube.com/embed/rnXIjl_Rzy4?autoplay=1",
      type: "youtube"
    },
    {
      name: "NYC Traffic Cam",
      url: "https://www.youtube.com/embed/eJ7ZkQ5TC08?autoplay=1", 
      type: "youtube"
    }
  ]

  const startStream = (url: string) => {
    if (videoRef.current) {
      setStreamUrl(url)
      setIsStreaming(true)
      
      if (url.includes('youtube.com')) {
        // Para YouTube, necesitaríamos crear un iframe
        // Por simplicidad, usaremos un placeholder
        console.log('YouTube stream:', url)
      } else {
        videoRef.current.src = url
        videoRef.current.load()
      }
    }
  }

  const stopStream = () => {
    if (videoRef.current) {
      videoRef.current.src = ''
      setStreamUrl('')
      setIsStreaming(false)
      clearCanvas()
    }
  }

  // Crear canvas cuando esté listo
  useEffect(() => {
    if (containerRef.current && isEnabled && model) {
      createCanvas(containerRef)
    }
  }, [createCanvas, isEnabled, model])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            AI Person Detection Demo
          </h1>
          <p className="text-gray-400 text-lg">
            Advanced real-time person detection with tracking and analytics
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Panel */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Camera className="w-5 h-5" />
                  <span>Video Stream</span>
                  {isStreaming && (
                    <Badge className="bg-red-500/20 text-red-400">
                      LIVE
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div ref={containerRef} className="relative bg-black rounded-lg overflow-hidden aspect-video">
                  {isStreaming ? (
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                      playsInline
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>Select a stream to start detection</p>
                      </div>
                    </div>
                  )}
                  
                  {/* AI Status Overlay */}
                  {isStreaming && (
                    <div className="absolute top-4 right-4 flex items-center space-x-2">
                      {isLoading && (
                        <Badge className="bg-yellow-500/20 text-yellow-400 animate-pulse">
                          <Brain className="w-3 h-3 mr-1 animate-spin" />
                          Loading...
                        </Badge>
                      )}
                      
                      {error && (
                        <Badge className="bg-red-500/20 text-red-400">
                          Error
                        </Badge>
                      )}
                      
                      {model && !error && (
                        <Badge className={isEnabled ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}>
                          <Brain className="w-3 h-3 mr-1" />
                          AI {performanceStats.backend}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {testStreams.map((stream, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      onClick={() => startStream(stream.url)}
                      className="text-white border-gray-600 hover:bg-gray-800"
                    >
                      {stream.name}
                    </Button>
                  ))}
                  
                  <Button
                    variant="outline"
                    onClick={stopStream}
                    disabled={!isStreaming}
                    className="text-white border-gray-600 hover:bg-gray-800"
                  >
                    Stop Stream
                  </Button>
                  
                  <Button
                    onClick={() => setIsEnabled(!isEnabled)}
                    disabled={!isStreaming || !model}
                    className={isEnabled ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    {isEnabled ? 'Disable AI' : 'Enable AI'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Panel */}
          <div className="space-y-6">
            {/* Detection Stats */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Detection Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Persons Detected</span>
                  <Badge className="bg-blue-500/20 text-blue-400">
                    {detections.length}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Avg Confidence</span>
                  <span className="text-green-400">
                    {(performanceStats.averageConfidence * 100).toFixed(1)}%
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Tracking</span>
                  <span className={performanceStats.trackingEnabled ? "text-green-400" : "text-gray-400"}>
                    {performanceStats.trackingEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Performance Stats */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Backend</span>
                  <Badge className="bg-purple-500/20 text-purple-400">
                    {performanceStats.backend}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Model Status</span>
                  <span className={performanceStats.modelLoaded ? "text-green-400" : "text-red-400"}>
                    {performanceStats.modelLoaded ? "Loaded" : "Not Loaded"}
                  </span>
                </div>
                
                {performanceStats.lastUpdate && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Last Update</span>
                    <span className="text-blue-400 text-sm">
                      {performanceStats.lastUpdate.toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Individual Detections */}
            {detections.length > 0 && (
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Active Detections</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {detections.slice(0, 10).map((detection, index) => (
                      <div 
                        key={detection.id} 
                        className="flex items-center justify-between p-2 bg-gray-800/50 rounded"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-sm">
                            Person #{detection.trackingId || index + 1}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="text-green-400">
                            {(detection.confidence * 100).toFixed(0)}%
                          </span>
                          {detection.velocity && (
                            <span className="text-purple-400">
                              {Math.sqrt(detection.velocity.x ** 2 + detection.velocity.y ** 2).toFixed(0)}px/s
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {detections.length > 10 && (
                      <div className="text-center text-gray-500 text-sm">
                        +{detections.length - 10} more...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIDetectionDemo
