document.addEventListener('DOMContentLoaded', () => {
    const sidebarToggler = document.getElementById('sidebar-toggler');
    const appContent = document.getElementById('app-content');

    if (sidebarToggler && appContent) {
        sidebarToggler.addEventListener('click', () => {
            appContent.classList.toggle('sidebar-collapsed');
            
      // --- THEME SWITCHER LOGIC ---
const themeToggle = document.getElementById('theme-toggle');

// Function to set the theme
function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
        themeToggle.checked = true;
    } else {
        themeToggle.checked = false;
    }
}

// Apply the saved theme on page load
const currentTheme = localStorage.getItem('theme');
if (currentTheme) {
    setTheme(currentTheme);
} else {
    // Default to dark mode if no theme is saved
    setTheme('dark');
}

// Handle toggle click
themeToggle.addEventListener('change', function() {
    if (this.checked) {
        setTheme('dark');
    } else {
        setTheme('light');
    }
     });
  });
    }
});
