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
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

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
  const [selectedCameraId, setSelectedCameraId] = useState("1")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const [cameras, setCameras] = useState<Camera[]>([
    {
      id: "1",
      name: "Entrada Principal",
      location: "Planta Baja - Lobby",
      status: "online",
      isRecording: true,
      peopleDetected: 2,
      lastMotion: new Date(Date.now() - 30000),
      alertLevel: "medium",
      resolution: "1920x1080",
      fps: 30,
    },
    {
      id: "2",
      name: "Pasillo Norte",
      location: "Primer Piso - Oficinas",
      status: "online",
      isRecording: true,
      peopleDetected: 0,
      lastMotion: new Date(Date.now() - 300000),
      alertLevel: "none",
      resolution: "1920x1080",
      fps: 25,
    },
    {
      id: "3",
      name: "Sala de Reuniones",
      location: "Segundo Piso - Sala A",
      status: "online",
      isRecording: false,
      peopleDetected: 5,
      lastMotion: new Date(Date.now() - 10000),
      alertLevel: "high",
      resolution: "2560x1440",
      fps: 30,
    },
    {
      id: "4",
      name: "Estacionamiento",
      location: "Exterior - Zona A",
      status: "offline",
      isRecording: false,
      peopleDetected: 0,
      lastMotion: null,
      alertLevel: "none",
      resolution: "1920x1080",
      fps: 0,
    },
    {
      id: "5",
      name: "Cafetería",
      location: "Planta Baja - Área Social",
      status: "online",
      isRecording: true,
      peopleDetected: 3,
      lastMotion: new Date(Date.now() - 60000),
      alertLevel: "low",
      resolution: "1920x1080",
      fps: 30,
    },
    {
      id: "6",
      name: "Salida Emergencia",
      location: "Planta Baja - Salida Este",
      status: "maintenance",
      isRecording: false,
      peopleDetected: 0,
      lastMotion: null,
      alertLevel: "none",
      resolution: "1280x720",
      fps: 0,
    },
  ])

  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([
    {
      id: "1",
      cameraId: "3",
      cameraName: "Sala de Reuniones",
      type: "multiple_people",
      timestamp: new Date(Date.now() - 10000),
      peopleCount: 5,
      severity: "critical",
      description: "5 personas detectadas simultáneamente en sala de reuniones",
    },
    {
      id: "2",
      cameraId: "1",
      cameraName: "Entrada Principal",
      type: "person_entered",
      timestamp: new Date(Date.now() - 30000),
      peopleCount: 2,
      severity: "info",
      description: "2 personas ingresaron al edificio",
    },
    {
      id: "3",
      cameraId: "5",
      cameraName: "Cafetería",
      type: "motion_detected",
      timestamp: new Date(Date.now() - 60000),
      peopleCount: 3,
      severity: "info",
      description: "Movimiento detectado - 3 personas en área social",
    },
  ])

  const selectedCamera = cameras.find((c) => c.id === selectedCameraId)

  // Simulación de actualizaciones en tiempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setCameras((prev) =>
        prev.map((camera) => {
          if (camera.status === "online" && Math.random() > 0.8) {
            const previousCount = camera.peopleDetected
            const newPeopleCount = Math.floor(Math.random() * 6)
            const newAlertLevel =
              newPeopleCount === 0 ? "none" : newPeopleCount <= 2 ? "low" : newPeopleCount <= 4 ? "medium" : "high"

            // Generar evento de tracking si hay cambios
            if (newPeopleCount !== previousCount) {
              let eventType: TrackingEvent["type"] = "motion_detected"
              let severity: TrackingEvent["severity"] = "info"
              let description = ""

              if (newPeopleCount > previousCount) {
                eventType = "person_entered"
                description = `${newPeopleCount - previousCount} persona${newPeopleCount - previousCount !== 1 ? "s" : ""} ingresó${newPeopleCount - previousCount !== 1 ? "aron" : ""}`
              } else if (newPeopleCount < previousCount) {
                eventType = "person_exited"
                description = `${previousCount - newPeopleCount} persona${previousCount - newPeopleCount !== 1 ? "s" : ""} salió${previousCount - newPeopleCount !== 1 ? "eron" : ""}`
              }

              if (newPeopleCount >= 4) {
                eventType = "multiple_people"
                severity = "critical"
                description = `${newPeopleCount} personas detectadas simultáneamente`
              } else if (newPeopleCount >= 2) {
                severity = "warning"
              }

              if (newPeopleCount !== previousCount) {
                const newEvent: TrackingEvent = {
                  id: Date.now().toString(),
                  cameraId: camera.id,
                  cameraName: camera.name,
                  type: eventType,
                  timestamp: new Date(),
                  peopleCount: newPeopleCount,
                  severity,
                  description:
                    description ||
                    `${newPeopleCount} persona${newPeopleCount !== 1 ? "s" : ""} detectada${newPeopleCount !== 1 ? "s" : ""}`,
                }
                setTrackingEvents((prev) => [newEvent, ...prev.slice(0, 49)])
              }
            }

            return {
              ...camera,
              peopleDetected: newPeopleCount,
              lastMotion: newPeopleCount > 0 ? new Date() : camera.lastMotion,
              alertLevel: newAlertLevel,
            }
          }
          return camera
        }),
      )
    }, 4000)

    return () => clearInterval(interval)
  }, [])

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
    if (!date) return "Nunca"
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
    <div className="min-h-screen bg-black text-white">
      <SidebarProvider>
        {/* Sidebar Izquierda - Lista de Cámaras */}
        <Sidebar className="border-r border-gray-800 bg-black" variant="sidebar" collapsible="none">
          <SidebarHeader className="border-b border-gray-800 p-4 bg-black">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <CameraIcon className="w-5 h-5 text-black" />
              </div>
              <div>
                <h2 className="font-semibold text-white text-base">Security Hub</h2>
                <p className="text-xs text-gray-400">Sistema de Monitoreo</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="bg-black p-0">
            <div className="p-4">
              <div className="mb-4">
                <h3 className="text-gray-400 text-xs uppercase tracking-wider font-medium">
                  Cámaras Activas ({cameras.filter((c) => c.status === "online").length})
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

                        {camera.status === "offline" && <div className="text-xs text-red-400">Sin conexión</div>}

                        {camera.status === "maintenance" && (
                          <div className="text-xs text-yellow-400">Mantenimiento</div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="bg-black">
          <div className="flex h-screen">
            {/* Vista Principal de Cámara */}
            <div className="flex-1 flex flex-col">
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
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMuted(!isMuted)}
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
                          Configurar Cámara
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-gray-300 hover:bg-gray-800">
                          <Eye className="w-4 h-4 mr-2" />
                          Pantalla Completa
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
                  <span>Última actividad: {formatTimeAgo(selectedCamera?.lastMotion)}</span>
                </div>
              </div>

              {/* Vista de video principal */}
              <div className="flex-1 p-4">
                <div className="h-full bg-gray-900 rounded-lg relative overflow-hidden border border-gray-800">
                  {selectedCamera?.status === "online" ? (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
                      <div className="absolute top-4 left-4 flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-white text-sm font-medium">EN VIVO</span>
                        <span className="text-gray-300 text-sm">{formatTimestamp(new Date())}</span>
                      </div>
                      {selectedCamera.peopleDetected > 0 && (
                        <div className="absolute bottom-4 left-4 bg-red-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Users className="w-5 h-5" />
                            <span className="font-medium">
                              {selectedCamera.peopleDetected} persona{selectedCamera.peopleDetected !== 1 ? "s" : ""}{" "}
                              detectada{selectedCamera.peopleDetected !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded text-sm">
                        {selectedCamera.resolution} • {selectedCamera.fps}fps
                      </div>
                    </>
                  ) : selectedCamera?.status === "offline" ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-gray-400">
                        <EyeOff className="w-16 h-16 mx-auto mb-4" />
                        <h3 className="text-xl font-medium mb-2">Cámara Sin Conexión</h3>
                        <p className="text-gray-500">La cámara no está disponible en este momento</p>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-yellow-400">
                        <Settings className="w-16 h-16 mx-auto mb-4" />
                        <h3 className="text-xl font-medium mb-2">En Mantenimiento</h3>
                        <p className="text-gray-500">La cámara está siendo actualizada</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Panel Derecho - Log de Tracking */}
            <div className="w-80 border-l border-gray-800 bg-gray-950 flex flex-col">
              <div className="border-b border-gray-800 p-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-white">Log de Actividad</h2>
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                    {trackingEvents.length}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400 mt-1">Seguimiento en tiempo real</p>
              </div>

              <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
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

              <div className="border-t border-gray-800 p-4">
                <Button className="w-full bg-white text-black hover:bg-gray-200">
                  <Plus className="w-4 h-4 mr-2" />
                  Exportar Log
                </Button>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
