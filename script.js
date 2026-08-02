const KP13_STATE = {
  matching: false,
  sequence: false,
  scenarios: false,
  simulation: false,
  diagnostic: false
};

const storageNotes = {
  permanent: {
    title: "Penyimpanan Kekal",
    text: "HDD, SSD dan media optik menyimpan data walaupun komputer dimatikan. Juruteknik perlu memastikan data dapat dibaca, ditulis dan dilindungi."
  },
  boot: {
    title: "Pemacu Sistem",
    text: "Pemacu sistem mengandungi boot loader, sistem pengoperasian, aplikasi dan fail konfigurasi. Kegagalan pemacu sistem boleh menyebabkan komputer gagal boot."
  },
  backup: {
    title: "Sandaran Data",
    text: "Backup ialah salinan data pada lokasi lain. Gunakan prinsip 3-2-1: tiga salinan, dua jenis media dan satu salinan di lokasi berbeza."
  },
  sharing: {
    title: "Perkongsian Data",
    text: "Pemacu boleh dikongsi melalui rangkaian. Kebenaran akses, kuota dan keselamatan pengguna perlu dikonfigurasi dengan betul."
  }
};

const connectorNotes = {
  "sata-data": "Kabel SATA data mempunyai penyambung berbentuk L. Sambungkan satu hujung ke pemacu dan satu lagi ke port SATA motherboard.",
  "sata-power": "Kabel SATA power biasanya mempunyai 15 pin dan datang daripada PSU. Jangan paksa penyambung jika orientasi tidak betul.",
  "m2": "Slot M.2 mungkin menyokong SATA, NVMe atau kedua-duanya. Semak manual motherboard, panjang modul dan key type.",
  "usb": "Pemacu USB sesuai untuk pemindahan data dan backup. Gunakan eject sebelum mencabut untuk mengurangkan risiko kerosakan sistem fail."
};

const fsNotes = {
  ntfs: "NTFS sesuai untuk Windows, menyokong fail besar, permission, compression, quota dan encryption.",
  fat32: "FAT32 sangat serasi tetapi saiz satu fail terhad kepada 4 GB. Sesuai untuk media boot atau peranti lama.",
  exfat: "exFAT sesuai untuk pemacu mudah alih berkapasiti besar dan fail besar, dengan keserasian antara Windows dan macOS."
};

const raidNotes = {
  0: "RAID 0 membahagi data merentasi beberapa pemacu untuk prestasi. Jika satu pemacu gagal, keseluruhan data boleh hilang.",
  1: "RAID 1 menyalin data yang sama ke dua pemacu. Sesuai untuk ketersediaan data tetapi kapasiti efektif hanya separuh.",
  5: "RAID 5 menggunakan striping dan parity. Minimum tiga pemacu dan boleh menahan kegagalan satu pemacu.",
  10: "RAID 10 menggabungkan mirroring dan striping. Prestasi serta ketahanan baik tetapi memerlukan minimum empat pemacu."
};

const matchingPairs = [
  { id: "cpu", left: "M.2 NVMe SSD", right: "Pemacu berkelajuan tinggi menggunakan PCIe" },
  { id: "sata", left: "SATA Power", right: "Membekalkan kuasa dari PSU" },
  { id: "ntfs", left: "NTFS", right: "Sistem fail Windows dengan permission" },
  { id: "raid1", left: "RAID 1", right: "Salinan sama pada dua pemacu" }
];

const sequenceSteps = [
  { id: 1, text: "Periksa keserasian pemacu, slot dan kabel" },
  { id: 2, text: "Pasang pemacu dengan prosedur ESD" },
  { id: 3, text: "Sambungkan kabel data dan kuasa" },
  { id: 4, text: "Semak pengesanan dalam BIOS/UEFI" },
  { id: 5, text: "Initialize dan cipta partisi" },
  { id: 6, text: "Format dengan sistem fail sesuai" },
  { id: 7, text: "Uji SMART, prestasi dan dokumentasi" }
];

