const C01Storage = {
  profileKey: "c01_student_profile",
  languageKey: "c01_language",

  defaultProfile() {
    return {
      name: "",
      id: "",
      avatar: "🧑‍💻",
      language: "ms",

      xp: 50,
      coins: 10,

      // Repository ini bermula pada Mission 13
      unlocked: 13,

      completed: [],
      scores: {},
      attempts: {},
      ktDetails: {},
      pendingAssessments: {},
      officialMarks: {},

      professionalScore: 0,

      badges: ["first-login"],

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

  loadProfile() {
    try {
      const rawProfile = localStorage.getItem(this.profileKey);

      if (!rawProfile) {
        return null;
      }

      const savedProfile = JSON.parse(rawProfile);

      const profile = {
        ...this.defaultProfile(),
        ...savedProfile,

        scores: savedProfile.scores || {},
        attempts: savedProfile.attempts || {},
        ktDetails: savedProfile.ktDetails || {},
        pendingAssessments:
          savedProfile.pendingAssessments || {},
        officialMarks:
          savedProfile.officialMarks || {},

        completed:
          Array.isArray(savedProfile.completed)
            ? savedProfile.completed
            : [],

        badges:
          Array.isArray(savedProfile.badges)
            ? savedProfile.badges
            : ["first-login"],

        workPerformance: {
          ...this.defaultProfile().workPerformance,
          ...(savedProfile.workPerformance || {})
        }
      };

      /*
        Pastikan profil lama yang mempunyai
        unlocked: 1 turut boleh membuka Mission 13.
      */
      profile.unlocked = Math.max(
        Number(profile.unlocked || 1),
        13
      );

      return profile;
    } catch (error) {
      console.error(
        "Gagal membaca profil pelatih:",
        error
      );

      return null;
    }
  },

  saveProfile(profile) {
    try {
      const normalizedProfile = {
        ...this.defaultProfile(),
        ...profile,

        unlocked: Math.max(
          Number(profile?.unlocked || 1),
          13
        ),

        completed:
          Array.isArray(profile?.completed)
            ? profile.completed
            : [],

        badges:
          Array.isArray(profile?.badges)
            ? profile.badges
            : ["first-login"],

        scores: profile?.scores || {},
        attempts: profile?.attempts || {},
        ktDetails: profile?.ktDetails || {},

        pendingAssessments:
          profile?.pendingAssessments || {},

        officialMarks:
          profile?.officialMarks || {},

        updatedAt: new Date().toISOString()
      };

      localStorage.setItem(
        this.profileKey,
        JSON.stringify(normalizedProfile)
      );

      return normalizedProfile;
    } catch (error) {
      console.error(
        "Gagal menyimpan profil pelatih:",
        error
      );

      return null;
    }
  },

  createProfile({
    name,
    id,
    avatar,
    language
  }) {
    const profile = {
      ...this.defaultProfile(),

      name: name || "",
      id: id || "",
      avatar: avatar || "🧑‍💻",
      language: language || "ms",

      // Terus membuka Mission 13
      unlocked: 13,

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return profile;
  },

  requireProfile() {
    const profile = this.loadProfile();

    if (
      !profile ||
      !profile.name ||
      !profile.id
    ) {
      const currentPath =
        window.location.pathname.toLowerCase();

      /*
        KP13 dan KT13 berada dua folder
        di bawah root repository.
      */
      if (
        currentPath.includes("/kp/") ||
        currentPath.includes("/kt/")
      ) {
        window.location.href =
          "../../login.html";
      } else {
        window.location.href =
          "login.html";
      }

      throw new Error(
        "Profil pelatih diperlukan."
      );
    }

    return profile;
  },

  updateProfile(updates = {}) {
    const currentProfile =
      this.loadProfile() ||
      this.defaultProfile();

    const updatedProfile = {
      ...currentProfile,
      ...updates,

      unlocked: Math.max(
        Number(
          updates.unlocked ??
          currentProfile.unlocked ??
          1
        ),
        13
      ),

      updatedAt: new Date().toISOString()
    };

    return this.saveProfile(
      updatedProfile
    );
  },

  setLanguage(language = "ms") {
    localStorage.setItem(
      this.languageKey,
      language
    );

    const profile = this.loadProfile();

    if (profile) {
      profile.language = language;

      this.saveProfile(profile);
    }

    return language;
  },

  getLanguage() {
    const profile = this.loadProfile();

    return (
      profile?.language ||
      localStorage.getItem(
        this.languageKey
      ) ||
      "ms"
    );
  },

  saveScore(missionId, score) {
    const profile =
      this.requireProfile();

    profile.scores =
      profile.scores || {};

    profile.scores[missionId] =
      Number(score) || 0;

    return this.saveProfile(profile);
  },

  saveAttempt(missionId) {
    const profile =
      this.requireProfile();

    profile.attempts =
      profile.attempts || {};

    profile.attempts[missionId] =
      Number(
        profile.attempts[missionId] || 0
      ) + 1;

    this.saveProfile(profile);

    return profile.attempts[missionId];
  },

  addCompletedMission(missionId) {
    const profile =
      this.requireProfile();

    profile.completed =
      profile.completed || [];

    if (
      !profile.completed.includes(
        missionId
      )
    ) {
      profile.completed.push(
        missionId
      );
    }

    return this.saveProfile(profile);
  },

  unlockMission(missionId) {
    const profile =
      this.requireProfile();

    profile.unlocked = Math.max(
      Number(profile.unlocked || 13),
      Number(missionId || 13),
      13
    );

    return this.saveProfile(profile);
  },

  addXp(amount = 0) {
    const profile =
      this.requireProfile();

    profile.xp =
      Number(profile.xp || 0) +
      Number(amount || 0);

    this.saveProfile(profile);

    return profile.xp;
  },

  addCoins(amount = 0) {
    const profile =
      this.requireProfile();

    profile.coins =
      Number(profile.coins || 0) +
      Number(amount || 0);

    this.saveProfile(profile);

    return profile.coins;
  },

  addBadge(badgeId) {
    const profile =
      this.requireProfile();

    profile.badges =
      profile.badges || [];

    if (
      badgeId &&
      !profile.badges.includes(
        badgeId
      )
    ) {
      profile.badges.push(
        badgeId
      );
    }

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
    const currentProfile =
      this.requireProfile();

    const resetProfile =
      this.createProfile({
        name: currentProfile.name,
        id: currentProfile.id,
        avatar:
          currentProfile.avatar,
        language:
          currentProfile.language || "ms"
      });

    return this.saveProfile(
      resetProfile
    );
  }
};
