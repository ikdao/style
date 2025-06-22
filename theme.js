(function () {
  const THEME_KEY = 'theme';
  const themeToggle = document.getElementById('theme');
  const root = document.documentElement;

  if (!themeToggle || !root) return;

  // Determine preferred theme
  const savedTheme = localStorage.getItem(THEME_KEY);
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

  const applyTheme = (theme) => {
    root.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    themeToggle.setAttribute('aria-pressed', theme === 'dark');
  };

  applyTheme(initialTheme);

  themeToggle.addEventListener('click', () => {
    const current = root.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  window.styleTheme = {
    toggle: () => themeToggle.click(),
    set: applyTheme,
    current: () => root.getAttribute('data-theme'),
  };
})();
