const GetScreenDimensions = (): { horizontal: number, vertical: number } => {
    const horizontal = window.innerWidth;
    const vertical = window.innerHeight;
    return { horizontal, vertical };
};

const { horizontal, vertical } = GetScreenDimensions();