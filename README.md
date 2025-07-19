# 🎨 Background Generator

A modern, interactive gradient background generator built with Next.js, TypeScript, and React. Create stunning abstract gradients with advanced effects and export them in high resolution.

## ✨ Features

### 🎯 Core Gradient Generation
- **Dynamic Color System** - Curated brand color palette with smart color selection
- **Multiple Gradient Styles** - Radial, linear, conic, and mesh gradients
- **Real-time Preview** - Instant updates as you adjust parameters
- **Aspect Ratio Support** - 1:1, 3:4, 4:3, 16:9, 9:16 presets

### 🎛️ Advanced Controls
- **Intensity Control** - Adjust gradient strength and contrast
- **Complexity Settings** - Control the number of gradient layers
- **Zoom Levels** - From macro details to broad patterns
- **Film Grain** - Organic texture overlay with intensity control

### 🎪 Overlay Effects
- **Glass Ripple** - Vertical sine wave distortions
- **Horizontal Scanlines** - Digital glitch effects with horizontal displacement
- **Vertical Scanlines** - Digital glitch effects with vertical displacement  
- **Pattern Overlay** - Semi-transparent dot patterns
- **Noise Pulse** - RGB-split noise blocks

### 📤 Export Features
- **High-Resolution Export** - Multiple resolution options:
  - **Small (S)** - 1920×1080
  - **Medium (M)** - 2880×1800
  - **Large (L)** - 3840×2160
  - **Extra Large (XL)** - 5120×2880
- **WebP Format** - Optimized file sizes with high quality
- **Full Pipeline Rendering** - All effects applied at export resolution

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/background-generator.git
   cd background-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Built With

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **React** - Component-based UI
- **Canvas API** - High-performance gradient rendering
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons

## 🎨 Usage

1. **Choose Colors** - Select from curated brand colors or shuffle for random combinations
2. **Adjust Style** - Control intensity, complexity, and zoom level
3. **Add Effects** - Enable overlay effects and adjust their intensity
4. **Set Aspect Ratio** - Choose from common ratios or use custom dimensions
5. **Export** - Select your desired resolution and download as WebP

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx          # Main application page
│   └── globals.css       # Global styles
├── components/
│   ├── CanvasRenderer.tsx # Canvas rendering logic
│   ├── ControlsPanel.tsx  # UI controls
│   ├── Button.tsx         # Button component  
│   └── Select.tsx         # Dropdown component
└── lib/
    └── utils.ts          # Utility functions
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Inspired by modern gradient design trends
- Built with performance and user experience in mind
- Optimized for both creative exploration and production use 