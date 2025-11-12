/**
 * CSS Debug Utilities
 * Helps diagnose and fix CSS loading issues
 */

// Force style recalculation for elements that might have CSS loading issues
export const forceStyleRecalculation = () => {
  if (typeof window !== 'undefined') {
    // Force reflow by reading computed styles
    document.body.offsetHeight;
    
    // Re-trigger CSS animations and transitions
    const elements = document.querySelectorAll('*');
    elements.forEach(el => {
      if (el instanceof HTMLElement) {
        const display = el.style.display;
        el.style.display = 'none';
        el.offsetHeight; // Trigger reflow
        el.style.display = display;
      }
    });
  }
};

// Check if Tailwind CSS is properly loaded
export const checkTailwindLoaded = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Create a test element with Tailwind classes
  const testEl = document.createElement('div');
  testEl.className = 'bg-blue-500 text-white p-4';
  testEl.style.visibility = 'hidden';
  testEl.style.position = 'absolute';
  document.body.appendChild(testEl);
  
  const styles = window.getComputedStyle(testEl);
  const hasBackground = styles.backgroundColor !== 'rgba(0, 0, 0, 0)' && styles.backgroundColor !== 'transparent';
  const hasColor = styles.color !== 'rgba(0, 0, 0, 0)' && styles.color !== '';
  const hasPadding = styles.padding !== '0px';
  
  document.body.removeChild(testEl);
  
  return hasBackground && hasColor && hasPadding;
};

// Force CSS reload
export const reloadCSS = () => {
  if (typeof window === 'undefined') return;
  
  const links = document.querySelectorAll('link[rel="stylesheet"]');
  links.forEach((link) => {
    if (link instanceof HTMLLinkElement) {
      const href = link.href;
      link.href = '';
      setTimeout(() => {
        link.href = href;
      }, 10);
    }
  });
};

// Log CSS debugging information
export const debugCSS = () => {
  if (typeof window === 'undefined') return;
  
  console.group('🎨 CSS Debug Information');
  console.log('Tailwind loaded:', checkTailwindLoaded());
  console.log('Stylesheets count:', document.querySelectorAll('link[rel="stylesheet"]').length);
  console.log('Style tags count:', document.querySelectorAll('style').length);
  
  // Check for common CSS issues
  const bodyStyles = window.getComputedStyle(document.body);
  console.log('Body background:', bodyStyles.background);
  console.log('Body color:', bodyStyles.color);
  
  console.groupEnd();
};