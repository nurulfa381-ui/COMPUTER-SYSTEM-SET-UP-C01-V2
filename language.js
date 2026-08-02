function currentLanguage(){
  return localStorage.getItem(C01Storage.languageKey) || 'ms';
}

function applyLanguage(){
  const lang = currentLanguage();
  document.documentElement.lang = lang;

  document.querySelectorAll('[data-bm][data-en]').forEach(element => {
    element.textContent = lang === 'en' ? element.dataset.en : element.dataset.bm;
  });
}

function toggleLanguage(){
  const next = currentLanguage() === 'en' ? 'ms' : 'en';
  localStorage.setItem(C01Storage.languageKey, next);

  const profile = C01Storage.loadProfile();
  if(profile){
    profile.language = next;
    C01Storage.saveProfile(profile);
  }

  applyLanguage();
}

applyLanguage();
