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

   Open [http://localhost:3000](http://localhost:3000) to see the app running locally.

## 🔧 Local Development Workflow

### Development vs Production
- **Local Development**: Runs on `http://localhost:3000` (no basePath)
- **Webflow Cloud**: Deployed to `/wow-bg` mount path
- **Configuration**: Automatically handled by `next.config.js`

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run dev:debug        # Start with Node.js debugging

# Local Testing  
npm run build:local      # Build for local testing (no basePath)
npm run start:local      # Start local production build
npm run type-check       # TypeScript type checking
npm run lint             # ESLint checking

# Webflow Cloud Deployment
npm run build            # Build for Webflow Cloud (with basePath)
npm run webflow:deploy   # Deploy to Webflow Cloud
```

### 🔄 Recommended Development Process

1. **Make changes locally** and test at `http://localhost:3000`
2. **Verify functionality** with the theme toggle, canvas rendering, etc.
3. **Run type checking**: `npm run type-check`
4. **Test production build locally**: `npm run build:local && npm run start:local`
5. **Deploy to Webflow**: `npm run webflow:deploy`

### 🎨 Testing Features Locally

All features work in local development:
- ✅ **Theme Toggle**: Light/Dark/System modes
- ✅ **Canvas Rendering**: All gradient styles and effects  
- ✅ **Export Functionality**: High-resolution WebP export
- ✅ **Image Upload**: Color extraction and analysis
- ✅ **Real-time Controls**: Sliders, dropdowns, color swatches

### 🐛 Troubleshooting

- **Port in use**: Try `npm run dev -- -p 3001` for different port
- **Build issues**: Clear `.next` folder: `rm -rf .next`
- **Type errors**: Run `npm run type-check` for detailed info

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