'use client'

import { useRef, useEffect, useCallback } from 'react'
import { Color } from '@/utils/colors'

interface ColorBlob {
  color: Color
  x: number
  y: number
  radius: number
  intensity: number
}

interface CanvasRendererProps {
  colors: Color[]
  posterizeSteps: number
  noiseIntensity: number
  gradientStyle: 'organic' | 'linear' | 'radial' | 'wave' | 'sunburst'
  gradientIntensity: number
  gradientDensity: number
  colorBlobs?: ColorBlob[]
  zoomLevel: number
  isAnimated: boolean
  animationSpeed: number
  triggerRegenerate: number
  overlayEnabled?: boolean
  overlayType?: 'glass' | 'horizontal-glitch' | 'vertical-glitch' | 'pattern' | 'noise'
  overlayIntensity?: number
  aspectRatio?: string
  rippleEnabled?: boolean
  rippleFrequencyX?: number
  rippleFrequencyY?: number
  rippleAmplitudeX?: number
  rippleAmplitudeY?: number
  onCanvasReady: (canvas: HTMLCanvasElement) => void
}

// Utility function to ensure valid hex colors for canvas
const sanitizeHexColor = (hexColor: string): string => {
  if (!hexColor || typeof hexColor !== 'string') return '#ffffff'
  
  // Remove # and any extra characters, keep only first 6 characters
  const cleanHex = hexColor.replace('#', '').substring(0, 6)
  
  // Validate hex characters
  if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
    console.warn(`Invalid hex color "${hexColor}", defaulting to #ffffff`)
    return '#ffffff'
  }
  
  return `#${cleanHex}`
}

