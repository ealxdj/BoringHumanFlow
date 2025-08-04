"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Camera, AlertTriangle, Info, Webcam, Eye } from "lucide-react"

interface YouTubeDetectionNoticeProps {
  onSwitchToWebcam: () => void
  className?: string
}

export const YouTubeDetectionNotice = ({ onSwitchToWebcam, className = "" }: YouTubeDetectionNoticeProps) => {
  return (
    <div className={`absolute inset-0 flex items-center justify-center z-20 bg-black/60 backdrop-blur-sm ${className}`}>
      <div className="max-w-md mx-4">
        <Alert className="bg-gray-900/90 border-yellow-500/50 backdrop-blur-sm">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-100">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-yellow-200 mb-2">Detección de personas no disponible</h3>
                <p className="text-sm text-gray-300 mb-3">
                  Los videos de YouTube tienen restricciones de seguridad (CORS) que impiden el análisis de AI en tiempo real.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Info className="w-4 h-4" />
                  <span>Para ver la detección en acción:</span>
                </div>
                
                <Button 
                  onClick={onSwitchToWebcam}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  <Webcam className="w-4 h-4 mr-2" />
                  Usar Webcam
                </Button>
              </div>

              <div className="border-t border-gray-700 pt-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Estado del stream:</span>
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                    <Eye className="w-3 h-3 mr-1" />
                    Visualizando
                  </Badge>
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
