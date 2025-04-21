// Theme management
class ThemeManager {
    constructor() {
        this.darkTheme = true; // Always start with dark theme
        this.applyTheme();
    }

    applyTheme() {
        document.body.classList.toggle('dark-theme', this.darkTheme);
        
        // Store theme preference
        localStorage.setItem('theme', this.darkTheme ? 'dark' : 'light');
    }
}

// Initialize theme when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});
