'use client'

import { useState, useCallback, useEffect } from 'react'
import { CanvasRenderer } from '@/components/CanvasRenderer'
import { ControlsPanel } from '@/components/ControlsPanel'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Color, getRandomMidToneColors } from '@/utils/colors'
import { Download } from 'lucide-react'

export default function Home() {
  const [colors, setColors] = useState<Color[]>([
    { name: 'Blue 500', hex: '#3B82F6', rgb: [59, 130, 246] },
    { name: 'Green 500', hex: '#10B981', rgb: [16, 185, 129] },
    { name: 'Purple 500', hex: '#8B5CF6', rgb: [139, 92, 246] }
  ])

  // Initialize colors after component mounts (client-side only)
  useEffect(() => {
    console.log('Initializing colors...')
    const initialColors = getRandomMidToneColors(3)
    console.log('Initial colors:', initialColors)
    setColors(initialColors)
  }, [])
  
  const handleColorsChange = useCallback((newColors: Color[]) => {
    console.log('Main state updating colors to:', newColors.map((c, i) => `${i}: ${c.hex} (${c.name})`));
    setColors(newColors)
  }, [])
  const [posterizeSteps, setPosterizeSteps] = useState(8)
  const [noiseIntensity, setNoiseIntensity] = useState(0.15)
  const [gradientStyle, setGradientStyle] = useState<'organic' | 'linear' | 'radial' | 'wave'>('organic')
  const [gradientIntensity, setGradientIntensity] = useState(0.8)
  const [gradientDensity, setGradientDensity] = useState(0.7)
  const [zoomLevel, setZoomLevel] = useState(1.0)
  const [isAnimated, setIsAnimated] = useState(false) // Hidden feature for now
  const [animationSpeed, setAnimationSpeed] = useState(1.0)
  const [colorBlobs, setColorBlobs] = useState<any[]>([])
  
  // Aspect Ratio Controls
  const [aspectRatio, setAspectRatio] = useState<string>('16:9')
  
  // Export Resolution Controls
  const [exportResolution, setExportResolution] = useState<string>('M')
  
  const resolutionOptions = {
    'S': { width: 1920, height: 1080, label: 'S' },
    'M': { width: 2880, height: 1800, label: 'M' },
    'L': { width: 3840, height: 2160, label: 'L' },
    'XL': { width: 5120, height: 2880, label: 'XL' }
  }
  
  // Overlay Effects
  const [overlayEnabled, setOverlayEnabled] = useState(false)
  const [overlayType, setOverlayType] = useState<'glass' | 'horizontal-glitch' | 'vertical-glitch' | 'pattern' | 'noise'>('glass')
  const [overlayIntensity, setOverlayIntensity] = useState(0.5)

  const [regenerateTrigger, setRegenerateTrigger] = useState(0)
  const [currentCanvas, setCurrentCanvas] = useState<HTMLCanvasElement | null>(null)

  const handleRegenerate = useCallback(() => {
    handleColorsChange(getRandomMidToneColors(Math.floor(Math.random() * 4) + 2))
    setColorBlobs([]) // Clear positioned blobs to go back to random generation
    setRegenerateTrigger(prev => prev + 1)
  }, [handleColorsChange])

  const handleExport = useCallback(async () => {
    // Get selected resolution settings
    const resolution = resolutionOptions[exportResolution as keyof typeof resolutionOptions]
    if (!resolution) return

    // Calculate canvas dimensions based on current aspect ratio
    const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number)
    const targetAspectRatio = widthRatio / heightRatio
    
    let exportWidth = resolution.width
    let exportHeight = resolution.width / targetAspectRatio
    
    // If height exceeds resolution height, scale to fit height
    if (exportHeight > resolution.height) {
      exportHeight = resolution.height
      exportWidth = resolution.height * targetAspectRatio
    }
    
    exportWidth = Math.round(exportWidth)
    exportHeight = Math.round(exportHeight)

    // Create high-resolution export canvas
    const exportCanvas = document.createElement('canvas')
    const exportCtx = exportCanvas.getContext('2d')
    if (!exportCtx) return

    exportCanvas.width = exportWidth
    exportCanvas.height = exportHeight

    // Call the CanvasRenderer's high-resolution rendering method
    try {
      // Call the renderAtResolution method we exposed on the canvas
      if (currentCanvas && (currentCanvas as any).renderAtResolution) {
        (currentCanvas as any).renderAtResolution(exportCanvas, exportWidth, exportHeight)
      } else {
        // Fallback: just scale up current canvas (lower quality but works)
        exportCtx.drawImage(currentCanvas!, 0, 0, exportWidth, exportHeight)
      }

      // Export as WebP
      exportCanvas.toBlob((blob) => {
        if (!blob) return
        
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `background-${exportWidth}x${exportHeight}-${Date.now()}.webp`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 'image/webp', 0.95)
      
    } catch (error) {
      console.error('Export failed:', error)
    }
  }, [
    exportResolution, 
    aspectRatio, 
    resolutionOptions, 
    currentCanvas, 
    colors, 
    posterizeSteps, 
    noiseIntensity, 
    gradientStyle, 
    gradientIntensity, 
    gradientDensity, 
    colorBlobs, 
    zoomLevel, 
    overlayEnabled, 
    overlayType, 
    overlayIntensity
  ])

  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    setCurrentCanvas(canvas)
  }, [])

  return (
    <main className="flex h-screen bg-neutral-100 dark:bg-neutral-900 transition-colors relative">
      {/* Theme Toggle - Top Right Corner */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      {/* Left Sidebar - Controls Panel */}
      <div className="w-80 h-full overflow-y-auto bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <ControlsPanel
          colors={colors}
          posterizeSteps={posterizeSteps}
          noiseIntensity={noiseIntensity}
          gradientStyle={gradientStyle}
          gradientIntensity={gradientIntensity}
          gradientDensity={gradientDensity}
          onColorsChange={handleColorsChange}
          onPosterizeStepsChange={setPosterizeSteps}
          onNoiseIntensityChange={setNoiseIntensity}
          onGradientStyleChange={setGradientStyle}
          onGradientIntensityChange={setGradientIntensity}
          onGradientDensityChange={setGradientDensity}
          zoomLevel={zoomLevel}
          onZoomLevelChange={setZoomLevel}
          isAnimated={isAnimated}
          onAnimatedChange={setIsAnimated}
          animationSpeed={animationSpeed}
          onAnimationSpeedChange={setAnimationSpeed}
          onColorBlobsChange={setColorBlobs}
          overlayEnabled={overlayEnabled}
          overlayType={overlayType}
          overlayIntensity={overlayIntensity}
          onOverlayEnabledChange={setOverlayEnabled}
          onOverlayTypeChange={setOverlayType}
          onOverlayIntensityChange={setOverlayIntensity}
          aspectRatio={aspectRatio}
          onAspectRatioChange={setAspectRatio}
        />
      </div>
      
      {/* Right Canvas Workspace */}
      <div className="flex-1 h-full p-8 flex items-center justify-center">
        <div className="canvas-container rounded-xl shadow-lg overflow-hidden inline-block relative">
          <CanvasRenderer
          colors={colors}
          posterizeSteps={posterizeSteps}
          noiseIntensity={noiseIntensity}
          gradientStyle={gradientStyle}
          gradientIntensity={gradientIntensity}
          gradientDensity={gradientDensity}
          colorBlobs={colorBlobs}
          zoomLevel={zoomLevel}
          isAnimated={isAnimated}
          animationSpeed={animationSpeed}
          triggerRegenerate={regenerateTrigger}
          overlayEnabled={overlayEnabled}
          overlayType={overlayType}
          overlayIntensity={overlayIntensity}
          aspectRatio={aspectRatio}
          onCanvasReady={handleCanvasReady}
        />
        
        {/* Export Controls Overlay */}
        <div className="absolute top-3 right-3 flex gap-2 items-center">
          <Select value={exportResolution} onValueChange={setExportResolution}>
            <SelectTrigger className="w-16 h-8 bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(resolutionOptions).map(([key, option]) => (
                <SelectItem key={key} value={key} className="text-xs">
                  {key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleExport}
            className="bg-black/70 hover:bg-black/90 text-white backdrop-blur-sm"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
        </div>
      </div>
    </main>
  )
} 