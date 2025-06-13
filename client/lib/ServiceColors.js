export const serviceColors = {
    'Informatique': {
        light: 'bg-blue-100',
        medium: 'bg-blue-200',
        dark: 'bg-blue-600',
        text: 'text-blue-800',
        border: 'border-blue-300',
        hover: 'hover:bg-blue-700'
    },
    'Technique': {
        light: 'bg-green-100',
        medium: 'bg-green-200',
        dark: 'bg-green-600',
        text: 'text-green-800',
        border: 'border-green-300',
        hover: 'hover:bg-green-700'
    },
    'Économat': {
        light: 'bg-amber-100',
        medium: 'bg-amber-200',
        dark: 'bg-amber-600',
        text: 'text-amber-800',
        border: 'border-amber-300',
        hover: 'hover:bg-amber-700'
    },
    // Couleur par défaut
    'default': {
        light: 'bg-gray-100',
        medium: 'bg-gray-200',
        dark: 'bg-gray-600',
        text: 'text-gray-800',
        border: 'border-gray-300',
        hover: 'hover:bg-gray-700'
    }
};

export function getServiceColor(serviceName) {
    if (!serviceName) return serviceColors.default;
    
    if (serviceName.includes('Informatique')) return serviceColors.Informatique;
    if (serviceName.includes('Technique')) return serviceColors.Technique;
    if (serviceName.includes('Économat') || serviceName.includes('Economat')) return serviceColors.Économat;
    
    return serviceColors.default;
}