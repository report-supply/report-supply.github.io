/* Shared dark/light theme toggle — same behaviour on every page */
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  const newTheme = isDark ? 'light' : 'dark';
  document.body.classList.add('theme-animating');
  setTimeout(() => document.body.classList.remove('theme-animating'), 500);
  html.setAttribute('data-theme', newTheme);
  const icon = document.getElementById('themeIcon');
  const text = document.getElementById('themeText');
  if (icon) icon.textContent = isDark ? '🌙' : '☀️';
  if (text) text.textContent = isDark ? 'Dark' : 'Light';
  localStorage.setItem('theme', newTheme);
}

(function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  document.addEventListener('DOMContentLoaded', () => {
    const icon = document.getElementById('themeIcon');
    const text = document.getElementById('themeText');
    if (icon) icon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    if (text) text.textContent = savedTheme === 'dark' ? 'Light' : 'Dark';
  });
})();
