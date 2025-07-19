'use client'

import React, { useState, useRef } from 'react'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Slider } from './ui/slider'
import { Switch } from './ui/switch'
import { Label } from './ui/label'
import { Color, BRAND_COLORS, getRandomMidToneColors } from '@/utils/colors'
import { Shuffle, Plus, X, Palette, Upload, Image } from 'lucide-react'

interface ControlsPanelProps {
  colors: Color[]
  posterizeSteps: number
  noiseIntensity: number
  gradientStyle: 'organic' | 'linear' | 'radial' | 'wave'
  gradientIntensity: number
  gradientDensity: number
  onColorsChange: (colors: Color[]) => void
  onPosterizeStepsChange: (steps: number) => void
  onNoiseIntensityChange: (intensity: number) => void
  onGradientStyleChange: (style: 'organic' | 'linear' | 'radial' | 'wave') => void
  onGradientIntensityChange: (intensity: number) => void
  onGradientDensityChange: (density: number) => void
  zoomLevel: number
  onZoomLevelChange: (zoom: number) => void
  isAnimated: boolean
  onAnimatedChange: (animated: boolean) => void
  animationSpeed: number
  onAnimationSpeedChange: (speed: number) => void
  onColorBlobsChange?: (blobs: any[]) => void
  overlayEnabled: boolean
  overlayType: 'glass' | 'horizontal-glitch' | 'vertical-glitch' | 'pattern' | 'noise'
  overlayIntensity: number
  onOverlayEnabledChange: (enabled: boolean) => void
  onOverlayTypeChange: (type: 'glass' | 'horizontal-glitch' | 'vertical-glitch' | 'pattern' | 'noise') => void
  onOverlayIntensityChange: (intensity: number) => void
  aspectRatio: string
  onAspectRatioChange: (ratio: string) => void
}



