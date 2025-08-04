# BoringHumanFlow - Sistema de Detección de Personas

## 🎯 Descripción
Sistema de detección de personas en tiempo real utilizando TensorFlow.js y el modelo COCO-SSD.

## ⚠️ IMPORTANTE: Por qué no funciona con YouTube

### El Problema
**Los videos de YouTube NO permiten detección de personas** debido a restricciones técnicas fundamentales:

1. **🚫 CORS Policy**: YouTube bloquea el acceso cross-origin a los píxeles del video
2. **🔒 Security Headers**: Políticas de seguridad que previenen análisis de contenido
3. **🛡️ Anti-Scraping**: Medidas de Google para proteger su contenido
4. **📦 iframe Sandbox**: El video está encapsulado y es inaccesible

### Lo que Verás
- ✅ **Stream de YouTube**: Se reproduce normalmente
- ❌ **Detección AI**: Muestra mensaje explicativo
- 🔄 **Opción alternativa**: Botón para cambiar a webcam

## 🎮 DEMOSTRACIÓN FUNCIONAL

### 1. 📷 Usar Webcam (RECOMENDADO)
```
1. Clic en botón de cámara (📷) en el header
2. Permitir acceso a webcam
3. Activar AI con botón cerebro (🧠) - se vuelve azul
4. ¡Muévete frente a la cámara!
```

### 2. 🎥 Resultados Esperados
- **Rectángulos de colores**: Verde (alta confianza), Amarillo (media), Rojo (baja)
- **IDs de tracking**: Números únicos para cada persona
- **Flechas de velocidad**: Indicadores de movimiento
- **Estadísticas**: Contador y confianza promedio

## 🛠️ Configuración Técnica

### Parámetros Ajustables
- `detectionInterval`: Frecuencia de detección (default: 300ms)
- `confidenceThreshold`: Umbral de confianza (default: 0.5)
- `enableTracking`: Activar seguimiento (default: true)

### Backends de TensorFlow.js
1. **WebGL** (preferido): GPU acceleration
2. **CPU** (fallback): Procesamiento en CPU

## 🎨 Interfaz de Usuario

### Indicadores Visuales
- 🟢 **Verde**: Alta confianza (>80%)
- 🟡 **Amarillo**: Confianza media (60-80%)
- 🔴 **Rojo**: Baja confianza (<60%)

### Información Mostrada
- Número de personas detectadas
- ID de tracking único
- Porcentaje de confianza
- Velocidad de movimiento (flecha)
- Estadísticas promedio

## 🚨 Mensajes de Error Comunes

### "No se puede detectar personas en videos de YouTube"
- **Causa**: Restricciones CORS de YouTube
- **Solución**: Usar webcam o video local

### "Error de seguridad (CORS)"
- **Causa**: Video sin headers CORS apropiados
- **Solución**: Verificar configuración del servidor

### "WebGL no disponible"
- **Causa**: GPU no compatible o deshabilitada
- **Solución**: El sistema usa CPU automáticamente

## 📊 Rendimiento

### Optimizaciones Implementadas
- Modelo MobileNet v2 (optimizado para tiempo real)
- Canvas scaling inteligente
- Gestión eficiente de memoria
- Detección por intervalos configurables

### Requisitos del Sistema
- **Navegador**: Chrome, Firefox, Safari modernos
- **JavaScript**: Habilitado
- **WebGL**: Recomendado para mejor rendimiento

## 🔄 Estados del Sistema

### Cámara Online + Detección AI
- Stream visible + overlays de detección

### Cámara Online + YouTube + Detección AI
- Mensaje informativo sobre limitaciones CORS

### Webcam + Detección AI
- Detección completamente funcional

---

**💡 Tip**: Para la mejor experiencia de demostración, usa la webcam con buena iluminación y muévete lentamente para ver el tracking en acción.
