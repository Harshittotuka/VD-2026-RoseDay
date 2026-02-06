const STATE = {
  LOADING: 'loading',
  T1150: 't1150',
  T1155: 't1155',
  PROPOSAL: 'proposal',
  COUNTDOWN: 'countdown',
  MIDNIGHT: 'midnight',
  STORY: 'story',
  MAP: 'map',
  CAMERA: 'camera',
  FINAL: 'final',
};

const UI = {
  screen: document.getElementById('screen'),
  title: document.getElementById('title'),
  subtitle: document.getElementById('subtitle'),
  actions: document.getElementById('actions'),
  hint: document.getElementById('hint'),
  countdown: document.getElementById('countdown'),
  countdownTime: document.getElementById('countdown-time'),
  storyTap: document.getElementById('story-tap'),
  map: document.getElementById('map'),
  mapArt: document.getElementById('map-art'),
  openCamera: document.getElementById('open-camera'),
  mapLightbox: document.getElementById('map-lightbox'),
  mapFull: document.getElementById('map-full'),
  camera: document.getElementById('camera'),
  cameraVideo: document.getElementById('camera-video'),
  cameraCanvas: document.getElementById('camera-canvas'),
  cameraPhoto: document.getElementById('camera-photo'),
  capturePhoto: document.getElementById('capture-photo'),
  complete: document.getElementById('complete'),
  skip: document.getElementById('skip'),
  cameraError: document.getElementById('camera-error'),
  password: document.getElementById('password'),
  flash: document.getElementById('flash'),
  clock: document.getElementById('clock'),
  popup: document.getElementById('popup'),
  midnightAudio: document.getElementById('midnight-audio'),
  videoOverlay: document.getElementById('video-overlay'),
  finalVideo: document.getElementById('final-video'),
  fireworks: document.getElementById('fireworks'),
  devPanel: document.getElementById('dev-panel'),
};

const appState = {
  current: STATE.LOADING,
  timelineLocked: false,
  storyIndex: 0,
  midnightTarget: null,
  countdownTimer: null,
  timelineTimer: null,
  fireworksActive: false,
  fireworksResizeBound: false,
  awaitingMidnightTap: false,
  awaitingPassword: false,
  passwordBuffer: '',
  testEnabled: false,
  testBuffer: '',
};

const storySequence = [
  'Today is about us 💕',
  'Ready for something fun? Let’s start the day with some CRAZY stuff 😏',
  'A surprise awaits… Find the treasure 🗺️💎',
];

function isWithinAllowedDates() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const current = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return current.getTime() === today.getTime() || current.getTime() === tomorrow.getTime();
}

function setTheme(themeClass) {
  document.body.className = themeClass;
}

function clearActions() {
  UI.actions.innerHTML = '';
}

function setScreen(title, subtitle, hint = '') {
  UI.title.textContent = title;
  UI.subtitle.textContent = subtitle;
  UI.hint.textContent = hint;
}

function showScreen() {
  UI.screen.classList.remove('fade-out');
  UI.screen.classList.add('fade-in');
}

function animateText() {
  UI.screen.classList.remove('text-animate');
  void UI.screen.offsetWidth;
  UI.screen.classList.add('text-animate');
}

function hideScreen() {
  UI.screen.classList.remove('fade-in');
  UI.screen.classList.add('fade-out');
}

function showCountdown(show) {
  UI.countdown.classList.toggle('hidden', !show);
}

function showStoryTap(show) {
  UI.storyTap.classList.toggle('hidden', !show);
}

function showMap(show) {
  UI.map.classList.toggle('hidden', !show);
}

function showCamera(show) {
  UI.camera.classList.toggle('hidden', !show);
}

function showPassword(show) {
  UI.password.classList.toggle('hidden', !show);
}

function showVideoOverlay(show) {
  if (!UI.videoOverlay) return;
  UI.videoOverlay.classList.toggle('hidden', !show);
}

function flashScreen(color) {
  UI.flash.style.background = color;
  UI.flash.classList.remove('hidden');
  requestAnimationFrame(() => {
    UI.flash.classList.add('show');
    setTimeout(() => {
      UI.flash.classList.remove('show');
      setTimeout(() => {
        UI.flash.classList.add('hidden');
      }, 220);
    }, 180);
  });
}

