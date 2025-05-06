// filepath: /home/silas/code/Git/Repos/Website/ags/test/Greeting.test.tsx
import { h } from 'preact';
import { render, screen, fireEvent } from '@testing-library/preact';
import '@testing-library/jest-dom';
import Greeting from '../src/components/Greeting';

describe('Greeting Component', () => {
  const messages = ['Hello', 'Hi', 'Hey'];

  it('renders the initial greeting message', () => {
    render(h(Greeting, { messages }));
    expect(screen.getByText(/Hello/)).toBeInTheDocument();
  });

  it('changes the greeting message when the button is clicked', () => {
    // Mock Math.random to return a predictable value
    const mockMath = Object.create(global.Math);
    mockMath.random = jest.fn().mockReturnValue(0.5); // Will select messages[1] which is 'Hi'
    global.Math = mockMath;

    render(h(Greeting, { messages }));
    const button = screen.getByRole('button', { name: /New Greeting/i });
    fireEvent.click(button);
    
    // Check that greeting has changed to 'Hi'
    expect(screen.getByText(/Hi!/)).toBeInTheDocument();
  });

  it('displays a thank you message', () => {
    render(h(Greeting, { messages }));
    expect(screen.getByText(/Thank you for visiting!/)).toBeInTheDocument();
  });

  it('keeps consistent greeting structure when changing messages', () => {
    // Mock Math.random to return different values on consecutive calls
    const mockMath = Object.create(global.Math);
    let callCount = 0;
    mockMath.random = jest.fn().mockImplementation(() => {
      callCount += 1;
      return callCount % 3 / 3; // Will cycle through 0.33, 0.66, 0
    });
    global.Math = mockMath;

    render(h(Greeting, { messages }));
    const button = screen.getByRole('button', { name: /New Greeting/i });
    
    // Initial greeting
    expect(screen.getByText(/Hello!/)).toBeInTheDocument();
    
    // Click button multiple times and check structure
    fireEvent.click(button);
    expect(screen.getByText(/Hey!/)).toBeInTheDocument();
    expect(screen.getByText(/Thank you for visiting!/)).toBeInTheDocument();
    
    fireEvent.click(button);
    expect(screen.getByText(/Hello!/)).toBeInTheDocument();
    expect(screen.getByText(/Thank you for visiting!/)).toBeInTheDocument();
  });

  it('handles empty messages array gracefully', () => {
    render(h(Greeting, { messages: [] }));
    
    // Even with empty messages, the component should not crash
    expect(screen.getByText(/Thank you for visiting!/)).toBeInTheDocument();
    
    const button = screen.getByRole('button', { name: /New Greeting/i });
    expect(button).toBeInTheDocument();
    
    // Clicking the button should not crash the component
    expect(() => fireEvent.click(button)).not.toThrow();
  });
});