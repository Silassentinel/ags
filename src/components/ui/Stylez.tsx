import { h } from 'preact';

/**
 * Common style definitions that can be used across the application
 */
export const Stylez = {
    headings: {
        h1: {
            color: 'purple',
            fontSize: '4rem'
        }
    },
    elements: {
        skill: {
            color: 'green',
            fontWeight: 'bold'
        }
    }
};

/**
 * RGB color for skill elements
 */
export const skillColor: [number, number, number] = [0, 255, 0];

/**
 * Font weight for emphasized elements
 */
export const fontWeight: string = "bold";

/**
 * Default text size
 */
export const textCase: string = "2rem";

/**
 * Hook to provide style constants throughout the application
 */
export const useStylez = () => {
    return {
        Stylez,
        skillColor,
        fontWeight,
        textCase
    };
};

export default useStylez;