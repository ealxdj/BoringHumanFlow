"use client"

import { useState, useEffect, useRef } from "react"
import {
  CameraIcon,
  Users,
  Settings,
  Pause,
  MoreHorizontal,
  Eye,
  EyeOff,
  Plus,
  MapPin,
  Maximize2,
  Volume2,
  VolumeX,
  RepeatIcon as Record,
  Circle,
  Brain,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import PersonDetectionOverlay from "@/components/person-detection-overlay"
import WebcamDetection from "@/components/webcam-detection"
import { SmartVideoDetection } from "@/components/smart-video-detection"

// Declaración para YouTube API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface Camera {
  id: string
  name: string
  location: string
  status: "online" | "offline" | "maintenance"
  isRecording: boolean
  peopleDetected: number
  lastMotion: Date | null
  alertLevel: "none" | "low" | "medium" | "high"
  resolution: string
  fps: number
  streamUrl?: string
}

interface TrackingEvent {
  id: string
  cameraId: string
  cameraName: string
  type: "person_entered" | "person_exited" | "motion_detected" | "multiple_people" | "person_lingering"
  timestamp: Date
  peopleCount: number
  severity: "info" | "warning" | "critical"
  description: string
}

export default function CameraDashboard() {
  // Estado para saber si estamos en el cliente
  const [isClient, setIsClient] = useState(false);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    setIsClient(true);
    // Cargar la API de YouTube
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);
  // Estado para la hora actual (solo cliente)
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    // Actualiza la hora cada segundo solo en el cliente
    const updateTime = () => setCurrentTime(formatTimestamp(new Date()));
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Función para manejar el mute/unmute del player de YouTube
  const handleMuteToggle = () => {
    if (playerRef.current) {
      if (isMuted) {
        playerRef.current.unMute()
      } else {
        playerRef.current.mute()
      }
    }
    setIsMuted(!isMuted)
  }

  // Función para inicializar el player de YouTube
  const initializeYouTubePlayer = (videoId: string) => {
    if (window.YT && window.YT.Player) {
      playerRef.current = new window.YT.Player('youtube-player', {
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          fs: 0,
          mute: isMuted ? 1 : 0
        },
        events: {
          onReady: (event: any) => {
            if (isMuted) {
              event.target.mute();
            }
          }
        }
      })
    }
  }
  const [selectedCameraId, setSelectedCameraId] = useState("1")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [isAIDetectionEnabled, setIsAIDetectionEnabled] = useState(true) // Habilitado por defecto
  const [useWebcam, setUseWebcam] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const videoElementRef = useRef<HTMLVideoElement | null>(null)

  const [cameras, setCameras] = useState<Camera[]>([
    {
      id: "1",
      name: "Times Square",
      location: "New York City - Manhattan",
      status: "online",
      isRecording: true,
      peopleDetected: 2,
      lastMotion: new Date(Date.now() - 30000),
      alertLevel: "medium",
      resolution: "1920x1080",
      fps: 30,
      // Enlace actualizado al nuevo directo de YouTube proporcionado
      streamUrl: "https://www.youtube.com/embed/rnXIjl_Rzy4?autoplay=1",
    },
    {
      id: "2",
      name: "Local Video Demo",
      location: "Video Local - Detección AI",
      status: "online",
      isRecording: false,
      peopleDetected: 0,
      lastMotion: new Date(Date.now() - 120000),
      alertLevel: "none",
      resolution: "1280x720",
      fps: 25,
      // Video local para probar detección AI
      streamUrl: "/v1.mp4",
    },
  ])

  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([
    {
      id: "1",
      cameraId: "1",
      cameraName: "Times Square",
      type: "person_entered",
      timestamp: new Date(Date.now() - 10000),
      peopleCount: 2,
      severity: "info",
      description: "2 people entered the viewing area",
    },
    {
      id: "2",
      cameraId: "2",
      cameraName: "Local Video Demo",
      type: "motion_detected",
      timestamp: new Date(Date.now() - 15000),
      peopleCount: 1,
      severity: "info",
      description: "AI detection ready for local video analysis",
    },
    {
      id: "3",
      cameraId: "1",
      cameraName: "Times Square",
      type: "motion_detected",
      timestamp: new Date(Date.now() - 30000),
      peopleCount: 2,
      severity: "info",
      description: "Motion detected in Times Square area",
    },
    {
      id: "4",
      cameraId: "2",
      cameraName: "Local Video Demo",
      type: "person_entered",
      timestamp: new Date(Date.now() - 45000),
      peopleCount: 1,
      severity: "info",
      description: "Local video loaded - AI detection available",
    },
    {
      id: "5",
      cameraId: "1",
      cameraName: "Times Square",
      type: "multiple_people",
      timestamp: new Date(Date.now() - 60000),
      peopleCount: 5,
      severity: "warning",
      description: "High pedestrian traffic detected",
    },
  ])

  const selectedCamera = cameras.find((c) => c.id === selectedCameraId)

  // ...existing code...

  // Auto-scroll del log
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0
    }
  }, [trackingEvents])

  const toggleRecording = (cameraId: string) => {
    setCameras((prev) =>
      prev.map((camera) => (camera.id === cameraId ? { ...camera, isRecording: !camera.isRecording } : camera)),
    )
  }

  const getStatusColor = (status: Camera["status"]) => {
    switch (status) {
      case "online":
        return "bg-green-500"
      case "offline":
        return "bg-red-500"
      case "maintenance":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getAlertColor = (level: Camera["alertLevel"]) => {
    switch (level) {
      case "high":
        return "border-red-500/50 bg-red-500/10"
      case "medium":
        return "border-yellow-500/50 bg-yellow-500/10"
      case "low":
        return "border-blue-500/50 bg-blue-500/10"
      default:
        return "border-gray-700"
    }
  }

  const getSeverityColor = (severity: TrackingEvent["severity"]) => {
    switch (severity) {
      case "critical":
        return "text-red-400"
      case "warning":
        return "text-yellow-400"
      case "info":
        return "text-blue-400"
      default:
        return "text-gray-400"
    }
  }

  const formatTimeAgo = (date: Date | null) => {
    if (!date) return "Never"
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    return `${hours}h`
  }

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <SidebarProvider>
        {/* Sidebar Izquierda - Lista de Cámaras */}
        <Sidebar className="border-r border-gray-800 bg-black" variant="sidebar" collapsible="none">
          <SidebarHeader className="border-b border-gray-800 p-4 bg-black">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <CameraIcon className="w-5 h-5 text-black" />
              </div>
              <div>
                <h2 className="font-semibold text-white text-base">BoringHumanFlow</h2>
                <p className="text-xs text-gray-400">Human Tracking System</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="bg-black p-0">
            <div className="p-4">
              <div className="mb-4">
                <h3 className="text-gray-400 text-xs uppercase tracking-wider font-medium">
                  Active Cameras ({cameras.filter((c) => c.status === "online").length})
                </h3>
              </div>

              <div className="space-y-2">
                {cameras.map((camera) => (
                  <button
                    key={camera.id}
                    onClick={() => setSelectedCameraId(camera.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                      selectedCameraId === camera.id
                        ? "bg-gray-800 border-white/20 shadow-lg"
                        : "bg-gray-900/50 border-gray-700 hover:bg-gray-800/50 hover:border-gray-600"
                    } ${getAlertColor(camera.alertLevel)}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative mt-1">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(camera.status)}`} />
                        {camera.isRecording && camera.status === "online" && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-white truncate pr-2">{camera.name}</h4>
                          {camera.peopleDetected > 0 && (
                            <Badge
                              variant="secondary"
                              className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 shrink-0"
                            >
                              {camera.peopleDetected}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center text-xs text-gray-400 mb-1">
                          <MapPin className="w-3 h-3 mr-1 shrink-0" />
                          <span className="truncate">{camera.location}</span>
                        </div>

                        {camera.status === "online" && (
                          <div className="flex items-center text-xs text-gray-500">
                            <span>{camera.resolution}</span>
                            <span className="mx-1">•</span>
                            <span>{camera.fps}fps</span>
                          </div>
                        )}

                        {camera.status === "offline" && <div className="text-xs text-red-400">No connection</div>}

                        {camera.status === "maintenance" && (
                          <div className="text-xs text-yellow-400">Maintenance</div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="bg-black overflow-hidden">
          <div className="flex h-screen overflow-hidden">
            {/* Vista Principal de Cámara */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header de la cámara principal */}
              <div className="border-b border-gray-800 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-4 h-4 rounded-full ${getStatusColor(selectedCamera?.status || "offline")}`} />
                      <h1 className="text-xl font-semibold text-white">{selectedCamera?.name}</h1>
                      {selectedCamera?.isRecording && selectedCamera.status === "online" && (
                        <div className="flex items-center space-x-1 text-red-400">
                          <Circle className="w-3 h-3 fill-current animate-pulse" />
                          <span className="text-sm">REC</span>
                        </div>
                      )}
                    </div>
                    <Badge
                      variant={
                        selectedCamera?.alertLevel === "high"
                          ? "destructive"
                          : selectedCamera?.alertLevel === "medium"
                            ? "default"
                            : "secondary"
                      }
                      className={
                        selectedCamera?.alertLevel === "high"
                          ? "bg-red-500/20 text-red-400 border-red-500/50"
                          : selectedCamera?.alertLevel === "medium"
                            ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                            : "bg-gray-500/20 text-gray-400 border-gray-500/50"
                      }
                    >
                      {selectedCamera?.alertLevel === "none" ? "Normal" : selectedCamera?.alertLevel?.toUpperCase()}
                    </Badge>
                    
                    {/* Indicador de tipo de stream y detección AI */}
                    {selectedCamera?.streamUrl?.includes("youtube") && (
                      <Badge 
                        variant="secondary" 
                        className={`${isAIDetectionEnabled 
                          ? "bg-orange-500/20 text-orange-400 border-orange-500/50" 
                          : "bg-blue-500/20 text-blue-400 border-blue-500/50"
                        }`}
                      >
                        YouTube {isAIDetectionEnabled ? "• AI Limitado" : "• Solo Stream"}
                      </Badge>
                    )}
                    
                    {selectedCamera?.streamUrl && !selectedCamera.streamUrl.includes("youtube") && !useWebcam && (
                      <Badge 
                        variant="secondary" 
                        className={`${isAIDetectionEnabled 
                          ? "bg-green-500/20 text-green-400 border-green-500/50" 
                          : "bg-gray-500/20 text-gray-400 border-gray-500/50"
                        }`}
                      >
                        Video Local {isAIDetectionEnabled ? "• AI Disponible" : "• AI Deshabilitado"}
                      </Badge>
                    )}
                    
                    {useWebcam && (
                      <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/50">
                        Webcam {isAIDetectionEnabled ? "• AI Activo" : ""}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUseWebcam(!useWebcam)}
                      className={`hover:bg-gray-800 ${
                        useWebcam 
                          ? "text-green-400 hover:text-green-300" 
                          : "text-gray-400 hover:text-white"
                      }`}
                      title={useWebcam ? "Cambiar a stream" : "Usar webcam"}
                    >
                      <CameraIcon className="w-4 h-4" />
                      {useWebcam && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAIDetectionEnabled(!isAIDetectionEnabled)}
                      className={`hover:bg-gray-800 ${
                        isAIDetectionEnabled 
                          ? "text-blue-400 hover:text-blue-300" 
                          : "text-gray-400 hover:text-white"
                      }`}
                      title={isAIDetectionEnabled ? "Desactivar detección AI" : "Activar detección AI"}
                    >
                      <Brain className="w-4 h-4" />
                      {isAIDetectionEnabled && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMuteToggle}
                      className="text-gray-400 hover:text-white hover:bg-gray-800"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className="text-gray-400 hover:text-white hover:bg-gray-800"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => selectedCamera && toggleRecording(selectedCamera.id)}
                      disabled={selectedCamera?.status !== "online"}
                      className="text-gray-400 hover:text-white hover:bg-gray-800"
                    >
                      {selectedCamera?.isRecording ? <Pause className="w-4 h-4" /> : <Record className="w-4 h-4" />}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-800">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-gray-900 border-gray-700">
                        <DropdownMenuItem className="text-gray-300 hover:bg-gray-800">
                          <Settings className="w-4 h-4 mr-2" />
                          Configure Camera
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-gray-300 hover:bg-gray-800">
                          <Eye className="w-4 h-4 mr-2" />
                          Full Screen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                  <span>{selectedCamera?.location}</span>
                  <span>•</span>
                  <span>{selectedCamera?.resolution}</span>
                  <span>•</span>
                  <span>{selectedCamera?.fps} FPS</span>
                  <span>•</span>
                  <span>Last activity: {formatTimeAgo(selectedCamera?.lastMotion ?? null)}</span>
                </div>
              </div>

              {/* Vista de video principal */}
              <div className="flex-1 p-4 overflow-hidden">
                <div className="h-full bg-gray-900 rounded-lg relative overflow-hidden border border-gray-800 flex items-center justify-center">
                  {useWebcam ? (
                    <WebcamDetection
                      isEnabled={isAIDetectionEnabled}
                      onToggle={() => setIsAIDetectionEnabled(!isAIDetectionEnabled)}
                      className="w-full h-full"
                    />
                  ) : (
                    <>
                      {selectedCamera?.status === "online" ? (
                        selectedCamera?.streamUrl && isClient ? (
                          <SmartVideoDetection
                            streamUrl={selectedCamera.streamUrl}
                            isAIDetectionEnabled={isAIDetectionEnabled}
                            onToggle={() => setIsAIDetectionEnabled(!isAIDetectionEnabled)}
                            onSwitchToWebcam={() => setUseWebcam(true)}
                            className="w-full h-full"
                          />
                        ) : (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
                            <div className="absolute top-4 left-4 flex items-center space-x-2">
                              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                              <span className="text-white text-sm font-medium">LIVE</span>
                              <span className="text-gray-300 text-sm">{currentTime}</span>
                              {isMuted && (
                                <div className="flex items-center space-x-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded">
                                  <VolumeX className="w-3 h-3 text-red-400" />
                                  <span className="text-xs text-red-400">MUTED</span>
                                </div>
                              )}
                            </div>
                            {selectedCamera.peopleDetected > 0 && (
                              <div className="absolute bottom-4 left-4 bg-red-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <Users className="w-5 h-5" />
                                  <span className="font-medium">
                                    {selectedCamera.peopleDetected} person{selectedCamera.peopleDetected !== 1 ? "s" : ""}{" "}
                                    detected
                                  </span>
                                </div>
                              </div>
                            )}
                            <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded text-sm">
                              {selectedCamera.resolution} • {selectedCamera.fps}fps
                            </div>
                          </>
                        )
                      ) : selectedCamera?.status === "offline" ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center text-gray-400">
                            <EyeOff className="w-16 h-16 mx-auto mb-4" />
                            <h3 className="text-xl font-medium mb-2">Camera Offline</h3>
                            <p className="text-gray-500">The camera is not available at this time</p>
                          </div>
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center text-yellow-400">
                            <Settings className="w-16 h-16 mx-auto mb-4" />
                            <h3 className="text-xl font-medium mb-2">Under Maintenance</h3>
                            <p className="text-gray-500">The camera is being updated</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Panel Derecho - Log de Tracking */}
            <div className="w-80 border-l border-gray-800 bg-gray-950 flex flex-col h-screen max-h-screen">
              <div className="border-b border-gray-800 p-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-white">Activity Log</h2>
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                    {trackingEvents.length}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400 mt-1">Real-time tracking</p>
              </div>

              {/* ScrollArea con altura limitada y scroll vertical */}
              <div className="flex-1 overflow-y-auto">
                <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
                  <div className="space-y-3">
                    {trackingEvents.map((event, index) => (
                      <div key={event.id}>
                        <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div
                                className={`w-2 h-2 rounded-full ${getSeverityColor(event.severity).replace("text-", "bg-")}`}
                              />
                              <span className="text-sm font-medium text-white">{event.cameraName}</span>
                            </div>
                            <span className="text-xs text-gray-500">{formatTimestamp(event.timestamp)}</span>
                          </div>
                          <p className="text-sm text-gray-300 mb-2">{event.description}</p>
                          <div className="flex items-center justify-between">
                            <Badge
                              variant="secondary"
                              className={`text-xs ${
                                event.severity === "critical"
                                  ? "bg-red-500/20 text-red-400"
                                  : event.severity === "warning"
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-blue-500/20 text-blue-400"
                              }`}
                            >
                              {event.severity.toUpperCase()}
                            </Badge>
                            {event.peopleCount > 0 && (
                              <div className="flex items-center space-x-1 text-xs text-gray-400">
                                <Users className="w-3 h-3" />
                                <span>{event.peopleCount}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {index < trackingEvents.length - 1 && <Separator className="my-2 bg-gray-800" />}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div className="border-t border-gray-800 p-4">
                <Button className="w-full bg-white text-black hover:bg-gray-200">
                  <Plus className="w-4 h-4 mr-2" />
                  Export Log
                </Button>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
