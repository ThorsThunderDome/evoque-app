document.addEventListener('DOMContentLoaded', () => {
    const sidebarToggler = document.getElementById('sidebar-toggler');
    const appContent = document.getElementById('app-content');

    if (sidebarToggler && appContent) {
        sidebarToggler.addEventListener('click', () => {
            appContent.classList.toggle('sidebar-collapsed');
        });
    }
});