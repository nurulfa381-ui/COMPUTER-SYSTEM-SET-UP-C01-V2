function rankFromXp(xp) {
  if (xp >= 5000) {
    return "Computer System Specialist";
  }

  if (xp >= 3500) {
    return "Senior System Engineer";
  }

  if (xp >= 2500) {
    return "System Engineer";
  }

  if (xp >= 1600) {
    return "Senior Technician";
  }

  if (xp >= 900) {
    return "Computer Technician";
  }

  if (xp >= 400) {
    return "Junior Technician";
  }

  return "Trainee Technician";
}

function safeSetText(id, value) {
  const element =
    document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

function safeSetWidth(id, value) {
  const element =
    document.getElementById(id);

  if (element) {
    element.style.width = value;
  }
}

function renderDashboard() {
  const profile =
    C01Storage.requireProfile();

  /*
    Pastikan profil lama boleh
    terus membuka Mission 13.
  */
  if (
    Number(profile.unlocked || 1) <
    13
  ) {
    profile.unlocked = 13;

    C01Storage.saveProfile(
      profile
    );
  }

  safeSetText(
    "profileAvatar",
    profile.avatar || "🧑‍💻"
  );

  safeSetText(
    "profileName",
    profile.name || "Pelatih"
  );

  safeSetText(
    "profileId",
    profile.id || "-"
  );

  safeSetText(
    "studentGreeting",
    currentLanguage() === "en"
      ? `Welcome, ${profile.name}`
      : `Selamat datang, ${profile.name}`
  );

  safeSetText(
    "profileRank",
    rankFromXp(
      Number(profile.xp || 0)
    )
  );

  const xp =
    Number(profile.xp || 0);

  const level =
    1 + Math.floor(xp / 500);

  const levelProgress =
    xp % 500;

  safeSetText(
    "levelStat",
    level
  );

  safeSetText(
    "coinStat",
    Number(profile.coins || 0)
  );

  safeSetText(
    "proStat",
    `${Number(
      profile.professionalScore || 0
    )}%`
  );

  safeSetText(
    "badgeStat",
    Array.isArray(profile.badges)
      ? profile.badges.length
      : 0
  );

  safeSetText(
    "xpText",
    `${levelProgress} / 500`
  );

  safeSetWidth(
    "xpBar",
    `${(levelProgress / 500) * 100}%`
  );

  const completed =
    Array.isArray(profile.completed)
      ? profile.completed
      : [];

  /*
    Repository ini hanya memaparkan
    Mission 13.
  */
  const mission13Completed =
    completed.includes(13);

  const progress =
    mission13Completed
      ? 100
      : 0;

  safeSetText(
    "overallProgress",
    `${progress}%`
  );

  const list =
    document.getElementById(
      "missionList"
    );

  if (!list) {
    console.error(
      "Elemen missionList tidak dijumpai."
    );

    return;
  }

  /*
    Ambil Mission 13 sahaja daripada
    missions.js.
  */
  const mission13List =
    C01_MISSIONS.filter(
      mission =>
        Number(mission.id) === 13
    );

  if (
    mission13List.length === 0
  ) {
    list.innerHTML = `
      <article class="mission-card open">
        <div class="mission-body">
          <h3>Mission 13 tidak dijumpai</h3>
          <p>
            Semak laluan Mission 13
            dalam missions.js.
          </p>
        </div>
      </article>
    `;

    return;
  }

  list.innerHTML =
    mission13List
      .map(mission => {
        const isDone =
          completed.includes(
            mission.id
          );

        /*
          Mission 13 sentiasa dibuka
          untuk repository ini.
        */
        const isOpen = true;

        const score =
          profile.scores?.[
            mission.id
          ];

        const officialMark =
          profile.officialMarks?.[
            mission.id
          ];

        let scoreText =
          "Sedia untuk dimulakan";

        if (
          officialMark?.score !==
          undefined
        ) {
          scoreText =
            `Markah Rasmi KT: ${officialMark.score}%`;
        } else if (
          score !== undefined
        ) {
          scoreText =
            `Markah KT: ${score}%`;
        }

        return `
          <article
            class="mission-card ${
              isDone
                ? "done"
                : isOpen
                  ? "open"
                  : "locked"
            }"
          >

            <div class="mission-number">
              ${String(
                mission.id
              ).padStart(2, "0")}
            </div>

            <div class="mission-body">

              <small>
                MISSION
                ${String(
                  mission.id
                ).padStart(2, "0")}
              </small>

              <h3>
                ${mission.title}
              </h3>

              <p>
                ${scoreText}
              </p>

            </div>

            <div class="mission-action">

              <button
                class="btn ${
                  isDone
                    ? "btn-secondary"
                    : "btn-primary"
                }"
                type="button"
                onclick="openMission13('${mission.kp}')"
              >
                ${
                  isDone
                    ? "Ulang Kaji"
                    : "Mula"
                }
              </button>

            </div>

          </article>
        `;
      })
      .join("");

  updateByteMessage(profile);
}

function openMission13(path) {
  if (!path) {
    alert(
      "Laluan KP13 tidak dijumpai."
    );

    return;
  }

  window.location.href = path;
}

function updateByteMessage(profile) {
  const byteMessage =
    document.getElementById(
      "byteMessage"
    );

  if (!byteMessage) {
    return;
  }

  if (
    currentLanguage() === "en"
  ) {
    byteMessage.textContent =
      `Welcome ${profile.name}. Press Mission 13 to begin.`;
  } else {
    byteMessage.textContent =
      `Selamat datang ${profile.name}. Tekan Mission 13 untuk bermula.`;
  }
}

function speakByte() {
  const messageElement =
    document.getElementById(
      "byteMessage"
    );

  if (!messageElement) {
    return;
  }

  const text =
    messageElement.textContent;

  if (
    "speechSynthesis" in window
  ) {
    speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(
        text
      );

    utterance.lang =
      currentLanguage() === "en"
        ? "en-US"
        : "ms-MY";

    utterance.rate = 0.9;

    speechSynthesis.speak(
      utterance
    );
  }
}

function logout() {
  C01Storage.clearSession();

  window.location.href =
    "index.html";
}

document.addEventListener(
  "DOMContentLoaded",
  function () {
    renderDashboard();
  }
);
