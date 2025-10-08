document.addEventListener('DOMContentLoaded', () => {
    const sidebarToggler = document.getElementById('sidebar-toggler');
    const appContent = document.getElementById('app-content');

    if (sidebarToggler && appContent) {
        sidebarToggler.addEventListener('click', () => {
            appContent.classList.toggle('sidebar-collapsed');
            
      // --- THEME SWITCHER LOGIC ---
const themeToggle = document.getElementById('theme-toggle');

function applyTheme(theme) {
    if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        themeToggle.checked = false;
    } else {
        document.documentElement.removeAttribute('data-theme');
        themeToggle.checked = true;
    }
    localStorage.setItem('theme', theme);
}

// Apply saved theme on page load, defaulting to dark
const currentTheme = localStorage.getItem('theme') || 'dark';
applyTheme(currentTheme);

// Handle toggle click
themeToggle.addEventListener('change', function() {
    if (this.checked) {
        applyTheme('dark');
    } else {
        applyTheme('light');
    }
     });
  });
    }
});