export const CanvasRenderer: React.FC<CanvasRendererProps> = ({
  colors,
  posterizeSteps,
  noiseIntensity,
  gradientStyle,
  gradientIntensity,
  gradientDensity,
  colorBlobs,
  zoomLevel,
  isAnimated,
  animationSpeed,
  triggerRegenerate,
  overlayEnabled = false,
  overlayType = 'glass',
  overlayIntensity = 0.5,
  aspectRatio = '16:9',
  rippleEnabled = false,
  rippleFrequencyX = 0.02,
  rippleFrequencyY = 0.015,
  rippleAmplitudeX = 8,
  rippleAmplitudeY = 12,
  onCanvasReady
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()
  const startTimeRef = useRef<number>(Date.now())

  // Create gradients that scale from subtle to dramatic based on intensity  
  const createOrganicGradient = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number = 0) => {
    // Scale intensity and density to maintain same strength with 0-100% UI range
    const scaledIntensity = gradientIntensity * 1.2 // Maintain 120% internal strength
    const scaledDensity = gradientDensity * 1.5 // Maintain 150% internal strength
    
    // Always use solid background color - never transparent
    const baseColor = colors[0] || { hex: '#ffffff' }
    ctx.fillStyle = baseColor.hex
    ctx.fillRect(0, 0, width, height)
    
    // Use positioned blobs if available from image analysis
    if (colorBlobs && colorBlobs.length > 0) {
      // Limit blobs based on complexity setting
      const maxBlobs = Math.floor(2 + (scaledDensity * 8)) // 2-10 blobs based on complexity
      const selectedBlobs = colorBlobs.slice(0, maxBlobs)
      
      // Create positioned blobs with intensity-based contrast
      selectedBlobs.forEach((blob, index) => {
        // Safety check for blob properties
        if (!blob || typeof blob.x !== 'number' || typeof blob.y !== 'number' ||
            typeof blob.radius !== 'number' || typeof blob.intensity !== 'number') {
          return // Skip invalid blobs
        }
        
        // Use colors from main state, not from blob.color - this ensures sync with ControlsPanel
        const color = colors[index % colors.length]
        const safeHex = sanitizeHexColor(color?.hex)
        
        // Base positions with optional animation drift
        let x = blob.x * width
        let y = blob.y * height
        
        // Add very subtle, slow animation drift if enabled
        if (isAnimated) {
          const smoothTime = time * 0.0001 * animationSpeed // Even slower and smoother
          const driftAmount = Math.min(width, height) * 0.005 // Tiny movements
          const uniqueOffset = index * 2.7 // Different stagger for more organic feel
          
          // Use multiple smooth sine waves for ultra-smooth movement
          x += (Math.sin(smoothTime + uniqueOffset) * 0.7 + Math.sin(smoothTime * 1.3 + uniqueOffset + 1) * 0.3) * driftAmount
          y += (Math.cos(smoothTime * 0.8 + uniqueOffset + 1.5) * 0.6 + Math.cos(smoothTime * 1.1 + uniqueOffset + 3) * 0.4) * driftAmount
        }
        // Size scales with intensity: smaller at low intensity, larger at high intensity
        const sizeMultiplier = 0.5 + (scaledIntensity * 1.5)
        let radius = blob.radius * Math.min(width, height) * scaledIntensity * sizeMultiplier
        
        // Add very subtle breathing animation if enabled
        if (isAnimated) {
          const smoothTime = time * 0.00015 * animationSpeed // Ultra smooth breathing
          const pulseAmount = 1 + (Math.sin(smoothTime + index * 2.1) * 0.5 + Math.sin(smoothTime * 1.4 + index * 1.3 + 2) * 0.5) * 0.02 // ±2% variation
          radius *= pulseAmount
        }
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
        
        // Balanced opacity that ensures all colors are visible
        // Adjust opacity based on color index to prevent single color dominance
        const baseOpacity = 0.3 + scaledIntensity * 0.5 // 30%-80% range
        const colorBalance = Math.max(0.3, 1 - (index * 0.05)) // Ensure minimum 30% opacity, gentler reduction
        const centerOpacity = Math.max(0, Math.min(255, Math.floor(baseOpacity * colorBalance * 255)))
        const midOpacity = Math.max(0, Math.min(255, Math.floor(centerOpacity * 0.7)))
        const centerHex = centerOpacity.toString(16).padStart(2, '0')
        const midHex = midOpacity.toString(16).padStart(2, '0')
        
        gradient.addColorStop(0, `${safeHex}${centerHex}`)
        gradient.addColorStop(0.6, `${safeHex}${midHex}`)
        gradient.addColorStop(1, `${safeHex}00`)
        
        // Balanced blend modes that give each color equal representation
        if (index === 0) {
          ctx.globalCompositeOperation = 'source-over'
        } else {
          // Use alternating blend modes for better color balance
          // This ensures no single color dominates regardless of brightness
          const blendModes: GlobalCompositeOperation[] = ['overlay', 'soft-light', 'hard-light', 'multiply', 'screen']
          ctx.globalCompositeOperation = blendModes[index % blendModes.length]
        }
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, 2 * Math.PI)
        ctx.fill()
      })
      
      // At high complexity, add extra random blobs using main colors for consistency
      if (gradientDensity > 0.8) {
        const extraBlobCount = Math.floor((gradientDensity - 0.8) * 10) // 0-2 extra blobs
        
        for (let i = 0; i < extraBlobCount; i++) {
          const randomColor = colors[i % colors.length] // Use main colors for consistency
          
          // Use seeded positions for consistency across frames
          const seed = (i + 1000) * 9876 // Different seed from main blobs
          const baseX = (Math.sin(seed) * 0.5 + 0.5) * width
          const baseY = (Math.cos(seed * 1.4) * 0.5 + 0.5) * height
          
          let x = baseX
          let y = baseY
          
          // Add ultra-smooth animation
          if (isAnimated) {
            const smoothTime = time * 0.0001 * animationSpeed
            const driftAmount = Math.min(width, height) * 0.004
            const uniqueOffset = (i + 1000) * 2.7
            
            x += (Math.sin(smoothTime + uniqueOffset) * 0.5 + Math.sin(smoothTime * 1.25 + uniqueOffset + 1) * 0.5) * driftAmount
            y += (Math.cos(smoothTime * 0.8 + uniqueOffset + 2) * 0.6 + Math.cos(smoothTime * 1.1 + uniqueOffset + 4) * 0.4) * driftAmount
          }
          
          // Seeded size with ultra-smooth breathing animation
          const baseRadius = (0.15 + (Math.sin(seed * 2.7) * 0.5 + 0.5) * 0.25) * Math.min(width, height) * gradientIntensity
          let radius = baseRadius
          
          if (isAnimated) {
            const smoothTime = time * 0.00015 * animationSpeed
            const pulseAmount = 1 + (Math.sin(smoothTime + i * 2.1 + 5) * 0.3 + Math.sin(smoothTime * 1.4 + i * 1.8 + 8) * 0.7) * 0.015
            radius *= pulseAmount
          }
          
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
          
          const centerOpacity = Math.floor((0.2 + gradientIntensity * 0.6) * 255)
          const midOpacity = Math.floor(centerOpacity * 0.6)
          const centerHex = centerOpacity.toString(16).padStart(2, '0')
          const midHex = midOpacity.toString(16).padStart(2, '0')
          
          gradient.addColorStop(0, `${randomColor.hex}${centerHex}`)
          gradient.addColorStop(0.6, `${randomColor.hex}${midHex}`)
          gradient.addColorStop(1, `${randomColor.hex}00`)
          
          // Use balanced blend mode for extra blobs
          const blendModes: GlobalCompositeOperation[] = ['soft-light', 'overlay', 'multiply']
          ctx.globalCompositeOperation = blendModes[i % blendModes.length]
          
          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(x, y, radius, 0, 2 * Math.PI)
          ctx.fill()
        }
      }
    } else {
      // Dramatic shape count scaling with complexity
      const minShapes = 2
      const maxShapes = 15 
      const baseCount = Math.floor(minShapes + (gradientDensity * (maxShapes - minShapes)))
      const intensityBonus = Math.floor(gradientIntensity * 3) // +0 to +3 from intensity
      const shapeCount = baseCount + intensityBonus
      
      for (let i = 0; i < shapeCount; i++) {
        const color = colors[i % colors.length]
        
        // Base position (seeded random for consistency across frames)
        const seed = i * 12345 // Consistent seed for each blob
        const baseX = (Math.sin(seed) * 0.5 + 0.5) * width // Convert -1,1 to 0,1 range  
        const baseY = (Math.cos(seed * 1.3) * 0.5 + 0.5) * height
        
        let x = baseX
        let y = baseY
        
        // Add very subtle animation drift if enabled
        if (isAnimated) {
          const smoothTime = time * 0.0001 * animationSpeed // Ultra smooth
          const driftAmount = Math.min(width, height) * 0.004 // Tiny movements
          const uniqueOffset = i * 2.5
          
          // Multiple smooth sine waves for ultra-smooth movement
          x += (Math.sin(smoothTime + uniqueOffset) * 0.6 + Math.sin(smoothTime * 1.2 + uniqueOffset + 0.5) * 0.4) * driftAmount
          y += (Math.cos(smoothTime * 0.75 + uniqueOffset + 1) * 0.7 + Math.cos(smoothTime * 1.15 + uniqueOffset + 2.5) * 0.3) * driftAmount
        }  
        
        // Size scaling with intensity AND complexity for more variation  
        const baseSize = 0.15 + (gradientIntensity * 0.4) // 15% to 55% of canvas
        const complexityVariation = (Math.sin(seed * 2.1) * 0.5 + 0.5) * (0.1 + gradientDensity * 0.3) // Seeded variation
        let radius = Math.min(width, height) * (baseSize + complexityVariation) * gradientIntensity
        
        // Add very subtle breathing animation if enabled  
        if (isAnimated) {
          const smoothTime = time * 0.00015 * animationSpeed // Ultra smooth breathing
          const pulseAmount = 1 + (Math.sin(smoothTime + i * 2.3) * 0.4 + Math.sin(smoothTime * 1.3 + i * 1.6 + 1.5) * 0.6) * 0.015 // ±1.5% variation
          radius *= pulseAmount
        }
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
        
        // Balanced opacity for non-blob organic gradients
        const baseOpacity = 0.3 + gradientIntensity * 0.5
        const colorBalance = Math.max(0.3, 1 - (i * 0.04)) // Ensure minimum 30% opacity, gentler reduction
        const centerOpacity = Math.max(0, Math.min(255, Math.floor(baseOpacity * colorBalance * 255)))
        const midOpacity = Math.max(0, Math.min(255, Math.floor(centerOpacity * 0.7)))
        const centerHex = centerOpacity.toString(16).padStart(2, '0')
        const midHex = midOpacity.toString(16).padStart(2, '0')
        
        gradient.addColorStop(0, `${color.hex}${centerHex}`)
        gradient.addColorStop(0.6, `${color.hex}${midHex}`)
        gradient.addColorStop(1, `${color.hex}00`)
        
        // Balanced blend modes for non-blob organic gradients
        if (i === 0) {
          ctx.globalCompositeOperation = 'source-over'
        } else {
          // Use alternating blend modes for better color balance
          const blendModes: GlobalCompositeOperation[] = ['overlay', 'soft-light', 'hard-light', 'multiply', 'screen']
          ctx.globalCompositeOperation = blendModes[i % blendModes.length]
        }
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, 2 * Math.PI)
        ctx.fill()
      }
      
      // Add overlay effects only at higher intensities
      if (gradientIntensity > 0.5) {
        const overlayCount = Math.floor((gradientIntensity - 0.5) * 2 * gradientDensity * 6) // 0-6 overlays
        
        for (let i = 0; i < overlayCount; i++) {
          const color = colors[Math.floor(Math.random() * colors.length)]
          const x = Math.random() * width
          const y = Math.random() * height
          const radius = Math.min(width, height) * (0.4 + Math.random() * 0.6) * gradientIntensity
          
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
          
          const overlayAlpha = Math.max(0, Math.min(255, Math.floor((gradientIntensity - 0.5) * 2 * 0.8 * 255)))
          const overlayOpacity = overlayAlpha.toString(16).padStart(2, '0')
          gradient.addColorStop(0, `${color.hex}${overlayOpacity}`)
          gradient.addColorStop(0.4, `${color.hex}80`) // 50%
          gradient.addColorStop(0.7, `${color.hex}40`) // 25%
          gradient.addColorStop(1, `${color.hex}00`)
          
          ctx.globalCompositeOperation = 'overlay'
          ctx.fillStyle = gradient
          ctx.fillRect(0, 0, width, height)
        }
      }
      
      // Add accent spots only at highest intensities
      if (gradientIntensity > 0.7) {
        const accentCount = Math.floor((gradientIntensity - 0.7) * 3.33 * gradientDensity * 3) // 0-3 accents
        
        for (let i = 0; i < accentCount; i++) {
          const color = colors[Math.floor(Math.random() * colors.length)]
          const x = Math.random() * width
          const y = Math.random() * height
          const radius = Math.min(width, height) * (0.2 + Math.random() * 0.3) * gradientIntensity
          
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
          
          gradient.addColorStop(0, color.hex) // Full opacity
          gradient.addColorStop(0.5, `${color.hex}AA`) // 65% opacity
          gradient.addColorStop(0.8, `${color.hex}33`) // 20% opacity
          gradient.addColorStop(1, `${color.hex}00`) // Transparent
          
          ctx.globalCompositeOperation = 'soft-light'
          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(x, y, radius, 0, 2 * Math.PI)
          ctx.fill()
        }
      }
    }
  }, [colors, gradientIntensity, gradientDensity, colorBlobs, isAnimated, animationSpeed])

  // Create linear flowing gradients with balanced layering and blend modes
  const createLinearGradient = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number = 0) => {
    // Scale intensity and density to maintain same strength with 0-100% UI range
    const scaledIntensity = gradientIntensity * 1.2 // Maintain 120% internal strength
    const scaledDensity = gradientDensity * 1.5 // Maintain 150% internal strength
    
    // Always use solid background color
    const baseColor = colors[0] || { hex: '#ffffff' }
    ctx.fillStyle = baseColor.hex
    ctx.fillRect(0, 0, width, height)
    
    // Smart layer count scaling
    const minLayers = 3
    const maxLayers = 12
    const baseLayers = Math.floor(minLayers + (scaledDensity * (maxLayers - minLayers)))
    const intensityBonus = Math.floor(scaledIntensity * 4)
    const numLayers = baseLayers + intensityBonus
    
    // Use image-aware angles if colorBlobs exist
    const useImageAngles = colorBlobs && colorBlobs.length >= 2
    
    for (let i = 0; i < numLayers; i++) {
      const color = colors[i % colors.length]
      let angle
      
      if (useImageAngles && i < colorBlobs!.length - 1) {
        // Create angle from one blob to another for image-aware flow
        const blob1 = colorBlobs![i]
        const blob2 = colorBlobs![(i + 1) % colorBlobs!.length]
        angle = Math.atan2(blob2.y - blob1.y, blob2.x - blob1.x)
      } else {
        // Seeded angles for consistency (not random)
        const seed = i * 73856 // Consistent seed
        angle = (Math.sin(seed) * 0.5 + 0.5) * Math.PI * 2 // Full range of angles
      }
      
      // Add subtle animation rotation if enabled
      if (isAnimated) {
        const smoothTime = time * 0.0001 * animationSpeed
        const rotationAmount = 0.1 // Small rotation range
        const uniqueOffset = i * 1.7
        angle += Math.sin(smoothTime + uniqueOffset) * rotationAmount
      }
      
      // Create gradient line extending beyond canvas for smooth coverage
      const extendFactor = 1.5
      const centerX = width * 0.5
      const centerY = height * 0.5
      const length = Math.max(width, height) * extendFactor
      
      const x1 = centerX + Math.cos(angle) * length * -0.5
      const y1 = centerY + Math.sin(angle) * length * -0.5
      const x2 = centerX + Math.cos(angle) * length * 0.5
      const y2 = centerY + Math.sin(angle) * length * 0.5
      
      const gradient = ctx.createLinearGradient(x1, y1, x2, y2)
      
      // Intensity-driven opacity (same as organic)
      const centerOpacity = Math.floor((0.2 + gradientIntensity * 0.6) * 255)
      const midOpacity = Math.floor(centerOpacity * 0.7)
      const centerHex = centerOpacity.toString(16).padStart(2, '0')
      const midHex = midOpacity.toString(16).padStart(2, '0')
      
      // Create flowing gradients with multiple stops
      gradient.addColorStop(0, `${color.hex}00`)
      gradient.addColorStop(0.2, `${color.hex}${Math.max(0, Math.min(255, Math.floor(centerOpacity * 0.3))).toString(16).padStart(2, '0')}`)
      gradient.addColorStop(0.4, `${color.hex}${centerHex}`)
      gradient.addColorStop(0.6, `${color.hex}${centerHex}`)
      gradient.addColorStop(0.8, `${color.hex}${Math.max(0, Math.min(255, Math.floor(centerOpacity * 0.3))).toString(16).padStart(2, '0')}`)
      gradient.addColorStop(1, `${color.hex}00`)
      
      // Smart blend mode (same as organic)
      if (i === 0) {
        ctx.globalCompositeOperation = 'source-over'
      } else {
        const blendModes: GlobalCompositeOperation[] = ['overlay', 'soft-light', 'multiply', 'screen', 'hard-light']
        ctx.globalCompositeOperation = blendModes[i % blendModes.length]
      }
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)
    }
    
    // Add flowing accent layers at higher intensities
    if (gradientIntensity > 0.6) {
      const accentCount = Math.floor((gradientIntensity - 0.6) * 2.5 * gradientDensity * 4) // 0-4 accents
      
      for (let i = 0; i < accentCount; i++) {
        const color = colors[i % colors.length]
        
        // More dramatic accent angles
        const seed = (i + 500) * 91237
        const angle = (Math.sin(seed) * 0.5 + 0.5) * Math.PI * 2
        
        const centerX = width * 0.5
        const centerY = height * 0.5
        const length = Math.max(width, height) * 2
        
        const x1 = centerX + Math.cos(angle) * length * -0.5
        const y1 = centerY + Math.sin(angle) * length * -0.5
        const x2 = centerX + Math.cos(angle) * length * 0.5
        const y2 = centerY + Math.sin(angle) * length * 0.5
        
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2)
        
        const accentAlpha = Math.max(0, Math.min(255, Math.floor((gradientIntensity - 0.6) * 2.5 * 0.6 * 255)))
        const accentHex = accentAlpha.toString(16).padStart(2, '0')
        
        gradient.addColorStop(0, `${color.hex}00`)
        gradient.addColorStop(0.3, `${color.hex}${Math.max(0, Math.min(255, Math.floor(accentAlpha * 0.5))).toString(16).padStart(2, '0')}`)
        gradient.addColorStop(0.5, `${color.hex}${accentHex}`)
        gradient.addColorStop(0.7, `${color.hex}${Math.max(0, Math.min(255, Math.floor(accentAlpha * 0.5))).toString(16).padStart(2, '0')}`)
        gradient.addColorStop(1, `${color.hex}00`)
        
        ctx.globalCompositeOperation = 'soft-light'
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, width, height)
      }
    }
  }, [colors, gradientIntensity, gradientDensity, colorBlobs, isAnimated, animationSpeed])

  // Create radial burst gradients with balanced positioning and blend modes
  const createRadialGradient = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number = 0) => {
    // Scale intensity and density to maintain same strength with 0-100% UI range
    const scaledIntensity = gradientIntensity * 1.2 // Maintain 120% internal strength
    const scaledDensity = gradientDensity * 1.5 // Maintain 150% internal strength
    
    // Always use solid background color
    const baseColor = colors[0] || { hex: '#ffffff' }
    ctx.fillStyle = baseColor.hex
    ctx.fillRect(0, 0, width, height)
    
    // Smart center count scaling
    const minCenters = 2
    const maxCenters = 8
    const baseCenters = Math.floor(minCenters + (scaledDensity * (maxCenters - minCenters)))
    const intensityBonus = Math.floor(scaledIntensity * 3)
    const numCenters = baseCenters + intensityBonus
    
    // Use image-aware positioning if colorBlobs exist
    const useImagePositions = colorBlobs && colorBlobs.length > 0
    
    for (let i = 0; i < numCenters; i++) {
      const color = colors[i % colors.length]
      let x, y, baseRadius
      
      if (useImagePositions && i < colorBlobs!.length) {
        // Use blob positions for image-aware placement
        const blob = colorBlobs![i]
        x = blob.x * width
        y = blob.y * height
        baseRadius = blob.radius * Math.min(width, height)
      } else {
        // Seeded positions for consistency (not random)
        const seed = i * 48271 // Consistent seed
        x = (Math.sin(seed) * 0.5 + 0.5) * width
        y = (Math.cos(seed * 1.4) * 0.5 + 0.5) * height
        baseRadius = Math.min(width, height) * (0.3 + (Math.sin(seed * 2.7) * 0.5 + 0.5) * 0.4) // 30%-70% of canvas
      }
      
      // Add subtle animation movement if enabled
      if (isAnimated) {
        const smoothTime = time * 0.0001 * animationSpeed
        const driftAmount = Math.min(width, height) * 0.02 // Larger movement than linear
        const uniqueOffset = i * 2.3
        
        x += (Math.sin(smoothTime + uniqueOffset) * 0.8 + Math.sin(smoothTime * 1.2 + uniqueOffset + 1) * 0.2) * driftAmount
        y += (Math.cos(smoothTime * 0.9 + uniqueOffset + 2) * 0.7 + Math.cos(smoothTime * 1.3 + uniqueOffset + 3) * 0.3) * driftAmount
      }
      
      // Intensity and complexity-driven radius scaling
      const sizeMultiplier = 0.6 + (gradientIntensity * 1.2) // Larger than linear style
      const complexityVariation = 0.8 + (gradientDensity * 0.6) // More variation at high complexity
      let radius = baseRadius * sizeMultiplier * complexityVariation * gradientIntensity
      
      // Add breathing animation if enabled
      if (isAnimated) {
        const smoothTime = time * 0.00012 * animationSpeed // Slower breathing for radials
        const pulseAmount = 1 + (Math.sin(smoothTime + i * 2.8) * 0.6 + Math.sin(smoothTime * 1.5 + i * 1.9 + 2) * 0.4) * 0.025 // ±2.5% variation
        radius *= pulseAmount
      }
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
      
      // Intensity-driven opacity with multiple gradient stops for smoother falloff
      const centerOpacity = Math.floor((0.3 + gradientIntensity * 0.7) * 255) // Stronger center than linear
      const midOpacity = Math.floor(centerOpacity * 0.6)
      const edgeOpacity = Math.floor(centerOpacity * 0.2)
      
      const centerHex = centerOpacity.toString(16).padStart(2, '0')
      const midHex = midOpacity.toString(16).padStart(2, '0')
      const edgeHex = edgeOpacity.toString(16).padStart(2, '0')
      
      gradient.addColorStop(0, `${color.hex}${centerHex}`)
      gradient.addColorStop(0.3, `${color.hex}${midHex}`)
      gradient.addColorStop(0.7, `${color.hex}${edgeHex}`)
      gradient.addColorStop(1, `${color.hex}00`)
      
      // Balanced blend modes for Radial Burst
      if (i === 0) {
        ctx.globalCompositeOperation = 'source-over'
      } else {
        const blendModes: GlobalCompositeOperation[] = ['overlay', 'soft-light', 'multiply', 'screen', 'hard-light']
        ctx.globalCompositeOperation = blendModes[i % blendModes.length]
      }
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)
    }
    
    // Add burst overlays at higher intensities for more drama
    if (gradientIntensity > 0.5) {
      const burstCount = Math.floor((gradientIntensity - 0.5) * 2 * gradientDensity * 3) // 0-3 bursts
      
      for (let i = 0; i < burstCount; i++) {
        const color = colors[i % colors.length]
        
        // Seeded positions for burst overlays
        const seed = (i + 777) * 31415
        const x = (Math.sin(seed) * 0.5 + 0.5) * width
        const y = (Math.cos(seed * 1.6) * 0.5 + 0.5) * height
        
        // Larger, more dramatic burst radius
        const radius = Math.max(width, height) * (0.4 + (Math.sin(seed * 3.2) * 0.5 + 0.5) * 0.6) * gradientIntensity
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
        
        const burstAlpha = Math.max(0, Math.min(255, Math.floor((gradientIntensity - 0.5) * 2 * 0.4 * 255))) // Subtle overlay
        const burstHex = burstAlpha.toString(16).padStart(2, '0')
        
        gradient.addColorStop(0, `${color.hex}${burstHex}`)
        gradient.addColorStop(0.5, `${color.hex}${Math.max(0, Math.min(255, Math.floor(burstAlpha * 0.6))).toString(16).padStart(2, '0')}`)
        gradient.addColorStop(0.8, `${color.hex}${Math.max(0, Math.min(255, Math.floor(burstAlpha * 0.3))).toString(16).padStart(2, '0')}`)
        gradient.addColorStop(1, `${color.hex}00`)
        
        ctx.globalCompositeOperation = 'overlay'
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, width, height)
      }
    }
    
    // Add concentrated hot spots at highest intensities
    if (gradientIntensity > 0.7) {
      const hotspotCount = Math.floor((gradientIntensity - 0.7) * 3.33 * gradientDensity * 2) // 0-2 hotspots
      
      for (let i = 0; i < hotspotCount; i++) {
        const color = colors[i % colors.length]
        
        // Seeded positions for hotspots
        const seed = (i + 1234) * 65537
        const x = (Math.sin(seed) * 0.5 + 0.5) * width
        const y = (Math.cos(seed * 1.8) * 0.5 + 0.5) * height
        
        // Smaller, intense hotspots
        const radius = Math.min(width, height) * (0.15 + (Math.sin(seed * 2.1) * 0.5 + 0.5) * 0.15) * gradientIntensity
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
        
        gradient.addColorStop(0, color.hex) // Full intensity center
        gradient.addColorStop(0.4, `${color.hex}BB`) // 75% intensity
        gradient.addColorStop(0.7, `${color.hex}66`) // 40% intensity
        gradient.addColorStop(1, `${color.hex}00`) // Transparent edge
        
        ctx.globalCompositeOperation = 'color-dodge' // Intense blend mode
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, 2 * Math.PI)
        ctx.fill()
      }
    }
  }, [colors, gradientIntensity, gradientDensity, colorBlobs, isAnimated, animationSpeed])



  // Create gradient mesh with balanced triangular color zones
  const createWaveGradient = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number = 0) => {
    // Scale intensity and density to maintain same strength with 0-100% UI range
    const scaledIntensity = gradientIntensity * 1.2 // Maintain 120% internal strength
    const scaledDensity = gradientDensity * 1.5 // Maintain 150% internal strength
    
    // Always use solid background color
    const baseColor = colors[0] || { hex: '#ffffff' }
    ctx.fillStyle = baseColor.hex
    ctx.fillRect(0, 0, width, height)
    
    // Smart mesh density scaling
    const minTriangles = 4
    const maxTriangles = 16
    const baseTriangles = Math.floor(minTriangles + (scaledDensity * (maxTriangles - minTriangles)))
    const intensityBonus = Math.floor(scaledIntensity * 6)
    const numTriangles = baseTriangles + intensityBonus
    
    // Use image-aware points if colorBlobs exist
    const useImagePoints = colorBlobs && colorBlobs.length >= 3
    
    // Generate mesh points
    let meshPoints = []
    
    if (useImagePoints) {
      // Use blob positions as mesh anchor points
      for (let i = 0; i < Math.min(colorBlobs!.length, numTriangles); i++) {
        const blob = colorBlobs![i]
        meshPoints.push({
          x: blob.x * width,
          y: blob.y * height,
          color: colors[i % colors.length]
        })
      }
    } else {
      // Generate seeded mesh points
      for (let i = 0; i < numTriangles; i++) {
        const seed = i * 67890
        meshPoints.push({
          x: (Math.sin(seed) * 0.5 + 0.5) * width,
          y: (Math.cos(seed * 1.7) * 0.5 + 0.5) * height,
          color: colors[i % colors.length]
        })
      }
    }
    
    // Add animation movement to mesh points
    if (isAnimated) {
      const smoothTime = time * 0.0001 * animationSpeed
      const driftAmount = Math.min(width, height) * 0.015
      
      meshPoints = meshPoints.map((point, i) => {
        const uniqueOffset = i * 2.7
        return {
          ...point,
          x: point.x + (Math.sin(smoothTime + uniqueOffset) * 0.6 + Math.sin(smoothTime * 1.4 + uniqueOffset + 1) * 0.4) * driftAmount,
          y: point.y + (Math.cos(smoothTime * 1.1 + uniqueOffset + 2) * 0.7 + Math.cos(smoothTime * 1.3 + uniqueOffset + 3) * 0.3) * driftAmount
        }
      })
    }
    
    // Create triangular mesh zones
    for (let i = 0; i < meshPoints.length; i++) {
      const point1 = meshPoints[i]
      const point2 = meshPoints[(i + 1) % meshPoints.length]
      const point3 = meshPoints[(i + 2) % meshPoints.length]
      
      // Calculate triangle centroid for gradient center
      const centerX = (point1.x + point2.x + point3.x) / 3
      const centerY = (point1.y + point2.y + point3.y) / 3
      
      // Calculate average distance for gradient radius
      const dist1 = Math.sqrt((point1.x - centerX)**2 + (point1.y - centerY)**2)
      const dist2 = Math.sqrt((point2.x - centerX)**2 + (point2.y - centerY)**2)
      const dist3 = Math.sqrt((point3.x - centerX)**2 + (point3.y - centerY)**2)
      const avgRadius = (dist1 + dist2 + dist3) / 3
      
      // Intensity-driven radius scaling
      const meshRadius = avgRadius * (0.8 + gradientIntensity * 0.8)
      
      // Create radial gradient for this triangle zone
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, meshRadius)
      
      // Use dominant color from the triangle's first point
      const zoneColor = point1.color
      
      // Opacity scaling with intensity
      const zoneOpacity = Math.floor((0.25 + gradientIntensity * 0.65) * 255)
      const midOpacity = Math.floor(zoneOpacity * 0.7)
      const edgeOpacity = Math.floor(zoneOpacity * 0.3)
      
      const zoneHex = zoneOpacity.toString(16).padStart(2, '0')
      const midHex = midOpacity.toString(16).padStart(2, '0')
      const edgeHex = edgeOpacity.toString(16).padStart(2, '0')
      
      gradient.addColorStop(0, `${zoneColor.hex}${zoneHex}`)
      gradient.addColorStop(0.4, `${zoneColor.hex}${midHex}`)
      gradient.addColorStop(0.8, `${zoneColor.hex}${edgeHex}`)
      gradient.addColorStop(1, `${zoneColor.hex}00`)
      
      // Smart blend mode
      if (i === 0) {
        ctx.globalCompositeOperation = 'source-over'
      } else {
        const blendModes: GlobalCompositeOperation[] = ['overlay', 'soft-light', 'multiply', 'screen', 'hard-light']
        ctx.globalCompositeOperation = blendModes[i % blendModes.length]
      }
      
      // Draw the triangle zone
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.moveTo(point1.x, point1.y)
      ctx.lineTo(point2.x, point2.y)
      ctx.lineTo(point3.x, point3.y)
      ctx.closePath()
      ctx.fill()
    }
    
    // Add mesh overlays at higher intensities
    if (gradientIntensity > 0.5) {
      const overlayCount = Math.floor((gradientIntensity - 0.5) * 2 * gradientDensity * 4) // 0-4 overlays
      
      for (let i = 0; i < overlayCount; i++) {
        const color = colors[i % colors.length]
        
        // Create overlay zones with different geometry
        const seed = (i + 555) * 23456
        const centerX = (Math.sin(seed) * 0.5 + 0.5) * width
        const centerY = (Math.cos(seed * 1.8) * 0.5 + 0.5) * height
        const radius = Math.min(width, height) * (0.2 + (Math.sin(seed * 3.1) * 0.5 + 0.5) * 0.4) * gradientIntensity
        
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
        
        const overlayAlpha = Math.max(0, Math.min(255, Math.floor((gradientIntensity - 0.5) * 2 * 0.35 * 255)))
        const overlayHex = overlayAlpha.toString(16).padStart(2, '0')
        
        gradient.addColorStop(0, `${color.hex}${overlayHex}`)
        gradient.addColorStop(0.6, `${color.hex}${Math.max(0, Math.min(255, Math.floor(overlayAlpha * 0.5))).toString(16).padStart(2, '0')}`)
        gradient.addColorStop(1, `${color.hex}00`)
        
        ctx.globalCompositeOperation = 'soft-light'
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
        ctx.fill()
      }
    }
    
    // Add connecting gradients between mesh points at highest intensities
    if (gradientIntensity > 0.7) {
      const connectionCount = Math.floor((gradientIntensity - 0.7) * 3.33 * gradientDensity * 3) // 0-3 connections
      
      for (let i = 0; i < connectionCount; i++) {
        const point1 = meshPoints[i % meshPoints.length]
        const point2 = meshPoints[(i + Math.floor(meshPoints.length / 2)) % meshPoints.length]
        
        // Create gradient connection between distant points
        const gradient = ctx.createLinearGradient(point1.x, point1.y, point2.x, point2.y)
        
        const connectionAlpha = Math.max(0, Math.min(255, Math.floor((gradientIntensity - 0.7) * 3.33 * 0.4 * 255)))
        const connectionHex = connectionAlpha.toString(16).padStart(2, '0')
        
        gradient.addColorStop(0, `${point1.color.hex}${connectionHex}`)
        gradient.addColorStop(0.5, `${point2.color.hex}${Math.max(0, Math.min(255, Math.floor(connectionAlpha * 0.8))).toString(16).padStart(2, '0')}`)
        gradient.addColorStop(1, `${point2.color.hex}00`)
        
        ctx.globalCompositeOperation = 'multiply'
        
        // Draw connection as wide line
        const connectionWidth = Math.min(width, height) * 0.06 * gradientIntensity
        ctx.save()
        ctx.translate(point1.x, point1.y)
        ctx.rotate(Math.atan2(point2.y - point1.y, point2.x - point1.x))
        const connectionLength = Math.sqrt((point2.x - point1.x)**2 + (point2.y - point1.y)**2)
        ctx.fillStyle = gradient
        ctx.fillRect(-connectionWidth/2, -connectionWidth/2, connectionLength + connectionWidth, connectionWidth)
        ctx.restore()
      }
    }
  }, [colors, gradientIntensity, gradientDensity, colorBlobs, isAnimated, animationSpeed])

  // Create sunburst radial rays emanating from center
  const createSunburstGradient = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number = 0) => {
    // Scale intensity and density to maintain same strength with 0-100% UI range
    const scaledIntensity = gradientIntensity * 1.2 // Maintain 120% internal strength
    const scaledDensity = gradientDensity * 1.5 // Maintain 150% internal strength
    
    // Always use solid background color
    const baseColor = colors[0] || { hex: '#ffffff' }
    ctx.fillStyle = baseColor.hex
    ctx.fillRect(0, 0, width, height)
    
    // Center point for the sunburst (customizable later)
    const centerX = width * 0.5
    const centerY = height * 0.5
    
    // Add slight animation to center if enabled
    let animatedCenterX = centerX
    let animatedCenterY = centerY
    
    if (isAnimated) {
      const smoothTime = time * 0.0001 * animationSpeed
      const driftAmount = Math.min(width, height) * 0.02
      animatedCenterX += Math.sin(smoothTime * 0.7) * driftAmount
      animatedCenterY += Math.cos(smoothTime * 0.5) * driftAmount
    }
    
    // Calculate number of rays based on density (16-64 rays)
    const minRays = 16
    const maxRays = 64
    const baseRayCount = Math.floor(minRays + (scaledDensity * (maxRays - minRays)))
    const rayCount = Math.max(minRays, baseRayCount)
    
    // Calculate radius for rays (should extend beyond canvas)
    const maxDimension = Math.max(width, height)
    const rayRadius = maxDimension * 1.2 // Extend beyond canvas
    
    // Rotation animation
    let rotationOffset = 0
    if (isAnimated) {
      const smoothTime = time * 0.00005 * animationSpeed // Very slow rotation
      rotationOffset = smoothTime
    }
    
    // Draw alternating color rays
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2 + rotationOffset
      const colorIndex = i % colors.length
      const color = colors[colorIndex]
      const safeHex = sanitizeHexColor(color?.hex)
      
      // Calculate ray width based on intensity and density
      const baseRayWidth = (Math.PI * 2) / rayCount // Base angular width
      const rayWidth = baseRayWidth * (0.7 + scaledIntensity * 0.6) // 70%-130% of base width
      
      // Create wedge path
      ctx.beginPath()
      ctx.moveTo(animatedCenterX, animatedCenterY)
      
      // Create smooth arc for the ray
      const startAngle = angle - rayWidth / 2
      const endAngle = angle + rayWidth / 2
      
      ctx.arc(animatedCenterX, animatedCenterY, rayRadius, startAngle, endAngle)
      ctx.closePath()
      
      // Create radial gradient for this ray
      const gradient = ctx.createRadialGradient(
        animatedCenterX, animatedCenterY, 0,
        animatedCenterX, animatedCenterY, rayRadius * 0.8
      )
      
      // Opacity based on intensity and ray index for variation
      const baseOpacity = 0.15 + scaledIntensity * 0.35 // 15%-50% range
      const rayVariation = 0.8 + (Math.sin(i * 0.5) * 0.4) // Vary each ray slightly
      const finalOpacity = Math.floor(baseOpacity * rayVariation * 255)
      
      const centerHex = Math.floor(Math.min(255, finalOpacity * 1.2)).toString(16).padStart(2, '0')
      const midHex = Math.floor(finalOpacity).toString(16).padStart(2, '0')
      const edgeHex = Math.floor(finalOpacity * 0.3).toString(16).padStart(2, '0')
      
      gradient.addColorStop(0, `${safeHex}${centerHex}`)
      gradient.addColorStop(0.3, `${safeHex}${midHex}`)
      gradient.addColorStop(0.7, `${safeHex}${edgeHex}`)
      gradient.addColorStop(1, `${safeHex}00`)
      
      // Blend modes for layering
      if (i === 0) {
        ctx.globalCompositeOperation = 'source-over'
      } else {
        const blendModes: GlobalCompositeOperation[] = ['overlay', 'soft-light', 'multiply', 'screen', 'color-dodge']
        ctx.globalCompositeOperation = blendModes[i % blendModes.length]
      }
      
      ctx.fillStyle = gradient
      ctx.fill()
    }
    
    // Add central glow at higher intensities
    if (scaledIntensity > 0.5) {
      const glowRadius = Math.min(width, height) * 0.2 * scaledIntensity
      const glowGradient = ctx.createRadialGradient(
        animatedCenterX, animatedCenterY, 0,
        animatedCenterX, animatedCenterY, glowRadius
      )
      
      // Use primary color for central glow
      const glowColor = colors[0]
      const glowHex = sanitizeHexColor(glowColor?.hex)
      const glowOpacity = Math.floor((scaledIntensity - 0.5) * 2 * 0.4 * 255)
      const glowOpacityHex = glowOpacity.toString(16).padStart(2, '0')
      
      glowGradient.addColorStop(0, `${glowHex}${glowOpacityHex}`)
      glowGradient.addColorStop(0.5, `${glowHex}${Math.floor(glowOpacity * 0.5).toString(16).padStart(2, '0')}`)
      glowGradient.addColorStop(1, `${glowHex}00`)
      
      ctx.globalCompositeOperation = 'overlay'
      ctx.fillStyle = glowGradient
      ctx.beginPath()
      ctx.arc(animatedCenterX, animatedCenterY, glowRadius, 0, Math.PI * 2)
      ctx.fill()
    }
    
  }, [colors, gradientIntensity, gradientDensity, isAnimated, animationSpeed])

  // Main gradient creation function that chooses the style
  const createGradient = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number = 0) => {
    // Save current transform
    ctx.save()
    
    // Apply zoom transformation
    // When zoomed in (zoom > 1), scale up and center the view
    // When zoomed out (zoom < 1), scale down to see more of the gradient
    const centerX = width / 2
    const centerY = height / 2
    
    // Translate to center, apply scale, translate back
    ctx.translate(centerX, centerY)
    ctx.scale(zoomLevel, zoomLevel)
    ctx.translate(-centerX, -centerY)
    
    // Calculate effective dimensions for the gradient functions
    const effectiveWidth = width
    const effectiveHeight = height
    
    switch (gradientStyle) {
      case 'organic':
        createOrganicGradient(ctx, effectiveWidth, effectiveHeight, time)
        break
      case 'linear':
        createLinearGradient(ctx, effectiveWidth, effectiveHeight, time)
        break
      case 'radial':
        createRadialGradient(ctx, effectiveWidth, effectiveHeight, time)
        break
      case 'wave':
        createWaveGradient(ctx, effectiveWidth, effectiveHeight, time)
        break
      case 'sunburst':
        createSunburstGradient(ctx, effectiveWidth, effectiveHeight, time)
        break
      default:
        createOrganicGradient(ctx, effectiveWidth, effectiveHeight)
    }
    
    // Restore transform
    ctx.restore()
  }, [gradientStyle, zoomLevel, createOrganicGradient, createLinearGradient, createRadialGradient, createWaveGradient, createSunburstGradient])

  // Apply heavy blur using multiple passes for ultra-soft ethereal effect
  const applyHeavyBlur = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Much stronger blur for ethereal effect - like the reference images
    const blurAmount = Math.min(width, height) * 0.12 // Increased blur intensity
    
    // Apply multiple blur passes for extremely soft transitions
    for (let i = 0; i < 3; i++) {
      ctx.filter = `blur(${blurAmount / (i + 1)}px)`
      
      // Create temporary canvas for blur application
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = width
      tempCanvas.height = height
      const tempCtx = tempCanvas.getContext('2d')
      
      if (tempCtx) {
        tempCtx.filter = `blur(${blurAmount / (i + 1)}px)`
        tempCtx.drawImage(ctx.canvas, 0, 0)
        
        // Draw blurred version back
        ctx.filter = 'none'
        ctx.drawImage(tempCanvas, 0, 0)
      }
    }
    
    // Reset filter
    ctx.filter = 'none'
  }, [])

  // Ultra-subtle posterization for smooth gradients (minimal banding)
  const posterizeImageData = useCallback((imageData: ImageData, steps: number): ImageData => {
    const data = imageData.data
    const factor = 255 / (steps - 1)
    
    for (let i = 0; i < data.length; i += 4) {
      // Ultra-minimal posterization strength - barely visible
      const posterizeStrength = 0.05 // Only 5% posterization
      
      // Posterize each channel with minimal strength
      const originalR = data[i]
      const originalG = data[i + 1]
      const originalB = data[i + 2]
      
      const posterizedR = Math.round(originalR / factor) * factor
      const posterizedG = Math.round(originalG / factor) * factor
      const posterizedB = Math.round(originalB / factor) * factor
      
      // Blend original with posterized for ultra-subtlety
      data[i] = originalR + (posterizedR - originalR) * posterizeStrength
      data[i + 1] = originalG + (posterizedG - originalG) * posterizeStrength
      data[i + 2] = originalB + (posterizedB - originalB) * posterizeStrength
    }
    
    return imageData
  }, [])

  // Organic film grain effect
  const addRichGrain = useCallback((imageData: ImageData, intensity: number): ImageData => {
    const data = imageData.data
    const width = imageData.width
    const height = imageData.height
    
    // Generate organic grain pattern
    for (let i = 0; i < data.length; i += 4) {
      const x = (i / 4) % width
      const y = Math.floor((i / 4) / width)
      
      // Create multiple layers of random noise for organic feel
      const noise1 = (Math.random() - 0.5) * 2
      const noise2 = (Math.random() - 0.5) * 2
      const noise3 = (Math.random() - 0.5) * 2
      
      // Weight the noise layers differently
      const grain = (noise1 * 0.6 + noise2 * 0.3 + noise3 * 0.1) * intensity * 40
      
      // Add some variance between RGB channels for film-like effect
      const rGrain = grain + (Math.random() - 0.5) * intensity * 10
      const gGrain = grain + (Math.random() - 0.5) * intensity * 10
      const bGrain = grain + (Math.random() - 0.5) * intensity * 10
      
      // Apply grain to each channel
      data[i] = Math.max(0, Math.min(255, data[i] + rGrain))
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + gGrain))
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + bGrain))
    }
    
    return imageData
  }, [])

  // Overlay Effects System
  const applyGlassRipple = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) => {
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data
    const newData = new Uint8ClampedArray(data.length)
    
    // Copy original data first
    newData.set(data)
    
    const rippleStrength = intensity * 20 // Max displacement in pixels
    const rippleFrequency = 0.008 // Wave frequency
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const sourceIndex = (y * width + x) * 4
        
        // Create vertical sine wave displacement
        const displacement = Math.sin(x * rippleFrequency) * rippleStrength
        const sourceY = Math.round(y + displacement)
        
        // Ensure we stay within bounds
        if (sourceY >= 0 && sourceY < height) {
          const targetIndex = (sourceY * width + x) * 4
          
          // Copy pixel data with displacement
          if (targetIndex >= 0 && targetIndex < data.length - 3) {
            newData[sourceIndex] = data[targetIndex]
            newData[sourceIndex + 1] = data[targetIndex + 1]
            newData[sourceIndex + 2] = data[targetIndex + 2]
            newData[sourceIndex + 3] = data[targetIndex + 3]
          }
        }
      }
    }
    
    const newImageData = new ImageData(newData, width, height)
    ctx.putImageData(newImageData, 0, 0)
  }, [])

  const applyGlitchScanlines = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) => {
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data
    const newData = new Uint8ClampedArray(data.length)
    
    // Copy original data first
    newData.set(data)
    
    const maxDisplacement = intensity * 80 // Increased max displacement for more dramatic effect
    const minScanlineHeight = 1
    const maxScanlineHeight = Math.max(3, Math.floor(intensity * 25)) // More variable scanline heights
    
    let y = 0
    while (y < height) {
      // Randomize scanline height for each band
      const scanlineHeight = Math.floor(Math.random() * (maxScanlineHeight - minScanlineHeight + 1)) + minScanlineHeight
      
      // Higher chance of glitching at higher intensities, but always some randomness
      const glitchProbability = Math.max(0.3, intensity * 0.8)
      
      if (Math.random() < glitchProbability) {
        // Randomize direction: -1 for left, 1 for right
        const direction = Math.random() < 0.5 ? -1 : 1
        
        // Create more varied displacement patterns
        const baseOffset = direction * Math.random() * maxDisplacement
        const offsetVariation = intensity * 10 // Additional per-row variation
        
        // Apply glitch to this band of scanlines
        for (let row = y; row < Math.min(y + scanlineHeight, height); row++) {
          // Add slight variation per row within the band for more organic glitching
          const rowVariation = (Math.random() - 0.5) * offsetVariation
          const totalOffset = Math.round(baseOffset + rowVariation)
          
          // Process each pixel in this row
          for (let x = 0; x < width; x++) {
            const sourceX = x + totalOffset
            const targetIndex = (row * width + x) * 4
            
            // Handle wrapping and bounds checking for more interesting effects
            let finalSourceX = sourceX
            if (sourceX < 0) {
              // Wrap from left edge or use edge pixel
              finalSourceX = intensity > 0.7 ? width + sourceX : 0
            } else if (sourceX >= width) {
              // Wrap from right edge or use edge pixel
              finalSourceX = intensity > 0.7 ? sourceX - width : width - 1
            }
            
            // Clamp to valid range
            finalSourceX = Math.max(0, Math.min(width - 1, finalSourceX))
            const sourceIndex = (row * width + finalSourceX) * 4
            
            // Copy pixel data with displacement
            if (sourceIndex >= 0 && sourceIndex < data.length - 3) {
              newData[targetIndex] = data[sourceIndex]
              newData[targetIndex + 1] = data[sourceIndex + 1]
              newData[targetIndex + 2] = data[sourceIndex + 2]
              newData[targetIndex + 3] = data[sourceIndex + 3]
              
              // Add subtle RGB channel separation for digital artifacts at high intensity
              if (intensity > 0.6) {
                const channelSeparation = Math.floor((intensity - 0.6) * 2.5 * 3) // 0-3 pixel separation
                if (channelSeparation > 0 && Math.random() < 0.3) {
                  const rSourceX = Math.max(0, Math.min(width - 1, finalSourceX + channelSeparation))
                  const bSourceX = Math.max(0, Math.min(width - 1, finalSourceX - channelSeparation))
                  const rSourceIndex = (row * width + rSourceX) * 4
                  const bSourceIndex = (row * width + bSourceX) * 4
                  
                  // Separate red and blue channels slightly
                  newData[targetIndex] = data[rSourceIndex] // Red from offset position
                  newData[targetIndex + 2] = data[bSourceIndex + 2] // Blue from opposite offset
                }
              }
            }
          }
        }
      }
      
      y += scanlineHeight
    }
    
    const finalImageData = new ImageData(newData, width, height)
    ctx.putImageData(finalImageData, 0, 0)
  }, [])

  const applyPatternOverlay = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) => {
    // Save current state
    ctx.save()
    
    // Set overlay blend mode and opacity
    ctx.globalCompositeOperation = 'overlay'
    ctx.globalAlpha = intensity * 0.3
    
    // Create dot pattern
    const dotSize = 3
    const spacing = Math.max(8, Math.floor(40 / (intensity * 2 + 1)))
    
    ctx.fillStyle = '#ffffff'
    
    for (let x = 0; x < width; x += spacing) {
      for (let y = 0; y < height; y += spacing) {
        // Add some randomness to dot positions
        const offsetX = (Math.random() - 0.5) * spacing * 0.3
        const offsetY = (Math.random() - 0.5) * spacing * 0.3
        
        ctx.beginPath()
        ctx.arc(x + offsetX, y + offsetY, dotSize * intensity, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    
    // Restore state
    ctx.restore()
  }, [])

  const applyNoisePulse = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) => {
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data
    
    const blockSize = Math.max(8, Math.floor(32 / intensity))
    const noiseStrength = intensity * 60
    
    // Create noise blocks
    for (let y = 0; y < height; y += blockSize) {
      for (let x = 0; x < width; x += blockSize) {
        // Randomly decide if this block should be noisy
        if (Math.random() < intensity * 0.4) {
          const colorOffset = (Math.random() - 0.5) * noiseStrength
          const rgbSplit = intensity > 0.5 ? (Math.random() - 0.5) * 10 : 0
          
          // Apply noise to the entire block
          for (let by = y; by < Math.min(y + blockSize, height); by++) {
            for (let bx = x; bx < Math.min(x + blockSize, width); bx++) {
              const index = (by * width + bx) * 4
              
              // Add color noise with slight RGB channel splitting
              data[index] = Math.max(0, Math.min(255, data[index] + colorOffset + rgbSplit))
              data[index + 1] = Math.max(0, Math.min(255, data[index + 1] + colorOffset))
              data[index + 2] = Math.max(0, Math.min(255, data[index + 2] + colorOffset - rgbSplit))
            }
          }
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0)
  }, [])

  const applyVerticalGlitchScanlines = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) => {
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data
    const newData = new Uint8ClampedArray(data.length)
    
    // Copy original data first
    newData.set(data)
    
    const maxDisplacement = intensity * 80 // Max vertical displacement
    const minScanlineWidth = 1
    const maxScanlineWidth = Math.max(3, Math.floor(intensity * 25)) // Variable column widths
    
    let x = 0
    while (x < width) {
      // Randomize column width for each band
      const scanlineWidth = Math.floor(Math.random() * (maxScanlineWidth - minScanlineWidth + 1)) + minScanlineWidth
      
      // Higher chance of glitching at higher intensities, but always some randomness
      const glitchProbability = Math.max(0.3, intensity * 0.8)
      
      if (Math.random() < glitchProbability) {
        // Randomize direction: -1 for up, 1 for down
        const direction = Math.random() < 0.5 ? -1 : 1
        
        // Create varied displacement patterns
        const baseOffset = direction * Math.random() * maxDisplacement
        const offsetVariation = intensity * 10 // Additional per-column variation
        
        // Apply glitch to this band of vertical scanlines
        for (let col = x; col < Math.min(x + scanlineWidth, width); col++) {
          // Add slight variation per column within the band
          const colVariation = (Math.random() - 0.5) * offsetVariation
          const totalOffset = Math.round(baseOffset + colVariation)
          
          // Process each pixel in this column
          for (let y = 0; y < height; y++) {
            const sourceY = y + totalOffset
            const targetIndex = (y * width + col) * 4
            
            // Handle wrapping and bounds checking
            let finalSourceY = sourceY
            if (sourceY < 0) {
              // Wrap from top edge or use edge pixel
              finalSourceY = intensity > 0.7 ? height + sourceY : 0
            } else if (sourceY >= height) {
              // Wrap from bottom edge or use edge pixel
              finalSourceY = intensity > 0.7 ? sourceY - height : height - 1
            }
            
            // Clamp to valid range
            finalSourceY = Math.max(0, Math.min(height - 1, finalSourceY))
            const sourceIndex = (finalSourceY * width + col) * 4
            
            // Copy pixel data with vertical displacement
            if (sourceIndex >= 0 && sourceIndex < data.length - 3) {
              newData[targetIndex] = data[sourceIndex]
              newData[targetIndex + 1] = data[sourceIndex + 1]
              newData[targetIndex + 2] = data[sourceIndex + 2]
              newData[targetIndex + 3] = data[sourceIndex + 3]
              
              // Add subtle RGB channel separation for digital artifacts at high intensity
              if (intensity > 0.6) {
                const channelSeparation = Math.floor((intensity - 0.6) * 2.5 * 3) // 0-3 pixel separation
                if (channelSeparation > 0 && Math.random() < 0.3) {
                  const rSourceY = Math.max(0, Math.min(height - 1, finalSourceY + channelSeparation))
                  const bSourceY = Math.max(0, Math.min(height - 1, finalSourceY - channelSeparation))
                  const rSourceIndex = (rSourceY * width + col) * 4
                  const bSourceIndex = (bSourceY * width + col) * 4
                  
                  // Separate red and blue channels slightly (vertically)
                  newData[targetIndex] = data[rSourceIndex] // Red from offset position
                  newData[targetIndex + 2] = data[bSourceIndex + 2] // Blue from opposite offset
                }
              }
            }
          }
        }
      }
      
      x += scanlineWidth
    }
    
    const finalImageData = new ImageData(newData, width, height)
    ctx.putImageData(finalImageData, 0, 0)
  }, [])

  const applyOverlayEffect = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, type: string, intensity: number) => {
    switch (type) {
      case 'glass':
        applyGlassRipple(ctx, width, height, intensity)
        break
      case 'horizontal-glitch':
        applyGlitchScanlines(ctx, width, height, intensity)
        break
      case 'vertical-glitch':
        applyVerticalGlitchScanlines(ctx, width, height, intensity)
        break
      case 'pattern':
        applyPatternOverlay(ctx, width, height, intensity)
        break
      case 'noise':
        applyNoisePulse(ctx, width, height, intensity)
        break
      default:
        break
    }
  }, [applyGlassRipple, applyGlitchScanlines, applyVerticalGlitchScanlines, applyPatternOverlay, applyNoisePulse])

  // Apply glass ripple distortion effect
  const applyRippleEffect = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number = 0) => {
    if (!rippleEnabled) return

    // Get current canvas image data
    const imageData = ctx.getImageData(0, 0, width, height)
    const originalData = new Uint8ClampedArray(imageData.data)
    const outputData = imageData.data

    // Add time-based animation if enabled
    let timeOffset = 0
    if (isAnimated) {
      timeOffset = time * 0.001 * animationSpeed * 0.5 // Slow ripple animation
    }

    // Apply ripple distortion to each pixel
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Calculate sine wave offsets with time animation
        const offsetX = Math.sin(y * rippleFrequencyY + timeOffset) * rippleAmplitudeX
        const offsetY = Math.sin(x * rippleFrequencyX + timeOffset * 1.3) * rippleAmplitudeY
        
        // Calculate source pixel position
        let sourceX = x + offsetX
        let sourceY = y + offsetY
        
        // Handle edge cases by clamping to canvas bounds
        sourceX = Math.max(0, Math.min(width - 1, Math.round(sourceX)))
        sourceY = Math.max(0, Math.min(height - 1, Math.round(sourceY)))
        
        // Get source and destination pixel indices
        const sourceIndex = (sourceY * width + sourceX) * 4
        const destIndex = (y * width + x) * 4
        
        // Copy RGBA values from source to destination
        outputData[destIndex] = originalData[sourceIndex]         // R
        outputData[destIndex + 1] = originalData[sourceIndex + 1] // G
        outputData[destIndex + 2] = originalData[sourceIndex + 2] // B
        outputData[destIndex + 3] = originalData[sourceIndex + 3] // A
      }
    }

    // Apply the distorted image data back to canvas
    ctx.putImageData(imageData, 0, 0)
  }, [rippleEnabled, rippleFrequencyX, rippleFrequencyY, rippleAmplitudeX, rippleAmplitudeY, isAnimated, animationSpeed])

  const drawBackground = useCallback((time: number = 0) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    console.log('Drawing background with', colors.length, 'colors:', colors)

    // Simple fixed dimensions based on aspect ratio to avoid sizing issues
    const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number)
    const targetAspectRatio = widthRatio / heightRatio
    
    // Use a reasonable base size that scales well
    const baseSize = 800
    
    let canvasWidth, canvasHeight
    
    if (targetAspectRatio >= 1) {
      // Landscape/square: fix width, calculate height
      canvasWidth = baseSize
      canvasHeight = Math.round(baseSize / targetAspectRatio)
    } else {
      // Portrait: fix height, calculate width
      canvasHeight = baseSize  
      canvasWidth = Math.round(baseSize * targetAspectRatio)
    }
    
    // Set canvas dimensions
    canvas.width = canvasWidth
    canvas.height = canvasHeight
    
    // Set CSS dimensions to ensure it's visible
    canvas.style.width = `${canvasWidth}px`
    canvas.style.height = `${canvasHeight}px`

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Debug: If no colors, show red background to confirm canvas is working
    if (!colors || colors.length === 0) {
      ctx.fillStyle = '#ff0000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      console.log('No colors - showing red debug background')
      return
    }

    // Step 1: Create gradient based on selected style  
    createGradient(ctx, canvas.width, canvas.height, time)

    // Step 2: Apply heavy blur for soft transitions (skip during animation for performance)
    if (!isAnimated || time === 0) {
      applyHeavyBlur(ctx, canvas.width, canvas.height)
    }

    // Step 3: Apply posterization for visible bands (temporarily disabled for smooth gradients)
    // const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    // const posterized = posterizeImageData(imageData, posterizeSteps)
    // ctx.putImageData(posterized, 0, 0)

    // Step 4: Add rich grain texture (skip during animation for performance) 
    if (noiseIntensity > 0 && (!isAnimated || time === 0)) {
      const grainImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const grainy = addRichGrain(grainImageData, noiseIntensity)
      ctx.putImageData(grainy, 0, 0)
    }



    // Step 6: Final subtle vignette for depth (skip during animation for performance)
    if (!isAnimated || time === 0) {
      const vignette = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height) / 2
      )
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
      vignette.addColorStop(0.7, 'rgba(0, 0, 0, 0)')
      vignette.addColorStop(1, 'rgba(0, 0, 0, 0.1)')
      
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // Step 7: Apply overlay effects (if enabled)
    if (overlayEnabled && overlayIntensity > 0) {
      applyOverlayEffect(ctx, canvas.width, canvas.height, overlayType, overlayIntensity)
    }

    // Step 8: Apply glass ripple distortion effect (if enabled)
    if (rippleEnabled) {
      applyRippleEffect(ctx, canvas.width, canvas.height, time)
    }

    // Notify parent that canvas is ready
    onCanvasReady(canvas)
  }, [colors, posterizeSteps, noiseIntensity, gradientStyle, gradientIntensity, gradientDensity, zoomLevel, isAnimated, overlayEnabled, overlayType, overlayIntensity, aspectRatio, rippleEnabled, onCanvasReady, createGradient, applyHeavyBlur, posterizeImageData, addRichGrain, applyOverlayEffect, applyRippleEffect])

  // High-resolution rendering for export
  const renderAtResolution = useCallback((exportCanvas: HTMLCanvasElement, width: number, height: number) => {
    const ctx = exportCanvas.getContext('2d')
    if (!ctx) return

    // Set export canvas dimensions
    exportCanvas.width = width
    exportCanvas.height = height

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Step 1: Create gradient based on selected style
    createGradient(ctx, width, height, 0) // Static export (time = 0)

    // Step 2: Apply heavy blur for soft transitions
    applyHeavyBlur(ctx, width, height)

    // Step 3: Skip posterization for smooth gradients
    // const imageData = ctx.getImageData(0, 0, width, height)
    // const posterized = posterizeImageData(imageData, posterizeSteps)
    // ctx.putImageData(posterized, 0, 0)

    // Step 4: Add grain/noise texture
    if (noiseIntensity > 0) {
      const grainImageData = ctx.getImageData(0, 0, width, height)
      const noisyImageData = addRichGrain(grainImageData, noiseIntensity)
      ctx.putImageData(noisyImageData, 0, 0)
    }

    // Step 5: Apply animation displacement effects (skip for static export)
    // This step would be skipped for static exports

    // Step 6: Apply dark overlay to increase contrast (skip this step as it darkens too much)
    // if (gradientIntensity < 0.8) {
    //   const overlayGradient = ctx.createRadialGradient(
    //     width / 2, height / 2, 0,
    //     width / 2, height / 2, Math.sqrt(width * width + height * height) / 2
    //   )
    //   overlayGradient.addColorStop(0, 'rgba(0,0,0,0)')
    //   overlayGradient.addColorStop(1, `rgba(0,0,0,${0.1 - gradientIntensity * 0.1})`)
    //   ctx.globalCompositeOperation = 'multiply'
    //   ctx.fillStyle = overlayGradient
    //   ctx.fillRect(0, 0, width, height)
    // }

    // Step 7: Apply overlay effects (if enabled)
    if (overlayEnabled && overlayIntensity > 0) {
      applyOverlayEffect(ctx, width, height, overlayType, overlayIntensity)
    }
  }, [colors, posterizeSteps, noiseIntensity, gradientStyle, gradientIntensity, gradientDensity, zoomLevel, overlayEnabled, overlayType, overlayIntensity, createGradient, applyHeavyBlur, addRichGrain, applyOverlayEffect])

  // Expose high-resolution rendering to parent via canvas ref
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      (canvas as any).renderAtResolution = renderAtResolution
    }
  }, [renderAtResolution])

  // Smooth animation loop 
  const animate = useCallback(() => {
    if (!isAnimated) return
    
    const currentTime = Date.now() - startTimeRef.current
    drawBackground(currentTime)
    
    animationFrameRef.current = requestAnimationFrame(animate)
  }, [isAnimated, drawBackground])

  // Start/stop animation based on isAnimated prop (disabled for now)
  useEffect(() => {
    // Force animation off for now due to performance issues
    const animationEnabled = false // isAnimated && false
    
    if (animationEnabled) {
      startTimeRef.current = Date.now()
      animate()
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      drawBackground() // Draw static version
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isAnimated, animate, drawBackground])

  // Redraw when properties change (static version)
  useEffect(() => {
    console.log('useEffect triggered - isAnimated:', isAnimated, 'colors:', colors.length)
    if (!isAnimated) {
      drawBackground()
    }
  }, [drawBackground, triggerRegenerate, isAnimated])

  // Also trigger initial draw when colors are available
  useEffect(() => {
    console.log('Colors changed effect - colors:', colors.length)
    if (colors.length > 0) {
      drawBackground()
    }
  }, [colors, drawBackground])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      drawBackground()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [drawBackground])

  return (
    <canvas
      ref={canvasRef}
      className="rounded-xl"
      style={{ display: 'block' }}
    />
  )
} 