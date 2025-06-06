/**
 * Tests for Skills.ts and Identity module TypeScript implementation
 * 
 * These tests verify the skills and identity functionality.
 */

import '@testing-library/jest-dom';
import { 
  Skill, 
  SoftSKill, 
  TechSkill, 
  compareSkillsByLevel, 
  techSkills, 
  softSkills, 
  identity 
} from '../../src/scripts/ContentBuilder/Identity/core/Skills';
import type { SkillType } from '../../src/scripts/ContentBuilder/Identity/core/Skills';

describe('Skills and Identity Module', () => {
  test('Skill class can be instantiated with a name', () => {
    const skill = new Skill('Test Skill');
    expect(skill).toBeInstanceOf(Skill);
    expect(skill.Name).toBe('Test Skill');
  });
  
  test('SoftSkill class extends Skill and adds level property', () => {
    const softSkill = new SoftSKill('Communication', 9);
    expect(softSkill).toBeInstanceOf(Skill);
    expect(softSkill).toBeInstanceOf(SoftSKill);
    expect(softSkill.Name).toBe('Communication');
    expect(softSkill.level).toBe(9);
  });
  
  test('TechSkill class extends Skill and adds experience and tools properties', () => {
    const techSkill = new TechSkill('JavaScript', 5, ['React', 'Node.js']);
    expect(techSkill).toBeInstanceOf(Skill);
    expect(techSkill).toBeInstanceOf(TechSkill);
    expect(techSkill.Name).toBe('JavaScript');
    expect(techSkill.experience).toBe(5);
    expect(techSkill.Tools).toEqual(['React', 'Node.js']);
  });
  
  test('compareSkillsByLevel sorts skills by level in descending order', () => {
    const skill1: SkillType = { name: 'Skill 1', level: 8 };
    const skill2: SkillType = { name: 'Skill 2', level: 10 };
    const skill3: SkillType = { name: 'Skill 3', level: 5 };
    
    const skills = [skill1, skill2, skill3];
    const sortedSkills = [...skills].sort(compareSkillsByLevel);
    
    expect(sortedSkills[0]).toBe(skill2); // level 10
    expect(sortedSkills[1]).toBe(skill1); // level 8
    expect(sortedSkills[2]).toBe(skill3); // level 5
  });
  
  test('techSkills array contains predefined technical skills', () => {
    expect(techSkills).toBeInstanceOf(Array);
    expect(techSkills.length).toBeGreaterThan(0);
    
    // Check for specific skills
    const frontendSkill = techSkills.find(skill => skill.Name === 'FrontEnd Development');
    expect(frontendSkill).toBeDefined();
    expect(frontendSkill?.Tools).toContain('React');
    
    // Verify all skills are instances of TechSkill
    techSkills.forEach(skill => {
      expect(skill).toBeInstanceOf(TechSkill);
    });
  });
  
  test('softSkills array contains predefined soft skills', () => {
    expect(softSkills).toBeInstanceOf(Array);
    expect(softSkills.length).toBeGreaterThan(0);
    
    // Check for specific skills
    const learningSkill = softSkills.find(skill => skill.Name === 'Eager to learn');
    expect(learningSkill).toBeDefined();
    expect(learningSkill?.level).toBe(10);
    
    // Verify all skills are instances of SoftSkill
    softSkills.forEach(skill => {
      expect(skill).toBeInstanceOf(SoftSKill);
    });
  });
  
  test('identity object has correct structure and properties', () => {
    expect(identity).toBeDefined();
    expect(identity.firstName).toBe('Benjamin');
    expect(identity.country).toBe('Belgium');
    expect(identity.occupation).toContain('Software');
    
    // Check hobbies array
    expect(identity.hobbies).toBeInstanceOf(Array);
    expect(identity.hobbies).toContain('cooking');
    
    // Check skills arrays
    expect(identity.softSkills).toBe(softSkills);
    expect(identity.techSkills).toBe(techSkills);
  });
  
  test('Skill toString method returns the skill name', () => {
    const skill = new Skill('Programming');
    expect(skill.toString()).toBe('Programming');
  });
});