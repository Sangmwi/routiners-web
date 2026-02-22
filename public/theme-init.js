(function () {
  try {
    var stored = localStorage.getItem('routiners-theme');
    var mode = stored ? JSON.parse(stored).state?.mode : 'system';
    var resolved =
      mode === 'dark' ? 'dark' :
      mode === 'light' ? 'light' :
      window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', resolved);
  } catch (e) {}
})();
