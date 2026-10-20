import { h } from 'preact';
import { useEffect } from 'preact/hooks';
import { initNavMenu, toggleNavMenu } from '../../scripts/ui/Menu';

interface MenuProps {
  // Optional props if needed
}

/**
 * Mounts the mobile navigation behaviour (hamburger toggle, back button).
 * The logic lives in src/scripts/ui/Menu.ts so it can be unit-tested
 * without Preact; this component only ties it to the page lifecycle.
 */
export function Menu(_props: MenuProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    return initNavMenu();
  }, []);

  // The component doesn't render any visible UI of its own
  return null;
}

export { toggleNavMenu };
export default Menu;