export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  colors,
  posterizeSteps,
  noiseIntensity,
  gradientStyle,
  gradientIntensity,
  gradientDensity,
  onColorsChange,
  onPosterizeStepsChange,
  onNoiseIntensityChange,
  onGradientStyleChange,
  onGradientIntensityChange,
  onGradientDensityChange,
  zoomLevel,
  onZoomLevelChange,
  isAnimated,
  onAnimatedChange,
  animationSpeed,
  onAnimationSpeedChange,
  onColorBlobsChange,
  overlayEnabled,
  overlayType,
  overlayIntensity,
  onOverlayEnabledChange,
  onOverlayTypeChange,
  onOverlayIntensityChange,
  aspectRatio,
  onAspectRatioChange
}) => {
  const handleColorSelection = (colorName: string) => {
    if (colorName === 'random') {
      onColorsChange(getRandomMidToneColors(3))
    } else {
      const selectedColor = BRAND_COLORS.find(c => c.name === colorName)
      if (selectedColor) {
        onColorsChange([selectedColor])
      }
    }
  }

  const handleMultiColorSelect = () => {
    onColorsChange(getRandomMidToneColors(Math.floor(Math.random() * 4) + 2))
  }



  // Color distance calculation for finding closest brand color
  const colorDistance = (color1: [number, number, number], color2: [number, number, number]): number => {
    const [r1, g1, b1] = color1
    const [r2, g2, b2] = color2
    return Math.sqrt(Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2))
  }

  // Find closest brand color to a given RGB color
  const findClosestBrandColor = (targetRgb: [number, number, number]): Color => {
    let closestColor = BRAND_COLORS[0]
    let minDistance = Infinity

    BRAND_COLORS.forEach(brandColor => {
      const distance = colorDistance(targetRgb, brandColor.rgb)
      if (distance < minDistance) {
        minDistance = distance
        closestColor = brandColor
      }
    })

    return closestColor
  }

  // Extract positioned color blobs from image
  const extractColorBlobsFromImage = (imageData: ImageData): { colors: Color[]; blobs: any[] } => {
    const data = imageData.data
    const width = imageData.width
    const height = imageData.height
    const colorRegions = new Map<string, { 
      count: number; 
      rgb: [number, number, number];
      positions: { x: number; y: number }[];
      avgX: number;
      avgY: number;
      maxIntensity: number;
    }>()
    
    // Sample every 2nd pixel for better spatial resolution
    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        const i = (y * width + x) * 4
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const alpha = data[i + 3]
        
        // Skip transparent pixels
        if (alpha < 128) continue
        
        // Group similar colors (gentler clustering to preserve nuance)
        const groupedR = Math.floor(r / 20) * 20
        const groupedG = Math.floor(g / 20) * 20
        const groupedB = Math.floor(b / 20) * 20
        const colorKey = `${groupedR}-${groupedG}-${groupedB}`
        
        // Calculate color intensity (how vibrant/bright it is)
        const intensity = Math.sqrt(r * r + g * g + b * b) / 255
        
        if (colorRegions.has(colorKey)) {
          const region = colorRegions.get(colorKey)!
          region.count++
          region.positions.push({ x: x / width, y: y / height })
          region.avgX = (region.avgX * (region.count - 1) + x / width) / region.count
          region.avgY = (region.avgY * (region.count - 1) + y / height) / region.count
          region.maxIntensity = Math.max(region.maxIntensity, intensity)
        } else {
          colorRegions.set(colorKey, { 
            count: 1, 
            rgb: [groupedR, groupedG, groupedB],
            positions: [{ x: x / width, y: y / height }],
            avgX: x / width,
            avgY: y / height,
            maxIntensity: intensity
          })
        }
      }
    }
    
    // Get the most significant color regions (by count and intensity)
    const sortedRegions = Array.from(colorRegions.entries())
      .sort((a, b) => (b[1].count * b[1].maxIntensity) - (a[1].count * a[1].maxIntensity))
      .slice(0, 12) // Top 12 color regions
    
    // Convert to brand colors and create positioned blobs
    const colorBlobs: any[] = []
    const uniqueColors = new Set<string>()
    
    sortedRegions.forEach(([_, regionData]) => {
      const brandColor = findClosestBrandColor(regionData.rgb)
      
      // Create multiple blobs for each color region if it's spread out
      if (regionData.positions.length > 20) {
        // For widespread colors, create multiple positioned blobs
        const numBlobs = Math.min(3, Math.floor(regionData.positions.length / 30))
        
        // Cluster positions into groups
        for (let i = 0; i < numBlobs; i++) {
          const startIndex = Math.floor(i * regionData.positions.length / numBlobs)
          const endIndex = Math.floor((i + 1) * regionData.positions.length / numBlobs)
          const cluster = regionData.positions.slice(startIndex, endIndex)
          
          const clusterX = cluster.reduce((sum, pos) => sum + pos.x, 0) / cluster.length
          const clusterY = cluster.reduce((sum, pos) => sum + pos.y, 0) / cluster.length
          
          colorBlobs.push({
            color: brandColor,
            x: clusterX,
            y: clusterY,
            radius: 0.15 + Math.random() * 0.15, // Vary blob sizes
            intensity: regionData.maxIntensity * (0.7 + Math.random() * 0.3)
          })
        }
      } else {
        // For concentrated colors, create single positioned blob
        colorBlobs.push({
          color: brandColor,
          x: regionData.avgX,
          y: regionData.avgY,
          radius: 0.1 + Math.random() * 0.2,
          intensity: regionData.maxIntensity
        })
      }
      
      uniqueColors.add(brandColor.hex)
    })
    
    // Get unique colors for the color palette - fix the extraction logic
    const uniqueColorObjects: Color[] = []
    const seenHexes = new Set<string>()
    
    colorBlobs.forEach(blob => {
      if (blob && blob.color && !seenHexes.has(blob.color.hex)) {
        uniqueColorObjects.push(blob.color)
        seenHexes.add(blob.color.hex)
      }
    })
    
    const colors = uniqueColorObjects.slice(0, 6) // Top 6 colors
    
    return { colors, blobs: colorBlobs.filter(blob => blob && blob.color) }
  }

  // Analyze image composition to determine gradient style
  const analyzeComposition = (imageData: ImageData): { style: string; intensity: number; density: number } => {
    const data = imageData.data
    const width = imageData.width
    const height = imageData.height
    
    // Calculate brightness gradient in different directions
    let horizontalGradient = 0
    let verticalGradient = 0
    let radialGradient = 0
    let complexity = 0
    
    const centerX = width / 2
    const centerY = height / 2
    
    // Sample brightness changes
    for (let y = 0; y < height; y += 4) {
      for (let x = 0; x < width; x += 4) {
        const i = (y * width + x) * 4
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
        
        // Check horizontal gradient
        if (x > 0) {
          const prevI = (y * width + x - 4) * 4
          const prevBrightness = (data[prevI] + data[prevI + 1] + data[prevI + 2]) / 3
          horizontalGradient += Math.abs(brightness - prevBrightness)
        }
        
        // Check vertical gradient
        if (y > 0) {
          const prevI = ((y - 4) * width + x) * 4
          const prevBrightness = (data[prevI] + data[prevI + 1] + data[prevI + 2]) / 3
          verticalGradient += Math.abs(brightness - prevBrightness)
        }
        
        // Check radial pattern
        const distanceFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2))
        const normalizedDistance = distanceFromCenter / (Math.sqrt(width * width + height * height) / 2)
        radialGradient += brightness * (1 - normalizedDistance)
        
        // Complexity based on local variance
        complexity += Math.abs(brightness - 128) / 128
      }
    }
    
    // Determine best gradient style
    let style = 'organic'
    if (horizontalGradient > verticalGradient && horizontalGradient > radialGradient) {
      style = 'linear'
    } else if (radialGradient > horizontalGradient && radialGradient > verticalGradient) {
      style = 'radial'
    } else if (complexity > width * height * 0.1) {
      style = Math.random() > 0.5 ? 'spiral' : 'wave'
    }
    
    // Calculate intensity and density based on image characteristics
    const avgComplexity = complexity / (width * height / 16)
    const intensity = Math.max(0.4, Math.min(1.0, avgComplexity))
    const density = Math.max(0.3, Math.min(1.2, avgComplexity * 1.5))
    
    return { style, intensity, density }
  }

  // Handle image upload and analysis
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file')
      return
    }
    
    setIsAnalyzing(true)
    
    try {
      // Create image URL for preview
      const imageUrl = URL.createObjectURL(file)
      setUploadedImage(imageUrl)
      
      // Create canvas for analysis
      const img = new globalThis.Image()
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            throw new Error('Could not get canvas context')
          }
          
          // Resize for faster processing
          const maxSize = 200
          const scale = Math.min(maxSize / img.width, maxSize / img.height)
          canvas.width = img.width * scale
          canvas.height = img.height * scale
          
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          
          // Validate image data
          if (!imageData || imageData.data.length === 0) {
            throw new Error('Could not extract image data')
          }
          
          // Extract colors and positioned blobs
          const { colors: extractedColors, blobs: colorBlobs } = extractColorBlobsFromImage(imageData)
          const composition = analyzeComposition(imageData)
          
          // Apply the analysis results with better validation
          if (extractedColors && extractedColors.length > 0) {
            console.log('Extracted colors from image:', extractedColors.length)

            onColorsChange(extractedColors)
          } else {
            console.log('No colors extracted, using fallback')
            // Fallback to random colors if no colors extracted
            onColorsChange(getRandomMidToneColors(3))
          }
          
          // Pass the positioned color blobs to the parent with validation
          if (onColorBlobsChange && colorBlobs && colorBlobs.length > 0) {
            // Validate blobs before passing
            const validBlobs = colorBlobs.filter(blob => 
              blob && blob.color && blob.color.hex &&
              typeof blob.x === 'number' && typeof blob.y === 'number' &&
              typeof blob.radius === 'number' && typeof blob.intensity === 'number' &&
              blob.x >= 0 && blob.x <= 1 && blob.y >= 0 && blob.y <= 1
            )
            console.log('Valid blobs created:', validBlobs.length, 'out of', colorBlobs.length)
            onColorBlobsChange(validBlobs)
          } else {
            console.log('No valid color blobs to pass')
          }
          
          onGradientStyleChange(composition.style as any)
          onGradientIntensityChange(composition.intensity)
          onGradientDensityChange(composition.density)
          
          setIsAnalyzing(false)
          URL.revokeObjectURL(imageUrl)
        } catch (analysisError) {
          console.error('Error during image analysis:', analysisError)
          setIsAnalyzing(false)
          URL.revokeObjectURL(imageUrl)
          // Fallback to random colors if analysis fails
          onColorsChange(getRandomMidToneColors(3))
        }
      }
      
      img.onerror = () => {
        console.error('Error loading image')
        setIsAnalyzing(false)
        URL.revokeObjectURL(imageUrl)
        onColorsChange(getRandomMidToneColors(3))
      }
      
      img.src = imageUrl
    } catch (error) {
      console.error('Error analyzing image:', error)
      setIsAnalyzing(false)
      // Fallback to random colors
      onColorsChange(getRandomMidToneColors(3))
    }
  }

  const handleImageUploadClick = () => {
    fileInputRef.current?.click()
  }

  const clearUploadedImage = () => {
    setUploadedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const [colorPickerIndex, setColorPickerIndex] = useState<number | null>(null)
  const [customColor, setCustomColor] = useState('#ff0000')
  const [selectedColorFamily, setSelectedColorFamily] = useState<string>('All')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleColorClick = (index: number) => {
    setColorPickerIndex(index)
    setCustomColor(colors[index]?.hex || '#ff0000')
    setSelectedColorFamily('All') // Reset to show all colors when opening
  }

  // Filter colors by selected family
  const getFilteredColors = () => {
    if (selectedColorFamily === 'All') {
      return BRAND_COLORS
    }
    return BRAND_COLORS.filter(color => 
      color.name.toLowerCase().includes(selectedColorFamily.toLowerCase())
    )
  }

  const handleColorChange = (newColor: string) => {
    setCustomColor(newColor)
  }

  const handleColorConfirm = () => {
    if (colorPickerIndex !== null) {
      const selectedBrandColor = BRAND_COLORS.find(c => c.hex === customColor)
      if (selectedBrandColor) {
        const newColors = [...colors]
        newColors[colorPickerIndex] = selectedBrandColor
        onColorsChange(newColors)
      }
    }
    setColorPickerIndex(null)
  }

  const handleAddColor = () => {
    if (colors.length < 6) {
      // Pick a random brand color that's not already in use
      const usedColors = new Set(colors.map(c => c.hex))
      const availableColors = BRAND_COLORS.filter(c => !usedColors.has(c.hex))
      
      if (availableColors.length > 0) {
        const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)]
        onColorsChange([...colors, randomColor])
      }
    }
  }

  const handleRemoveColor = (index: number) => {
    if (colors.length > 2) {
      const newColors = colors.filter((_, i) => i !== index)
      onColorsChange(newColors)
    }
  }



  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-800">WoW:BG</h2>
          <p className="text-sm text-gray-600">Create beautiful, stylized backgrounds</p>
        </div>
        
        {/* Color Selection */}
        <div className="space-y-2">
          <Label>Colors ({colors.length})</Label>
          <div className="flex gap-2">
            <Select onValueChange={handleColorSelection}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select color" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                <SelectItem value="random">Random Mix</SelectItem>
                {BRAND_COLORS.map((color) => (
                  <SelectItem key={color.name} value={color.name}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full border border-gray-300" 
                        style={{ backgroundColor: color.hex }}
                      />
                      {color.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleMultiColorSelect}>
              <Shuffle className="w-4 h-4" />
            </Button>
          </div>
          
                    {/* Interactive Color Swatches */}
          <div className="flex flex-wrap gap-2 mt-2">
                          {colors.map((color, index) => {
                console.log(`Swatch ${index}: visual=${color.hex}, name=${color.name}, full object:`, color);
                return (
                  <div key={`${index}-${color.hex}`} className="relative group">
                                  <div
                  className={`swatch-${index}-${color.hex.replace('#', '')}`}
                  style={{ 
                    width: '32px',
                    height: '32px',
                    borderRadius: '16px',
                    border: '2px solid #ccc',
                    cursor: 'pointer',
                    position: 'relative',
                    display: 'inline-block'
                  }}
                  title={`${color.name} (${color.hex}) - Click to change`}
                  data-color-hex={color.hex}
                  ref={(el) => {
                    if (el) {
                      el.style.setProperty('background-color', color.hex, 'important');
                      el.style.setProperty('background', color.hex, 'important');
                      console.log(`Applied ${color.hex} to swatch ${index}, computed style:`, getComputedStyle(el).backgroundColor);
                    }
                  }}
                    onClick={() => {
                      console.log(`Clicked swatch ${index}:`, color);
                      handleColorClick(index);
                    }}
                                    />
                  {colors.length > 2 && (
                    <button
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      onClick={() => handleRemoveColor(index)}
                      title="Remove color"
                    >
                      <X className="w-2 h-2" />
                    </button>
                  )}
                </div>
              );
            })}
            {colors.length < 6 && (
              <Button
                variant="outline"
                size="sm"
                className="w-8 h-8 p-0 rounded-full"
                onClick={handleAddColor}
                title="Add color"
              >
                <Plus className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Brand Color Picker Modal */}
        {colorPickerIndex !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold mb-3">
                  Choose Brand Color {colorPickerIndex + 1}
                </h3>
                
                {/* Current Color Preview */}
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
                  <div
                    className="w-16 h-16 rounded-xl border border-gray-300 shadow-sm"
                    style={{ backgroundColor: customColor }}
                  />
                  <div>
                    <Label className="text-base font-medium">Current Selection</Label>
                    <p className="text-lg font-mono text-gray-700 mt-1">{customColor}</p>
                    <p className="text-sm text-gray-500">
                      {BRAND_COLORS.find(c => c.hex === customColor)?.name || 'Custom Color'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Color Family Tabs */}
              <div className="p-6 pb-4 border-b border-gray-200">
                <Label className="text-base font-medium mb-3 block">Browse by Family</Label>
                <div className="flex flex-wrap gap-2">
                  {['All', 'Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple', 'Pink'].map(family => {
                    const familyCount = family === 'All' 
                      ? BRAND_COLORS.length 
                      : BRAND_COLORS.filter(c => c.name.toLowerCase().includes(family.toLowerCase())).length
                    
                    return (
                      <Button
                        key={family}
                        variant={selectedColorFamily === family ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedColorFamily(family)}
                        className="text-sm"
                      >
                        {family} ({familyCount})
                      </Button>
                    )
                  })}
                </div>
              </div>
              
              {/* Color Grid */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">
                      {selectedColorFamily === 'All' ? 'All Colors' : `${selectedColorFamily} Colors`}
                    </Label>
                    <span className="text-sm text-gray-500">
                      {getFilteredColors().length} colors
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-8 gap-3">
                    {getFilteredColors().map((color) => (
                      <div
                        key={color.name}
                        className={`relative group cursor-pointer`}
                        onClick={() => handleColorChange(color.hex)}
                      >
                        <div
                          className={`w-12 h-12 rounded-xl border-3 transition-all duration-200 hover:scale-110 hover:shadow-lg ${
                            customColor === color.hex 
                              ? 'border-blue-500 shadow-lg ring-2 ring-blue-200' 
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          style={{ backgroundColor: color.hex }}
                        />
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                          {color.name}
                        </div>
                        
                        {/* Selected indicator */}
                        {customColor === color.hex && (
                          <div className="absolute top-1 right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex gap-3">
                  <Button onClick={handleColorConfirm} className="flex-1 text-base py-2">
                    <Palette className="w-5 h-5 mr-2" />
                    Apply Color
                  </Button>
                  <Button variant="outline" onClick={() => setColorPickerIndex(null)} className="text-base py-2 px-6">
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

{/* Image Analysis - Hidden due to performance issues */}
        {false && (
        <div className="space-y-2">
          <Label>AI Image Analysis</Label>
          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleImageUploadClick}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </>
              )}
            </Button>
            
            {uploadedImage && (
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                <Image className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600 flex-1">Image analyzed</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={clearUploadedImage}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
            
            <p className="text-xs text-gray-500">
              Upload an image to extract colors and composition. Creates an abstract, hyper-zoomed gradient inspired by your photo.
            </p>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
        )}



        {/* Gradient Style */}
        <div className="space-y-2">
          <Label>Gradient Style</Label>
          <Select value={gradientStyle} onValueChange={onGradientStyleChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select gradient style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="organic">Organic Blobs</SelectItem>
              <SelectItem value="linear">Linear Flow</SelectItem>
              <SelectItem value="radial">Radial Burst</SelectItem>

              <SelectItem value="wave">Gradient Mesh</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Canvas Aspect Ratio */}
        <div className="space-y-2">
          <Label>Canvas Size</Label>
          <Select value={aspectRatio} onValueChange={onAspectRatioChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select aspect ratio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1:1">Square (1:1)</SelectItem>
              <SelectItem value="3:4">Portrait (3:4)</SelectItem>
              <SelectItem value="4:3">Landscape (4:3)</SelectItem>
              <SelectItem value="16:9">Widescreen (16:9)</SelectItem>
              <SelectItem value="9:16">Mobile (9:16)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Gradient Intensity */}
        <div className="space-y-2">
          <Label>Intensity: {Math.round(gradientIntensity * 100)}%</Label>
          <Slider
            value={[gradientIntensity]}
            onValueChange={(value) => onGradientIntensityChange(value[0])}
            min={0.1}
            max={1.2}
            step={0.1}
            className="w-full"
          />
          <p className="text-xs text-gray-500">
            Controls how bold and dramatic the colors appear
          </p>
        </div>

        {/* Contextual Gradient Control */}
        <div className="space-y-2">
          <Label>
            {gradientStyle === 'organic' && `Complexity: ${Math.round(gradientDensity * 100)}%`}
            {gradientStyle === 'linear' && `Layers: ${Math.round(gradientDensity * 100)}%`}
            {gradientStyle === 'radial' && `Centers: ${Math.round(gradientDensity * 100)}%`}
            
                          {gradientStyle === 'wave' && `Density: ${Math.round(gradientDensity * 100)}%`}
          </Label>
          <Slider
            value={[gradientDensity]}
            onValueChange={(value) => onGradientDensityChange(value[0])}
            min={0.2}
            max={1.5}
            step={0.1}
            className="w-full"
          />
          <p className="text-xs text-gray-500">
            {gradientStyle === 'organic' && 'More complexity = more color blobs'}
            {gradientStyle === 'linear' && 'More layers = richer gradient depth'}
            {gradientStyle === 'radial' && 'More centers = multiple focal points'}
            
                          {gradientStyle === 'wave' && 'Higher density = more triangular mesh zones'}
          </p>
        </div>

        {/* Zoom Level */}
        <div className="space-y-2">
          <Label>
            Zoom: {zoomLevel < 1 ? `${Math.round(zoomLevel * 100)}%` : `${zoomLevel.toFixed(1)}x`}
          </Label>
          <Slider
            value={[zoomLevel]}
            onValueChange={(value) => onZoomLevelChange(value[0])}
            min={0.2}
            max={3.0}
            step={0.1}
            className="w-full"
          />
          <p className="text-xs text-gray-500">
            Zoom in for fine details, zoom out for broader patterns
          </p>
        </div>

        {/* Animation Controls - Hidden for now due to performance issues */}
        {false && (
          <div className="space-y-3 border-t pt-3">
            <h3 className="text-sm font-medium text-gray-700">Animation</h3>
            
            {/* Animation Toggle */}
            <div className="flex items-center space-x-2">
              <Switch 
                checked={isAnimated} 
                onCheckedChange={onAnimatedChange}
                id="animation-toggle"
              />
              <Label htmlFor="animation-toggle" className="text-sm">
                Slow Morphing
              </Label>
            </div>
            
            {/* Animation Speed */}
            {isAnimated && (
              <div className="space-y-2">
                <Label>
                  Speed: {
                    animationSpeed <= 0.3 ? 'Glacial' :
                    animationSpeed <= 0.5 ? 'Very Slow' : 
                    animationSpeed <= 0.8 ? 'Slow' :
                    animationSpeed <= 1.2 ? 'Normal' : 
                    animationSpeed <= 1.5 ? 'Fast' : 'Very Fast'
                  }
                </Label>
                <Slider
                  value={[animationSpeed]}
                  onValueChange={(value) => onAnimationSpeedChange(value[0])}
                  min={0.2}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Very slow = meditative, subtle morphing
                </p>
              </div>
            )}
          </div>
        )}

        {/* Posterize Steps - temporarily disabled for smooth gradients */}
        {/* <div className="space-y-2">
          <Label>Posterize Steps: {posterizeSteps}</Label>
          <Slider
            value={[posterizeSteps]}
            onValueChange={(value) => onPosterizeStepsChange(value[0])}
            min={4}
            max={16}
            step={1}
            className="w-full"
          />
        </div> */}

        {/* Noise Intensity */}
        <div className="space-y-2">
          <Label>Grain Amount: {Math.round(noiseIntensity * 100)}%</Label>
          <Slider
            value={[noiseIntensity]}
            onValueChange={(value) => onNoiseIntensityChange(value[0])}
            min={0}
            max={0.5}
            step={0.01}
            className="w-full"
          />
          <p className="text-xs text-gray-500">
            Adds organic film-like texture to the background
          </p>
        </div>

        {/* Overlay Effects */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Overlay Effects</Label>
            <Switch 
              checked={overlayEnabled} 
              onCheckedChange={onOverlayEnabledChange}
              id="overlay-toggle"
            />
          </div>
          
          {overlayEnabled && (
            <div className="space-y-3 pl-2 border-l-2 border-gray-200">
              {/* Effect Type Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Effect Type</Label>
                <Select value={overlayType} onValueChange={onOverlayTypeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="glass">Glass Ripple</SelectItem>
                    <SelectItem value="horizontal-glitch">Horizontal Scanline</SelectItem>
              <SelectItem value="vertical-glitch">Vertical Scanline</SelectItem>
                    <SelectItem value="pattern">Pattern Overlay</SelectItem>
                    <SelectItem value="noise">Noise Pulse</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Effect Intensity */}
              <div className="space-y-2">
                <Label className="text-sm">
                  Intensity: {Math.round(overlayIntensity * 100)}%
                </Label>
                <Slider
                  value={[overlayIntensity]}
                  onValueChange={(value) => onOverlayIntensityChange(value[0])}
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  {overlayType === 'glass' && 'Vertical sine wave distortion'}
                  {overlayType === 'horizontal-glitch' && 'Digital horizontal scanline displacement'}
                  {overlayType === 'vertical-glitch' && 'Digital vertical scanline displacement'}
                  {overlayType === 'pattern' && 'Semi-transparent dot overlay'}
                  {overlayType === 'noise' && 'RGB-split noise blocks'}
                </p>
              </div>
            </div>
          )}
        </div>


      </div>
    </div>
  )
} 