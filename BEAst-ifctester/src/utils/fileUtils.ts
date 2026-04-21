/**
 * Reads a file and returns its content as a text string
 */
export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target && typeof e.target.result === 'string') {
        resolve(e.target.result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
  });
}

/**
 * Fetches a file from a given path and returns its content as text
 */
export async function fetchFileAsText(filePath: string): Promise<string> {
  const response = await fetch(filePath);
  if (!response.ok) {
    throw new Error(`Failed to load file from ${filePath}: ${response.statusText}`);
  }
  return await response.text();
}

/**
 * Shows an error message to the user
 */
export function showError(message: string, duration: number = 5000): void {
  const errorElement = document.createElement('div');
  errorElement.style.position = 'fixed';
  errorElement.style.top = '20px';
  errorElement.style.left = '50%';
  errorElement.style.transform = 'translateX(-50%)';
  errorElement.style.backgroundColor = '#ff4d4d';
  errorElement.style.color = 'white';
  errorElement.style.padding = '10px 20px';
  errorElement.style.borderRadius = '4px';
  errorElement.style.zIndex = '1000';
  errorElement.textContent = message;
  
  document.body.appendChild(errorElement);
  
  setTimeout(() => {
    errorElement.style.opacity = '0';
    errorElement.style.transition = 'opacity 0.5s';
    
    setTimeout(() => {
      document.body.removeChild(errorElement);
    }, 500);
  }, duration);
} 