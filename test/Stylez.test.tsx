import { h } from 'preact';
import { renderHook } from '@testing-library/preact-hooks';
import '@testing-library/jest-dom';
import { Stylez, skillColor, fontWeight, textCase, useStylez } from '../src/components/ui/Stylez';

describe('Stylez Component', () => {
  // Test individual exports
  test('Stylez object contains expected style definitions', () => {
    expect(Stylez).toHaveProperty('headings.h1.color', 'purple');
    expect(Stylez).toHaveProperty('headings.h1.fontSize', '4rem');
    expect(Stylez).toHaveProperty('elements.skill.color', 'green');
    expect(Stylez).toHaveProperty('elements.skill.fontWeight', 'bold');
  });
  
  test('skillColor is defined correctly', () => {
    expect(skillColor).toEqual([0, 255, 0]);
  });
  
  test('fontWeight is defined correctly', () => {
    expect(fontWeight).toBe('bold');
  });
  
  test('textCase is defined correctly', () => {
    expect(textCase).toBe('2rem');
  });
  
  // Test the useStylez hook
  test('useStylez hook returns all style constants', () => {
    const { result } = renderHook(() => useStylez());
    
    // Add null checks before accessing result.current
    if (result.current) {
      expect(result.current).toHaveProperty('Stylez');
      expect(result.current).toHaveProperty('skillColor');
      expect(result.current).toHaveProperty('fontWeight');
      expect(result.current).toHaveProperty('textCase');
      
      // Check that the values match the exported constants
      expect(result.current.Stylez).toBe(Stylez);
      expect(result.current.skillColor).toBe(skillColor);
      expect(result.current.fontWeight).toBe(fontWeight);
      expect(result.current.textCase).toBe(textCase);
    } else {
      // Fail the test if result.current is undefined
      fail('renderHook result is undefined');
    }
  });
});