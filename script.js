const startButton = document.getElementById("startButton");
const thresholdSlider = document.getElementById("threshold");
const thresholdValue = document.getElementById("thresholdValue");
const alertBox = document.getElementById("alertBox");
const alarmSound = document.getElementById("alarmSound");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

const modal = document.getElementById("modal");
const studentInput = document.getElementById("studentName");
const saveStudentBtn = document.getElementById("saveStudent");
const studentList = document.getElementById("studentList");
const clearBoardBtn = document.getElementById("clearBoard");

let audioContext;
let analyser;
let dataArray;
let running = false;
let modalOpen = false;

let cooldownMs = 2500;        // evita spam de modais se o som ficar alto direto
let lastTrigger = 0;

function getStore(){
  return JSON.parse(localStorage.getItem("students") || "{}");
}
function setStore(obj){
  localStorage.setItem("students", JSON.stringify(obj));
}

function renderBoard(){
  const saved = getStore();
  // Ordena por contagem desc; depois por nome
  const entries = Object.entries(saved).sort((a,b)=> b[1]-a[1] || a[0].localeCompare(b[0]));
  studentList.innerHTML = "";
  for(const [name, count] of entries){
    const li = document.createElement("li");
    const left = document.createElement("span"); left.textContent = name;
    const right = document.createElement("span"); right.className = "count"; right.textContent = `(${count})`;
    li.append(left, right);
    li.dataset.name = name;
    studentList.appendChild(li);
  }
}

thresholdSlider?.addEventListener("input", () => {
  thresholdValue.textContent = thresholdSlider.value;
});

startButton?.addEventListener("click", async () => {
  if (running) return;
  running = true;
  startButton.disabled = true;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    source.connect(analyser);

    drawVisualizer();
  } catch (err) {
    alert("Erro ao acessar microfone: " + err.message);
    startButton.disabled = false;
    running = false;
  }
});

function drawVisualizer() {
  requestAnimationFrame(drawVisualizer);

  analyser.getByteFrequencyData(dataArray);

  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  const barWidth = (width / dataArray.length) * 2.5;
  let x = 0;
  let sum = 0;

  for (let i = 0; i < dataArray.length; i++) {
    const barHeight = dataArray[i];
    sum += barHeight;

    // cor gradiente simples
    const r = barHeight + 25;
    const g = 250 - barHeight;
    ctx.fillStyle = `rgb(${r},${g},50)`;
    ctx.fillRect(x, height - barHeight, barWidth, barHeight);
    x += barWidth + 1;
  }

  const average = sum / dataArray.length;
  const threshold = parseInt(thresholdSlider.value, 10);

  if (average > threshold) {
    alertBox.style.display = "block";

    const now = performance.now();
    if (!modalOpen && alarmSound.paused && now - lastTrigger > cooldownMs) {
      lastTrigger = now;
      alarmSound.play().catch(()=>{}); // alguns mobile pedem interação prévia
      triggerStudentModal();
    }
  } else {
    alertBox.style.display = "none";
  }
}

// Modal do aluno
function triggerStudentModal() {
  modal.style.display = "flex";
  modal.setAttribute("aria-hidden", "false");
  modalOpen = true;
  studentInput.value = "";
  // dá um pequeno delay pra focar em mobile
  setTimeout(()=> studentInput.focus(), 50);
}

saveStudentBtn?.addEventListener("click", commitStudent);
studentInput?.addEventListener("keydown", (e)=>{
  if(e.key === "Enter") commitStudent();
});

function commitStudent(){
  const name = (studentInput.value || "").trim();
  if(!name) return;

  const saved = getStore();
  saved[name] = (saved[name] || 0) + 1;   // soma +1 no repetido
  setStore(saved);
  renderBoard();

  // fecha modal e reseta alarme
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
  modalOpen = false;
  alarmSound.pause();
  alarmSound.currentTime = 0;
}

// Limpar quadro
clearBoardBtn?.addEventListener("click", () => {
  if (confirm("Limpar todas as anotações do Quadro de Barulho?")) {
    localStorage.removeItem("students");
    renderBoard();
  }
});

// Inicialização da UI ao carregar
window.addEventListener("DOMContentLoaded", () => {
  renderBoard();
});
