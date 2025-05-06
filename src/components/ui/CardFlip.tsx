// filepath: /home/silas/code/Git/Repos/Website/ags/src/components/ui/CardFlip.tsx
import { h } from 'preact';
import { useEffect } from 'preact/hooks';

interface CardFlipProps {
  // Optional props if needed
}

export function CardFlip(props: CardFlipProps) {
  /**
   * Initialize card flip functionality
   */
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    // Card flip functionality
    document.querySelectorAll('.read-more-btn').forEach(button => {
      button.addEventListener('click', () => {
        const card = button.closest('.brutalist-card');
        if (card) {
          card.classList.add('flipped');
        }
      });
    });
    
    document.querySelectorAll('.back-btn').forEach(button => {
      button.addEventListener('click', () => {
        const card = button.closest('.brutalist-card');
        if (card) {
          card.classList.remove('flipped');
        }
      });
    });
    
    // Cleanup function to remove event listeners when component unmounts
    return () => {
      document.querySelectorAll('.read-more-btn').forEach(button => {
        button.removeEventListener('click', () => {
          const card = button.closest('.brutalist-card');
          if (card) {
            card.classList.add('flipped');
          }
        });
      });
      
      document.querySelectorAll('.back-btn').forEach(button => {
        button.removeEventListener('click', () => {
          const card = button.closest('.brutalist-card');
          if (card) {
            card.classList.remove('flipped');
          }
        });
      });
    };
  }, []); // Run once on component mount
  
  // The component doesn't render any visible UI of its own
  return null;
}

export default CardFlip;