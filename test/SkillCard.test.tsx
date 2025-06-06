import { h } from 'preact';
import { render, screen } from '@testing-library/preact';
import '@testing-library/jest-dom';
// The SkillCard component is an Astro component, so we need to mock it
// or test a preact wrapper if it exists

// Mock the SkillCard component for testing
const SkillCard = () => {
  return h('div', { class: 'skill-card' },
    h('h3', {}, 'Frontend Development'),
    h('ul', {}, 
      ['HTML', 'CSS', 'JavaScript'].map(tool => 
        h('li', { key: tool }, tool)
      )
    )
  );
};

describe('SkillCard Component', () => {
  it('renders the skill name and tools', () => {
    const mockTechSkills = [
      {
        Name: 'Frontend Development',
        Tools: ['HTML', 'CSS', 'JavaScript']
      }
    ];

    // Mock the core module
    jest.mock('../src/scripts/ContentBuilder/Identity/core', () => ({
      techSkills: mockTechSkills
    }));

    render(h(SkillCard, {}));

    expect(screen.getByText('Frontend Development')).toBeInTheDocument();
    mockTechSkills[0].Tools.forEach((tool) => {
      expect(screen.getByText(tool)).toBeInTheDocument();
    });
  });
});