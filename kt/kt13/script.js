const KT13_CONFIG = {
  missionId: 13,
  ktCode: "KT13",
  passMark: 60
};

const questionBank = [
  {
    id: "q1",
    text: "Apakah kelebihan utama SSD berbanding HDD?",
    correct: "Tiada bahagian bergerak dan akses data lebih pantas",
    options: [
      "Tiada bahagian bergerak dan akses data lebih pantas",
      "Memerlukan lebih banyak kuasa dan menghasilkan bunyi",
      "Hanya boleh digunakan untuk backup",
      "Tidak memerlukan sistem fail"
    ]
  },
  {
    id: "q2",
    text: "Apakah fungsi kabel SATA data?",
    correct: "Menghantar data antara pemacu dan motherboard",
    options: [
      "Membekalkan kuasa terus kepada CPU",
      "Menghantar data antara pemacu dan motherboard",
      "Mengawal kelajuan kipas casing",
      "Menghubungkan monitor ke GPU"
    ]
  },
  {
    id: "q3",
    text: "Bilakah GPT lebih sesuai digunakan?",
    correct: "Apabila menggunakan UEFI dan pemacu berkapasiti besar",
    options: [
      "Apabila menggunakan pemacu floppy",
      "Apabila hanya ada satu fail kecil",
      "Apabila menggunakan UEFI dan pemacu berkapasiti besar",
      "Apabila komputer tidak mempunyai sistem pengoperasian"
    ]
  },
  {
    id: "q4",
    text: "Sistem fail manakah paling sesuai untuk pemacu dalaman Windows?",
    correct: "NTFS",
    options: [
      "FAT12",
      "NTFS",
      "ISO 9660",
      "RAW"
    ]
  },
  {
    id: "q5",
    text: "Apakah ciri utama RAID 1?",
    correct: "Data yang sama disalin ke dua pemacu",
    options: [
      "Data yang sama disalin ke dua pemacu",
      "Semua pemacu digabung tanpa perlindungan",
      "Hanya satu pemacu digunakan",
      "Data dipadam secara automatik"
    ]
  },
  {
    id: "q6",
    text: "Apakah langkah pertama sebelum memasang pemacu baharu?",
    correct: "Semak keserasian pemacu, slot dan kabel",
    options: [
      "Format pemacu sebelum memasangnya",
      "Semak keserasian pemacu, slot dan kabel",
      "Padam semua partisi lama komputer",
      "Tukar kata laluan pengguna"
    ]
  },
  {
    id: "q7",
    text: "Apakah fungsi SMART?",
    correct: "Memantau kesihatan dan tanda awal kegagalan pemacu",
    options: [
      "Meningkatkan kapasiti fizikal pemacu",
      "Menukar SATA kepada USB",
      "Memantau kesihatan dan tanda awal kegagalan pemacu",
      "Mengawal resolusi monitor"
    ]
  },
  {
    id: "q8",
    text: "Pemacu 2 TB digunakan antara Windows dan macOS serta menyimpan video besar. Sistem fail yang sesuai ialah:",
    correct: "exFAT",
    options: [
      "FAT16",
      "exFAT",
      "RAW",
      "EXT2"
    ]
  },
  {
    id: "q9",
    text: "Apakah tindakan pertama jika SSD SATA tidak dikesan?",
    correct: "Semak kabel SATA data dan kuasa",
    options: [
      "Tukar keyboard",
      "Pasang semula driver printer",
      "Semak kabel SATA data dan kuasa",
      "Padam akaun pengguna"
    ]
  },
  {
    id: "q10",
    text: "Pernyataan manakah betul tentang RAID dan backup?",
    correct: "RAID meningkatkan ketersediaan tetapi backup masih diperlukan",
    options: [
      "RAID menghapuskan keperluan backup",
      "Backup hanya diperlukan untuk HDD",
      "RAID meningkatkan ketersediaan tetapi backup masih diperlukan",
      "RAID hanya digunakan pada pemacu USB"
    ]
  }
];

const matchingBank = [
  { id: "m1", term: "SATA Power", correct: "Bekalan kuasa daripada PSU" },
  { id: "m2", term: "M.2 NVMe", correct: "SSD menggunakan PCIe dan protokol NVMe" },
  { id: "m3", term: "FAT32", correct: "Keserasian tinggi tetapi fail maksimum 4 GB" },
  { id: "m4", term: "GPT", correct: "Gaya partisi moden untuk UEFI" },
  { id: "m5", term: "RAID 5", correct: "Striping dengan parity dan minimum tiga pemacu" }
];

