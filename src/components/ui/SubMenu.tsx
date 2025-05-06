// filepath: /home/silas/code/Git/Repos/Website/ags/src/components/ui/SubMenu.tsx
import { h } from 'preact';
import { useEffect } from 'preact/hooks';

interface SubMenuProps {
  // Optional props if needed
}

export function SubMenu(props: SubMenuProps) {
  /**
   * Initialize submenu click functionality
   */
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    // Script to handle click on menu items
    const menuItems = document.querySelectorAll('.brutalist-sub-menu .menu-item');
    
    const handleMenuItemClick = (e: Event, item: Element) => {
      // Get the target element
      const targetId = item.getAttribute('href')?.substring(1);
      if (!targetId) return;
      
      const targetElement = document.getElementById(targetId);
      if (!targetElement) return;
      
      e.preventDefault();
      
      // Scroll to element
      targetElement.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
      
      // Apply darkening effect to other content
      document.querySelectorAll('.darkable').forEach(el => {
        if (el.id === targetId) {
          el.classList.add('content-highlighted');
          el.classList.remove('content-darkened');
        } else {
          el.classList.add('content-darkened');
          el.classList.remove('content-highlighted');
        }
      });
      
      // Add .darkable class to elements that should be affected
      if (!targetElement.classList.contains('darkable')) {
        targetElement.classList.add('darkable');
      }
      
      // Set a timeout to reset the effect after 5 seconds
      setTimeout(() => {
        document.querySelectorAll('.darkable').forEach(el => {
          el.classList.remove('content-darkened');
        });
      }, 5000);
    };
    
    menuItems.forEach(item => {
      item.addEventListener('click', (e) => handleMenuItemClick(e, item));
    });
    
    // Cleanup function to remove event listeners when component unmounts
    return () => {
      menuItems.forEach(item => {
        item.removeEventListener('click', (e) => handleMenuItemClick(e, item));
      });
    };
  }, []); // Run once on component mount
  
  // The component doesn't render any visible UI of its own
  return null;
}

export default SubMenu;