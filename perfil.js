import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  updateDoc,
  setDoc,
  deleteDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDXotES01Dan0HDKSf5FoO9HVcQ1NYV54g",
  authDomain: "cine-clube-xiquete.firebaseapp.com",
  projectId: "cine-clube-xiquete",
  storageBucket: "cine-clube-xiquete.firebasestorage.app",
  messagingSenderId: "1040585635594",
  appId: "1:1040585635594:web:c5a9560c4f6d7d310a2cf3",
  measurementId: "G-XYGW6XN6R7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===== DOM ELEMENTS =====
const loading = document.getElementById('loading');
const profileContent = document.getElementById('profileContent');
const avatarInitial = document.getElementById('avatarInitial');
const avatarImage = document.getElementById('avatarImage');
const profileName = document.getElementById('profileName');
const profileLogin = document.getElementById('profileLogin');
const editProfileBtn = document.getElementById('editProfileBtn');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const editAvatarBtn = document.getElementById('editAvatarBtn');
const avatarInput = document.getElementById('avatarInput');
const bioText = document.getElementById('bioText');
const bioDisplay = document.getElementById('bioDisplay');
const bioEdit = document.getElementById('bioEdit');
const bioInput = document.getElementById('bioInput');
const topMoviesGrid = document.getElementById('topMoviesGrid');
const chartBars = document.getElementById('chartBars');
const genresContainer = document.getElementById('genresContainer');
const genresEdit = document.getElementById('genresEdit');
const genresInput = document.getElementById('genresInput');
const recentReviewsList = document.getElementById('recentReviewsList');
const profileNameInput = document.getElementById('profileNameInput');
const profileLoginInput = document.getElementById('profileLoginInput');
const profileNameEdit = document.getElementById('profileNameEdit');
const profileLoginEdit = document.getElementById('profileLoginEdit');

let currentUser = null;
let currentUserData = null;
let profileUserId = null;
let isOwnProfile = false;
let isEditMode = false;
let originalData = null;
let tempTopMovies = [];
let tempGenres = [];

// ===== VARIÁVEIS PARA CROP =====
let cropBoxSize = 70;
let cropImageElement = null;
let isCropping = false;
let cropWrapper = null;
let cropBox = null;

// Variáveis para arrastar o box
let isDraggingBox = false;
let dragStartX = 0;
let dragStartY = 0;
let boxStartX = 0;
let boxStartY = 0;
let boxStartPercentX = 0;
let boxStartPercentY = 0;

// Variáveis para redimensionar
let isResizing = false;
let resizeHandle = null;
let resizeStartX = 0;
let resizeStartY = 0;
let resizeStartSize = 0;

// ===== TOAST NOTIFICATIONS =====
function showToast(type, title, message, duration = 4000) {
  let container = document.getElementById('notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.className = `notification ${type}`;
  
  const icons = {
    success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
    warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z"/></svg>`
  };
  
  toast.innerHTML = `
    <div class="notification-icon">${icons[type] || icons.info}</div>
    <div class="notification-content">
      <div class="notification-title">${title}</div>
      <div class="notification-message">${message}</div>
    </div>
    <button class="notification-close">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  `;
  
  container.appendChild(toast);
  
  const closeBtn = toast.querySelector('.notification-close');
  closeBtn.addEventListener('click', () => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  });
  
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), 300);
    }
  }, duration);
}

// ===== GENERATE STARS =====
function generateStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 && rating % 1 < 1 ? 1 : 0;
  const empty = 5 - full - half;
  
  let html = '';
  for (let i = 0; i < full; i++) html += '★';
  if (half) html += '★';
  for (let i = 0; i < empty; i++) html += '☆';
  
  return html;
}

// ===== VERIFICAR SE LOGIN EXISTE =====
async function checkLoginExists(login) {
    if (!login) return false;
    try {
        const docRef = doc(db, 'usuarios', login);
        const docSnap = await getDoc(docRef);
        return docSnap.exists();
    } catch (error) {
        console.error('Erro ao verificar login:', error);
        return false;
    }
}

// ===== LOAD TOP MOVIES =====
async function loadTopMovies() {
  try {
    const topMoviesData = currentUserData.topMovies || [];
    tempTopMovies = [...topMoviesData];
    renderTopMovies(topMoviesData);
  } catch (error) {
    console.error('Erro ao carregar top filmes:', error);
  }
}

// ===== RENDER TOP MOVIES =====
function renderTopMovies(movies) {
  if (!movies || movies.length === 0) {
    if (isEditMode) {
      topMoviesGrid.innerHTML = `
        <div class="top-movie-item editable" data-index="0">
          <button class="add-top-btn" data-index="0">+</button>
          <div class="empty-movie">Adicionar filme</div>
        </div>
        <div class="top-movie-item editable" data-index="1">
          <button class="add-top-btn" data-index="1">+</button>
          <div class="empty-movie">Adicionar filme</div>
        </div>
        <div class="top-movie-item editable" data-index="2">
          <button class="add-top-btn" data-index="2">+</button>
          <div class="empty-movie">Adicionar filme</div>
        </div>
        <div class="top-movie-item editable" data-index="3">
          <button class="add-top-btn" data-index="3">+</button>
          <div class="empty-movie">Adicionar filme</div>
        </div>
      `;
    } else {
      topMoviesGrid.innerHTML = '<div class="empty-top-movies">Nenhum filme adicionado</div>';
    }
    if (isEditMode) {
      setTimeout(setupTopMovieEvents, 50);
    }
    return;
  }
  
  let html = '';
  const top4 = movies.slice(0, 4);
  
  for (let i = 0; i < 4; i++) {
    const movie = top4[i] || null;
    const isEditable = isEditMode;
    
    if (movie) {
      html += `
        <div class="top-movie-item ${isEditable ? 'editable' : ''}" data-index="${i}" onclick="${!isEditable ? `window.location.href='filme.html?id=${movie.id}'` : ''}">
          ${movie.poster ? `<img src="${movie.poster}" alt="${movie.nome}">` : 
            `<div class="empty-movie">${movie.nome || 'Sem poster'}</div>`}
          ${isEditable ? `<button class="remove-top-btn" data-index="${i}">✕</button>` : ''}
        </div>
      `;
    } else {
      if (isEditable) {
        html += `
          <div class="top-movie-item editable" data-index="${i}">
            <button class="add-top-btn" data-index="${i}">+</button>
            <div class="empty-movie">Adicionar filme</div>
          </div>
        `;
      } else {
        html += `
          <div class="top-movie-item" data-index="${i}">
            <div class="empty-movie">Vazio</div>
          </div>
        `;
      }
    }
  }
  
  topMoviesGrid.innerHTML = html;
  
  if (isEditMode) {
    setTimeout(setupTopMovieEvents, 50);
  }
}