const sequenceBank = [
  { id: 1, text: "Semak keserasian pemacu dan sambungan" },
  { id: 2, text: "Pasang pemacu menggunakan prosedur ESD" },
  { id: 3, text: "Sambungkan kabel data dan kuasa" },
  { id: 4, text: "Semak pemacu dalam BIOS/UEFI" },
  { id: 5, text: "Initialize, partition, format dan uji pemacu" }
];

let currentSequence = [];

document.addEventListener("DOMContentLoaded", initialiseKT13);

function shuffleArray(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

function ensureCollections(profile) {
  profile.scores = profile.scores || {};
  profile.attempts = profile.attempts || {};
  profile.ktDetails = profile.ktDetails || {};
  profile.pendingAssessments = profile.pendingAssessments || {};
  profile.officialMarks = profile.officialMarks || {};
  profile.completed = profile.completed || [];
  profile.badges = profile.badges || [];
  return profile;
}

function initialiseKT13() {
  const profile = ensureCollections(C01Storage.requireProfile());

  candidateName.textContent = profile.name || "-";
  candidateId.textContent = profile.id || "-";
  attemptNumber.textContent = (profile.attempts?.[13] || 0) + 1;

  renderMCQ();
  renderMatching();
  renderSequence();

  const official = profile.officialMarks?.[13];
  const pending = profile.pendingAssessments?.[13];

  if (official?.locked === true) {
    showOfficialResult(official);
  } else if (pending?.status === "MENUNGGU_PENGESAHAN") {
    showPendingResult(pending);
  }
}

function renderMCQ() {
  const shuffledQuestions = shuffleArray(questionBank);

  mcqContainer.innerHTML = shuffledQuestions.map((question, questionIndex) => {
    const shuffledOptions = shuffleArray(question.options);

    return `
      <article class="question-card" data-question-id="${question.id}">
        <p>${questionIndex + 1}. ${question.text}</p>

        ${shuffledOptions.map((option, optionIndex) => `
          <label class="answer-option">
            <input
              type="radio"
              name="${question.id}"
              value="${encodeURIComponent(option)}"
            >
            ${String.fromCharCode(65 + optionIndex)}. ${option}
          </label>
        `).join("")}
      </article>
    `;
  }).join("");
}

function renderMatching() {
  const shuffledTerms = shuffleArray(matchingBank);
  const allAnswers = shuffleArray(matchingBank.map(item => item.correct));

  matchingContainer.innerHTML = shuffledTerms.map((item, index) => {
    const options = shuffleArray(allAnswers);

    return `
      <div class="matching-card" data-id="${item.id}" data-answer="${encodeURIComponent(item.correct)}">
        <strong>${index + 1}. ${item.term}</strong>

        <select>
          <option value="">Pilih padanan</option>
          ${options.map(option => `
            <option value="${encodeURIComponent(option)}">${option}</option>
          `).join("")}
        </select>
      </div>
    `;
  }).join("");
}

function renderSequence() {
  currentSequence = shuffleArray(sequenceBank);

  if (currentSequence.every((item, index) => item.id === index + 1)) {
    currentSequence = shuffleArray(sequenceBank);
  }

  renderSequenceList();
}

function renderSequenceList() {
  sequenceContainer.innerHTML = currentSequence.map((item, index) => `
    <div class="sequence-item" draggable="true" data-index="${index}">
      <span>${item.text}</span>

      <div class="sequence-controls">
        <button type="button" onclick="moveSequence(${index}, -1)">▲</button>
        <button type="button" onclick="moveSequence(${index}, 1)">▼</button>
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

      renderSequenceList();
    });
  });
}

function moveSequence(index, direction) {
  const target = index + direction;

  if (target < 0 || target >= currentSequence.length) {
    return;
  }

  [currentSequence[index], currentSequence[target]] =
    [currentSequence[target], currentSequence[index]];

  renderSequenceList();
}

function allAnswered() {
  const mcqComplete = questionBank.every(question =>
    document.querySelector(`input[name="${question.id}"]:checked`)
  );

  const matchingComplete = [...document.querySelectorAll(".matching-card select")]
    .every(select => select.value);

  return mcqComplete && matchingComplete;
}

function calculateMCQMarks() {
  let correctCount = 0;

  questionBank.forEach(question => {
    const selected = document.querySelector(`input[name="${question.id}"]:checked`);

    if (selected && decodeURIComponent(selected.value) === question.correct) {
      correctCount += 1;
    }
  });

  return correctCount * 5;
}

function calculateMatchingMarks() {
  let correctCount = 0;

  document.querySelectorAll(".matching-card").forEach(card => {
    const selected = card.querySelector("select").value;
    const answer = card.dataset.answer;

    if (selected === answer) {
      correctCount += 1;
    }
  });

  return correctCount * 5;
}

function calculateSequenceMarks() {
  const correctPositions = currentSequence.filter((item, index) => item.id === index + 1).length;
  return correctPositions * 5;
}

function submitKT13() {
  const profile = ensureCollections(C01Storage.requireProfile());

  if (profile.officialMarks?.[13]?.locked === true) {
    alert("Markah rasmi KT13 telah dikunci.");
    return;
  }

  if (profile.pendingAssessments?.[13]?.status === "MENUNGGU_PENGESAHAN") {
    showPendingResult(profile.pendingAssessments[13]);
    return;
  }

  if (!allAnswered()) {
    alert("Sila jawab semua soalan dan lengkapkan semua padanan.");
    return;
  }

  const mcqMarks = calculateMCQMarks();
  const matchingMarks = calculateMatchingMarks();
  const sequenceMarks = calculateSequenceMarks();

  const totalMarks = mcqMarks + matchingMarks + sequenceMarks;
  const percentage = totalMarks;
  const passed = percentage >= KT13_CONFIG.passMark;
  const submittedAt = new Date().toISOString();

  profile.scores[13] = percentage;
  profile.attempts[13] = (profile.attempts[13] || 0) + 1;

  profile.ktDetails[13] = {
    mcqMarks,
    matchingMarks,
    sequenceMarks,
    totalMarks,
    percentage,
    passed,
    official: false,
    status: passed ? "MENUNGGU_PENGESAHAN" : "BELUM TERAMPIL",
    submittedAt
  };

  if (passed) {
    profile.pendingAssessments[13] = {
      missionId: 13,
      ktCode: "KT13",
      score: percentage,
      sectionA: mcqMarks,
      sectionB: matchingMarks,
      sectionC: sequenceMarks,
      totalMarks,
      passed: true,
      status: "MENUNGGU_PENGESAHAN",
      attempt: profile.attempts[13],
      submittedAt
    };
  }

  C01Storage.saveProfile(profile);

  attemptNumber.textContent = profile.attempts[13] + 1;

  if (passed) {
    showPendingResult(profile.pendingAssessments[13]);
  } else {
    showFailResult(profile.ktDetails[13]);
  }
}

function showPendingResult(pending) {
  assessmentStatus.textContent = `MENUNGGU PENGESAHAN • ${pending.score}%`;
  assessmentStatus.className = "pending";

  resultPanel.innerHTML = `
    <div class="result-card pass">
      <h2>Markah Sementara: ${pending.score}%</h2>
      <p>Bahagian A: ${pending.sectionA}/50</p>
      <p>Bahagian B: ${pending.sectionB}/25</p>
      <p>Bahagian C: ${pending.sectionC}/25</p>

      <h3 class="pending">⏳ MENUNGGU PENGESAHAN PEGAWAI PENILAI</h3>

      <p>
        Markah telah disimpan. KP14 hanya dibuka selepas
        markah rasmi disahkan melalui Mod Guru.
      </p>
    </div>
  `;

  resultPanel.scrollIntoView({ behavior: "smooth", block: "center" });
}

function showFailResult(detail) {
  assessmentStatus.textContent = `BELUM TERAMPIL • ${detail.percentage}%`;
  assessmentStatus.className = "failed";

  resultPanel.innerHTML = `
    <div class="result-card fail">
      <h2>Markah: ${detail.percentage}%</h2>
      <p>Bahagian A: ${detail.mcqMarks}/50</p>
      <p>Bahagian B: ${detail.matchingMarks}/25</p>
      <p>Bahagian C: ${detail.sequenceMarks}/25</p>

      <h3 class="failed">❌ BELUM TERAMPIL</h3>

      <p>
        Ulang kaji KP13 dan cuba semula.
      </p>
    </div>
  `;
}

function showOfficialResult(official) {
  assessmentStatus.textContent = `TERAMPIL • ${official.score}%`;
  assessmentStatus.className = "official";

  submitButton.disabled = true;
  submitButton.textContent = "MARKAH RASMI DIKUNCI";

  resultPanel.innerHTML = `
    <div class="result-card official">
      <h2>Markah Rasmi: ${official.score}%</h2>
      <h3 class="official">✅ TERAMPIL</h3>
      <p>Markah telah disahkan dan dikunci oleh Pegawai Penilai.</p>
    </div>
  `;
}
