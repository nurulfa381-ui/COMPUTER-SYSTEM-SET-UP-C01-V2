/*
  C01 FIREBASE SYNC OVERLAY
  ------------------------------------------------------------
  Tujuan:
  - Kekalkan enjin KT asal dan localStorage.
  - Hantar profil serta markah KT13, KT14 dan KT15 ke Firestore.
  - Terima pengesahan rasmi guru secara masa nyata.
  - Tidak mengubah logik pemarkahan asal.

  Keperluan di root repository:
  - firebase-config.js
  - firebase-storage.js
  - firebase-sync.js

  Cara panggil pada halaman KT:
  <script type="module" src="../../firebase-sync.js?v=20260804-1"></script>
*/

import {
  C01FirebaseStorage
} from "./firebase-storage.js";

const C01FirebaseSync = (() => {
  const WATCHED_KEYS = new Set([
    "c01_student_profile",
    "c01_kp14_profile_v1",
    "c01_kp15_profile_v1"
  ]);

  const MISSION_IDS = [13, 14, 15];

  let started = false;
  let syncing = false;
  let syncTimer = null;
  let originalSetItem = null;
  const unsubscribeMap = new Map();

  function safeParse(value) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  }

  function getBestLocalProfile() {
    const profile =
      C01FirebaseStorage.readLocalProfile();

    return profile?.name && profile?.id
      ? profile
      : null;
  }

  function detectCurrentMission() {
    const path =
      window.location.pathname.toLowerCase();

    if (path.includes("kt13") || path.includes("kp13")) {
      return 13;
    }

    if (path.includes("kt14") || path.includes("kp14")) {
      return 14;
    }

    if (path.includes("kt15") || path.includes("kp15")) {
      return 15;
    }

    const profile =
      getBestLocalProfile();

    if (profile?.pendingAssessments?.[15] || profile?.scores?.[15] !== undefined) {
      return 15;
    }

    if (profile?.pendingAssessments?.[14] || profile?.scores?.[14] !== undefined) {
      return 14;
    }

    return 13;
  }

  function getAssessmentFromProfile(profile, missionId) {
    const pending =
      profile?.pendingAssessments?.[missionId];

    const detail =
      profile?.ktDetails?.[missionId];

    const score =
      pending?.score ??
      detail?.percentage ??
      profile?.scores?.[missionId];

    if (score === undefined || score === null) {
      return null;
    }

    const attempt =
      pending?.attempt ??
      profile?.attempts?.[missionId] ??
      1;

    const numericScore =
      Number(score) || 0;

    const passed =
      pending?.passed ??
      detail?.passed ??
      numericScore >= 60;

    const status =
      pending?.status ??
      detail?.status ??
      (
        passed
          ? "MENUNGGU_PENGESAHAN"
          : "BELUM_TERAMPIL"
      );

    return {
      missionId,
      score: numericScore,

      sectionA:
        pending?.sectionA ??
        detail?.mcqMarks ??
        detail?.sectionA ??
        0,

      sectionB:
        pending?.sectionB ??
        detail?.matchingMarks ??
        detail?.sectionB ??
        0,

      sectionC:
        pending?.sectionC ??
        detail?.sequenceMarks ??
        detail?.sectionC ??
        0,

      sectionD:
        pending?.sectionD ??
        detail?.sectionD ??
        0,

      attempt:
        Number(attempt) || 1,

      passed:
        Boolean(passed),

      status,

      details: {
        source:
          "firebase-sync-overlay",

        submittedAtLocal:
          pending?.submittedAt ??
          detail?.submittedAt ??
          new Date().toISOString()
      }
    };
  }

  async function syncProfile() {
    const profile =
      getBestLocalProfile();

    if (!profile) {
      return null;
    }

    return C01FirebaseStorage.saveStudentProfile({
      name: profile.name,
      id: profile.id,
      studentId:
        profile.studentId ||
        profile.id,

      avatar:
        profile.avatar ||
        "🧑‍💻",

      language:
        profile.language ||
        "ms",

      xp:
        Number(profile.xp || 50),

      coins:
        Number(profile.coins || 0),

      currentMission:
        detectCurrentMission(),

      repository:
        getRepositoryName()
    });
  }

  async function syncMission(missionId) {
    const profile =
      getBestLocalProfile();

    if (!profile) {
      return null;
    }

    const assessment =
      getAssessmentFromProfile(
        profile,
        missionId
      );

    if (!assessment) {
      return null;
    }

    return C01FirebaseStorage.saveKTScore(
      assessment
    );
  }

  async function syncAll() {
    if (syncing) {
      return;
    }

    syncing = true;

    try {
      await syncProfile();

      for (const missionId of MISSION_IDS) {
        await syncMission(missionId);
      }

      dispatchSyncEvent(
        "c01-firebase-sync-success"
      );
    } catch (error) {
      console.error(
        "C01 Firebase Sync gagal:",
        error
      );

      dispatchSyncEvent(
        "c01-firebase-sync-error",
        {
          message:
            error?.message ||
            String(error)
        }
      );
    } finally {
      syncing = false;
    }
  }

  function scheduleSync(delay = 350) {
    window.clearTimeout(syncTimer);

    syncTimer =
      window.setTimeout(
        syncAll,
        delay
      );
  }

  function patchLocalStorage() {
    if (originalSetItem) {
      return;
    }

    originalSetItem =
      localStorage.setItem.bind(
        localStorage
      );

    localStorage.setItem =
      function patchedSetItem(
        key,
        value
      ) {
        originalSetItem(
          key,
          value
        );

        if (WATCHED_KEYS.has(key)) {
          scheduleSync();
        }
      };
  }

  function listenStorageChanges() {
    window.addEventListener(
      "storage",
      event => {
        if (
          event.key &&
          WATCHED_KEYS.has(event.key)
        ) {
          scheduleSync(100);
        }
      }
    );
  }

  async function startOfficialListeners() {
    const profile =
      getBestLocalProfile();

    if (!profile) {
      return;
    }

    for (const missionId of MISSION_IDS) {
      if (
        unsubscribeMap.has(
          missionId
        )
      ) {
        continue;
      }

      const unsubscribe =
        C01FirebaseStorage
          .listenToStudentAssessment(
            missionId,
            assessment => {
              if (!assessment) {
                return;
              }

              if (
                assessment.official === true &&
                assessment.locked === true
              ) {
                applyOfficialToLocal(
                  missionId,
                  assessment
                );

                dispatchSyncEvent(
                  "c01-official-mark-updated",
                  {
                    missionId,
                    assessment
                  }
                );
              }
            },
            error => {
              console.error(
                `Listener rasmi KT${missionId} gagal:`,
                error
              );
            }
          );

      unsubscribeMap.set(
        missionId,
        unsubscribe
      );
    }
  }

  function applyOfficialToLocal(
    missionId,
    assessment
  ) {
    const profile =
      getBestLocalProfile();

    if (!profile) {
      return;
    }

    profile.officialMarks =
      profile.officialMarks || {};

    profile.pendingAssessments =
      profile.pendingAssessments || {};

    profile.scores =
      profile.scores || {};

    profile.officialMarks[
      missionId
    ] = {
      score:
        Number(
          assessment.score || 0
        ),

      status:
        assessment.status ||
        (
          Number(
            assessment.score || 0
          ) >= 60
            ? "TERAMPIL"
            : "BELUM TERAMPIL"
        ),

      assessor:
        assessment.assessor ||
        "Pegawai Penilai",

      verifiedAt:
        timestampToIso(
          assessment.verifiedAt
        ),

      locked:
        true
    };

    profile.scores[
      missionId
    ] =
      Number(
        assessment.score || 0
      );

    delete profile
      .pendingAssessments[
        missionId
      ];

    C01FirebaseStorage
      .saveLocalProfile(
        profile,
        profile.__localStorageKey
      );
  }

  function timestampToIso(value) {
    if (!value) {
      return new Date()
        .toISOString();
    }

    if (
      typeof value.toDate ===
      "function"
    ) {
      return value
        .toDate()
        .toISOString();
    }

    const date =
      new Date(value);

    return Number.isNaN(
      date.getTime()
    )
      ? new Date().toISOString()
      : date.toISOString();
  }

  function getRepositoryName() {
    const parts =
      window.location.pathname
        .split("/")
        .filter(Boolean);

    return (
      parts[0] ||
      "COMPUTER-SYSTEM-SET-UP-C01"
    );
  }

  function dispatchSyncEvent(
    name,
    detail = {}
  ) {
    window.dispatchEvent(
      new CustomEvent(
        name,
        { detail }
      )
    );
  }

  function exposeManualControls() {
    window.C01FirebaseSync = {
      syncNow:
        syncAll,

      syncProfile,

      syncMission,

      scheduleSync,

      startOfficialListeners,

      getLocalProfile:
        getBestLocalProfile
    };
  }

  async function start() {
    if (started) {
      return;
    }

    started = true;

    patchLocalStorage();
    listenStorageChanges();
    exposeManualControls();

    try {
      await syncAll();
      await startOfficialListeners();
    } catch (error) {
      console.error(
        "C01 Firebase Sync gagal dimulakan:",
        error
      );
    }
  }

  function stop() {
    for (
      const unsubscribe
      of unsubscribeMap.values()
    ) {
      try {
        unsubscribe();
      } catch (error) {
        console.warn(error);
      }
    }

    unsubscribeMap.clear();

    if (originalSetItem) {
      localStorage.setItem =
        originalSetItem;

      originalSetItem = null;
    }

    started = false;
  }

  return {
    start,
    stop,
    syncAll,
    syncProfile,
    syncMission,
    scheduleSync,
    startOfficialListeners
  };
})();

document.addEventListener(
  "DOMContentLoaded",
  () => {
    C01FirebaseSync.start();
  }
);

export {
  C01FirebaseSync
};
