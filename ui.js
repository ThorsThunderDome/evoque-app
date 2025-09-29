document.addEventListener('DOMContentLoaded', () => {
    const sidebarToggler = document.getElementById('sidebar-toggler');
    const sidebar = document.getElementById('sidebar');

    if (sidebarToggler && sidebar) {
        sidebarToggler.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }
});