function resetCameraUI() {
  UI.cameraVideo.classList.remove('hidden');
  UI.cameraPhoto.classList.add('hidden');
  UI.cameraCanvas.classList.add('hidden');
  UI.cameraError.textContent = '';
  UI.capturePhoto.classList.remove('hidden');
  UI.complete.classList.add('hidden');
  UI.skip.classList.remove('hidden');
}

function resetPasswordEntry() {
  appState.awaitingPassword = false;
  appState.passwordBuffer = '';
  showPassword(false);
}

function formatTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hrs = String(Math.floor(total / 3600)).padStart(2, '0');
  const mins = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const secs = String(total % 60).padStart(2, '0');
  return `${hrs}:${mins}:${secs}`;
}

function computeMidnightTarget() {
  const now = new Date();
  const target = new Date(now);
  target.setHours(24, 0, 0, 0);
  return target;
}

function updateCountdown() {
  if (!appState.midnightTarget) return;
  const remaining = appState.midnightTarget.getTime() - Date.now();
  UI.countdownTime.textContent = formatTime(remaining);
  if (remaining <= 0) {
    stopCountdown();
    goToState(STATE.MIDNIGHT, { fromCountdown: true });
  }
}

function startCountdown() {
  appState.midnightTarget = computeMidnightTarget();
  showCountdown(true);
  updateCountdown();
  appState.countdownTimer = setInterval(updateCountdown, 200);
}

function stopCountdown() {
  if (appState.countdownTimer) {
    clearInterval(appState.countdownTimer);
    appState.countdownTimer = null;
  }
}

function getMappedTimeStage() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();

  if (hour === 23 && minute >= 50 && minute < 55) return STATE.T1150;
  if (hour === 23 && minute >= 55 && minute < 59) return STATE.T1155;
  if (hour === 23 && minute >= 59) return STATE.PROPOSAL;
  if (hour === 0 && minute >= 0) return STATE.MIDNIGHT;
  return STATE.LOADING;
}

function timelineTick() {
  if (appState.timelineLocked) return;
  if (!isWithinAllowedDates()) {
    goToState(STATE.LOADING);
    setScreen('This surprise unlocks today and tomorrow only 💗', 'Come back very soon.');
    UI.title.classList.remove('loading-ellipsis');
    UI.title.classList.remove('heart-beat');
    return;
  }
  const stage = getMappedTimeStage();
  if (stage !== appState.current) {
    goToState(stage);
  }
}

function setupActions() {
  UI.actions.innerHTML = '';
  if (appState.current === STATE.PROPOSAL) {
    const yesButton = document.createElement('button');
    yesButton.className = 'btn glow';
    yesButton.textContent = 'YES — Forever ❤️';
    yesButton.addEventListener('click', () => {
      appState.timelineLocked = true;
      goToState(STATE.COUNTDOWN, { fromYes: true });
    });
    UI.actions.appendChild(yesButton);

    const noButton = document.createElement('button');
    noButton.className = 'btn no';
    noButton.textContent = 'No';
    noButton.dataset.x = '0';
    noButton.dataset.y = '0';
    noButton.addEventListener('click', () => {
      showPopup('hahaha — you can trick the website, but you can’t say no 💞');
      moveNoButton(noButton, { force: true });
    });
    UI.actions.appendChild(noButton);
    requestAnimationFrame(() => requestAnimationFrame(() => placeNoButton(noButton)));
    UI.actions.addEventListener('pointermove', (event) => {
      moveNoButton(noButton, { clientX: event.clientX, clientY: event.clientY });
    });
    window.addEventListener('resize', () => placeNoButton(noButton));
  }
}

function placeNoButton(button) {
  const container = UI.actions;
  const rect = container.getBoundingClientRect();
  const btnRect = button.getBoundingClientRect();
  const x = Math.min(rect.width - btnRect.width, rect.width * 0.62);
  const y = (rect.height - btnRect.height) / 2;
  button.style.left = `${x}px`;
  button.style.top = `${Math.max(0, y)}px`;
  button.style.transform = 'translate(0, 0)';
  button.dataset.x = String(x);
  button.dataset.y = String(Math.max(0, y));
}

