import { h } from 'preact';
import { render, screen } from '@testing-library/preact';
import '@testing-library/jest-dom';
import SkillCard from '../src/components/Resume/SkillCard.astro';

describe('SkillCard Component', () => {
  it('renders the skill name and tools', () => {
    const mockTechSkills = [
      {
        Name: 'Frontend Development',
        Tools: ['HTML', 'CSS', 'JavaScript']
      }
    ];

    jest.mock('../src/scripts/ContentBuilder/Identity/core', () => ({
      techSkills: mockTechSkills
    }));

    render(<SkillCard />);

    expect(screen.getByText('Frontend Development')).toBeInTheDocument();
    mockTechSkills[0].Tools.forEach((tool) => {
      expect(screen.getByText(tool)).toBeInTheDocument();
    });
  });
});