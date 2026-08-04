import {
  C01FirebaseStorage
} from "../firebase-storage.js?v=20260804-1";

import {
  ensureFirebaseLogin
} from "../firebase-config.js?v=20260804-1";

const SESSION_KEY = "c01_teacher_session_v2";
const PIN_KEY = "c01_teacher_pin_v2";

let students = [];
let assessmentMap = new Map();
let studentUnsubscribers = new Map();
let unsubscribeStudents = null;

const teacherGreeting = document.getElementById("teacherGreeting");
const studentCount = document.getElementById("studentCount");
const pendingCount = document.getElementById("pendingCount");
const competentCount = document.getElementById("competentCount");
const failedCount = document.getElementById("failedCount");
const connectionStatus = document.getElementById("connectionStatus");
const studentCards = document.getElementById("studentCards");
const searchInput = document.getElementById("searchInput");
const moduleFilter = document.getElementById("moduleFilter");
const statusFilter = document.getElementById("statusFilter");

document.addEventListener("DOMContentLoaded", initialiseTeacherDashboard);

async function initialiseTeacherDashboard() {
  const session = requireTeacherSession();
  if (!session) return;

  teacherGreeting.textContent = `Selamat datang, ${session.name}`;

  bindActions();

  try {
    await ensureFirebaseLogin();
    startRealtimeStudents();
  } catch (error) {
    console.error(error);
    setConnection("RALAT FIREBASE", "error");
    showToast("Sambungan Firebase gagal.");
  }
}

function requireTeacherSession() {
  try {
    const session = JSON.parse(
      sessionStorage.getItem(SESSION_KEY) || "null"
    );

    if (!session?.name) {
      location.href = "login.html";
      return null;
    }

    return session;
  } catch (error) {
    location.href = "login.html";
    return null;
  }
}

function bindActions() {
  document.getElementById("refreshButton")
    .addEventListener("click", restartRealtime);

  document.getElementById("csvButton")
    .addEventListener("click", async () => {
      try {
        await C01FirebaseStorage.downloadCsvReport();
      } catch (error) {
        showToast("Export CSV gagal.");
      }
    });

  document.getElementById("backupButton")
    .addEventListener("click", async () => {
      try {
        await C01FirebaseStorage.downloadJsonBackup();
      } catch (error) {
        showToast("Backup JSON gagal.");
      }
    });

  document.getElementById("pinButton")
    .addEventListener("click", changePin);

  document.getElementById("logoutButton")
    .addEventListener("click", logoutTeacher);

  searchInput.addEventListener("input", renderDashboard);
  moduleFilter.addEventListener("change", renderDashboard);
  statusFilter.addEventListener("change", renderDashboard);
}

function startRealtimeStudents() {
  stopRealtime();
  setConnection("MENYAMBUNG...", "connecting");

  unsubscribeStudents =
    C01FirebaseStorage.listenToAllStudents(
      incomingStudents => {
        students = incomingStudents;

        const liveUids = new Set(
          incomingStudents.map(student => student.uid)
        );

        for (const [uid, unsubscribe] of studentUnsubscribers.entries()) {
          if (!liveUids.has(uid)) {
            unsubscribe();
            studentUnsubscribers.delete(uid);
            assessmentMap.delete(uid);
          }
        }

        incomingStudents.forEach(student => {
          if (studentUnsubscribers.has(student.uid)) return;

          const unsubscribe =
            C01FirebaseStorage.listenToStudentAssessments(
              student.uid,
              assessments => {
                assessmentMap.set(student.uid, assessments);
                renderDashboard();
              },
              error => {
                console.error(error);
                showToast(`Rekod ${student.name || "pelatih"} gagal dibaca.`);
              }
            );

          studentUnsubscribers.set(student.uid, unsubscribe);
        });

        setConnection("REALTIME AKTIF", "online");
        renderDashboard();
      },
      error => {
        console.error(error);
        setConnection("RALAT FIREBASE", "error");
        showToast("Data pelatih gagal dimuatkan.");
      }
    );
}

function restartRealtime() {
  startRealtimeStudents();
  showToast("Dashboard dimuat semula.");
}

function stopRealtime() {
  if (unsubscribeStudents) {
    unsubscribeStudents();
    unsubscribeStudents = null;
  }

  for (const unsubscribe of studentUnsubscribers.values()) {
    unsubscribe();
  }

  studentUnsubscribers.clear();
}

function flattenRecords() {
  const records = [];

  students.forEach(student => {
    const assessments = assessmentMap.get(student.uid) || [];

    if (!assessments.length) {
      records.push({
        student,
        assessment: null,
        module: "BELUM DINILAI",
        status: "BELUM_DINILAI"
      });
      return;
    }

    assessments.forEach(assessment => {
      records.push({
        student,
        assessment,
        module: assessment.ktCode || `KT${assessment.missionId}`,
        status: normalizeStatus(assessment)
      });
    });
  });

  return records;
}

function normalizeStatus(assessment) {
  if (!assessment) return "BELUM_DINILAI";

  if (assessment.official === true && assessment.locked === true) {
    return Number(assessment.score) >= 60
      ? "TERAMPIL"
      : "BELUM_TERAMPIL";
  }

  return assessment.status || (
    Number(assessment.score) >= 60
      ? "MENUNGGU_PENGESAHAN"
      : "BELUM_TERAMPIL"
  );
}