function moveNoButton(button, options = {}) {
  const { clientX, clientY, force } = options;
  const container = UI.actions;
  const rect = container.getBoundingClientRect();
  const btnRect = button.getBoundingClientRect();

  if (!force && (!clientX || !clientY)) return;

  const btnCenterX = btnRect.left + btnRect.width / 2;
  const btnCenterY = btnRect.top + btnRect.height / 2;
  const dx = (clientX ?? btnCenterX) - btnCenterX;
  const dy = (clientY ?? btnCenterY) - btnCenterY;
  const distance = Math.hypot(dx, dy);

  if (!force && distance > 90) return;

  const angle = Math.atan2(-dy, -dx);
  const jump = force ? 140 : 120;
  let nextX = (parseFloat(button.dataset.x) || 0) + Math.cos(angle) * jump;
  let nextY = (parseFloat(button.dataset.y) || 0) + Math.sin(angle) * jump;

  const maxX = Math.max(0, rect.width - btnRect.width);
  const maxY = Math.max(0, rect.height - btnRect.height);

  nextX = Math.min(maxX, Math.max(0, nextX));
  nextY = Math.min(maxY, Math.max(0, nextY));

  button.style.left = `${nextX}px`;
  button.style.top = `${nextY}px`;
  button.style.transform = 'translate(0, 0)';
  button.dataset.x = String(nextX);
  button.dataset.y = String(nextY);
}

let popupTimer = null;
function showPopup(message) {
  UI.popup.textContent = message;
  UI.popup.classList.remove('hidden');
  if (popupTimer) clearTimeout(popupTimer);
  popupTimer = setTimeout(() => {
    UI.popup.classList.add('hidden');
  }, 2000);
}

function setTestEngine(enabled) {
  appState.testEnabled = enabled;
  if (UI.devPanel) {
    UI.devPanel.classList.toggle('hidden', !enabled);
  }
  showPopup(enabled ? 'Test engine enabled' : 'Test engine disabled');
}

function goToState(state, options = {}) {
  if (appState.current === STATE.CAMERA && state !== STATE.CAMERA) {
    stopCamera();
  }
  appState.current = state;

  clearActions();
  showScreen();
  animateText();
  showStoryTap(false);
  showMap(false);
  showCamera(false);
  showPassword(false);
  showVideoOverlay(false);
  showCountdown(false);
  stopCountdown();
  if (![STATE.MIDNIGHT, STATE.STORY, STATE.FINAL].includes(state)) {
    stopFireworks();
  }
  resetPasswordEntry();

  switch (state) {
    case STATE.LOADING:
      setTheme('theme-black');
      setScreen('Something magical is loading', 'This thing will work only once — record it if you want to.');
      UI.title.classList.add('loading-ellipsis');
      UI.title.classList.remove('heart-beat');
      break;
    case STATE.T1150:
      setTheme('theme-romantic-1');
      UI.title.classList.remove('loading-ellipsis');
      UI.title.classList.add('heart-beat');
      setScreen('You have 10 minutes to decide our upcoming faith ❤️', '', '');
      break;
    case STATE.T1155:
      setTheme('theme-romantic-2');
      UI.title.classList.add('loading-ellipsis');
      UI.title.classList.remove('heart-beat');
      setScreen('Every second matters… ⏳ TICK… TOCK…', '', '');
      break;
    case STATE.PROPOSAL:
      setTheme('theme-proposal');
      UI.title.classList.remove('loading-ellipsis');
      UI.title.classList.remove('heart-beat');
      setScreen('Would you be my Valentine? ❤️', '');
      setupActions();
      break;
    case STATE.COUNTDOWN:
      setTheme('theme-black');
      UI.title.classList.remove('loading-ellipsis');
      UI.title.classList.remove('heart-beat');
      hideScreen();
      startCountdown();
      break;
    case STATE.MIDNIGHT:
      setTheme('theme-rose');
      UI.title.classList.remove('loading-ellipsis');
      UI.title.classList.remove('heart-beat');
      showCountdown(false);
      setScreen('Happy Rose Day My Valentine 🌹', '');
      if (UI.midnightAudio) {
        UI.midnightAudio.currentTime = 0;
        UI.midnightAudio.play().catch(() => {});
      }
      launchFireworks(Number.POSITIVE_INFINITY);
      appState.awaitingMidnightTap = true;
      showStoryTap(true);
      break;
    case STATE.STORY:
      setTheme('theme-rose');
      UI.title.classList.remove('loading-ellipsis');
      UI.title.classList.remove('heart-beat');
      UI.screen.classList.remove('fun-style');
      appState.awaitingMidnightTap = false;
      appState.storyIndex = 0;
      setScreen(storySequence[0], '');
      showStoryTap(true);
      break;
    case STATE.MAP:
      setTheme('theme-rose');
      UI.title.classList.remove('loading-ellipsis');
      UI.title.classList.remove('heart-beat');
      setScreen('A surprise awaits… Find the treasure 🗺️💎', '', '');
      showMap(true);
      break;
    case STATE.CAMERA:
      setTheme('theme-rose');
      UI.title.classList.remove('loading-ellipsis');
      UI.title.classList.remove('heart-beat');
      setScreen('', '');
      showCamera(true);
      resetCameraUI();
      startCamera();
      break;
    case STATE.FINAL:
      setTheme('theme-rose');
      UI.title.classList.remove('loading-ellipsis');
      UI.title.classList.remove('heart-beat');
      setScreen('Happy Rose Day My Valentine ❤️', 'I Love You… Forever 💫');
      const enjoyButton = document.createElement('button');
      enjoyButton.className = 'btn glow cute';
      enjoyButton.textContent = 'Click to enjoy the show';
      enjoyButton.addEventListener('click', () => {
        if (UI.midnightAudio) {
          UI.midnightAudio.volume = 0.5;
        }
        if (UI.finalVideo) {
          showVideoOverlay(true);
          UI.finalVideo.currentTime = 0;
          UI.finalVideo.play().catch(() => {});
          const requestFull = UI.finalVideo.requestFullscreen || UI.finalVideo.webkitRequestFullscreen || UI.finalVideo.msRequestFullscreen;
          if (requestFull) {
            requestFull.call(UI.finalVideo);
          }
        }
      });
      UI.actions.appendChild(enjoyButton);
      launchFireworks(7000);
      break;
    default:
      break;
  }
}