const scenarios = [
  {
    id: "windows",
    title: "Pemacu dalaman Windows",
    description: "Digunakan untuk aplikasi, fail besar dan kawalan permission.",
    answer: "ntfs"
  },
  {
    id: "legacy",
    title: "Media boot untuk peranti lama",
    description: "Perlu keserasian tinggi tetapi fail tidak melebihi 4 GB.",
    answer: "fat32"
  },
  {
    id: "portable",
    title: "Pemacu mudah alih 1 TB",
    description: "Perlu membawa fail video besar antara Windows dan macOS.",
    answer: "exfat"
  }
];

const simulationSteps = [
  "Pilih SSD SATA",
  "Pasang SSD pada bay 2.5 inci",
  "Sambung kabel SATA data",
  "Sambung kabel SATA power",
  "Initialize pemacu",
  "Cipta partisi",
  "Format NTFS",
  "Uji pemacu"
];

let matchingAssignments = {};
let selectedMatchItem = null;
let currentSequence = [];
let simulationIndex = 0;

document.addEventListener("DOMContentLoaded", () => {
  initialiseTabs();
  initialiseInfoCards();
  resetMatchingActivity();
  shuffleSequenceActivity();
  renderScenarioActivity();
  resetStorageSimulation();
  renderDiagnosticChoices();
  updateProgress();
});

function shuffleArray(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

function initialiseTabs() {
  document.querySelectorAll(".mode-button").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".mode-button").forEach(item => item.classList.remove("active"));
      document.querySelectorAll(".mode-section").forEach(section => section.classList.remove("active"));

      button.classList.add("active");
      document.getElementById(`${button.dataset.mode}Mode`).classList.add("active");
    });
  });
}

function initialiseInfoCards() {
  document.querySelectorAll("[data-note]").forEach(button => {
    button.addEventListener("click", () => {
      const item = storageNotes[button.dataset.note];
      noteInfo.innerHTML = `<h3>${item.title}</h3><p>${item.text}</p>`;
    });
  });

  document.querySelectorAll("[data-connector]").forEach(button => {
    button.addEventListener("click", () => {
      connectorInfo.innerHTML = `<strong>${button.querySelector("strong").textContent}</strong><p>${connectorNotes[button.dataset.connector]}</p>`;
    });
  });

  document.querySelectorAll("[data-fs]").forEach(button => {
    button.addEventListener("click", () => {
      fileSystemInfo.innerHTML = `<strong>${button.textContent}</strong><p>${fsNotes[button.dataset.fs]}</p>`;
    });
  });

  document.querySelectorAll("[data-raid]").forEach(button => {
    button.addEventListener("click", () => {
      raidInfo.innerHTML = `<strong>RAID ${button.dataset.raid}</strong><p>${raidNotes[button.dataset.raid]}</p>`;
    });
  });
}

