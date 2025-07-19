'use client'

import React, { useRef, useState, useCallback } from 'react'
import { Color } from '@/utils/colors'

interface DraggableColorBlob {
  id: string
  color: Color
  x: number // 0-1 normalized position
  y: number // 0-1 normalized position
  radius: number // 0-1 normalized size
  intensity: number
}

interface DraggableBlobOverlayProps {
  blobs: DraggableColorBlob[]
  isDragging: boolean
  dragBlobId: string | null
  onBlobDragStart: (blobId: string) => void
  onBlobDrag: (blobId: string, x: number, y: number) => void
  onBlobDragEnd: () => void
}

export const DraggableBlobOverlay: React.FC<DraggableBlobOverlayProps> = ({
  blobs,
  isDragging,
  dragBlobId,
  onBlobDragStart,
  onBlobDrag,
  onBlobDragEnd
}) => {
  const overlayRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent, blobId: string) => {
    e.preventDefault()
    onBlobDragStart(blobId)
  }, [onBlobDragStart])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragBlobId || !overlayRef.current) return

    const rect = overlayRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    onBlobDrag(dragBlobId, x, y)
  }, [isDragging, dragBlobId, onBlobDrag])

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      onBlobDragEnd()
    }
  }, [isDragging, onBlobDragEnd])

  return (
    <div 
      ref={overlayRef}
      className="absolute inset-0 pointer-events-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {blobs.map((blob) => {
        const isBeingDragged = dragBlobId === blob.id
        const size = Math.max(24, blob.radius * 100) // Convert to pixel size with minimum
        
        return (
          <div
            key={blob.id}
            className={`absolute pointer-events-auto cursor-grab rounded-full border-2 transition-all duration-200 ${
              isBeingDragged 
                ? 'border-white shadow-lg scale-110 cursor-grabbing' 
                : 'border-white/70 hover:border-white hover:scale-105'
            }`}
            style={{
              left: `${blob.x * 100}%`,
              top: `${blob.y * 100}%`,
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: blob.color.hex,
              transform: `translate(-50%, -50%)`,
              boxShadow: isBeingDragged 
                ? '0 8px 25px rgba(0,0,0,0.3)' 
                : '0 2px 8px rgba(0,0,0,0.2)',
              zIndex: isBeingDragged ? 1000 : 10
            }}
            onMouseDown={(e) => handleMouseDown(e, blob.id)}
            title={`${blob.color.name} - Drag to reposition`}
          >
            {/* Inner glow effect */}
            <div 
              className="absolute inset-1 rounded-full opacity-50"
              style={{
                backgroundColor: blob.color.hex,
                filter: 'blur(3px)'
              }}
            />
            
            {/* Center indicator */}
            <div 
              className="absolute top-1/2 left-1/2 w-2 h-2 bg-white/80 rounded-full transform -translate-x-1/2 -translate-y-1/2"
            />
          </div>
        )
      })}
      
      {/* Dragging instructions */}
      {blobs.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-black/50 text-white text-sm px-3 py-2 rounded-lg pointer-events-none">
          💡 Drag the color blobs to reposition them
        </div>
      )}
    </div>
  )
} 