function handleStoryTap() {
  if (appState.current !== STATE.STORY) return;
  appState.storyIndex += 1;
  if (appState.storyIndex < storySequence.length) {
    if (appState.storyIndex === 1) {
      UI.screen.classList.add('fun-style');
    } else {
      UI.screen.classList.remove('fun-style');
    }
    setScreen(storySequence[appState.storyIndex], '');
    animateText();
  } else {
    showStoryTap(false);
    UI.screen.classList.remove('fun-style');
    goToState(STATE.MAP);
  }
}

function startCamera() {
  resetCameraUI();
  navigator.mediaDevices
    .getUserMedia({ video: { facingMode: 'user' }, audio: false })
    .then((stream) => {
      UI.cameraVideo.srcObject = stream;
      UI.cameraVideo.play();
    })
    .catch(() => {
      UI.cameraError.textContent = 'Camera access unavailable. You can skip and still complete.';
      UI.skip.classList.remove('hidden');
    });
}

function stopCamera() {
  const stream = UI.cameraVideo.srcObject;
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
  UI.cameraVideo.srcObject = null;
}

function capturePhoto() {
  const video = UI.cameraVideo;
  const canvas = UI.cameraCanvas;
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const data = canvas.toDataURL('image/png');
  UI.cameraPhoto.src = data;
  UI.cameraPhoto.classList.remove('hidden');
  UI.cameraVideo.classList.add('hidden');
  UI.capturePhoto.classList.add('hidden');
  UI.skip.classList.add('hidden');
  UI.complete.classList.add('hidden');
  stopCamera();
  UI.camera.classList.add('hidden');
  showPassword(true);
  appState.awaitingPassword = true;
}