function toggleProjectorMode() {
  document.body.classList.toggle("projector-mode");
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

function speakByteMessage() {
  if (!("speechSynthesis" in window)) {
    alert("Audio tidak disokong oleh pelayar ini.");
    return;
  }

  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(byteMessage.textContent);
  utterance.lang = "ms-MY";
  utterance.rate = 0.9;

  speechSynthesis.speak(utterance);
}

function playDataFlowAnimation() {
  const nodes = [flowApp, flowRam, flowController, flowDrive];

  nodes.forEach(node => node.classList.remove("active"));
  dataPacket.classList.remove("playing");
  void dataPacket.offsetWidth;
  dataPacket.classList.add("playing");

  const explanations = [
    "Aplikasi menghasilkan atau mengubah data.",
    "Data sementara berada dalam RAM.",
    "Pengawal storan mengurus arahan baca dan tulis.",
    "Data disimpan secara kekal pada SSD atau HDD."
  ];

  nodes.forEach((node, index) => {
    setTimeout(() => {
      nodes.forEach(item => item.classList.remove("active"));
      node.classList.add("active");
      dataFlowExplanation.textContent = explanations[index];
    }, index * 1000);
  });

  setTimeout(() => {
    nodes.forEach(item => item.classList.remove("active"));
    dataFlowExplanation.textContent = "Data selesai ditulis ke pemacu storan.";
  }, 4300);
}

function playDriveComparison() {
  hddRunner.classList.remove("run");
  ssdRunner.classList.remove("run");

  void hddRunner.offsetWidth;

  hddRunner.classList.add("run");
  ssdRunner.classList.add("run");

  driveComparisonResult.innerHTML = `
    <strong>SSD lebih pantas kerana tiada bahagian mekanikal.</strong>
    <p>HDD masih berguna untuk kapasiti besar dan kos lebih rendah.</p>
  `;
}

function resetMatchingActivity() {
  matchingAssignments = {};
  selectedMatchItem = null;

  const leftItems = shuffleArray(matchingPairs);
  const rightItems = shuffleArray(matchingPairs);

  matchingActivity.innerHTML = `
    <div class="match-column" id="matchLeftColumn">
      ${leftItems.map(item => `
        <button class="match-item" data-id="${item.id}">
          ${item.left}
        </button>
      `).join("")}
    </div>

    <div class="match-column" id="matchRightColumn">
      ${rightItems.map(item => `
        <button class="match-target" data-id="${item.id}">
          ${item.right}
        </button>
      `).join("")}
    </div>
  `;

  document.querySelectorAll(".match-item").forEach(item => {
    item.addEventListener("click", () => {
      document.querySelectorAll(".match-item").forEach(button => button.classList.remove("selected"));
      selectedMatchItem = item.dataset.id;
      item.classList.add("selected");
    });
  });

  document.querySelectorAll(".match-target").forEach(target => {
    target.addEventListener("click", () => {
      if (!selectedMatchItem) {
        matchingResult.textContent = "Pilih satu item di sebelah kiri dahulu.";
        return;
      }

      Object.keys(matchingAssignments).forEach(key => {
        if (matchingAssignments[key] === target.dataset.id) {
          delete matchingAssignments[key];
        }
      });

      matchingAssignments[selectedMatchItem] = target.dataset.id;

      target.classList.add("filled");
      target.innerHTML = `${target.textContent}<br><small>Dipadankan</small>`;

      document.querySelectorAll(".match-item").forEach(button => button.classList.remove("selected"));
      selectedMatchItem = null;
    });
  });

  matchingResult.textContent = "Susunan item telah diacak.";
}

function checkMatchingActivity() {
  const correct = matchingPairs.every(item => matchingAssignments[item.id] === item.id);

  KP13_STATE.matching = correct;

  matchingResult.innerHTML = correct
    ? "<strong>✅ Semua padanan betul.</strong><p>Anda memahami fungsi asas storan.</p>"
    : "<strong>❌ Masih ada padanan yang salah.</strong><p>Semak semula jenis peranti dan fungsinya.</p>";

  updateProgress();
}

function shuffleSequenceActivity() {
  currentSequence = shuffleArray(sequenceSteps);

  if (currentSequence.every((item, index) => item.id === index + 1)) {
    currentSequence = shuffleArray(sequenceSteps);
  }

  renderSequenceActivity();
  sequenceResult.textContent = "Langkah telah diacak. Susun semula mengikut prosedur sebenar.";
}

function renderSequenceActivity() {
  sequenceList.innerHTML = currentSequence.map((item, index) => `
    <div class="sequence-item" draggable="true" data-index="${index}">
      <span>${item.text}</span>

      <div class="sequence-controls">
        <button onclick="moveSequenceItem(${index}, -1)">▲</button>
        <button onclick="moveSequenceItem(${index}, 1)">▼</button>
      </div>
    </div>
  `).join("");

  let draggedIndex = null;

  document.querySelectorAll(".sequence-item").forEach(item => {
    item.addEventListener("dragstart", () => {
      draggedIndex = Number(item.dataset.index);
    });

    item.addEventListener("dragover", event => {
      event.preventDefault();
    });

    item.addEventListener("drop", event => {
      event.preventDefault();

      const targetIndex = Number(item.dataset.index);
      const [draggedItem] = currentSequence.splice(draggedIndex, 1);
      currentSequence.splice(targetIndex, 0, draggedItem);

      renderSequenceActivity();
    });
  });
}

function moveSequenceItem(index, direction) {
  const newIndex = index + direction;

  if (newIndex < 0 || newIndex >= currentSequence.length) {
    return;
  }

  [currentSequence[index], currentSequence[newIndex]] =
    [currentSequence[newIndex], currentSequence[index]];

  renderSequenceActivity();
}

function checkSequenceActivity() {
  const correct = currentSequence.every((item, index) => item.id === index + 1);

  KP13_STATE.sequence = correct;

  sequenceResult.innerHTML = correct
    ? "<strong>✅ Urutan betul.</strong><p>Anda mengikuti prosedur pemasangan dan konfigurasi yang sistematik.</p>"
    : "<strong>❌ Urutan belum tepat.</strong><p>Mulakan dengan semakan keserasian sebelum pemasangan.</p>";

  updateProgress();
}

function renderScenarioActivity() {
  const shuffledScenarios = shuffleArray(scenarios);

  scenarioActivity.innerHTML = shuffledScenarios.map(scenario => {
    const options = shuffleArray([
      { value: "ntfs", label: "NTFS" },
      { value: "fat32", label: "FAT32" },
      { value: "exfat", label: "exFAT" }
    ]);

    return `
      <article class="scenario-card" data-id="${scenario.id}" data-answer="${scenario.answer}">
        <h3>${scenario.title}</h3>
        <p>${scenario.description}</p>

        <select>
          <option value="">Pilih sistem fail</option>
          ${options.map(option => `<option value="${option.value}">${option.label}</option>`).join("")}
        </select>
      </article>
    `;
  }).join("");
}

function checkScenarioActivity() {
  const cards = [...document.querySelectorAll(".scenario-card")];

  const complete = cards.every(card => card.querySelector("select").value);
  const correct = complete && cards.every(card => card.querySelector("select").value === card.dataset.answer);

  KP13_STATE.scenarios = correct;

  scenarioResult.innerHTML = !complete
    ? "<strong>⚠️ Lengkapkan semua pilihan.</strong>"
    : correct
      ? "<strong>✅ Semua pilihan tepat.</strong><p>Anda memilih sistem fail berdasarkan keperluan sebenar.</p>"
      : "<strong>❌ Ada pilihan yang kurang sesuai.</strong><p>Semak saiz fail, keserasian dan ciri keselamatan.</p>";

  updateProgress();
}

function resetStorageSimulation() {
  simulationIndex = 0;
  KP13_STATE.simulation = false;

  const components = shuffleArray([
    { id: "ssd", label: "💾 SSD SATA 2.5 inci" },
    { id: "data", label: "🔌 Kabel SATA Data" },
    { id: "power", label: "⚡ Kabel SATA Power" },
    { id: "hdd", label: "💽 HDD 3.5 inci" }
  ]);

  componentTray.innerHTML = components.map(item => `
    <button class="sim-component" data-id="${item.id}">
      ${item.label}
    </button>
  `).join("");

  componentTray.querySelectorAll(".sim-component").forEach(button => {
    button.addEventListener("click", () => handleSimulationSelection(button));
  });

  renderSimulationChecklist();
  simulationFeedback.textContent = "Mulakan dengan mengenal pasti SSD SATA 2.5 inci.";
}

function renderSimulationChecklist() {
  simulationChecklist.innerHTML = simulationSteps.map((step, index) => `
    <div class="check-item ${index < simulationIndex ? "done" : ""}">
      ${index < simulationIndex ? "✅" : "⬜"} ${step}
    </div>
  `).join("");
}

function handleSimulationSelection(button) {
  const expected = ["ssd", "ssd", "data", "power"][simulationIndex];

  if (simulationIndex < 4) {
    if (button.dataset.id !== expected) {
      simulationFeedback.innerHTML = "<strong>❌ Komponen belum tepat.</strong><p>Semak semula arahan dan jenis komponen.</p>";
      return;
    }

    simulationIndex += 1;
    renderSimulationChecklist();

    const messages = [
      "SSD dikenal pasti. Klik SSD sekali lagi untuk memasangnya pada bay.",
      "SSD dipasang pada bay 2.5 inci. Pilih kabel SATA data.",
      "Kabel data disambungkan ke motherboard. Pilih kabel SATA power.",
      "Kabel kuasa disambungkan. Teruskan konfigurasi perisian."
    ];

    simulationFeedback.textContent = messages[simulationIndex - 1];

    if (simulationIndex === 4) {
      renderSoftwareSimulationControls();
    }

    return;
  }
}

function renderSoftwareSimulationControls() {
  componentTray.innerHTML = shuffleArray([
    { id: 4, label: "Initialize GPT" },
    { id: 5, label: "Cipta Simple Volume" },
    { id: 6, label: "Format NTFS" },
    { id: 7, label: "Semak SMART & prestasi" }
  ]).map(item => `
    <button class="sim-component" data-step="${item.id}">
      ${item.label}
    </button>
  `).join("");

  componentTray.querySelectorAll(".sim-component").forEach(button => {
    button.addEventListener("click", () => {
      const expectedStep = simulationIndex;

      if (Number(button.dataset.step) !== expectedStep) {
        simulationFeedback.innerHTML = "<strong>❌ Tindakan belum mengikut urutan.</strong><p>Initialize dahulu sebelum mencipta volume.</p>";
        return;
      }

      simulationIndex += 1;
      button.disabled = true;
      button.classList.add("active");
      renderSimulationChecklist();

      if (simulationIndex === simulationSteps.length) {
        KP13_STATE.simulation = true;
        simulationFeedback.innerHTML = "<strong>✅ Simulasi lengkap.</strong><p>SSD dipasang, dikonfigurasi dan diuji dengan betul.</p>";
        updateProgress();
      }
    });
  });
}

function renderDiagnosticChoices() {
  const choices = shuffleArray([
    {
      id: "cable",
      label: "Periksa kabel SATA data dan kuasa",
      correct: true,
      feedback: "Langkah pertama yang sesuai untuk pemacu SATA yang tidak dikesan."
    },
    {
      id: "bios",
      label: "Semak pengesanan dalam BIOS/UEFI",
      correct: true,
      feedback: "Jika kabel betul, semak sama ada firmware mengesan pemacu."
    },
    {
      id: "printer",
      label: "Pasang semula driver printer",
      correct: false,
      feedback: "Printer tidak berkaitan dengan pengesanan pemacu storan."
    },
    {
      id: "speaker",
      label: "Tukar speaker komputer",
      correct: false,
      feedback: "Speaker tidak menyebabkan pemacu gagal dikesan."
    }
  ]);

  diagnosticChoices.innerHTML = choices.map(choice => `
    <button
      class="diagnostic-card"
      data-correct="${choice.correct}"
      data-feedback="${choice.feedback}"
    >
      ${choice.label}
    </button>
  `).join("");

  diagnosticChoices.querySelectorAll(".diagnostic-card").forEach(button => {
    button.addEventListener("click", () => {
      if (button.dataset.correct === "true") {
        KP13_STATE.diagnostic = true;
        diagnosticResult.innerHTML = `<strong>✅ Pilihan tepat.</strong><p>${button.dataset.feedback}</p>`;
      } else {
        diagnosticResult.innerHTML = `<strong>❌ Pilihan tidak berkaitan.</strong><p>${button.dataset.feedback}</p>`;
      }

      updateProgress();
    });
  });
}

function updateProgress() {
  const completed = Object.values(KP13_STATE).filter(Boolean).length;
  const percentage = Math.round((completed / 5) * 100);

  completionText.textContent = `${completed} daripada 5 aktiviti selesai.`;
  progressBar.style.width = `${percentage}%`;

  const profile = C01Storage.requireProfile();
  profile.kpProgress = profile.kpProgress || {};
  profile.kpProgress[13] = percentage;
  C01Storage.saveProfile(profile);
}

function completeKP13() {
  const completed = Object.values(KP13_STATE).every(Boolean);

  if (!completed) {
    alert("Lengkapkan semua aktiviti, simulasi dan diagnosis KP13 dahulu.");
    return;
  }

  const profile = C01Storage.requireProfile();

  profile.kpProgress = profile.kpProgress || {};
  profile.kpProgress[13] = 100;

  profile.badges = profile.badges || [];

  if (!profile.badges.includes("storage-technician")) {
    profile.badges.push("storage-technician");
    profile.xp = Number(profile.xp || 0) + 50;
    profile.coins = Number(profile.coins || 0) + 10;
  }

  C01Storage.saveProfile(profile);
  location.href = "../../kt/kt13/index.html";
}
