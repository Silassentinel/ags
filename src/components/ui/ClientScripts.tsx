import { h } from 'preact';
import ChaosMode from '../features/ChaosMode/ChaosMode';
import Menu from './Menu';
import Theme from './Theme';
import CardFlip from './CardFlip';
import SubMenu from './SubMenu';
import ContentHighlight from '../features/ContentHighlight/ContentHighlight';
import Settings from './Settings';

/**
 * ClientScripts component that includes all client-side functionality
 * 
 * This component combines all the individual functionality components
 * in one place, making it easy to include all client-side scripts
 * in Astro pages.
 */
export function ClientScripts() {
  return (
    <>
      {/* Theme switching functionality */}
      <Theme />
      
      {/* Mobile menu functionality */}
      <Menu />
      
      {/* Card flip functionality */}
      <CardFlip />
      
      {/* Submenu functionality */}
      <SubMenu />
      
      {/* Content highlighting based on viewport */}
      <ContentHighlight />
      
      {/* Chaos mode easter egg */}
      <ChaosMode />
      
      {/* Settings panel for toggling features */}
      <Settings />
    </>
  );
}

export default ClientScripts;