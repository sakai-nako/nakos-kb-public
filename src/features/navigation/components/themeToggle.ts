type ThemePref = 'system' | 'light' | 'dark';
type Resolved = 'light' | 'dark';

function resolveTheme(pref: ThemePref): Resolved {
  if (pref === 'light' || pref === 'dark') return pref;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(pref: ThemePref): void {
  const html = document.documentElement;
  if (pref === 'system') {
    localStorage.removeItem('theme');
  } else {
    localStorage.setItem('theme', pref);
  }
  html.dataset.themePref = pref;
  html.dataset.theme = resolveTheme(pref);
}

export function initThemeToggle(): void {
  const html = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  const menu = document.getElementById('theme-menu');

  if (!btn || !menu) return;

  const items = menu.querySelectorAll<HTMLElement>('[data-theme]');

  function updateAriaCurrent(): void {
    const current = html.dataset.themePref ?? 'system';
    items.forEach((el) => {
      el.setAttribute('aria-current', el.dataset.theme === current ? 'true' : 'false');
    });
  }

  function openMenu(): void {
    menu!.hidden = false;
    btn!.setAttribute('aria-expanded', 'true');
  }

  function closeMenu(): void {
    menu!.hidden = true;
    btn!.setAttribute('aria-expanded', 'false');
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (menu.hidden) {
      openMenu();
    } else {
      closeMenu();
    }
  });

  menu.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const item = target.closest<HTMLElement>('[data-theme]');
    if (!item) return;
    const pref = item.dataset.theme as ThemePref;
    applyTheme(pref);
    updateAriaCurrent();
    closeMenu();
  });

  document.addEventListener('click', (e) => {
    if (menu.hidden) return;
    const target = e.target as Node;
    if (!btn.contains(target) && !menu.contains(target)) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) {
      closeMenu();
      btn.focus();
    }
  });

  // OS 側の prefers-color-scheme 変更は、ユーザーが「system」を選んでいるときだけ追従
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (html.dataset.themePref === 'system') {
      html.dataset.theme = e.matches ? 'dark' : 'light';
    }
  });

  updateAriaCurrent();
}