function setupEventListeners() {
  document.addEventListener('click', (event) => {
    if (UI.devPanel && event.target.closest('.dev-panel')) return;
    if (appState.current === STATE.MIDNIGHT && appState.awaitingMidnightTap) {
      appState.awaitingMidnightTap = false;
      goToState(STATE.STORY);
      return;
    }
    if (appState.current === STATE.STORY) {
      handleStoryTap();
    }
  });

  UI.openCamera.addEventListener('click', () => {
    goToState(STATE.CAMERA);
  });

  if (UI.mapArt && UI.mapLightbox) {
    UI.mapArt.addEventListener('click', () => {
      UI.mapLightbox.classList.remove('hidden');
    });
    UI.mapLightbox.addEventListener('click', () => {
      UI.mapLightbox.classList.add('hidden');
    });
  }

  UI.capturePhoto.addEventListener('click', () => {
    capturePhoto();
  });

  UI.complete.addEventListener('click', () => {
    stopCamera();
    goToState(STATE.FINAL);
  });

  UI.skip.addEventListener('click', () => {
    stopCamera();
    UI.cameraVideo.classList.add('hidden');
    UI.cameraPhoto.classList.add('hidden');
    UI.cameraCanvas.classList.add('hidden');
    UI.capturePhoto.classList.add('hidden');
    UI.skip.classList.add('hidden');
    UI.camera.classList.add('hidden');
    showPassword(true);
    appState.awaitingPassword = true;
    UI.cameraError.textContent = 'Camera skipped.';
  });

  document.addEventListener('keydown', (event) => {
    if (event.key.length !== 1) return;

    appState.testBuffer = (appState.testBuffer + event.key).slice(-4);
    if (appState.testBuffer.toLowerCase() === 'test') {
      setTestEngine(!appState.testEnabled);
      appState.testBuffer = '';
    }

    if (!appState.awaitingPassword) return;
    appState.passwordBuffer = (appState.passwordBuffer + event.key).slice(-4);
    if (appState.passwordBuffer.toLowerCase() === 'love') {
      flashScreen('rgba(64, 201, 120, 0.95)');
      setTimeout(() => {
        resetPasswordEntry();
        goToState(STATE.FINAL);
      }, 220);
    } else if (appState.passwordBuffer.length >= 4) {
      flashScreen('rgba(255, 70, 70, 0.85)');
      appState.passwordBuffer = '';
    }
  });

  if (UI.finalVideo && UI.videoOverlay) {
    UI.finalVideo.addEventListener('ended', () => {
      showVideoOverlay(false);
    });
    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement !== UI.finalVideo) {
        showVideoOverlay(false);
      }
    });
  }

  if (UI.devPanel) {
    document.querySelectorAll('[data-dev]').forEach((button) => {
      button.addEventListener('click', () => {
        if (!appState.testEnabled) return;
        const target = button.getAttribute('data-dev');
        appState.timelineLocked = true;
        switch (target) {
          case 'loading':
            appState.timelineLocked = false;
            goToState(STATE.LOADING);
            break;
          case 't1150':
            goToState(STATE.T1150);
            break;
          case 't1155':
            goToState(STATE.T1155);
            break;
          case 'proposal':
            goToState(STATE.PROPOSAL);
            break;
          case 'countdown':
            goToState(STATE.COUNTDOWN, { fromYes: true });
            break;
          case 'midnight':
            goToState(STATE.MIDNIGHT, { fromCountdown: true });
            break;
          case 'story':
            goToState(STATE.STORY);
            break;
          case 'map':
            goToState(STATE.MAP);
            break;
          case 'camera':
            goToState(STATE.CAMERA);
            break;
          case 'final':
            goToState(STATE.FINAL);
            break;
          default:
            break;
        }
      });
    });
  }
}

function launchFireworks(duration = 5000) {
  const canvas = UI.fireworks;
  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);
  const particles = [];
  const start = performance.now();
  appState.fireworksActive = true;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function createBurst() {
    const x = Math.random() * width;
    const y = Math.random() * height * 0.5 + height * 0.1;
    const count = 40 + Math.floor(Math.random() * 20);
    const colors = ['#ff7aa2', '#f2d2a9', '#ffffff'];
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * (1.5 + Math.random() * 1.8),
        vy: Math.sin(angle) * (1.5 + Math.random() * 1.8),
        life: 60 + Math.random() * 30,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  function render(now) {
    if (!appState.fireworksActive) return;
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'lighter';

    if (now - start < duration && Math.random() < 0.08) {
      createBurst();
    }

    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.02;
      p.life -= 1;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(p.life / 80, 0);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    if (now - start < duration || particles.length > 0) {
      requestAnimationFrame(render);
    }
  }

  if (!appState.fireworksResizeBound) {
    window.addEventListener('resize', resize);
    appState.fireworksResizeBound = true;
  }
  requestAnimationFrame(render);
}

function stopFireworks() {
  appState.fireworksActive = false;
  const ctx = UI.fireworks.getContext('2d');
  ctx.clearRect(0, 0, UI.fireworks.width, UI.fireworks.height);
}

function initTimeline() {
  goToState(getMappedTimeStage());
  appState.timelineTimer = setInterval(timelineTick, 1000);
}

function updateClock() {
  const now = new Date();
  const formatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  UI.clock.textContent = formatted;
}

setInterval(updateClock, 1000);
updateClock();

setupEventListeners();
initTimeline();
