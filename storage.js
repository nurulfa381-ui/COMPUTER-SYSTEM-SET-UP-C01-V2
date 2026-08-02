const C01Storage = {
  profileKey: 'c01_student_profile',
  languageKey: 'c01_language',

  loadProfile(){
    try{
      return JSON.parse(localStorage.getItem(this.profileKey) || 'null');
    }catch{
      return null;
    }
  },

  saveProfile(profile){
    localStorage.setItem(this.profileKey, JSON.stringify(profile));
  },

  createProfile({name, id, avatar, language}){
    return {
      name,
      id,
      avatar,
      language,
      xp: 50,
      coins: 10,
      unlocked: 1,
      completed: [],
      scores: {},
      professionalScore: 0,
      badges: ['first-login'],
      workPerformance: {
        safety: 0,
        procedure: 0,
        accuracy: 0,
        quality: 0,
        documentation: 0
      }
    };
  },

  requireProfile(){
    const profile = this.loadProfile();
    if(!profile){
      location.href = 'login.html';
      throw new Error('Profile required');
    }
    return profile;
  },

  clearSession(){
    localStorage.removeItem(this.profileKey);
  }
};
