/**
 * Screen dimension utility functions
 * @returns Object containing horizontal (width) and vertical (height) screen dimensions
 */
export const getScreenDimensions = (): { horizontal: number, vertical: number } => {
    const horizontal = window.innerWidth;
    const vertical = window.innerHeight;
    return { horizontal, vertical };
};

// Export getScreenSize as an alias for backward compatibility
export const getScreenSize = getScreenDimensions;