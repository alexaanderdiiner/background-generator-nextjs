export const brandColors = {
  red: {
    900: '#3C0009',
    800: '#5D000D',
    700: '#850013',
    600: '#B0001C',
    500: '#DB1A30',
    400: '#F13D51',
    300: '#F5737C',
    200: '#F998A2',
    100: '#FCC3C9',
  },
  orange: {
    900: '#3F1D00',
    800: '#5E2B00',
    700: '#874100',
    600: '#B75C00',
    500: '#EF7800',
    400: '#F1933D',
    300: '#F5A969',
    200: '#F9C198',
    100: '#FDDDC3',
  },
  yellow: {
    900: '#3F3300',
    800: '#5E4B00',
    700: '#876C00',
    600: '#B69000',
    500: '#D9A800',
    400: '#FABD13',
    300: '#F8C752',
    200: '#F9D388',
    100: '#FDE6C1',
  },
  green: {
    900: '#002015',
    800: '#00422B',
    700: '#006638',
    600: '#008F44',
    500: '#00C16A',
    400: '#22E067',
    300: '#46F16D',
    200: '#91F3AE',
    100: '#CAF9D1',
  },
  blue: {
    900: '#001435',
    800: '#002A6A',
    700: '#0042AD',
    600: '#005DD4',
    500: '#168EFF',
    400: '#399FFF',
    300: '#6CAFFF',
    200: '#90C6FF',
    100: '#C1E1FF',
  },
  purple: {
    900: '#160B2F',
    800: '#2F165B',
    700: '#50219B',
    600: '#6D2BD7',
    500: '#8B45FF',
    400: '#A870FF',
    300: '#C38CFF',
    200: '#D7B3FF',
    100: '#E7D9FF',
  },
  pink: {
    900: '#3D0020',
    800: '#6A0040',
    700: '#9C0068',
    600: '#CC188A',
    500: '#F54CB3',
    400: '#F779C7',
    300: '#F89FD5',
    200: '#FABEE0',
    100: '#FDD9ED',
  },
};

export interface Color {
  name: string;
  hex: string;
  rgb: [number, number, number];
}

// Define utility functions first
export const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
      ]
    : [0, 0, 0];
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

// Convert the new brandColors structure to the existing Color interface format
export const BRAND_COLORS: Color[] = Object.entries(brandColors).flatMap(([colorName, shades]) =>
  Object.entries(shades).map(([shade, hex]) => ({
    name: `${colorName.charAt(0).toUpperCase() + colorName.slice(1)} ${shade}`,
    hex,
    rgb: hexToRgb(hex)
  }))
);

// Helper function to get colors by shade across all color families
export const getColorsByShade = (shade: keyof typeof brandColors.red): Color[] => {
  return Object.entries(brandColors).map(([colorName, shades]) => ({
    name: `${colorName.charAt(0).toUpperCase() + colorName.slice(1)} ${shade}`,
    hex: shades[shade],
    rgb: hexToRgb(shades[shade])
  }));
};

// Helper function to get all shades of a specific color
export const getColorShades = (colorName: keyof typeof brandColors): Color[] => {
  return Object.entries(brandColors[colorName]).map(([shade, hex]) => ({
    name: `${colorName.charAt(0).toUpperCase() + colorName.slice(1)} ${shade}`,
    hex,
    rgb: hexToRgb(hex)
  }));
};