// ===== SETUP EVENTOS DO TOP MOVIES =====
function setupTopMovieEvents() {
  document.querySelectorAll('.remove-top-btn').forEach(btn => {
    btn.replaceWith(btn.cloneNode(true));
  });
  
  document.querySelectorAll('.remove-top-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      e.preventDefault();
      const index = parseInt(this.dataset.index);
      removeFromTop(index);
    });
  });
  
  document.querySelectorAll('.add-top-btn').forEach(btn => {
    btn.replaceWith(btn.cloneNode(true));
  });
  
  document.querySelectorAll('.add-top-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      e.preventDefault();
      const index = parseInt(this.dataset.index);
      addToTop(index);
    });
  });
}

// ===== REMOVE FROM TOP =====
async function removeFromTop(index) {
  const newTop = [...tempTopMovies];
  newTop.splice(index, 1);
  tempTopMovies = newTop;
  renderTopMovies(tempTopMovies);
  showToast('info', 'Removido', 'Filme removido do Top 4.');
}

// ===== ADD TO TOP =====
async function addToTop(index) {
  const existingModal = document.getElementById('movieSelectModal');
  if (existingModal) {
    document.body.removeChild(existingModal);
  }
  
  try {
    const moviesRef = collection(db, 'filmes');
    const snapshot = await getDocs(moviesRef);
    const allMovies = [];
    snapshot.forEach(doc => {
      allMovies.push({ id: doc.id, ...doc.data() });
    });
    
    if (allMovies.length === 0) {
      showToast('warning', 'Aviso', 'Nenhum filme cadastrado ainda.');
      return;
    }
    
    const existingIds = tempTopMovies.map(m => m.id);
    const available = allMovies.filter(m => !existingIds.includes(m.id));
    
    if (available.length === 0) {
      showToast('warning', 'Aviso', 'Todos os filmes já estão no Top 4.');
      return;
    }
    
    const overlay = document.createElement('div');
    overlay.id = 'movieSelectModal';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.85);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;
    
    const modalBox = document.createElement('div');
    modalBox.style.cssText = `
      background: #1e1e1e;
      border-radius: 20px;
      max-width: 450px;
      width: 100%;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      border: 1px solid rgba(253,119,203,0.2);
      box-shadow: 0 20px 60px rgba(0,0,0,0.8);
    `;
    
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px 16px 24px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      flex-shrink: 0;
    `;
    header.innerHTML = `
      <h3 style="color:white;font-size:1.1rem;font-weight:600;margin:0;">Selecionar Filme</h3>
      <button id="closeModalBtn" style="
        background:none;
        border:none;
        color:#888;
        font-size:1.5rem;
        cursor:pointer;
        padding:4px 8px;
        border-radius:8px;
        transition:all 0.2s;
        line-height:1;
      ">✕</button>
    `;
    
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Buscar filme...';
    searchInput.style.cssText = `
      margin: 12px 24px 8px 24px;
      padding: 10px 14px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      color: white;
      font-size: 0.9rem;
      outline: none;
      flex-shrink: 0;
    `;
    
    const list = document.createElement('div');
    list.style.cssText = `
      overflow-y: auto;
      flex: 1;
      padding: 8px 20px 20px 20px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    `;
    
    available.forEach(movie => {
      const item = document.createElement('div');
      item.className = 'movie-item';
      item.dataset.name = movie.nome;
      item.style.cssText = `
        padding: 10px 14px;
        background: rgba(255,255,255,0.03);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 12px;
        border: 1px solid transparent;
      `;
      
      item.addEventListener('mouseenter', () => {
        item.style.background = 'rgba(253,119,203,0.12)';
        item.style.borderColor = 'rgba(253,119,203,0.2)';
      });
      item.addEventListener('mouseleave', () => {
        item.style.background = 'rgba(255,255,255,0.03)';
        item.style.borderColor = 'transparent';
      });
      
      const posterHtml = movie.poster 
        ? `<img src="${movie.poster}" alt="${movie.nome}" style="width:36px;height:50px;object-fit:cover;border-radius:6px;flex-shrink:0;">`
        : `<div style="width:36px;height:50px;background:#2a2a2a;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#666;font-size:0.6rem;flex-shrink:0;text-align:center;">Sem</div>`;
      
      item.innerHTML = `
        ${posterHtml}
        <div style="flex:1;min-width:0;">
          <div style="color:white;font-weight:500;font-size:0.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${movie.nome}</div>
          <div style="color:#888;font-size:0.75rem;">${movie.ano || 'Ano desconhecido'} ${movie.genero ? `• ${movie.genero}` : ''}</div>
        </div>
      `;
      
      item.addEventListener('click', function() {
        const newTop = [...tempTopMovies];
        newTop.splice(index, 0, movie);
        if (newTop.length > 4) {
          newTop.pop();
        }
        tempTopMovies = newTop;
        renderTopMovies(tempTopMovies);
        if (document.body.contains(overlay)) {
          document.body.removeChild(overlay);
        }
        showToast('success', 'Adicionado!', `${movie.nome} foi adicionado ao Top 4.`);
      });
      
      list.appendChild(item);
    });
    
    searchInput.addEventListener('input', function() {
      const query = this.value.toLowerCase().trim();
      const items = list.querySelectorAll('.movie-item');
      items.forEach(item => {
        const name = item.dataset.name.toLowerCase();
        item.style.display = name.includes(query) ? 'flex' : 'none';
      });
    });
    
    modalBox.appendChild(header);
    modalBox.appendChild(searchInput);
    modalBox.appendChild(list);
    overlay.appendChild(modalBox);
    document.body.appendChild(overlay);
    
    const closeBtn = header.querySelector('#closeModalBtn');
    closeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    });
    
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay && document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    });
    
    const escHandler = function(e) {
      if (e.key === 'Escape' && document.body.contains(overlay)) {
        document.body.removeChild(overlay);
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
    
    setTimeout(() => searchInput.focus(), 100);
    
  } catch (error) {
    console.error('Erro em addToTop:', error);
    showToast('error', 'Erro', 'Não foi possível abrir a lista de filmes.');
  }
}

// ===== LOAD GENRES =====
async function loadGenres() {
  try {
    const genresData = currentUserData.generos || [];
    tempGenres = [...genresData];
    renderGenres(genresData);
  } catch (error) {
    console.error('Erro ao carregar gêneros:', error);
  }
}

function renderGenres(genres) {
  if (isEditMode) {
    genresContainer.style.display = 'none';
    genresEdit.classList.remove('hidden');
    genresInput.value = genres.join(', ');
  } else {
    genresContainer.style.display = 'flex';
    genresEdit.classList.add('hidden');
    
    if (!genres || genres.length === 0) {
      genresContainer.innerHTML = '<span class="empty-genres">Nenhum gênero definido</span>';
      return;
    }
    
    let html = '';
    genres.slice(0, 3).forEach(genre => {
      html += `<span class="genre-tag">${genre}</span>`;
    });
    genresContainer.innerHTML = html;
  }
}

// ===== LOAD REVIEWS =====
async function loadReviews() {
  try {
    const reviewsRef = collection(db, 'avaliacoes');
    const q = query(reviewsRef, where('uid', '==', profileUserId));
    const snapshot = await getDocs(q);
    
    const reviews = [];
    snapshot.forEach(doc => {
      reviews.push({ id: doc.id, ...doc.data() });
    });
    
    const filteredReviews = reviews.filter(r => r.nota > 0);
    
    filteredReviews.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB - dateA;
    });
    
    renderChart(filteredReviews);
    renderRecentReviews(filteredReviews.slice(0, 4));
    
  } catch (error) {
    console.error('Erro ao carregar avaliações:', error);
    if (error.code === 'failed-precondition') {
      showToast('warning', 'Aviso', 'Crie o índice no Firebase Console para ver as avaliações.');
    }
    renderChart([]);
    renderRecentReviews([]);
  }
}

function renderChart(reviews) {
  const ratingCounts = {};
  for (let i = 0.5; i <= 5; i += 0.5) {
    ratingCounts[i] = 0;
  }
  
  reviews.forEach(review => {
    const nota = review.nota || 0;
    const rounded = Math.round(nota * 2) / 2;
    if (rounded >= 0.5 && rounded <= 5) {
      ratingCounts[rounded] = (ratingCounts[rounded] || 0) + 1;
    }
  });
  
  let maxCount = 0;
  let maxRating = null;
  for (const [rating, count] of Object.entries(ratingCounts)) {
    if (count > maxCount) {
      maxCount = count;
      maxRating = parseFloat(rating);
    }
  }
  
  const maxOverall = Math.max(...Object.values(ratingCounts), 1);
  
  let html = '';
  const ratings = Object.keys(ratingCounts).sort((a, b) => parseFloat(a) - parseFloat(b));
  
  ratings.forEach(rating => {
    const count = ratingCounts[rating];
    const percentage = count > 0 ? (count / maxOverall) * 100 : 4;
    const height = Math.max(percentage, 4);
    const isZero = count === 0;
    const isMax = count > 0 && count === maxCount && rating == maxRating;
    
    html += `
      <div class="chart-bar-wrapper">
        <div class="chart-bar-count">${count}</div>
        <div class="chart-bar ${isZero ? 'zero' : ''} ${isMax ? 'max' : ''}" style="height: ${height}%;"></div>
        <div class="chart-bar-label">${parseFloat(rating).toFixed(1)}</div>
      </div>
    `;
  });
  
  chartBars.innerHTML = html;
}

function renderRecentReviews(reviews) {
  if (reviews.length === 0) {
    recentReviewsList.innerHTML = '<div class="no-reviews">Nenhuma avaliação ainda</div>';
    return;
  }
  
  let html = '';
  reviews.forEach(review => {
    const stars = generateStars(review.nota || 0);
    
    html += `
      <div class="recent-review-item" onclick="window.location.href='filme.html?id=${review.filmeId}'">
        <div class="recent-review-poster">
          ${review.poster ? `<img src="${review.poster}" alt="${review.nomeFilme}">` : 
            `<div class="no-poster">${review.nomeFilme || 'Filme'}</div>`}
        </div>
        <div class="recent-review-info">
          <div class="recent-review-name">${review.nomeFilme || 'Filme'}</div>
          <div class="recent-review-stars">${stars}</div>
        </div>
        <div class="recent-review-rating">${(review.nota || 0).toFixed(1)}</div>
      </div>
    `;
  });
  
  recentReviewsList.innerHTML = html;
}

// ===== LOAD PROFILE =====
async function loadProfile() {
  const params = new URLSearchParams(window.location.search);
  const uid = params.get('uid');
  
  if (!uid) {
    if (currentUser) {
      profileUserId = currentUser.uid;
      isOwnProfile = true;
    } else {
      showToast('error', 'Erro', 'Usuário não encontrado.');
      setTimeout(() => window.location.href = 'menu.html', 2000);
      return;
    }
  } else {
    profileUserId = uid;
    isOwnProfile = (currentUser && uid === currentUser.uid);
  }
  
  try {
    const usuariosRef = collection(db, 'usuarios');
    const q = query(usuariosRef, where('uid', '==', profileUserId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      showToast('error', 'Erro', 'Usuário não encontrado.');
      setTimeout(() => window.location.href = 'menu.html', 2000);
      return;
    }
    
    const doc = querySnapshot.docs[0];
    currentUserData = { id: doc.id, ...doc.data() };
    
    renderProfile();
    await loadTopMovies();
    await loadGenres();
    await loadReviews();
    
    loading.style.display = 'none';
    profileContent.classList.remove('hidden');
    
  } catch (error) {
    console.error('Erro ao carregar perfil:', error);
    showToast('error', 'Erro', 'Não foi possível carregar o perfil.');
    loading.innerHTML = `
      <div style="text-align:center;color:#666;">
        <p style="font-size:1.2rem;margin-bottom:8px;">Erro ao carregar</p>
        <p style="font-size:0.9rem;">Tente novamente mais tarde.</p>
        <button onclick="window.location.href='menu.html'" style="margin-top:16px;padding:10px 24px;background:#fd77cb;border:none;border-radius:12px;color:white;font-weight:600;cursor:pointer;">Voltar ao Menu</button>
      </div>
    `;
  }
}

function renderProfile() {
  const nome = currentUserData.nome || 'Usuário';
  const login = currentUserData.login || 'usuario';
  
  profileName.textContent = nome;
  profileLogin.textContent = `@${login}`;
  
  const initial = nome.charAt(0).toUpperCase();
  if (currentUserData.fotoPerfil) {
    avatarImage.src = currentUserData.fotoPerfil;
    avatarImage.style.display = 'block';
    avatarInitial.textContent = '';
  } else {
    avatarImage.style.display = 'none';
    avatarInitial.textContent = initial;
  }
  
  bioText.textContent = currentUserData.bio || 'Nenhuma bio adicionada ainda.';
  
  if (isOwnProfile) {
    editProfileBtn.classList.remove('hidden');
  } else {
    editProfileBtn.classList.add('hidden');
  }
}

// ===== FUNÇÕES DO CROP =====

function openCropModal(imageSrc) {
    const modal = document.getElementById('cropModal');
    const img = document.getElementById('cropImage');
    
    if (!modal || !img) return;
    
    img.src = imageSrc;
    cropBoxSize = 70;
    cropImageElement = img;
    isCropping = true;
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    const cropBoxEl = document.getElementById('cropBox');
    if (cropBoxEl) {
        cropBoxEl.style.left = '50%';
        cropBoxEl.style.top = '50%';
        cropBoxEl.style.transform = 'translate(-50%, -50%)';
        cropBoxEl.style.width = '70%';
        cropBoxEl.style.height = '70%';
    }
    
    // Atualiza o indicador de tamanho
    const sizeLevel = document.getElementById('sizeLevel');
    if (sizeLevel) {
        sizeLevel.textContent = '70%';
    }
    
    img.onload = function() {
        setupCropEvents();
    };
    if (img.complete) {
        img.onload();
    }
}

function closeCropModal() {
    const modal = document.getElementById('cropModal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = '';
    isCropping = false;
    cropImageElement = null;
    isDraggingBox = false;
    isResizing = false;
}

function updateCropBoxSizeAndPosition() {
    const cropBoxEl = document.getElementById('cropBox');
    if (!cropBoxEl) return;
    
    cropBoxEl.style.width = `${cropBoxSize}%`;
    cropBoxEl.style.height = `${cropBoxSize}%`;
    
    // Atualiza o indicador de tamanho
    const sizeLevel = document.getElementById('sizeLevel');
    if (sizeLevel) {
        sizeLevel.textContent = `${Math.round(cropBoxSize)}%`;
    }
}

function setupCropEvents() {
    const wrapper = document.getElementById('cropWrapper');
    const cropBoxEl = document.getElementById('cropBox');
    
    if (!wrapper || !cropBoxEl) return;
    
    // Remove event listeners antigos clonando
    const newWrapper = wrapper.cloneNode(true);
    wrapper.parentNode.replaceChild(newWrapper, wrapper);
    
    cropWrapper = document.getElementById('cropWrapper');
    cropBox = document.getElementById('cropBox');
    cropImageElement = document.getElementById('cropImage');
    
    // Configura posição inicial
    cropBox.style.width = `${cropBoxSize}%`;
    cropBox.style.height = `${cropBoxSize}%`;
    cropBox.style.left = '50%';
    cropBox.style.top = '50%';
    cropBox.style.transform = 'translate(-50%, -50%)';
    
    // ===== DRAG DO BOX (mouse) =====
    cropBox.addEventListener('mousedown', function(e) {
        if (e.target.closest('.crop-handle') || e.target.closest('.crop-edge')) {
            return;
        }
        
        isDraggingBox = true;
        const rect = cropBox.getBoundingClientRect();
        const wrapperRect = cropWrapper.getBoundingClientRect();
        
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        boxStartX = rect.left - wrapperRect.left;
        boxStartY = rect.top - wrapperRect.top;
        
        // Guarda a posição em porcentagem
        const wrapperWidth = wrapperRect.width;
        const wrapperHeight = wrapperRect.height;
        boxStartPercentX = (boxStartX / wrapperWidth) * 100;
        boxStartPercentY = (boxStartY / wrapperHeight) * 100;
        
        cropBox.style.cursor = 'grabbing';
        e.preventDefault();
    });
    
    // ===== DRAG DO BOX (touch) =====
    cropBox.addEventListener('touchstart', function(e) {
        if (e.target.closest('.crop-handle') || e.target.closest('.crop-edge')) {
            return;
        }
        
        const touch = e.touches[0];
        if (!touch) return;
        
        isDraggingBox = true;
        const rect = cropBox.getBoundingClientRect();
        const wrapperRect = cropWrapper.getBoundingClientRect();
        
        dragStartX = touch.clientX;
        dragStartY = touch.clientY;
        boxStartX = rect.left - wrapperRect.left;
        boxStartY = rect.top - wrapperRect.top;
        
        const wrapperWidth = wrapperRect.width;
        const wrapperHeight = wrapperRect.height;
        boxStartPercentX = (boxStartX / wrapperWidth) * 100;
        boxStartPercentY = (boxStartY / wrapperHeight) * 100;
        
        e.preventDefault();
    }, { passive: false });
    
    // ===== HANDLES DE REDIMENSIONAMENTO =====
    document.querySelectorAll('.crop-handle, .crop-edge').forEach(handle => {
        handle.addEventListener('mousedown', function(e) {
            e.stopPropagation();
            isResizing = true;
            resizeHandle = this.dataset.handle || this.className.split(' ')[1]?.replace('crop-edge-', '');
            
            resizeStartX = e.clientX;
            resizeStartY = e.clientY;
            resizeStartSize = cropBoxSize;
            
            e.preventDefault();
        });
        
        handle.addEventListener('touchstart', function(e) {
            e.stopPropagation();
            const touch = e.touches[0];
            if (!touch) return;
            
            isResizing = true;
            resizeHandle = this.dataset.handle || this.className.split(' ')[1]?.replace('crop-edge-', '');
            
            resizeStartX = touch.clientX;
            resizeStartY = touch.clientY;
            resizeStartSize = cropBoxSize;
            
            e.preventDefault();
        }, { passive: false });
    });
    
    // ===== MOVIMENTO DO MOUSE =====
    document.addEventListener('mousemove', function(e) {
        if (isDraggingBox) {
            moveCropBox(e.clientX, e.clientY);
        } else if (isResizing) {
            resizeCropBox(e.clientX, e.clientY);
        }
    });
    
    document.addEventListener('touchmove', function(e) {
        const touch = e.touches[0];
        if (!touch) return;
        
        if (isDraggingBox) {
            moveCropBox(touch.clientX, touch.clientY);
        } else if (isResizing) {
            resizeCropBox(touch.clientX, touch.clientY);
        }
    }, { passive: false });
    
    // ===== FIM DO DRAG =====
    document.addEventListener('mouseup', function() {
        if (isDraggingBox || isResizing) {
            isDraggingBox = false;
            isResizing = false;
            resizeHandle = null;
            if (cropBox) {
                cropBox.style.cursor = 'grab';
            }
        }
    });
    
    document.addEventListener('touchend', function() {
        isDraggingBox = false;
        isResizing = false;
        resizeHandle = null;
    });
}

// ===== FUNÇÃO PARA MOVER O BOX =====
function moveCropBox(clientX, clientY) {
    if (!cropBox || !cropWrapper) return;
    
    const wrapperRect = cropWrapper.getBoundingClientRect();
    const wrapperWidth = wrapperRect.width;
    const wrapperHeight = wrapperRect.height;
    
    const deltaX = clientX - dragStartX;
    const deltaY = clientY - dragStartY;
    
    let newLeft = boxStartX + deltaX;
    let newTop = boxStartY + deltaY;
    
    const boxSizePx = (cropBoxSize / 100) * wrapperWidth;
    const maxX = wrapperWidth - boxSizePx;
    const maxY = wrapperHeight - boxSizePx;
    
    newLeft = Math.max(0, Math.min(maxX, newLeft));
    newTop = Math.max(0, Math.min(maxY, newTop));
    
    const percentX = (newLeft / wrapperWidth) * 100;
    const percentY = (newTop / wrapperHeight) * 100;
    
    cropBox.style.left = `${percentX}%`;
    cropBox.style.top = `${percentY}%`;
    cropBox.style.transform = 'translate(0, 0)';
}

// ===== FUNÇÃO PARA REDIMENSIONAR O BOX =====
function resizeCropBox(clientX, clientY) {
    if (!cropBox || !resizeHandle) return;
    
    const wrapperRect = cropWrapper.getBoundingClientRect();
    const wrapperSize = Math.min(wrapperRect.width, wrapperRect.height);
    
    let delta = 0;
    
    // Calcula o delta baseado na direção
    switch(resizeHandle) {
        case 'tl':
        case 'tr':
            delta = (resizeStartY - clientY) / wrapperSize * 100;
            break;
        case 'bl':
        case 'br':
            delta = (clientY - resizeStartY) / wrapperSize * 100;
            break;
        case 'top':
            delta = (resizeStartY - clientY) / wrapperSize * 100;
            break;
        case 'bottom':
            delta = (clientY - resizeStartY) / wrapperSize * 100;
            break;
        case 'left':
            delta = (resizeStartX - clientX) / wrapperSize * 100;
            break;
        case 'right':
            delta = (clientX - resizeStartX) / wrapperSize * 100;
            break;
        default:
            delta = (clientX - resizeStartX) / wrapperSize * 100;
    }
    
    let newSize = resizeStartSize + delta;
    newSize = Math.max(30, Math.min(95, newSize));
    
    cropBoxSize = newSize;
    
    // Atualiza o tamanho
    cropBox.style.width = `${cropBoxSize}%`;
    cropBox.style.height = `${cropBoxSize}%`;
    
    // Atualiza o indicador de tamanho
    const sizeLevel = document.getElementById('sizeLevel');
    if (sizeLevel) {
        sizeLevel.textContent = `${Math.round(cropBoxSize)}%`;
    }
}

// ===== FUNÇÃO PARA COMPRIMIR IMAGEM =====
function compressImage(base64Image, maxWidth = 300, maxHeight = 300, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function() {
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }
            }
            
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            const compressed = canvas.toDataURL('image/jpeg', quality);
            resolve(compressed);
        };
        img.onerror = reject;
        img.src = base64Image;
    });
}

// ===== APLICAR CROP - RECORTE QUADRADO =====
function applyCrop() {
    if (!cropImageElement) return;
    
    const img = cropImageElement;
    const container = img.parentElement;
    const containerRect = container.getBoundingClientRect();
    
    const containerSize = containerRect.width;
    const cropSize = (cropBoxSize / 100) * containerSize;
    
    const cropBoxEl = document.getElementById('cropBox');
    const boxRect = cropBoxEl.getBoundingClientRect();
    const containerRect2 = container.getBoundingClientRect();
    
    const boxX = boxRect.left - containerRect2.left;
    const boxY = boxRect.top - containerRect2.top;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const outputSize = 300;
    canvas.width = outputSize;
    canvas.height = outputSize;
    
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    const naturalWidth = img.naturalWidth || 400;
    const naturalHeight = img.naturalHeight || 400;
    
    const imgRatio = naturalWidth / naturalHeight;
    const containerRatio = 1;
    
    let drawWidth, drawHeight, drawX, drawY;
    if (imgRatio > containerRatio) {
        drawHeight = containerSize;
        drawWidth = containerSize * imgRatio;
        drawX = -(drawWidth - containerSize) / 2;
        drawY = 0;
    } else {
        drawWidth = containerSize;
        drawHeight = containerSize / imgRatio;
        drawX = 0;
        drawY = -(drawHeight - containerSize) / 2;
    }
    
    const scaleX = naturalWidth / drawWidth;
    const scaleY = naturalHeight / drawHeight;
    
    const boxCenterX = boxX + cropSize / 2;
    const boxCenterY = boxY + cropSize / 2;
    const containerCenter = containerSize / 2;
    
    const offsetX = boxCenterX - containerCenter;
    const offsetY = boxCenterY - containerCenter;
    
    const cropX = (-drawX + offsetX + (containerSize - cropSize) / 2) * scaleX;
    const cropY = (-drawY + offsetY + (containerSize - cropSize) / 2) * scaleY;
    const cropW = cropSize * scaleX;
    const cropH = cropSize * scaleY;
    
    // RECORTE QUADRADO - sem máscara circular
    ctx.drawImage(
        img,
        cropX, cropY, cropW, cropH,
        0, 0, outputSize, outputSize
    );
    
    const croppedImage = canvas.toDataURL('image/jpeg', 0.8);
    
    showToast('info', 'Processando', 'Comprimindo imagem...');
    
    compressImage(croppedImage, 150, 150, 0.7)
        .then(compressedImage => {
            saveProfileImage(compressedImage);
        })
        .catch(error => {
            console.error('Erro ao comprimir imagem:', error);
            saveProfileImage(croppedImage);
        });
    
    closeCropModal();
}

// ===== SAVE PROFILE IMAGE =====
async function saveProfileImage(base64Image) {
    const sizeInBytes = base64Image.length * 0.75;
    const sizeInMB = sizeInBytes / (1024 * 1024);
    
    if (sizeInMB > 0.8) {
        showToast('warning', 'Imagem muito grande', 'Tentando comprimir mais...');
        try {
            const compressed = await compressImage(base64Image, 120, 120, 0.5);
            await saveProfileImageToFirestore(compressed);
            return;
        } catch (error) {
            showToast('error', 'Erro', 'Não foi possível comprimir a imagem.');
            return;
        }
    }
    
    await saveProfileImageToFirestore(base64Image);
}

async function saveProfileImageToFirestore(base64Image) {
    try {
        await updateDoc(doc(db, 'usuarios', currentUserData.id), {
            fotoPerfil: base64Image
        });
        
        currentUserData.fotoPerfil = base64Image;
        avatarImage.src = base64Image;
        avatarImage.style.display = 'block';
        avatarInitial.textContent = '';
        
        showToast('success', 'Foto atualizada!', 'Sua foto de perfil foi atualizada.');
    } catch (error) {
        console.error('Erro ao salvar foto:', error);
        if (error.message.includes('size')) {
            showToast('error', 'Erro', 'A imagem é muito grande. Tente uma imagem menor (máx 150KB).');
        } else {
            showToast('error', 'Erro', 'Não foi possível salvar a foto.');
        }
    }
}

// ===== EDIT MODE =====
editProfileBtn.addEventListener('click', function() {
  isEditMode = true;
  originalData = {
    bio: currentUserData.bio || '',
    topMovies: [...(currentUserData.topMovies || [])],
    generos: [...(currentUserData.generos || [])],
    nome: currentUserData.nome || '',
    login: currentUserData.login || ''
  };
  
  tempTopMovies = [...originalData.topMovies];
  tempGenres = [...originalData.generos];
  
  this.classList.add('hidden');
  saveProfileBtn.classList.remove('hidden');
  cancelEditBtn.classList.remove('hidden');
  editAvatarBtn.classList.add('visible');
  
  // Bio
  bioDisplay.style.display = 'none';
  bioEdit.classList.remove('hidden');
  bioInput.value = currentUserData.bio || '';
  bioInput.focus();
  
  // Nome - mostra input
  profileName.style.display = 'none';
  profileNameEdit.classList.remove('hidden');
  profileNameInput.value = currentUserData.nome || '';
  
  // Login - mostra input
  profileLogin.style.display = 'none';
  profileLoginEdit.classList.remove('hidden');
  profileLoginInput.value = currentUserData.login || '';
  
  renderTopMovies(tempTopMovies);
  renderGenres(tempGenres);
});

cancelEditBtn.addEventListener('click', function() {
  isEditMode = false;
  
  currentUserData.bio = originalData.bio;
  currentUserData.topMovies = originalData.topMovies;
  currentUserData.generos = originalData.generos;
  currentUserData.nome = originalData.nome;
  currentUserData.login = originalData.login;
  tempTopMovies = [...originalData.topMovies];
  tempGenres = [...originalData.generos];
  
  // Bio
  bioDisplay.style.display = 'block';
  bioEdit.classList.add('hidden');
  
  // Nome
  profileName.style.display = 'block';
  profileNameEdit.classList.add('hidden');
  profileName.textContent = originalData.nome;
  
  // Login
  profileLogin.style.display = 'block';
  profileLoginEdit.classList.add('hidden');
  profileLogin.textContent = `@${originalData.login}`;
  
  renderTopMovies(currentUserData.topMovies);
  renderGenres(currentUserData.generos);
  
  editProfileBtn.classList.remove('hidden');
  saveProfileBtn.classList.add('hidden');
  this.classList.add('hidden');
  editAvatarBtn.classList.remove('visible');
  
  showToast('info', 'Cancelado', 'As alterações foram descartadas.');
});

saveProfileBtn.addEventListener('click', async function() {
  const newBio = bioInput.value.trim();
  const newNome = profileNameInput.value.trim();
  const newLogin = profileLoginInput.value.trim().toLowerCase();
  const newGenres = genresInput.value.split(',').map(g => g.trim()).filter(g => g).slice(0, 3);
  
  // Validações
  if (!newNome) {
    showToast('warning', 'Nome vazio', 'Por favor, insira um nome.');
    profileNameInput.focus();
    return;
  }
  
  if (!newLogin) {
    showToast('warning', 'Login vazio', 'Por favor, insira um login.');
    profileLoginInput.focus();
    return;
  }
  
  // Verifica se o login mudou e se já existe
  if (newLogin !== originalData.login) {
    const loginExists = await checkLoginExists(newLogin);
    if (loginExists) {
      showToast('warning', 'Login indisponível', `O login "${newLogin}" já está em uso. Escolha outro.`);
      profileLoginInput.focus();
      profileLoginInput.select();
      return;
    }
  }
  
  this.disabled = true;
  this.textContent = 'Salvando...';
  
  try {
    // Atualiza o documento com o novo ID se o login mudou
    if (newLogin !== originalData.login) {
      // Cria novo documento com o novo login
      const newDocRef = doc(db, 'usuarios', newLogin);
      await setDoc(newDocRef, {
        uid: currentUserData.uid,
        nome: newNome,
        email: currentUserData.email,
        login: newLogin,
        bio: newBio,
        topMovies: tempTopMovies,
        generos: newGenres,
        fotoPerfil: currentUserData.fotoPerfil || '',
        updatedAt: serverTimestamp()
      });
      
      // Remove o documento antigo
      const oldDocRef = doc(db, 'usuarios', originalData.login);
      await deleteDoc(oldDocRef);
      
      // Atualiza os dados locais
      currentUserData.id = newLogin;
      currentUserData.login = newLogin;
      currentUserData.nome = newNome;
    } else {
      // Atualiza o documento existente
      await updateDoc(doc(db, 'usuarios', currentUserData.id), {
        nome: newNome,
        bio: newBio,
        topMovies: tempTopMovies,
        generos: newGenres,
        updatedAt: serverTimestamp()
      });
    }
    
    currentUserData.bio = newBio;
    currentUserData.topMovies = tempTopMovies;
    currentUserData.generos = newGenres;
    currentUserData.nome = newNome;
    currentUserData.login = newLogin;
    
    isEditMode = false;
    
    // Bio
    bioDisplay.style.display = 'block';
    bioEdit.classList.add('hidden');
    bioText.textContent = newBio || 'Nenhuma bio adicionada ainda.';
    
    // Nome
    profileName.style.display = 'block';
    profileNameEdit.classList.add('hidden');
    profileName.textContent = newNome;
    
    // Login
    profileLogin.style.display = 'block';
    profileLoginEdit.classList.add('hidden');
    profileLogin.textContent = `@${newLogin}`;
    
    renderTopMovies(tempTopMovies);
    renderGenres(newGenres);
    
    editProfileBtn.classList.remove('hidden');
    this.classList.add('hidden');
    cancelEditBtn.classList.add('hidden');
    editAvatarBtn.classList.remove('visible');
    
    showToast('success', 'Perfil atualizado!', 'Suas alterações foram salvas com sucesso.');
    
  } catch (error) {
    console.error('Erro ao salvar perfil:', error);
    showToast('error', 'Erro', 'Não foi possível salvar as alterações.');
  } finally {
    this.disabled = false;
    this.textContent = 'Salvar';
    this.classList.remove('hidden');
  }
});

// ===== EDIT AVATAR =====
editAvatarBtn.addEventListener('click', () => {
  avatarInput.click();
});

avatarInput.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  if (file.size > 2 * 1024 * 1024) {
    showToast('warning', 'Imagem muito grande', 'Use imagens de até 2MB.');
    this.value = '';
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(event) {
    const imageSrc = event.target.result;
    openCropModal(imageSrc);
    avatarInput.value = '';
  };
  reader.readAsDataURL(file);
});

// ===== EASTER EGG - SMURFS =====
const mushroomBtn = document.getElementById('mushroomBtn');

// Emojis de apoio (cogumelo, arco-íris, árvores, brilhos)
const supportEmojis = ['🍄', '🌈', '🌳', '🌲', '🌴', '✨', '⭐', '🌟', '💫', '🌸', '🌺'];

// Nomes dos arquivos das imagens dos Smurfs
const smurfImages = [
    '1.png',
    '2.png', 
    '3.png',
    '4.png',
    '5.png'
];

// Array para armazenar os Smurfs
let activeSmurfs = [];
let smurfTimeout = null;
let rainInterval = null;
let isRaining = false;

// Função para criar um Smurf
function createSmurf() {
    const smurf = document.createElement('div');
    smurf.className = 'smurf';
    
    // Decida se vai ser um Smurf (imagem) ou um emoji de apoio
    const isSmurf = Math.random() < 0.6; // 60% de chance de ser Smurf
    
    if (isSmurf) {
        // Tenta usar imagem do Smurf
        const imgIndex = Math.floor(Math.random() * smurfImages.length);
        const imgName = smurfImages[imgIndex];
        const imgPath = `assets/${imgName}`;
        
        const img = document.createElement('img');
        img.src = imgPath;
        img.style.width = '50px';
        img.style.height = '50px';
        img.style.objectFit = 'contain';
        img.style.display = 'block';
        img.style.pointerEvents = 'none';
        img.alt = 'Smurf';
        
        // Se a imagem falhar, usa emoji de cogumelo como fallback
        img.onerror = function() {
            smurf.textContent = '🍄';
            smurf.style.fontSize = (35 + Math.random() * 25) + 'px';
            smurf.style.display = 'flex';
            smurf.style.alignItems = 'center';
            smurf.style.justifyContent = 'center';
        };
        
        smurf.appendChild(img);
    } else {
        // Usa emoji de apoio
        const emoji = supportEmojis[Math.floor(Math.random() * supportEmojis.length)];
        smurf.textContent = emoji;
        smurf.style.display = 'flex';
        smurf.style.alignItems = 'center';
        smurf.style.justifyContent = 'center';
    }
    
    // Posição horizontal aleatória
    const maxX = window.innerWidth - 80;
    const x = 20 + Math.random() * maxX;
    smurf.style.left = x + 'px';
    
    // Tamanho aleatório
    const size = 35 + Math.random() * 35;
    if (!smurf.querySelector('img')) {
        smurf.style.fontSize = size + 'px';
        smurf.style.width = size + 'px';
        smurf.style.height = size + 'px';
    } else {
        smurf.style.width = '50px';
        smurf.style.height = '50px';
    }
    
    // Duração aleatória da animação (2.5 a 4.5 segundos)
    const duration = 2.5 + Math.random() * 2;
    smurf.style.animationDuration = duration + 's';
    
    // Delay aleatório (0 a 0.5 segundos)
    const delay = Math.random() * 0.5;
    smurf.style.animationDelay = delay + 's';
    
    // Rotação inicial aleatória
    const rotation = Math.random() * 360;
    smurf.style.transform = `rotate(${rotation}deg)`;
    
    // Adiciona ao body
    document.body.appendChild(smurf);
    activeSmurfs.push(smurf);
    
    // Remove o Smurf após a animação + delay + margem
    const totalTime = (duration + delay) * 1000 + 300;
    setTimeout(() => {
        if (smurf.parentNode) {
            smurf.remove();
        }
        activeSmurfs = activeSmurfs.filter(s => s !== smurf);
    }, totalTime);
    
    return smurf;
}

// Função para criar uma chuva de Smurfs
function startSmurfRain() {
    // Se já está chovendo, não faz nada
    if (isRaining) return;
    
    // Limpa Smurfs anteriores (apenas os que estão no ar, não os que já terminaram)
    clearSmurfs();
    
    isRaining = true;
    
    // Duração da chuva: entre 3 e 5 segundos
    const duration = 3000 + Math.random() * 2000;
    
    // Quantidade de itens: entre 40 e 70
    const totalItems = 40 + Math.floor(Math.random() * 30);
    
    console.log(`🌧️ Chuva de Smurfs! ${totalItems} itens durante ${(duration/1000).toFixed(1)}s`);
    
    // Mostra um toast de aviso
    showToast('info', '🍄 Surpresa!', `${totalItems} Smurfs estão caindo!`);
    
    // Cria itens em intervalos
    let count = 0;
    const intervalTime = Math.max(40, 80 - Math.random() * 30);
    
    rainInterval = setInterval(() => {
        if (count >= totalItems) {
            clearInterval(rainInterval);
            rainInterval = null;
            return;
        }
        createSmurf();
        count++;
    }, intervalTime);
    
    // Para a chuva após a duração (não remove os Smurfs existentes)
    smurfTimeout = setTimeout(() => {
        if (rainInterval) {
            clearInterval(rainInterval);
            rainInterval = null;
        }
        isRaining = false;
        console.log(`🌈 Chuva de Smurfs terminou! ${activeSmurfs.length} Smurfs ainda caindo...`);
        showToast('info', '🌈 Fim!', 'A chuva de Smurfs acabou!');
        
        // Não remove os Smurfs ativos - eles vão terminar a animação naturalmente
        // E serão removidos pelos seus próprios timeouts
    }, duration);
}

// Função para limpar todos os Smurfs (força a remoção)
function clearSmurfs() {
    // Remove todos os Smurfs ativos imediatamente
    activeSmurfs.forEach(smurf => {
        if (smurf.parentNode) {
            smurf.remove();
        }
    });
    activeSmurfs = [];
    
    // Limpa os intervalos e timeouts
    if (rainInterval) {
        clearInterval(rainInterval);
        rainInterval = null;
    }
    if (smurfTimeout) {
        clearTimeout(smurfTimeout);
        smurfTimeout = null;
    }
    isRaining = false;
}

// Função para criar efeito de explosão inicial
function createInitialExplosion() {
    const count = 15 + Math.floor(Math.random() * 10);
    for (let i = 0; i < count; i++) {
        setTimeout(() => createSmurf(), i * 50);
    }
}

// Evento do cogumelo
if (mushroomBtn) {
    mushroomBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // Se já está chovendo, não faz nada
        if (isRaining) {
            showToast('info', '🍄 Já está chovendo!', 'Espere a chuva passar...');
            return;
        }
        
        // Feedback visual do clique
        this.style.transform = 'scale(0.7)';
        this.style.animation = 'none';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
            this.style.animation = 'mushroomPulse 2s ease-in-out infinite';
        }, 200);
        
        // Efeito de explosão inicial
        createInitialExplosion();
        
        // Inicia a chuva de Smurfs
        setTimeout(() => {
            startSmurfRain();
        }, 400);
    });
}

// Limpa os Smurfs quando a página for fechada
window.addEventListener('beforeunload', clearSmurfs);
window.addEventListener('unload', clearSmurfs);

console.log('🍄 Easter Egg do Cogumelo carregado!');

// ===== EVENTOS DO CROP =====
document.getElementById('confirmCropBtn').addEventListener('click', applyCrop);
document.getElementById('cancelCropBtn').addEventListener('click', closeCropModal);
document.getElementById('closeCropModal').addEventListener('click', closeCropModal);

document.getElementById('cropModal').addEventListener('click', function(e) {
  if (e.target === this) {
    closeCropModal();
  }
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && isCropping) {
    closeCropModal();
  }
});

// ===== INIT =====
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    await loadProfile();
  } else {
    window.location.href = 'index.html';
  }
});

console.log('Cine Clube Xiquete - Perfil carregado!');