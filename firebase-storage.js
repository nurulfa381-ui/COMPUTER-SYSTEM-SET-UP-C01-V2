/*
  COMPUTER SYSTEM SET-UP C01
  Firebase Storage Engine
*/

import {
  db,
  auth,
  ensureFirebaseLogin,
  serverTimestamp
} from "./firebase-config.js";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  writeBatch,
  deleteField
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

const C01FirebaseStorage = (() => {
  const LOCAL_PROFILE_KEYS = [
    "c01_student_profile",
    "c01_kp14_profile_v1",
    "c01_kp15_profile_v1"
  ];

  const MODULE_MAP = {
    13: { code: "KT13", title: "Pengujian Sistem Komputer" },
    14: { code: "KT14", title: "Pengendalian Perkakasan Tambahan Komputer" },
    15: { code: "KT15", title: "Penyediaan Laporan Sistem Komputer" }
  };

  function cleanText(value) {
    return String(value ?? "").trim();
  }

  function normalizeStudentId(value) {
    return cleanText(value)
      .toUpperCase()
      .replace(/\s+/g, "-")
      .replace(/[^A-Z0-9_-]/g, "");
  }

  function safeNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function getDeviceType() {
    const agent = navigator.userAgent.toLowerCase();
    if (agent.includes("ipad")) return "iPad";
    if (agent.includes("iphone")) return "iPhone";
    if (agent.includes("android") && !agent.includes("mobile")) return "Tablet Android";
    if (agent.includes("android")) return "Telefon Android";
    if (agent.includes("macintosh")) return "Mac";
    if (agent.includes("windows")) return "Windows PC";
    return "Komputer";
  }

  function readLocalProfile() {
    for (const key of LOCAL_PROFILE_KEYS) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const profile = JSON.parse(raw);
        if (profile?.name && profile?.id) {
          return { ...profile, __localStorageKey: key };
        }
      } catch (error) {
        console.warn(`Profil tempatan tidak dapat dibaca daripada ${key}:`, error);
      }
    }
    return null;
  }

  function saveLocalProfile(profile, preferredKey = null) {
    const key = preferredKey || profile?.__localStorageKey || "c01_student_profile";
    const cleanProfile = { ...profile };
    delete cleanProfile.__localStorageKey;
    localStorage.setItem(key, JSON.stringify(cleanProfile));
    return cleanProfile;
  }

  async function getFirebaseUser() {
    if (auth.currentUser) return auth.currentUser;
    return ensureFirebaseLogin();
  }

  async function getStudentContext() {
    const user = await getFirebaseUser();
    const profile = readLocalProfile();
    if (!profile?.name || !profile?.id) {
      throw new Error("Profil pelatih tidak lengkap. Sila login semula.");
    }
    return { user, profile, studentDocId: user.uid };
  }

  function studentReference(uid) {
    return doc(db, "students", uid);
  }

  function assessmentReference(uid, missionId) {
    return doc(db, "students", uid, "assessments", `kt${missionId}`);
  }

  async function saveStudentProfile(profileData = {}) {
    const user = await getFirebaseUser();
    const localProfile = readLocalProfile() || {};
    const name = cleanText(profileData.name ?? localProfile.name);
    const studentId = cleanText(
      profileData.studentId ?? profileData.id ?? localProfile.studentId ?? localProfile.id
    );

    if (!name || !studentId) {
      throw new Error("Nama dan ID pelatih diperlukan.");
    }

    const profile = {
      uid: user.uid,
      name,
      studentId,
      normalizedStudentId: normalizeStudentId(studentId),
      avatar: profileData.avatar ?? localProfile.avatar ?? "🧑‍💻",
      language: profileData.language ?? localProfile.language ?? "ms",
      course: "IT-020-3:2013",
      competencyUnit: "C01 COMPUTER SYSTEM SET-UP",
      xp: safeNumber(profileData.xp ?? localProfile.xp, 50),
      coins: safeNumber(profileData.coins ?? localProfile.coins, 0),
      currentMission: safeNumber(profileData.currentMission ?? localProfile.unlocked, 13),
      repository: profileData.repository ?? "COMPUTER-SYSTEM-SET-UP-C01-V2",
      device: getDeviceType(),
      browser: navigator.userAgent,
      lastLogin: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(studentReference(user.uid), profile, { merge: true });

    const updatedLocalProfile = {
      ...localProfile,
      name,
      id: studentId,
      studentId,
      avatar: profile.avatar,
      language: profile.language,
      xp: profile.xp,
      coins: profile.coins,
      firebaseUid: user.uid,
      updatedAt: new Date().toISOString()
    };

    saveLocalProfile(updatedLocalProfile, localProfile.__localStorageKey);
    return { ...updatedLocalProfile, uid: user.uid };
  }

  async function getStudentProfile() {
    const { user } = await getStudentContext();
    const snapshot = await getDoc(studentReference(user.uid));
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
  }

  async function saveKTScore({
    missionId,
    score,
    sectionA = 0,
    sectionB = 0,
    sectionC = 0,
    sectionD = 0,
    attempt = 1,
    passed = null,
    status = null,
    details = {}
  }) {
    const mission = MODULE_MAP[missionId];
    if (!mission) throw new Error(`Mission ${missionId} tidak disokong.`);

    const { user, profile } = await getStudentContext();
    const numericScore = safeNumber(score, 0);
    const isPassed = passed === null ? numericScore >= 60 : Boolean(passed);
    const assessmentStatus = status || (isPassed ? "MENUNGGU_PENGESAHAN" : "BELUM_TERAMPIL");

    const assessmentData = {
      missionId,
      ktCode: mission.code,
      title: mission.title,
      studentUid: user.uid,
      studentId: profile.studentId || profile.id,
      studentName: profile.name,
      avatar: profile.avatar || "🧑‍💻",
      score: numericScore,
      sectionA: safeNumber(sectionA),
      sectionB: safeNumber(sectionB),
      sectionC: safeNumber(sectionC),
      sectionD: safeNumber(sectionD),
      attempt: Math.max(1, safeNumber(attempt, 1)),
      passed: isPassed,
      status: assessmentStatus,
      official: false,
      locked: false,
      assessor: null,
      verifiedAt: null,
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      details
    };

    await setDoc(assessmentReference(user.uid, missionId), assessmentData, { merge: true });

    await setDoc(studentReference(user.uid), {
      uid: user.uid,
      name: profile.name,
      studentId: profile.studentId || profile.id,
      normalizedStudentId: normalizeStudentId(profile.studentId || profile.id),
      avatar: profile.avatar || "🧑‍💻",
      currentMission: missionId,
      lastAssessment: mission.code,
      lastScore: numericScore,
      lastStatus: assessmentStatus,
      updatedAt: serverTimestamp()
    }, { merge: true });

    syncAssessmentToLocalProfile(missionId, assessmentData);
    return assessmentData;
  }

  function syncAssessmentToLocalProfile(missionId, assessment) {
    const localProfile = readLocalProfile();
    if (!localProfile) return;

    localProfile.scores = localProfile.scores || {};
    localProfile.attempts = localProfile.attempts || {};
    localProfile.ktDetails = localProfile.ktDetails || {};
    localProfile.pendingAssessments = localProfile.pendingAssessments || {};
    localProfile.officialMarks = localProfile.officialMarks || {};

    localProfile.scores[missionId] = assessment.score;
    localProfile.attempts[missionId] = assessment.attempt;
    localProfile.ktDetails[missionId] = {
      ...assessment,
      submittedAt: new Date().toISOString()
    };

    if (assessment.status === "MENUNGGU_PENGESAHAN") {
      localProfile.pendingAssessments[missionId] = {
        ...assessment,
        submittedAt: new Date().toISOString()
      };
    }

    saveLocalProfile(localProfile, localProfile.__localStorageKey);
  }

  async function getAssessment(missionId) {
    const { user } = await getStudentContext();
    const snapshot = await getDoc(assessmentReference(user.uid, missionId));
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
  }

  function listenToStudentAssessment(missionId, callback, errorCallback = console.error) {
    let unsubscribe = () => {};

    getStudentContext()
      .then(({ user }) => {
        unsubscribe = onSnapshot(
          assessmentReference(user.uid, missionId),
          snapshot => {
            const data = snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
            if (data) syncOfficialResultToLocal(missionId, data);
            callback(data);
          },
          errorCallback
        );
      })
      .catch(errorCallback);

    return () => unsubscribe();
  }

  function syncOfficialResultToLocal(missionId, assessment) {
    if (!assessment?.official && !assessment?.locked) return;

    const localProfile = readLocalProfile();
    if (!localProfile) return;

    localProfile.officialMarks = localProfile.officialMarks || {};
    localProfile.pendingAssessments = localProfile.pendingAssessments || {};
    localProfile.scores = localProfile.scores || {};

    localProfile.officialMarks[missionId] = {
      score: safeNumber(assessment.score),
      status: assessment.status,
      assessor: assessment.assessor || "Pegawai Penilai",
      verifiedAt: assessment.verifiedAt || new Date().toISOString(),
      locked: Boolean(assessment.locked)
    };

    localProfile.scores[missionId] = safeNumber(assessment.score);
    delete localProfile.pendingAssessments[missionId];
    saveLocalProfile(localProfile, localProfile.__localStorageKey);
  }

  function listenToAllStudents(callback, errorCallback = console.error) {
    const studentsQuery = query(collection(db, "students"), orderBy("name"));
    return onSnapshot(
      studentsQuery,
      snapshot => callback(snapshot.docs.map(item => ({ uid: item.id, ...item.data() }))),
      errorCallback
    );
  }

  function listenToStudentAssessments(studentUid, callback, errorCallback = console.error) {
    const assessmentsQuery = query(
      collection(db, "students", studentUid, "assessments"),
      orderBy("missionId")
    );

    return onSnapshot(
      assessmentsQuery,
      snapshot => callback(snapshot.docs.map(item => ({ id: item.id, ...item.data() }))),
      errorCallback
    );
  }

  async function getAllStudents() {
    const snapshot = await getDocs(query(collection(db, "students"), orderBy("name")));
    return snapshot.docs.map(item => ({ uid: item.id, ...item.data() }));
  }

  async function getAllStudentAssessments(studentUid) {
    const snapshot = await getDocs(query(
      collection(db, "students", studentUid, "assessments"),
      orderBy("missionId")
    ));
    return snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
  }

  async function approveAssessment({ studentUid, missionId, score, assessor }) {
    if (!studentUid) throw new Error("UID pelatih diperlukan.");
    if (!MODULE_MAP[missionId]) throw new Error("Mission tidak sah.");

    const numericScore = safeNumber(score, 0);
    if (numericScore < 0 || numericScore > 100) {
      throw new Error("Markah mesti antara 0 hingga 100.");
    }

    const status = numericScore >= 60 ? "TERAMPIL" : "BELUM_TERAMPIL";

    await setDoc(assessmentReference(studentUid, missionId), {
      score: numericScore,
      status,
      passed: numericScore >= 60,
      official: true,
      locked: true,
      assessor: cleanText(assessor) || "Pegawai Penilai",
      verifiedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    await setDoc(studentReference(studentUid), {
      lastOfficialMission: `KT${missionId}`,
      lastOfficialScore: numericScore,
      lastOfficialStatus: status,
      updatedAt: serverTimestamp()
    }, { merge: true });

    return { studentUid, missionId, score: numericScore, status, locked: true };
  }

  async function reopenAssessment({ studentUid, missionId }) {
    await updateDoc(assessmentReference(studentUid, missionId), {
      official: false,
      locked: false,
      assessor: deleteField(),
      verifiedAt: deleteField(),
      status: "MENUNGGU_PENGESAHAN",
      updatedAt: serverTimestamp()
    });
  }

  async function updateStudentProgress({ xp, coins, currentMission } = {}) {
    const { user, profile } = await getStudentContext();
    const updateData = { updatedAt: serverTimestamp() };

    if (xp !== undefined) updateData.xp = safeNumber(xp);
    if (coins !== undefined) updateData.coins = safeNumber(coins);
    if (currentMission !== undefined) updateData.currentMission = safeNumber(currentMission, 13);

    await setDoc(studentReference(user.uid), updateData, { merge: true });

    const localProfile = { ...profile };
    if (xp !== undefined) localProfile.xp = safeNumber(xp);
    if (coins !== undefined) localProfile.coins = safeNumber(coins);
    if (currentMission !== undefined) localProfile.unlocked = safeNumber(currentMission, 13);
    saveLocalProfile(localProfile, profile.__localStorageKey);
  }

  async function exportAllData() {
    const students = await getAllStudents();
    const result = [];

    for (const student of students) {
      const assessments = await getAllStudentAssessments(student.uid);
      result.push({ ...student, assessments });
    }

    return result;
  }

  async function downloadJsonBackup() {
    const data = await exportAllData();
    const blob = new Blob([
      JSON.stringify({
        project: "COMPUTER SYSTEM SET-UP C01",
        exportedAt: new Date().toISOString(),
        students: data
      }, null, 2)
    ], { type: "application/json;charset=utf-8" });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `C01-Firebase-Backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function downloadCsvReport() {
    const data = await exportAllData();
    const rows = [[
      "Nama", "ID Pelatih", "Avatar", "Modul", "Markah",
      "Percubaan", "Status", "Rasmi", "Dikunci", "Pegawai Penilai"
    ]];

    data.forEach(student => {
      if (!student.assessments.length) {
        rows.push([
          student.name || "", student.studentId || "", student.avatar || "",
          "", "", "", "BELUM DINILAI", "", "", ""
        ]);
        return;
      }

      student.assessments.forEach(assessment => {
        rows.push([
          student.name || "",
          student.studentId || "",
          student.avatar || "",
          assessment.ktCode || "",
          assessment.score ?? "",
          assessment.attempt ?? "",
          assessment.status || "",
          assessment.official ? "YA" : "TIDAK",
          assessment.locked ? "YA" : "TIDAK",
          assessment.assessor || ""
        ]);
      });
    });

    const csv = rows
      .map(row => row.map(value => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Laporan-C01-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function batchUpdateStudentProfiles(updates = []) {
    if (!Array.isArray(updates)) {
      throw new Error("Senarai kemas kini mesti dalam bentuk array.");
    }

    const batch = writeBatch(db);
    updates.forEach(item => {
      if (!item?.uid) return;
      batch.set(studentReference(item.uid), {
        ...item.data,
        updatedAt: serverTimestamp()
      }, { merge: true });
    });
    await batch.commit();
  }

  return {
    MODULE_MAP,
    readLocalProfile,
    saveLocalProfile,
    getFirebaseUser,
    getStudentContext,
    saveStudentProfile,
    getStudentProfile,
    saveKTScore,
    getAssessment,
    listenToStudentAssessment,
    listenToAllStudents,
    listenToStudentAssessments,
    getAllStudents,
    getAllStudentAssessments,
    approveAssessment,
    reopenAssessment,
    updateStudentProgress,
    exportAllData,
    downloadJsonBackup,
    downloadCsvReport,
    batchUpdateStudentProfiles
  };
})();

export { C01FirebaseStorage };