function getFilteredRecords() {
  const keyword = searchInput.value.trim().toLowerCase();
  const selectedModule = moduleFilter.value;
  const selectedStatus = statusFilter.value;

  return flattenRecords().filter(record => {
    const searchText = [
      record.student.name,
      record.student.studentId,
      record.module
    ].join(" ").toLowerCase();

    const matchesSearch =
      !keyword || searchText.includes(keyword);

    const matchesModule =
      selectedModule === "ALL" ||
      record.module === selectedModule;

    const matchesStatus =
      selectedStatus === "ALL" ||
      record.status === selectedStatus;

    return matchesSearch && matchesModule && matchesStatus;
  });
}

function renderDashboard() {
  const allRecords = flattenRecords();
  const filteredRecords = getFilteredRecords();

  studentCount.textContent = students.length;

  pendingCount.textContent =
    allRecords.filter(record =>
      record.status === "MENUNGGU_PENGESAHAN"
    ).length;

  competentCount.textContent =
    allRecords.filter(record =>
      record.status === "TERAMPIL"
    ).length;

  failedCount.textContent =
    allRecords.filter(record =>
      record.status === "BELUM_TERAMPIL"
    ).length;

  if (!filteredRecords.length) {
    studentCards.innerHTML = `
      <div class="empty-state">
        <h3>Tiada rekod ditemui</h3>
        <p>Rekod akan muncul apabila pelatih login atau menghantar KT.</p>
      </div>
    `;
    return;
  }

  studentCards.innerHTML =
    filteredRecords.map(renderRecordCard).join("");
}

function renderRecordCard(record) {
  const student = record.student;
  const assessment = record.assessment;
  const score = assessment?.score ?? "-";
  const attempt = assessment?.attempt ?? 0;
  const status = record.status;
  const missionId = Number(assessment?.missionId || 0);
  const locked = assessment?.locked === true;

  return `
    <article class="student-card">
      <div class="student-profile">
        <div class="student-avatar">${escapeHtml(student.avatar || "🧑‍💻")}</div>
        <div>
          <h3>${escapeHtml(student.name || "Pelatih")}</h3>
          <p>ID: ${escapeHtml(student.studentId || "-")}</p>
          <p>Peranti: ${escapeHtml(student.device || "-")}</p>
        </div>
      </div>

      <div class="assessment-info">
        <span class="module-badge">${escapeHtml(record.module)}</span>
        <strong class="score">${score === "-" ? "-" : `${score}%`}</strong>
        <span>Percubaan: ${attempt}</span>
        <span class="${statusClass(status)}">${statusLabel(status)}</span>
      </div>

      ${
        assessment
          ? `
            <div class="mark-editor">
              <label>
                Markah Rasmi
                <input
                  id="score_${student.uid}_${missionId}"
                  type="number"
                  min="0"
                  max="100"
                  value="${Number(score) || 0}"
                  ${locked ? "disabled" : ""}
                >
              </label>

              <button
                type="button"
                onclick="window.approveFirebaseMark('${student.uid}', ${missionId})"
                ${locked ? "disabled" : ""}
              >
                SAHKAN & KUNCI
              </button>

              <button
                type="button"
                class="warning"
                onclick="window.reopenFirebaseMark('${student.uid}', ${missionId})"
                ${locked ? "" : "disabled"}
              >
                BUKA SEMULA
              </button>
            </div>
          `
          : `
            <div class="no-assessment">
              Pelatih belum menghantar sebarang KT.
            </div>
          `
      }
    </article>
  `;
}

window.approveFirebaseMark = async function(studentUid, missionId) {
  const input = document.getElementById(`score_${studentUid}_${missionId}`);
  const score = Number(input.value);
  const session = requireTeacherSession();

  if (!Number.isFinite(score) || score < 0 || score > 100) {
    showToast("Markah mesti antara 0 hingga 100.");
    return;
  }

  if (!confirm(`Sahkan markah rasmi ${score}% dan kunci rekod ini?`)) {
    return;
  }

  try {
    await C01FirebaseStorage.approveAssessment({
      studentUid,
      missionId,
      score,
      assessor: session.name
    });

    showToast("Markah rasmi berjaya disahkan.");
  } catch (error) {
    console.error(error);
    showToast("Pengesahan markah gagal.");
  }
};

window.reopenFirebaseMark = async function(studentUid, missionId) {
  if (!confirm("Buka semula markah rasmi ini?")) return;

  try {
    await C01FirebaseStorage.reopenAssessment({
      studentUid,
      missionId
    });

    showToast("Markah dibuka semula.");
  } catch (error) {
    console.error(error);
    showToast("Markah gagal dibuka semula.");
  }
};

function changePin() {
  const oldPin = prompt("Masukkan PIN lama:");
  if (oldPin === null) return;

  const savedPin = localStorage.getItem(PIN_KEY) || "1515";

  if (oldPin !== savedPin) {
    showToast("PIN lama tidak tepat.");
    return;
  }

  const newPin = prompt("Masukkan PIN baharu (minimum 4 aksara):");
  if (newPin === null) return;

  if (newPin.trim().length < 4) {
    showToast("PIN baharu terlalu pendek.");
    return;
  }

  localStorage.setItem(PIN_KEY, newPin.trim());
  showToast("PIN guru berjaya ditukar.");
}

function logoutTeacher() {
  stopRealtime();
  sessionStorage.removeItem(SESSION_KEY);
  location.href = "login.html";
}

function setConnection(text, className) {
  connectionStatus.textContent = text;
  connectionStatus.className = `connection ${className}`;
}

function statusClass(status) {
  if (status === "TERAMPIL") return "status competent";
  if (status === "MENUNGGU_PENGESAHAN") return "status pending";
  if (status === "BELUM_TERAMPIL") return "status failed";
  return "status neutral";
}

function statusLabel(status) {
  return String(status).replaceAll("_", " ");
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");

  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.classList.add("hidden");
  }, 2600);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

window.addEventListener("beforeunload", stopRealtime);
