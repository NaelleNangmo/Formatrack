// Formatage des montants en FCFA
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';
}

// Formatage des dates
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

// Formatage des dates courtes
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

// Formatage des heures
export function formatTime(timeString: string): string {
  return timeString.slice(0, 5); // HH:MM
}

// Obtenir l'heure actuelle
export function getCurrentTime(): string {
  const now = new Date();
  return now.toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
}

// Obtenir la date actuelle
export function getCurrentDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Vérifier si c'est un retard (après 9h00)
export function isLate(timeString: string): boolean {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours > 9 || (hours === 9 && minutes > 0);
}