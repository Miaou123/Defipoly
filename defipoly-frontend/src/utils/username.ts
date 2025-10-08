/**
 * Get username for a wallet address
 */
export function getUsername(address: string): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(`username_${address}`);
  }
  
  /**
   * Set username for a wallet address
   */
  export function setUsername(address: string, username: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`username_${address}`, username);
  }
  
  /**
   * Get display name (username or shortened address)
   */
  export function getDisplayName(address: string): string {
    const username = getUsername(address);
    if (username) return username;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }