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
    // 0.5 * 3 messages -> index 1 -> 'Hi'
    jest.spyOn(Math, 'random').mockReturnValue(0.5);

    render(h(Greeting, { messages }));
    const button = screen.getByRole('button', { name: /New Greeting/i });
    fireEvent.click(button);

    expect(screen.getByText(/Hi!/)).toBeInTheDocument();
  });

  it('displays a thank you message', () => {
    render(h(Greeting, { messages }));
    expect(screen.getByText(/Thank you for visiting!/)).toBeInTheDocument();
  });

  it('keeps consistent greeting structure when changing messages', () => {
    // Cycle through the messages: 1/3 -> 'Hi', 2/3 -> 'Hey', 0 -> 'Hello'
    let callCount = 0;
    jest.spyOn(Math, 'random').mockImplementation(() => {
      callCount += 1;
      return (callCount % 3) / 3;
    });

    render(h(Greeting, { messages }));
    const button = screen.getByRole('button', { name: /New Greeting/i });

    expect(screen.getByText(/Hello!/)).toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.getByText(/Hi!/)).toBeInTheDocument();
    expect(screen.getByText(/Thank you for visiting!/)).toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.getByText(/Hey!/)).toBeInTheDocument();
    expect(screen.getByText(/Thank you for visiting!/)).toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.getByText(/Hello!/)).toBeInTheDocument();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});
