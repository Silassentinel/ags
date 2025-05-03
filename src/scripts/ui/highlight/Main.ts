// Screen dimension utility function
export const GetScreenDimensions = (): { horizontal: number, vertical: number } => {
    const horizontal = window.innerWidth;
    const vertical = window.innerHeight;
    return { horizontal, vertical };
};

export const getScreenSize = (): { horizontal: number, vertical: number } => {
    return GetScreenDimensions();
};