// Updated to work with the new color structure
export const getRandomColors = (count: number = 3): Color[] => {
  const shuffled = [...BRAND_COLORS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Get random colors from mid-range shades (400-600) for better gradients
export const getRandomMidToneColors = (count: number = 3): Color[] => {
  const midToneShades: (keyof typeof brandColors.red)[] = [400, 500, 600];
  const colors: Color[] = [];
  
  Object.entries(brandColors).forEach(([colorName, shades]) => {
    midToneShades.forEach(shade => {
      colors.push({
        name: `${colorName.charAt(0).toUpperCase() + colorName.slice(1)} ${shade}`,
        hex: shades[shade],
        rgb: hexToRgb(shades[shade])
      });
    });
  });
  
  const shuffled = colors.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Color harmony functions for creating interesting compositions
export const getComplementaryColors = (): Color[] => {
  const colorPairs = [
    ['red', 'green'],
    ['blue', 'orange'],
    ['yellow', 'purple'],
  ];
  
  const randomPair = colorPairs[Math.floor(Math.random() * colorPairs.length)];
  const shades = [400, 500, 600];
  const colors: Color[] = [];
  
  randomPair.forEach(colorName => {
    const shade = shades[Math.floor(Math.random() * shades.length)];
    if (brandColors[colorName as keyof typeof brandColors]) {
      colors.push({
        name: `${colorName.charAt(0).toUpperCase() + colorName.slice(1)} ${shade}`,
        hex: brandColors[colorName as keyof typeof brandColors][shade as keyof typeof brandColors.red],
        rgb: hexToRgb(brandColors[colorName as keyof typeof brandColors][shade as keyof typeof brandColors.red])
      });
    }
  });
  
  return colors;
};

export const getAnalogousColors = (): Color[] => {
  const colorGroups = [
    ['red', 'orange', 'yellow'],
    ['yellow', 'green', 'blue'],
    ['blue', 'purple', 'red'],
    ['green', 'blue', 'purple'],
  ];
  
  const randomGroup = colorGroups[Math.floor(Math.random() * colorGroups.length)];
  const shades = [300, 400, 500, 600];
  const colors: Color[] = [];
  
  randomGroup.forEach(colorName => {
    const shade = shades[Math.floor(Math.random() * shades.length)];
    if (brandColors[colorName as keyof typeof brandColors]) {
      colors.push({
        name: `${colorName.charAt(0).toUpperCase() + colorName.slice(1)} ${shade}`,
        hex: brandColors[colorName as keyof typeof brandColors][shade as keyof typeof brandColors.red],
        rgb: hexToRgb(brandColors[colorName as keyof typeof brandColors][shade as keyof typeof brandColors.red])
      });
    }
  });
  
  return colors;
};

export const getTriadicColors = (): Color[] => {
  const colorTriads = [
    ['red', 'yellow', 'blue'],
    ['orange', 'green', 'purple'],
  ];
  
  const randomTriad = colorTriads[Math.floor(Math.random() * colorTriads.length)];
  const shades = [400, 500, 600];
  const colors: Color[] = [];
  
  randomTriad.forEach(colorName => {
    const shade = shades[Math.floor(Math.random() * shades.length)];
    if (brandColors[colorName as keyof typeof brandColors]) {
      colors.push({
        name: `${colorName.charAt(0).toUpperCase() + colorName.slice(1)} ${shade}`,
        hex: brandColors[colorName as keyof typeof brandColors][shade as keyof typeof brandColors.red],
        rgb: hexToRgb(brandColors[colorName as keyof typeof brandColors][shade as keyof typeof brandColors.red])
      });
    }
  });
  
  return colors;
};

export const getMonochromaticColors = (): Color[] => {
  const colorNames = Object.keys(brandColors);
  const randomColor = colorNames[Math.floor(Math.random() * colorNames.length)] as keyof typeof brandColors;
  const shades = [300, 400, 500, 600, 700];
  const colors: Color[] = [];
  
  // Pick 3 different shades of the same color
  const selectedShades = shades.sort(() => 0.5 - Math.random()).slice(0, 3);
  
  selectedShades.forEach(shade => {
    colors.push({
      name: `${randomColor.charAt(0).toUpperCase() + randomColor.slice(1)} ${shade}`,
      hex: brandColors[randomColor][shade as keyof typeof brandColors.red],
      rgb: hexToRgb(brandColors[randomColor][shade as keyof typeof brandColors.red])
    });
  });
  
  return colors;
};

export const getWarmColors = (): Color[] => {
  const warmColorNames = ['red', 'orange', 'yellow'];
  const shades = [300, 400, 500, 600];
  const colors: Color[] = [];
  
  // Pick 2-3 warm colors
  const numColors = Math.floor(Math.random() * 2) + 2;
  const selectedColors = warmColorNames.sort(() => 0.5 - Math.random()).slice(0, numColors);
  
  selectedColors.forEach(colorName => {
    const shade = shades[Math.floor(Math.random() * shades.length)];
    colors.push({
      name: `${colorName.charAt(0).toUpperCase() + colorName.slice(1)} ${shade}`,
      hex: brandColors[colorName as keyof typeof brandColors][shade as keyof typeof brandColors.red],
      rgb: hexToRgb(brandColors[colorName as keyof typeof brandColors][shade as keyof typeof brandColors.red])
    });
  });
  
  return colors;
};

export const getCoolColors = (): Color[] => {
  const coolColorNames = ['blue', 'green', 'purple'];
  const shades = [300, 400, 500, 600];
  const colors: Color[] = [];
  
  // Pick 2-3 cool colors
  const numColors = Math.floor(Math.random() * 2) + 2;
  const selectedColors = coolColorNames.sort(() => 0.5 - Math.random()).slice(0, numColors);
  
  selectedColors.forEach(colorName => {
    const shade = shades[Math.floor(Math.random() * shades.length)];
    if (brandColors[colorName as keyof typeof brandColors]) {
      colors.push({
        name: `${colorName.charAt(0).toUpperCase() + colorName.slice(1)} ${shade}`,
        hex: brandColors[colorName as keyof typeof brandColors][shade as keyof typeof brandColors.red],
        rgb: hexToRgb(brandColors[colorName as keyof typeof brandColors][shade as keyof typeof brandColors.red])
      });
    }
  });
  
  return colors;
};

export const getVibrantColors = (): Color[] => {
  const vibrantShades = [400, 500] as const; // More saturated shades
  const colors: Color[] = [];
  
  Object.entries(brandColors).forEach(([colorName, shades]) => {
    vibrantShades.forEach(shade => {
      colors.push({
        name: `${colorName.charAt(0).toUpperCase() + colorName.slice(1)} ${shade}`,
        hex: shades[shade as keyof typeof shades],
        rgb: hexToRgb(shades[shade as keyof typeof shades])
      });
    });
  });
  
  const shuffled = colors.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
};

export const getSubtleColors = (): Color[] => {
  const subtleShades = [200, 300] as const; // Lighter, more muted shades
  const colors: Color[] = [];
  
  Object.entries(brandColors).forEach(([colorName, shades]) => {
    subtleShades.forEach(shade => {
      colors.push({
        name: `${colorName.charAt(0).toUpperCase() + colorName.slice(1)} ${shade}`,
        hex: shades[shade as keyof typeof shades],
        rgb: hexToRgb(shades[shade as keyof typeof shades])
      });
    });
  });
  
  const shuffled = colors.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
};

// Curated mood-based color combinations
export const getSunsetColors = (): Color[] => {
  return [
    { name: 'Orange 500', hex: brandColors.orange[500], rgb: hexToRgb(brandColors.orange[500]) },
    { name: 'Red 400', hex: brandColors.red[400], rgb: hexToRgb(brandColors.red[400]) },
    { name: 'Yellow 400', hex: brandColors.yellow[400], rgb: hexToRgb(brandColors.yellow[400]) },
  ];
};

export const getOceanColors = (): Color[] => {
  return [
    { name: 'Blue 500', hex: brandColors.blue[500], rgb: hexToRgb(brandColors.blue[500]) },
    { name: 'Green 400', hex: brandColors.green[400], rgb: hexToRgb(brandColors.green[400]) },
    { name: 'Blue 300', hex: brandColors.blue[300], rgb: hexToRgb(brandColors.blue[300]) },
  ];
};

export const getForestColors = (): Color[] => {
  return [
    { name: 'Green 600', hex: brandColors.green[600], rgb: hexToRgb(brandColors.green[600]) },
    { name: 'Green 400', hex: brandColors.green[400], rgb: hexToRgb(brandColors.green[400]) },
    { name: 'Yellow 300', hex: brandColors.yellow[300], rgb: hexToRgb(brandColors.yellow[300]) },
  ];
};

export const getRoyalColors = (): Color[] => {
  return [
    { name: 'Purple 600', hex: brandColors.purple[600], rgb: hexToRgb(brandColors.purple[600]) },
    { name: 'Blue 600', hex: brandColors.blue[600], rgb: hexToRgb(brandColors.blue[600]) },
    { name: 'Purple 400', hex: brandColors.purple[400], rgb: hexToRgb(brandColors.purple[400]) },
  ];
};

// Get colors by mood/style
export const getColorsByMood = (moodType: string): Color[] => {
  switch (moodType) {
    case 'warm':
      return getWarmColors();
    case 'cool':
      return getCoolColors();
    case 'expressive':
      return getVibrantColors(); // High contrast, bold colors
    case 'modern':
      return getMonochromaticColors(); // Clean, sophisticated single-color variations
    case 'sophisticated':
      return getSubtleColors(); // Muted, elegant tones
    case 'wild':
      return getTriadicColors(); // Bold, high-contrast combinations
    case 'energetic':
      return getComplementaryColors(); // High contrast, dynamic
    case 'calm':
      return getAnalogousColors(); // Harmonious, flowing colors
    case 'sunset':
      return getSunsetColors();
    case 'ocean':
      return getOceanColors();
    case 'forest':
      return getForestColors();
    case 'royal':
      return getRoyalColors();
    default:
      return getRandomMidToneColors(3);
  }
}; 