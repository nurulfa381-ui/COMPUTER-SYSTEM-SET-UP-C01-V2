function rankFromXp(xp){
  if(xp >= 5000) return 'Computer System Specialist';
  if(xp >= 3500) return 'Senior System Engineer';
  if(xp >= 2500) return 'System Engineer';
  if(xp >= 1600) return 'Senior Technician';
  if(xp >= 900) return 'Computer Technician';
  if(xp >= 400) return 'Junior Technician';
  return 'Trainee Technician';
}

function renderDashboard(){
  const profile = C01Storage.requireProfile();

  document.getElementById('profileAvatar').textContent = profile.avatar;
  document.getElementById('profileName').textContent = profile.name;
  document.getElementById('profileId').textContent = profile.id;
  document.getElementById('studentGreeting').textContent =
    currentLanguage() === 'en'
      ? `Welcome, ${profile.name}`
      : `Selamat datang, ${profile.name}`;

  document.getElementById('profileRank').textContent = rankFromXp(profile.xp);

  const level = 1 + Math.floor(profile.xp / 500);
  const levelProgress = profile.xp % 500;

  document.getElementById('levelStat').textContent = level;
  document.getElementById('coinStat').textContent = profile.coins;
  document.getElementById('proStat').textContent = `${profile.professionalScore || 0}%`;
  document.getElementById('badgeStat').textContent = (profile.badges || []).length;
  document.getElementById('xpText').textContent = `${levelProgress} / 500`;
  document.getElementById('xpBar').style.width = `${(levelProgress/500)*100}%`;

  const completed = profile.completed || [];
  const progress = Math.round((completed.length / C01_MISSIONS.length) * 100);
  document.getElementById('overallProgress').textContent = `${progress}%`;

  const list = document.getElementById('missionList');
  list.innerHTML = C01_MISSIONS.map(mission => {
    const isDone = completed.includes(mission.id);
    const isOpen = mission.id <= profile.unlocked;
    const score = profile.scores?.[mission.id];

    return `
      <article class="mission-card ${isDone ? 'done' : isOpen ? 'open' : 'locked'}">
        <div class="mission-number">${String(mission.id).padStart(2,'0')}</div>
        <div class="mission-body">
          <small>MISSION ${String(mission.id).padStart(2,'0')}</small>
          <h3>${mission.title}</h3>
          <p>${score !== undefined ? `Markah KT: ${score}%` : isOpen ? 'Sedia untuk dimulakan' : 'Lengkapkan misi sebelumnya'}</p>
        </div>
        <div class="mission-action">
          ${isOpen
            ? `<button class="btn ${isDone ? 'btn-secondary' : 'btn-primary'}" onclick="location.href='${mission.kp}'">${isDone ? 'Ulang Kaji' : 'Mula'}</button>`
            : `<span class="lock-icon">🔒</span>`}
        </div>
      </article>
    `;
  }).join('');
}

function speakByte(){
  const text = document.getElementById('byteMessage').textContent;
  if('speechSynthesis' in window){
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = currentLanguage() === 'en' ? 'en-US' : 'ms-MY';
    speechSynthesis.speak(utterance);
  }
}

function logout(){
  C01Storage.clearSession();
  location.href = 'index.html';
}

renderDashboard();
