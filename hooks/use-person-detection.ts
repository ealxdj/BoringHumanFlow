import { useEffect, useRef, useState, useCallback } from 'react'
import * as tf from '@tensorflow/tfjs'
import * as cocoSsd from '@tensorflow-models/coco-ssd'

interface Detection {
  bbox: [number, number, number, number] // [x, y, width, height]
  class: string
  score: number
}

interface PersonDetection {
  id: string
  bbox: [number, number, number, number]
  confidence: number
  timestamp: Date
  trackingId?: number
  velocity?: { x: number; y: number }
  area: number
}

interface UsePersonDetectionProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  isEnabled: boolean
  detectionInterval?: number
  confidenceThreshold?: number
  enableTracking?: boolean
}

export const usePersonDetection = ({
  videoRef,
  isEnabled,
  detectionInterval = 300, // Más frecuente para mejor detección
  confidenceThreshold = 0.5, // Threshold optimizado
  enableTracking = true
}: UsePersonDetectionProps) => {
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [detections, setDetections] = useState<PersonDetection[]>([])
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const detectionIdCounter = useRef(0)
  const previousDetections = useRef<PersonDetection[]>([])
  const trackingIdCounter = useRef(0)

  // Función para calcular la distancia entre dos puntos centrales
  const calculateDistance = (bbox1: [number, number, number, number], bbox2: [number, number, number, number]) => {
    const center1 = [bbox1[0] + bbox1[2] / 2, bbox1[1] + bbox1[3] / 2]
    const center2 = [bbox2[0] + bbox2[2] / 2, bbox2[1] + bbox2[3] / 2]
    return Math.sqrt(Math.pow(center1[0] - center2[0], 2) + Math.pow(center1[1] - center2[1], 2))
  }

  // Función para calcular el área de un bbox
  const calculateArea = (bbox: [number, number, number, number]) => {
    return bbox[2] * bbox[3]
  }

  // Función para asignar tracking IDs a las detecciones
  const assignTrackingIds = (newDetections: PersonDetection[]): PersonDetection[] => {
    if (!enableTracking) return newDetections

    const maxDistance = 100 // Distancia máxima para considerar el mismo objeto

    return newDetections.map((detection): PersonDetection => {
      // Buscar la detección anterior más cercana
      let bestMatch: PersonDetection | null = null
      let minDistance = Infinity

      previousDetections.current.forEach((prevDetection: PersonDetection) => {
        const distance = calculateDistance(detection.bbox, prevDetection.bbox)
        if (distance < minDistance && distance < maxDistance) {
          minDistance = distance
          bestMatch = prevDetection
        }
      })

      if (bestMatch) {
        // Calcular velocidad usando type assertion para evitar el error de TypeScript
        const matchedDetection = bestMatch as PersonDetection
        const prevCenter = [matchedDetection.bbox[0] + matchedDetection.bbox[2] / 2, matchedDetection.bbox[1] + matchedDetection.bbox[3] / 2]
        const currCenter = [detection.bbox[0] + detection.bbox[2] / 2, detection.bbox[1] + detection.bbox[3] / 2]
        const timeDiff = (detection.timestamp.getTime() - matchedDetection.timestamp.getTime()) / 1000
        
        const velocity = timeDiff > 0 ? {
          x: (currCenter[0] - prevCenter[0]) / timeDiff,
          y: (currCenter[1] - prevCenter[1]) / timeDiff
        } : { x: 0, y: 0 }

        return {
          ...detection,
          trackingId: matchedDetection.trackingId,
          velocity
        }
      } else {
        // Nueva detección
        return {
          ...detection,
          trackingId: trackingIdCounter.current++
        }
      }
    })
  }

  // Cargar el modelo con configuración optimizada
  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Configurar TensorFlow.js con backend optimizado
        await tf.ready()
        
        // Preferir WebGL para mejor rendimiento, fallback a CPU
        if (tf.getBackend() !== 'webgl') {
          try {
            await tf.setBackend('webgl')
          } catch (webglError) {
            console.warn('WebGL no disponible, usando CPU:', webglError)
            await tf.setBackend('cpu')
          }
        }
        
        console.log('TensorFlow.js backend:', tf.getBackend())
        
        // Cargar el modelo COCO-SSD con configuración optimizada
        const loadedModel = await cocoSsd.load({
          base: 'mobilenet_v2', // Más rápido para tiempo real
          modelUrl: undefined // Usar el modelo por defecto
        })
        
        setModel(loadedModel)
        console.log('Modelo COCO-SSD cargado exitosamente')
      } catch (err) {
        console.error('Error cargando el modelo:', err)
        setError('Error cargando el modelo de detección. Verifique su conexión a internet.')
      } finally {
        setIsLoading(false)
      }
    }

    loadModel()
  }, [])

  // Función para detectar personas con técnicas avanzadas
  const detectPersons = useCallback(async () => {
    if (!model || !videoRef.current || !isEnabled) return

    const video = videoRef.current
    
    // Verificar que el video esté listo y tenga dimensiones válidas
    if (video.readyState !== 4 || video.videoWidth === 0 || video.videoHeight === 0) {
      return
    }

    try {
      // Verificar si es un video de YouTube o iframe (que causa problemas CORS)
      if (video.src && video.src.includes('youtube')) {
        console.warn('No se puede detectar personas en videos de YouTube debido a restricciones CORS')
        setError('La detección de personas no está disponible para streams de YouTube debido a restricciones de seguridad. Use la webcam para ver la detección en acción.')
        return
      }

      // Realizar la detección con configuración optimizada
      const predictions = await model.detect(video, undefined, 0.3) // Threshold bajo para capturar más detecciones
      
      // Filtrar y procesar solo personas con confianza suficiente
      const rawPersonDetections = predictions
        .filter((prediction: Detection) => 
          prediction.class === 'person' && 
          prediction.score >= confidenceThreshold
        )
        .map((prediction: Detection) => {
          const area = calculateArea(prediction.bbox)
          return {
            id: `person_${detectionIdCounter.current++}`,
            bbox: prediction.bbox,
            confidence: prediction.score,
            timestamp: new Date(),
            area
          }
        })

      // Aplicar Non-Maximum Suppression para eliminar detecciones duplicadas
      const filteredDetections = applyNMS(rawPersonDetections, 0.4)
      
      // Asignar tracking IDs
      const trackedDetections = assignTrackingIds(filteredDetections)
      
      // Actualizar detecciones anteriores para tracking
      previousDetections.current = trackedDetections

      setDetections(trackedDetections)
      
      // Actualizar el canvas con las detecciones
      drawDetections(trackedDetections, video)
      
    } catch (err: any) {
      console.error('Error en la detección:', err)
      
      // Detectar errores específicos de CORS o acceso a video
      if (err.message && (err.message.includes('CORS') || err.message.includes('cross-origin') || err.message.includes('tainted'))) {
        setError('No se puede acceder al video debido a restricciones de seguridad (CORS). Use la webcam para detección en tiempo real.')
      } else if (err.message && err.message.includes('Failed to execute \'getImageData\'')) {
        setError('El video no permite el análisis de AI. Use un stream compatible o la webcam.')
      } else {
        setError('Error en la detección de personas. Verifique que el video esté funcionando.')
      }
    }
  }, [model, videoRef, isEnabled, confidenceThreshold])

  // Función para aplicar Non-Maximum Suppression
  const applyNMS = (detections: PersonDetection[], iouThreshold: number) => {
    if (detections.length === 0) return detections

    // Ordenar por confianza (descendente)
    const sortedDetections = [...detections].sort((a, b) => b.confidence - a.confidence)
    const keep: PersonDetection[] = []

    for (const detection of sortedDetections) {
      let shouldKeep = true

      for (const keptDetection of keep) {
        const iou = calculateIoU(detection.bbox, keptDetection.bbox)
        if (iou > iouThreshold) {
          shouldKeep = false
          break
        }
      }

      if (shouldKeep) {
        keep.push(detection)
      }
    }

    return keep
  }

  // Función para calcular Intersection over Union (IoU)
  const calculateIoU = (bbox1: [number, number, number, number], bbox2: [number, number, number, number]) => {
    const [x1, y1, w1, h1] = bbox1
    const [x2, y2, w2, h2] = bbox2

    // Calcular la intersección
    const xIntersect = Math.max(0, Math.min(x1 + w1, x2 + w2) - Math.max(x1, x2))
    const yIntersect = Math.max(0, Math.min(y1 + h1, y2 + h2) - Math.max(y1, y2))
    const intersection = xIntersect * yIntersect

    // Calcular la unión
    const area1 = w1 * h1
    const area2 = w2 * h2
    const union = area1 + area2 - intersection

    return union > 0 ? intersection / union : 0
  }

  // Función para dibujar las detecciones en el canvas con diseño mejorado
  const drawDetections = useCallback((detections: PersonDetection[], video: HTMLVideoElement) => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Obtener las dimensiones del contenedor padre
    const container = canvas.parentElement
    if (!container) return

    const containerRect = container.getBoundingClientRect()
    
    // Asegurar que el canvas no exceda las dimensiones del contenedor
    const maxWidth = containerRect.width
    const maxHeight = containerRect.height
    
    // Calcular las dimensiones del canvas basándose en el video y el contenedor
    let canvasWidth = Math.min(video.videoWidth, maxWidth)
    let canvasHeight = Math.min(video.videoHeight, maxHeight)
    
    // Mantener aspect ratio
    const videoAspectRatio = video.videoWidth / video.videoHeight
    const containerAspectRatio = maxWidth / maxHeight
    
    if (videoAspectRatio > containerAspectRatio) {
      canvasWidth = maxWidth
      canvasHeight = maxWidth / videoAspectRatio
    } else {
      canvasHeight = maxHeight
      canvasWidth = maxHeight * videoAspectRatio
    }
    
    // Establecer las dimensiones del canvas
    canvas.width = canvasWidth
    canvas.height = canvasHeight
    
    // Asegurar que el canvas esté centrado y no exceda el contenedor
    canvas.style.width = `${canvasWidth}px`
    canvas.style.height = `${canvasHeight}px`
    canvas.style.maxWidth = '100%'
    canvas.style.maxHeight = '100%'
    
    // Calcular escalas para las coordenadas de detección
    const scaleX = canvasWidth / video.videoWidth
    const scaleY = canvasHeight / video.videoHeight

    // Limpiar el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Función helper para dibujar rectángulo redondeado
    const drawRoundedRect = (x: number, y: number, width: number, height: number, radius: number) => {
      ctx.beginPath()
      ctx.moveTo(x + radius, y)
      ctx.lineTo(x + width - radius, y)
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
      ctx.lineTo(x + width, y + height - radius)
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
      ctx.lineTo(x + radius, y + height)
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
      ctx.lineTo(x, y + radius)
      ctx.quadraticCurveTo(x, y, x + radius, y)
      ctx.closePath()
    }

    // Dibujar cada detección con diseño mejorado
    detections.forEach((detection, index) => {
      const [x, y, width, height] = detection.bbox
      
      // Escalar las coordenadas
      const scaledX = x * scaleX
      const scaledY = y * scaleY
      const scaledWidth = width * scaleX
      const scaledHeight = height * scaleY

      // Color basado en confianza (verde alto, amarillo medio, rojo bajo)
      const confidence = detection.confidence
      let color = '#ef4444' // rojo por defecto
      if (confidence > 0.8) color = '#10b981' // verde
      else if (confidence > 0.6) color = '#f59e0b' // amarillo

      // Configurar el estilo del rectángulo
      ctx.strokeStyle = color
      ctx.lineWidth = 3
      ctx.fillStyle = color + '20' // Semi-transparente
      
      // Dibujar el rectángulo de detección
      ctx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight)
      ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight)
      
      // Dibujar punto central para tracking
      const centerX = scaledX + scaledWidth / 2
      const centerY = scaledY + scaledHeight / 2
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI)
      ctx.fill()

      // Configurar el texto
      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'left'
      
      // Crear etiqueta con información detallada
      const trackingInfo = detection.trackingId !== undefined ? ` #${detection.trackingId}` : ''
      const confidencePercent = (confidence * 100).toFixed(0)
      const label = `Person${trackingInfo} ${confidencePercent}%`
      
      // Medir el texto para el fondo
      const textMetrics = ctx.measureText(label)
      const textWidth = textMetrics.width + 12
      const textHeight = 24

      // Dibujar fondo del texto con bordes redondeados
      const labelX = scaledX
      const labelY = scaledY - textHeight - 5
      
      ctx.fillStyle = color
      drawRoundedRect(labelX, labelY, textWidth, textHeight, 4)
      ctx.fill()

      // Dibujar el texto
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 12px Arial'
      ctx.fillText(label, labelX + 6, labelY + 16)

      // Dibujar indicador de velocidad si está disponible
      if (detection.velocity && enableTracking) {
        const speed = Math.sqrt(detection.velocity.x ** 2 + detection.velocity.y ** 2)
        if (speed > 10) { // Solo mostrar si hay movimiento significativo
          const arrowLength = Math.min(speed / 5, 30)
          const angle = Math.atan2(detection.velocity.y, detection.velocity.x)
          
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(centerX, centerY)
          ctx.lineTo(
            centerX + Math.cos(angle) * arrowLength,
            centerY + Math.sin(angle) * arrowLength
          )
          ctx.stroke()

          // Punta de flecha
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.arc(
            centerX + Math.cos(angle) * arrowLength,
            centerY + Math.sin(angle) * arrowLength,
            3, 0, 2 * Math.PI
          )
          ctx.fill()
        }
      }
    })

    // Dibujar información general en la esquina
    if (detections.length > 0) {
      const infoText = `${detections.length} person${detections.length !== 1 ? 's' : ''} detected`
      const avgConfidence = detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length
      const confidenceText = `Avg confidence: ${(avgConfidence * 100).toFixed(0)}%`

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      drawRoundedRect(10, 10, 200, 50, 8)
      ctx.fill()
      
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 14px Arial'
      ctx.fillText(infoText, 20, 30)
      ctx.font = '12px Arial'
      ctx.fillText(confidenceText, 20, 50)
    }
  }, [enableTracking])

  // Iniciar/parar la detección automática con mejor gestión de recursos
  useEffect(() => {
    if (isEnabled && model && videoRef.current) {
      // Verificar que el video esté realmente reproduciendo
      const video = videoRef.current
      const checkVideoReady = () => {
        if (video.readyState >= 3 && video.videoWidth > 0) {
          detectionIntervalRef.current = setInterval(detectPersons, detectionInterval)
        } else {
          // Reintentار después de un breve retraso
          setTimeout(checkVideoReady, 500)
        }
      }
      
      checkVideoReady()
    } else {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
        detectionIntervalRef.current = null
      }
      // Limpiar detecciones cuando se deshabilite
      if (!isEnabled) {
        setDetections([])
        previousDetections.current = []
      }
    }

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
      }
    }
  }, [isEnabled, model, detectPersons, detectionInterval])

  // Crear el canvas overlay con mejor gestión
  const createCanvas = useCallback((containerRef: React.RefObject<HTMLElement | null>) => {
    if (!containerRef.current || canvasRef.current) return canvasRef.current

    const canvas = document.createElement('canvas')
    
    // Configuración estricta del canvas
    canvas.style.position = 'absolute'
    canvas.style.top = '0'
    canvas.style.left = '0'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.maxWidth = '100%'
    canvas.style.maxHeight = '100%'
    canvas.style.pointerEvents = 'none'
    canvas.style.zIndex = '10'
    canvas.style.objectFit = 'contain'
    canvas.style.boxSizing = 'border-box'
    
    canvasRef.current = canvas
    
    // Asegurar que el contenedor tenga las propiedades correctas
    const container = containerRef.current
    if (container.style.position !== 'relative' && container.style.position !== 'absolute') {
      container.style.position = 'relative'
    }
    container.style.overflow = 'hidden'
    container.style.boxSizing = 'border-box'
    
    container.appendChild(canvas)
    
    // Manejar resize del contenedor de forma más segura
    const resizeObserver = new ResizeObserver(() => {
      if (canvasRef.current && videoRef.current && container) {
        // Verificar que el contenedor tenga dimensiones válidas
        const containerRect = container.getBoundingClientRect()
        if (containerRect.width > 0 && containerRect.height > 0) {
          const video = videoRef.current
          const detectionsCopy = [...detections]
          if (detectionsCopy.length > 0) {
            drawDetections(detectionsCopy, video)
          }
        }
      }
    })
    
    resizeObserver.observe(container)
    
    return canvas
  }, [detections, drawDetections])

  // Limpiar el canvas y recursos
  const clearCanvas = useCallback(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
      
      // Remover el canvas del DOM y limpiar referencias
      const parent = canvasRef.current.parentNode
      if (parent) {
        parent.removeChild(canvasRef.current)
        // Restaurar el overflow del contenedor si es necesario
        const parentElement = parent as HTMLElement
        if (parentElement.style.overflow === 'hidden') {
          // Mantener el overflow hidden por seguridad
          parentElement.style.overflow = 'hidden'
        }
      }
      canvasRef.current = null
    }
    setDetections([])
    previousDetections.current = []
  }, [])

  // Función para obtener estadísticas de rendimiento
  const getPerformanceStats = useCallback(() => {
    return {
      modelLoaded: !!model,
      backend: tf.getBackend(),
      detectionCount: detections.length,
      averageConfidence: detections.length > 0 
        ? detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length 
        : 0,
      trackingEnabled: enableTracking,
      lastUpdate: detections.length > 0 ? detections[0].timestamp : null
    }
  }, [model, detections, enableTracking])

  return {
    model,
    isLoading,
    detections,
    error,
    detectPersons,
    createCanvas,
    clearCanvas,
    canvasRef,
    getPerformanceStats
  }
}
