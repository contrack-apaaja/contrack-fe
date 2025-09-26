// Shared color utility for contract types
// This ensures consistent colors between chart and table

export const getContractTypeColor = (type: string, isHex: boolean = false) => {
  // Predefined colors for common contract types
  const predefinedColors: { [key: string]: { hex: string; tailwind: string } } = {
    'Construction': { hex: '#3B82F6', tailwind: 'bg-blue-100 text-blue-800' },
    'Supply': { hex: '#10B981', tailwind: 'bg-green-100 text-green-800' },
    'Service Agreement': { hex: '#F59E0B', tailwind: 'bg-amber-100 text-amber-800' },
    'Service': { hex: '#8B5CF6', tailwind: 'bg-purple-100 text-purple-800' },
    'Maintenance': { hex: '#EF4444', tailwind: 'bg-red-100 text-red-800' },
    'Consulting': { hex: '#06B6D4', tailwind: 'bg-cyan-100 text-cyan-800' },
    'School': { hex: '#84CC16', tailwind: 'bg-lime-100 text-lime-800' },
    'Employment': { hex: '#F97316', tailwind: 'bg-orange-100 text-orange-800' },
    'Kontrak Kerja': { hex: '#EC4899', tailwind: 'bg-pink-100 text-pink-800' },
    'Partnership': { hex: '#6366F1', tailwind: 'bg-indigo-100 text-indigo-800' },
    'Lease': { hex: '#14B8A6', tailwind: 'bg-teal-100 text-teal-800' },
    'Purchase': { hex: '#DC2626', tailwind: 'bg-red-100 text-red-800' },
  };

  // If type exists in predefined colors, return it
  if (predefinedColors[type]) {
    return isHex ? predefinedColors[type].hex : predefinedColors[type].tailwind;
  }

  // For unknown types, generate a consistent color based on the type name
  const fallbackColors = [
    { hex: '#3B82F6', tailwind: 'bg-blue-100 text-blue-800' },
    { hex: '#10B981', tailwind: 'bg-green-100 text-green-800' },
    { hex: '#F59E0B', tailwind: 'bg-amber-100 text-amber-800' },
    { hex: '#8B5CF6', tailwind: 'bg-purple-100 text-purple-800' },
    { hex: '#EF4444', tailwind: 'bg-red-100 text-red-800' },
    { hex: '#06B6D4', tailwind: 'bg-cyan-100 text-cyan-800' },
    { hex: '#84CC16', tailwind: 'bg-lime-100 text-lime-800' },
    { hex: '#F97316', tailwind: 'bg-orange-100 text-orange-800' },
    { hex: '#EC4899', tailwind: 'bg-pink-100 text-pink-800' },
    { hex: '#6366F1', tailwind: 'bg-indigo-100 text-indigo-800' },
    { hex: '#14B8A6', tailwind: 'bg-teal-100 text-teal-800' },
    { hex: '#DC2626', tailwind: 'bg-red-100 text-red-800' },
  ];

  // Use hash of the type name to get a consistent color
  let hash = 0;
  for (let i = 0; i < type.length; i++) {
    const char = type.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  const colorIndex = Math.abs(hash) % fallbackColors.length;
  return isHex ? fallbackColors[colorIndex].hex : fallbackColors[colorIndex].tailwind;
};

// Generate colors for multiple contract types
export const generateContractTypeColors = (types: string[]) => {
  const colorMap: { [key: string]: { hex: string; tailwind: string } } = {};
  
  types.forEach((type, index) => {
    colorMap[type] = {
      hex: getContractTypeColor(type, true),
      tailwind: getContractTypeColor(type, false)
    };
  });
  
  return colorMap;
};
