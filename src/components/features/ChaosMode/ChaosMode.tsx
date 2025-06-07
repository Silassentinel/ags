import { h } from 'preact';
import { useEffect } from 'preact/hooks';
import { initChaosMode } from '../../../scripts/ui/features/ChaosMode/Index';

interface ChaosModeProps {
  // Optional props if needed
}

export function ChaosMode(props: ChaosModeProps) {
  // Set up effects when component mounts
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    // Initialize the ChaosMode implementation
    initChaosMode();
    
    // No cleanup needed as ChaosMode manages its own lifecycle
  }, []); // Only run once on mount
  
  // The component doesn't render any visible UI of its own
  return null;
}

// Export the component
export default ChaosMode;