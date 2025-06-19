export function generateStrainId(): string {
  return `strain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function calculateUserLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function xpToNextLevel(currentXp: number): number {
  const currentLevel = calculateUserLevel(currentXp);
  const nextLevelXp = Math.pow(currentLevel, 2) * 100;
  return nextLevelXp - currentXp;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength - 3) + '...';
}

export function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function generateRandomColor(): string {
  const colors = ['#4CAF50', '#FFC107', '#2196F3', '#9C27B0', '#FF5722'];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function calculateStrainMatch(strain1: string, strain2: string): number {
  const s1 = strain1.toLowerCase();
  const s2 = strain2.toLowerCase();
  
  if (s1 === s2) return 100;
  
  let matches = 0;
  const minLength = Math.min(s1.length, s2.length);
  
  for (let i = 0; i < minLength; i++) {
    if (s1[i] === s2[i]) matches++;
  }
  
  return Math.round((matches / Math.max(s1.length, s2.length)) * 100);
}

export function formatTHCCBD(thc: number, cbd: number): string {
  return `THC: ${thc.toFixed(1)}% | CBD: ${cbd.toFixed(1)}%`;
}

export function getStrainTypeColor(type: 'sativa' | 'indica' | 'hybrid'): string {
  switch (type) {
    case 'sativa':
      return '#4CAF50';
    case 'indica':
      return '#9C27B0';
    case 'hybrid':
      return '#FF9800';
    default:
      return '#757575';
  }
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function validateUsername(username: string): boolean {
  if (!username || username.length < 3 || username.length > 20) {
    return false;
  }
  
  // Allow alphanumeric characters, underscores, and hyphens
  const validPattern = /^[a-zA-Z0-9_-]+$/;
  return validPattern.test(username);
}

export function validateStrainName(strainName: string): boolean {
  if (!strainName || strainName.length < 2 || strainName.length > 50) {
    return false;
  }
  
  // Allow letters, numbers, spaces, and common symbols
  const validPattern = /^[a-zA-Z0-9\s\-_#.()]+$/;
  return validPattern.test(strainName);
}