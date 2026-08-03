const C01Storage = {
  profileKey: "c01_student_profile",
  languageKey: "c01_language",

  loadProfile() {
    try {
      return JSON.parse(
        localStorage.getItem(this.profileKey) || "null"
      );
    } catch (error) {
      console.error("Gagal membaca profil pelatih:", error);
      return null;
    }
  },

  saveProfile(profile) {
    try {
      localStorage.setItem(
        this.profileKey,
        JSON.stringify(profile)
      );

      return profile;
    } catch (error) {
      console.error("Gagal menyimpan profil pelatih:", error);
      return null;
    }
  },

  createProfile({ name, id, avatar, language }) {
    return {
      name: name || "",
      id: id || "",
      avatar: avatar || "🧑‍💻",
      language: language || "ms",

      xp: 50,
      coins: 10,
      unlocked: 1,

      completed: [],
      scores: {},
      attempts: {},
      ktDetails: {},
      pendingAssessments: {},
      officialMarks: {},

      professionalScore: 0,

      badges: [
        "first-login"
      ],

      workPerformance: {
        safety: 0,
        procedure: 0,
        accuracy: 0,
        quality: 0,
        documentation: 0
      },

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },

  requireProfile() {
    const profile = this.loadProfile();

    if (!profile) {
      const currentPath = window.location.pathname.toLowerCase();

      /*
        Jika halaman dibuka dari:
        /kp/kp13/index.html
        /kt/kt13/index.html

        Login berada dua folder di atas:
        ../../login.html
      */

      if (
        currentPath.includes("/kp/") ||
        currentPath.includes("/kt/")
      ) {
        window.location.href = "../../login.html";
      } else {
        /*
          Jika halaman berada di root seperti:
          dashboard.html
          kp13.html
          kt13.html
        */
        window.location.href = "login.html";
      }

      throw new Error("Profil pelatih diperlukan.");
    }

    return profile;
  },

  updateProfile(updates = {}) {
    const currentProfile =
      this.loadProfile() || {};

    const updatedProfile = {
      ...currentProfile,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.saveProfile(updatedProfile);

    return updatedProfile;
  },

  setLanguage(language = "ms") {
    localStorage.setItem(
      this.languageKey,
      language
    );

    const profile = this.loadProfile();

    if (profile) {
      profile.language = language;
      profile.updatedAt = new Date().toISOString();

      this.saveProfile(profile);
    }

    return language;
  },

  getLanguage() {
    const profile = this.loadProfile();

    return (
      profile?.language ||
      localStorage.getItem(this.languageKey) ||
      "ms"
    );
  },

  saveScore(missionId, score) {
    const profile = this.requireProfile();

    profile.scores =
      profile.scores || {};

    profile.scores[missionId] =
      Number(score) || 0;

    profile.updatedAt =
      new Date().toISOString();

    this.saveProfile(profile);

    return profile;
  },

  saveAttempt(missionId) {
    const profile = this.requireProfile();

    profile.attempts =
      profile.attempts || {};

    profile.attempts[missionId] =
      Number(profile.attempts[missionId] || 0) + 1;

    profile.updatedAt =
      new Date().toISOString();

    this.saveProfile(profile);

    return profile.attempts[missionId];
  },

  addCompletedMission(missionId) {
    const profile = this.requireProfile();

    profile.completed =
      profile.completed || [];

    if (
      !profile.completed.includes(missionId)
    ) {
      profile.completed.push(missionId);
    }

    profile.updatedAt =
      new Date().toISOString();

    this.saveProfile(profile);

    return profile;
  },

  unlockMission(missionId) {
    const profile = this.requireProfile();

    const missionNumber =
      Number(missionId) || 1;

    profile.unlocked = Math.max(
      Number(profile.unlocked || 1),
      missionNumber
    );

    profile.updatedAt =
      new Date().toISOString();

    this.saveProfile(profile);

    return profile;
  },

  addXp(amount = 0) {
    const profile = this.requireProfile();

    profile.xp =
      Number(profile.xp || 0) +
      Number(amount || 0);

    profile.updatedAt =
      new Date().toISOString();

    this.saveProfile(profile);

    return profile.xp;
  },

  addCoins(amount = 0) {
    const profile = this.requireProfile();

    profile.coins =
      Number(profile.coins || 0) +
      Number(amount || 0);

    profile.updatedAt =
      new Date().toISOString();

    this.saveProfile(profile);

    return profile.coins;
  },

  addBadge(badgeId) {
    const profile = this.requireProfile();

    profile.badges =
      profile.badges || [];

    if (
      badgeId &&
      !profile.badges.includes(badgeId)
    ) {
      profile.badges.push(badgeId);
    }

    profile.updatedAt =
      new Date().toISOString();

    this.saveProfile(profile);

    return profile.badges;
  },

  clearSession() {
    localStorage.removeItem(
      this.profileKey
    );

    sessionStorage.clear();
  },

  resetProgress() {
    const profile = this.requireProfile();

    const resetProfile = {
      ...this.createProfile({
        name: profile.name,
        id: profile.id,
        avatar: profile.avatar,
        language:
          profile.language || "ms"
      })
    };

    this.saveProfile(resetProfile);

    return resetProfile;
  }
};
