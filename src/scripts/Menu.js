const navLinks = document.querySelector('.nav-links');
navLinks?.classList.toggle('expanded');

document.querySelector('.hamburger').addEventListener('click', () => {
    document.querySelector('.nav-links').classList.toggle('expanded');
  });

  
// 
document.querySelector(".goBack").addEventListener('click', () => window.history.back());