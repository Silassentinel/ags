// Content highlighting script
// When content is in the center of the screen it should be highlighted
// When content is not in the center of the screen it should be darkened

document.addEventListener('DOMContentLoaded', () => {
  const highlightElements = document.querySelectorAll('.highlight-in-viewport');
  
  const observerOptions = {
    root: null, // use viewport as reference
    rootMargin: '-20% 0px', // shrink the effective viewport by 20% vertically
    threshold: 0.6 // element is considered "in center" when 60% visible
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Element is in center of viewport
        entry.target.classList.add('content-highlighted');
        entry.target.classList.remove('content-darkened');
      } else {
        // Element is not in center of viewport
        entry.target.classList.remove('content-highlighted');
        entry.target.classList.add('content-darkened');
      }
    });
  }, observerOptions);
  
  // Start observing each element
  highlightElements.forEach(element => {
    observer.observe(element);
  });
});