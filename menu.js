import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  addDoc,
  orderBy,
  limit,
  serverTimestamp,
  arrayUnion,
  arrayRemove
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
const userAvatar = document.getElementById('userAvatar');
const avatarInitial = document.getElementById('avatarInitial');
const userName = document.getElementById('userName');
const userLogin = document.getElementById('userLogin');
const userProfile = document.getElementById('userProfile');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const featuredMovie = document.getElementById('featuredMovie');
const reviewsList = document.getElementById('reviewsList');
const notificationBtn = document.getElementById('notificationBtn');
const notificationBadge = document.getElementById('notificationBadge');
const notificationModal = document.getElementById('notificationModal');
const notificationsList = document.getElementById('notificationsList');
const closeNotifications = document.getElementById('closeNotifications');

// Admin elements
const adminBtn = document.getElementById('adminBtn');
const adminFeaturedBtn = document.getElementById('adminFeaturedBtn');
const adminModal = document.getElementById('adminModal');
const closeAdminModal = document.getElementById('closeAdminModal');
const adminSearchInput = document.getElementById('adminSearchInput');
const adminSearchResults = document.getElementById('adminSearchResults');
const adminSelectedMovie = document.getElementById('adminSelectedMovie');
const adminSelectedPoster = document.getElementById('adminSelectedPoster');
const adminSelectedTitle = document.getElementById('adminSelectedTitle');
const adminSelectedYear = document.getElementById('adminSelectedYear');
const adminCurrentMovie = document.getElementById('adminCurrentMovie');

// Admin form elements
const adminMoviePoster = document.getElementById('adminMoviePoster');
const adminMovieNome = document.getElementById('adminMovieNome');
const adminMovieAno = document.getElementById('adminMovieAno');
const adminMovieGenero = document.getElementById('adminMovieGenero');
const adminMovieDiretor = document.getElementById('adminMovieDiretor');
const adminMovieSinopse = document.getElementById('adminMovieSinopse');

let currentUser = null;
let currentUserData = null;
let allMovies = [];
let allReviews = [];
let unreadCount = 0;
let selectedMovieForAdmin = null;
let isAdmin = false;
let currentAdminTab = 'existing';
let posterBase64 = null;

// ===== TOAST NOTIFICATIONS =====
function showToast(type, title, message, duration = 4000) {
  const container = document.getElementById('notification-container');
  if (!container) return;
  
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

// ===== CHECK ADMIN =====
function checkAdmin(user) {
  if (user && user.email === 'contato.lucadesousa@gmail.com') {
    isAdmin = true;
    adminBtn.classList.remove('hidden');
    adminFeaturedBtn.classList.remove('hidden');
  } else {
    isAdmin = false;
    adminBtn.classList.add('hidden');
    adminFeaturedBtn.classList.add('hidden');
  }
}

// ===== LOAD USER DATA =====
async function loadUserData(user) {
  try {
    const usuariosRef = collection(db, 'usuarios');
    const q = query(usuariosRef, where('uid', '==', user.uid));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      currentUserData = { id: doc.id, ...doc.data() };
      
      const nome = currentUserData.nome || user.displayName || 'Usuário';
      const login = currentUserData.login || 'usuario';
      
      userName.textContent = nome;
      userLogin.textContent = `@${login}`;
      
      const initial = nome.charAt(0).toUpperCase();
      avatarInitial.textContent = initial;
      
      if (currentUserData.fotoPerfil) {
        const img = document.createElement('img');
        img.src = currentUserData.fotoPerfil;
        avatarInitial.textContent = '';
        userAvatar.appendChild(img);
      }
    }
  } catch (error) {
    console.error('Erro ao carregar dados do usuário:', error);
  }
}

// ===== LOAD MOVIES =====
async function loadMovies() {
  try {
    const moviesRef = collection(db, 'filmes');
    const q = query(moviesRef, orderBy('nome'));
    const querySnapshot = await getDocs(q);
    
    allMovies = [];
    querySnapshot.forEach((doc) => {
      allMovies.push({ id: doc.id, ...doc.data() });
    });
  } catch (error) {
    console.error('Erro ao carregar filmes:', error);
  }
}

// ===== LOAD FEATURED MOVIE =====
async function loadFeaturedMovie() {
  try {
    const configDoc = await getDoc(doc(db, 'config', 'featured'));
    
    let featuredId = null;
    if (configDoc.exists()) {
      featuredId = configDoc.data().movieId;
    }
    
    if (featuredId) {
      const movieDoc = await getDoc(doc(db, 'filmes', featuredId));
      if (movieDoc.exists()) {
        const movie = { id: movieDoc.id, ...movieDoc.data() };
        displayFeaturedMovie(movie);
        return;
      }
    }
    
    if (allMovies.length > 0) {
      displayFeaturedMovie(allMovies[0]);
    } else {
      featuredMovie.innerHTML = '<div class="featured-loading">Nenhum filme disponível</div>';
    }
  } catch (error) {
    console.error('Erro ao carregar filme da semana:', error);
    featuredMovie.innerHTML = '<div class="featured-loading">Erro ao carregar filme da semana</div>';
  }
}

function displayFeaturedMovie(movie) {
  const rating = movie.avaliacoes || 0;
  const ratingCount = movie.totalAvaliacoes || 0;
  
  // Sistema de estrelas com meias estrelas
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5 && rating % 1 < 1;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  let starsHtml = '';
  for (let i = 0; i < fullStars; i++) {
    starsHtml += '★';
  }
  if (hasHalfStar) {
    starsHtml += '★'; // Meia estrela
  }
  for (let i = 0; i < emptyStars; i++) {
    starsHtml += '☆';
  }
  
  featuredMovie.innerHTML = `
    <div class="featured-poster" onclick="window.location.href='filme.html?id=${movie.id}'">
      ${movie.poster ? `<img src="${movie.poster}" alt="${movie.nome}">` : 
        `<div class="no-poster">${movie.nome}</div>`}
      <div class="featured-badge">Destaque</div>
    </div>
    <div class="featured-info">
      <div class="featured-title">${movie.nome}</div>
      <div class="featured-meta">${movie.ano || ''} ${movie.genero ? `• ${movie.genero}` : ''}</div>
      ${rating > 0 ? `
        <div class="featured-rating">
          <span class="stars ${hasHalfStar ? 'has-half' : ''}">${starsHtml}</span>
          <span class="rating-value">${rating.toFixed(1)}</span>
          <span class="rating-count">(${ratingCount} avaliações)</span>
        </div>
      ` : `
        <div class="featured-rating">
          <span style="color:#666;font-size:0.85rem;">Ainda sem avaliações</span>
        </div>
      `}
    </div>
  `;
}

// ===== LOAD REVIEWS =====
function loadReviews() {
  try {
    const reviewsRef = collection(db, 'avaliacoes');
    const q = query(reviewsRef, orderBy('createdAt', 'desc'), limit(20));
    
    onSnapshot(q, (snapshot) => {
      allReviews = [];
      snapshot.forEach((doc) => {
        allReviews.push({ id: doc.id, ...doc.data() });
      });
      displayReviews(allReviews);
    }, (error) => {
      console.error('Erro no snapshot de avaliações:', error);
      reviewsList.innerHTML = '<div class="loading-reviews">Erro ao carregar avaliações</div>';
    });
  } catch (error) {
    console.error('Erro ao carregar avaliações:', error);
    reviewsList.innerHTML = '<div class="loading-reviews">Erro ao carregar avaliações</div>';
  }
}

function displayReviews(reviews) {
  if (reviews.length === 0) {
    reviewsList.innerHTML = '<div class="loading-reviews">Nenhuma avaliação ainda</div>';
    return;
  }
  
  let html = '';
  reviews.forEach((review) => {
    // Usar a mesma lógica de estrelas do filme
    const rating = review.nota || 0;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5 && rating % 1 < 1;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHtml = '';
    for (let i = 0; i < fullStars; i++) {
      starsHtml += '★';
    }
    if (hasHalfStar) {
      starsHtml += '★'; // Meia estrela (será estilizada com CSS)
    }
    for (let i = 0; i < emptyStars; i++) {
      starsHtml += '☆';
    }
    
    const userNome = review.nomeUsuario || review.usuario || 'Usuário';
    const userLogin = review.loginUsuario || 'usuario';
    const initial = userNome.charAt(0).toUpperCase();
    
    html += `
      <div class="review-item" data-review-id="${review.id}">
        <div class="review-header" onclick="window.location.href='perfil.html?uid=${review.uid}'">
          <div class="review-avatar">${initial}</div>
          <div class="review-user">
            <div class="review-username">${userNome}</div>
            <div class="review-userlogin">@${userLogin}</div>
          </div>
        </div>
        <div class="review-movie" onclick="window.location.href='filme.html?id=${review.filmeId}'">
          Filme: <strong>${review.nomeFilme || 'Filme'}</strong>
        </div>
        <div class="review-stars ${hasHalfStar ? 'has-half' : ''}">${starsHtml}</div>
        ${review.comentario ? `<div class="review-text">${review.comentario}</div>` : ''}
        <div class="review-actions">
          <button class="review-action-btn like-btn" data-review-id="${review.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
              <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
            </svg>
            <span>${review.curtidas || 0}</span>
          </button>
        </div>
      </div>
    `;
  });
  
  reviewsList.innerHTML = html;
  
  document.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', handleLike);
  });
}

// ===== HANDLE LIKE =====
async function handleLike(e) {
  e.stopPropagation();
  const btn = e.currentTarget;
  const reviewId = btn.dataset.reviewId;
  
  if (!currentUser) {
    showToast('warning', 'Atenção', 'Faça login para curtir avaliações.');
    return;
  }
  
  try {
    const reviewRef = doc(db, 'avaliacoes', reviewId);
    const reviewDoc = await getDoc(reviewRef);
    
    if (!reviewDoc.exists()) return;
    
    const reviewData = reviewDoc.data();
    const curtidas = reviewData.curtidas || 0;
    const usuariosCurtiram = reviewData.usuariosCurtiram || [];
    
    const userUid = currentUser.uid;
    const hasLiked = usuariosCurtiram.includes(userUid);
    
    if (hasLiked) {
      await updateDoc(reviewRef, {
        curtidas: curtidas - 1,
        usuariosCurtiram: arrayRemove(userUid)
      });
      btn.classList.remove('liked');
      showToast('info', 'Curtida removida', 'Você removeu sua curtida.');
    } else {
      await updateDoc(reviewRef, {
        curtidas: curtidas + 1,
        usuariosCurtiram: arrayUnion(userUid)
      });
      btn.classList.add('liked');
      showToast('success', 'Curtida adicionada', 'Você curtiu esta avaliação!');
      
      if (reviewData.uid !== userUid) {
        await createNotification({
          tipo: 'curtida',
          mensagem: `${currentUserData?.nome || 'Alguém'} curtiu sua avaliação de "${reviewData.nomeFilme}"`,
          usuarioOrigem: userUid,
          usuarioDestino: reviewData.uid,
          reviewId: reviewId,
          filmeId: reviewData.filmeId,
          data: new Date().toISOString()
        });
      }
    }
    
    const countSpan = btn.querySelector('span');
    const currentCount = parseInt(countSpan.textContent);
    countSpan.textContent = hasLiked ? currentCount - 1 : currentCount + 1;
    
  } catch (error) {
    console.error('Erro ao curtir:', error);
    showToast('error', 'Erro', 'Não foi possível curtir a avaliação.');
  }
}

// ===== SEARCH MOVIES =====
searchInput.addEventListener('input', function() {
  const query = this.value.toLowerCase().trim();
  
  if (query.length < 2) {
    searchResults.classList.add('hidden');
    return;
  }
  
  const results = allMovies.filter(movie => 
    movie.nome.toLowerCase().includes(query)
  );
  
  if (results.length === 0) {
    searchResults.innerHTML = `
      <div class="search-result-item" style="color:#666;justify-content:center;padding:20px;">
        Nenhum filme encontrado
      </div>
    `;
    searchResults.classList.remove('hidden');
    return;
  }
  
  let html = '';
  results.slice(0, 10).forEach(movie => {
    html += `
      <div class="search-result-item" data-movie-id="${movie.id}" onclick="window.location.href='filme.html?id=${movie.id}'">
        <div class="search-result-poster">
          ${movie.poster ? `<img src="${movie.poster}" alt="${movie.nome}">` : 
            `<div class="no-poster">${movie.nome}</div>`}
        </div>
        <div>
          <div class="search-result-title">${movie.nome}</div>
          <div class="search-result-year">${movie.ano || ''}</div>
        </div>
      </div>
    `;
  });
  
  searchResults.innerHTML = html;
  searchResults.classList.remove('hidden');
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-container')) {
    searchResults.classList.add('hidden');
  }
});

// ===== NOTIFICATIONS =====
async function createNotification(data) {
  try {
    await addDoc(collection(db, 'notificacoes'), {
      ...data,
      lidaPor: [],
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
  }
}

function loadNotifications() {
  if (!currentUser) return;
  
  const userUid = currentUser.uid;
  const notificationsRef = collection(db, 'notificacoes');
  
  const q = query(
    notificationsRef,
    where('usuarioDestino', '==', userUid),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  
  onSnapshot(q, (snapshot) => {
    const notifications = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const isRead = data.lidaPor && data.lidaPor.includes(userUid);
      notifications.push({ id: doc.id, ...data, isRead });
    });
    
    unreadCount = notifications.filter(n => !n.isRead).length;
    updateBadge(unreadCount);
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, (error) => {
    console.error('Erro no snapshot de notificações:', error);
    if (error.code === 'failed-precondition') {
      console.log('⚠️ Índice necessário para notificações. Crie no Firebase Console.');
      const fallbackQuery = query(
        notificationsRef,
        where('usuarioDestino', '==', userUid),
        limit(50)
      );
      
      onSnapshot(fallbackQuery, (snapshot) => {
        const notifications = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          const isRead = data.lidaPor && data.lidaPor.includes(userUid);
          notifications.push({ id: doc.id, ...data, isRead });
        });
        
        notifications.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return dateB - dateA;
        });
        
        unreadCount = notifications.filter(n => !n.isRead).length;
        updateBadge(unreadCount);
        localStorage.setItem('notifications', JSON.stringify(notifications));
      });
    }
  });
}

function updateBadge(count) {
  if (count > 0) {
    notificationBadge.textContent = count > 99 ? '99+' : count;
    notificationBadge.classList.remove('hidden');
  } else {
    notificationBadge.classList.add('hidden');
  }
}

function openNotifications() {
  notificationModal.classList.remove('hidden');
  renderNotifications();
  
  if (currentUser && unreadCount > 0) {
    markNotificationsAsRead();
  }
}

function renderNotifications() {
  const stored = localStorage.getItem('notifications');
  if (!stored) {
    notificationsList.innerHTML = '<div class="no-notifications">Nenhuma notificação</div>';
    return;
  }
  
  const notifications = JSON.parse(stored);
  
  if (notifications.length === 0) {
    notificationsList.innerHTML = '<div class="no-notifications">Nenhuma notificação</div>';
    return;
  }
  
  let html = '';
  notifications.slice(0, 20).forEach((notif) => {
    const isUnread = !notif.isRead;
    html += `
      <div class="notification-item ${isUnread ? 'unread' : ''}">
        <div class="icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>
        <div class="content">
          <div class="text">${notif.mensagem}</div>
          <div class="time">${formatTime(notif.data || notif.createdAt)}</div>
        </div>
      </div>
    `;
  });
  
  notificationsList.innerHTML = html;
}

async function markNotificationsAsRead() {
  if (!currentUser) return;
  
  try {
    const userUid = currentUser.uid;
    const notificationsRef = collection(db, 'notificacoes');
    const q = query(
      notificationsRef,
      where('usuarioDestino', '==', userUid)
    );
    
    const snapshot = await getDocs(q);
    
    const batch = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.lidaPor || !data.lidaPor.includes(userUid)) {
        batch.push(updateDoc(doc.ref, {
          lidaPor: arrayUnion(userUid)
        }));
      }
    });
    
    await Promise.all(batch);
    
    unreadCount = 0;
    updateBadge(0);
    
    const stored = localStorage.getItem('notifications');
    if (stored) {
      const notifications = JSON.parse(stored);
      notifications.forEach(n => n.isRead = true);
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
    
  } catch (error) {
    console.error('Erro ao marcar notificações como lidas:', error);
  }
}

function formatTime(timestamp) {
  if (!timestamp) return 'agora';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000 / 60);
  
  if (diff < 1) return 'agora';
  if (diff < 60) return `${diff}m atrás`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h atrás`;
  if (diff < 43200) return `${Math.floor(diff / 1440)}d atrás`;
  return date.toLocaleDateString('pt-BR');
}

// ===== ADMIN: UPLOAD POSTER =====
adminMoviePoster.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  // Verificar tamanho da imagem (máximo 500KB para evitar problemas)
  if (file.size > 500 * 1024) {
    showToast('warning', 'Imagem muito grande', 'Use imagens de até 500KB para melhor performance.');
    this.value = '';
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(event) {
    posterBase64 = event.target.result;
    const preview = document.getElementById('adminMoviePosterPreview');
    preview.innerHTML = `<img src="${posterBase64}" alt="Preview">`;
    preview.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
});

// ===== ADMIN TABS =====
document.querySelectorAll('.admin-tab').forEach(tab => {
  tab.addEventListener('click', function() {
    const tabName = this.dataset.tab;
    
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
    
    this.classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
    
    currentAdminTab = tabName;
    
    if (tabName === 'new') {
      document.getElementById('adminNewMovieForm').reset();
      document.getElementById('adminMoviePosterPreview').classList.add('hidden');
      posterBase64 = null;
    }
  });
});

// ===== ADMIN: CREATE NEW MOVIE (SALVANDO BASE64 DIRETO NO FIRESTORE) =====
document.getElementById('adminNewMovieForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const nome = adminMovieNome.value.trim();
  const ano = adminMovieAno.value.trim();
  const genero = adminMovieGenero.value.trim();
  const diretor = adminMovieDiretor.value.trim();
  const sinopse = adminMovieSinopse.value.trim();
  
  if (!nome || !ano || !genero) {
    showToast('warning', 'Campos obrigatórios', 'Preencha Nome, Ano e Gênero.');
    return;
  }
  
  const submitBtn = this.querySelector('.admin-create-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Criando...';
  
  try {
    // Salvar a imagem em base64 diretamente no Firestore
    const movieData = {
      nome: nome,
      ano: ano,
      genero: genero,
      diretor: diretor || '',
      sinopse: sinopse || '',
      poster: posterBase64 || '', // Salva o base64 diretamente no documento
      avaliacoes: 0,
      totalAvaliacoes: 0,
      createdAt: serverTimestamp(),
      createdBy: currentUser?.uid || 'admin'
    };
    
    const docRef = await addDoc(collection(db, 'filmes'), movieData);
    const newMovie = { id: docRef.id, ...movieData };
    
    allMovies.push(newMovie);
    
    await setDoc(doc(db, 'config', 'featured'), {
      movieId: docRef.id,
      updatedAt: serverTimestamp(),
      updatedBy: currentUser?.uid || 'admin'
    });
    
    showToast('success', 'Filme criado!', `${nome} foi adicionado e definido como filme da semana.`);
    
    closeAdminModalFunc();
    await loadFeaturedMovie();
    await loadMovies();
    
  } catch (error) {
    console.error('Erro ao criar filme:', error);
    showToast('error', 'Erro', 'Não foi possível criar o filme. Tente novamente.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Criar Filme e Definir como da Semana';
  }
});

// ===== ADMIN: ADICIONAR FILME (SEM SER DA SEMANA) =====
document.getElementById('adminAddOnlyForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const nome = document.getElementById('adminAddNome').value.trim();
  const ano = document.getElementById('adminAddAno').value.trim();
  const genero = document.getElementById('adminAddGenero').value.trim();
  const diretor = document.getElementById('adminAddDiretor').value.trim();
  const sinopse = document.getElementById('adminAddSinopse').value.trim();
  
  // Pegar a imagem se houver
  const posterInput = document.getElementById('adminAddPoster');
  let posterBase64Local = null;
  
  if (posterInput.files && posterInput.files[0]) {
    const file = posterInput.files[0];
    if (file.size > 500 * 1024) {
      showToast('warning', 'Imagem muito grande', 'Use imagens de até 500KB.');
      return;
    }
    const reader = new FileReader();
    const fileData = await new Promise((resolve) => {
      reader.onload = function(event) {
        resolve(event.target.result);
      };
      reader.readAsDataURL(file);
    });
    posterBase64Local = fileData;
  }
  
  if (!nome || !ano || !genero) {
    showToast('warning', 'Campos obrigatórios', 'Preencha Nome, Ano e Gênero.');
    return;
  }
  
  const submitBtn = this.querySelector('.admin-add-only-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Adicionando...';
  
  try {
    const movieData = {
      nome: nome,
      ano: ano,
      genero: genero,
      diretor: diretor || '',
      sinopse: sinopse || '',
      poster: posterBase64Local || '',
      avaliacoes: 0,
      totalAvaliacoes: 0,
      createdAt: serverTimestamp(),
      createdBy: currentUser?.uid || 'admin'
    };
    
    const docRef = await addDoc(collection(db, 'filmes'), movieData);
    const newMovie = { id: docRef.id, ...movieData };
    
    allMovies.push(newMovie);
    
    // Resetar formulário
    this.reset();
    document.getElementById('adminAddPosterPreview').classList.add('hidden');
    
    showToast('success', 'Filme adicionado!', `${nome} foi adicionado ao catálogo.`);
    await loadMovies();
    
  } catch (error) {
    console.error('Erro ao adicionar filme:', error);
    showToast('error', 'Erro', 'Não foi possível adicionar o filme.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Adicionar Filme';
  }
});

// ===== ADMIN: UPLOAD POSTER PARA A ABA "ADICIONAR FILME" =====
document.getElementById('adminAddPoster').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  if (file.size > 500 * 1024) {
    showToast('warning', 'Imagem muito grande', 'Use imagens de até 500KB para melhor performance.');
    this.value = '';
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(event) {
    const preview = document.getElementById('adminAddPosterPreview');
    preview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
    preview.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
});

// ===== ADMIN: OPEN MODAL =====
function openAdminModal() {
  if (!isAdmin) {
    showToast('warning', 'Acesso negado', 'Apenas administradores podem acessar esta função.');
    return;
  }
  adminModal.classList.remove('hidden');
  loadAdminCurrentFeatured();
  adminSearchInput.value = '';
  adminSearchResults.classList.add('hidden');
  adminSelectedMovie.classList.add('hidden');
  selectedMovieForAdmin = null;
  adminSearchInput.focus();
  
  document.getElementById('adminNewMovieForm').reset();
  document.getElementById('adminMoviePosterPreview').classList.add('hidden');
  posterBase64 = null;
  
  const existingTab = document.getElementById('tab-existing');
  const oldBtn = existingTab.querySelector('.admin-confirm-btn');
  if (oldBtn) oldBtn.remove();
}

function closeAdminModalFunc() {
  adminModal.classList.add('hidden');
}

// ===== ADMIN: LOAD CURRENT FEATURED =====
async function loadAdminCurrentFeatured() {
  try {
    const configDoc = await getDoc(doc(db, 'config', 'featured'));
    if (configDoc.exists()) {
      const movieId = configDoc.data().movieId;
      if (movieId) {
        const movieDoc = await getDoc(doc(db, 'filmes', movieId));
        if (movieDoc.exists()) {
          const movie = movieDoc.data();
          adminCurrentMovie.textContent = `${movie.nome} (${movie.ano || 'ano desconhecido'})`;
          return;
        }
      }
    }
    adminCurrentMovie.textContent = 'Nenhum filme definido';
  } catch (error) {
    console.error('Erro ao carregar filme atual:', error);
    adminCurrentMovie.textContent = 'Erro ao carregar';
  }
}

// ===== ADMIN: SEARCH MOVIES =====
adminSearchInput.addEventListener('input', function() {
  const query = this.value.toLowerCase().trim();
  
  if (query.length < 2) {
    adminSearchResults.classList.add('hidden');
    return;
  }
  
  const results = allMovies.filter(movie => 
    movie.nome.toLowerCase().includes(query)
  );
  
  if (results.length === 0) {
    adminSearchResults.innerHTML = `
      <div class="search-result-item" style="color:#666;justify-content:center;padding:20px;">
        Nenhum filme encontrado
      </div>
    `;
    adminSearchResults.classList.remove('hidden');
    return;
  }
  
  let html = '';
  results.slice(0, 10).forEach(movie => {
    html += `
      <div class="search-result-item admin-search-item" data-movie-id="${movie.id}">
        <div class="search-result-poster">
          ${movie.poster ? `<img src="${movie.poster}" alt="${movie.nome}">` : 
            `<div class="no-poster">${movie.nome}</div>`}
        </div>
        <div>
          <div class="search-result-title">${movie.nome}</div>
          <div class="search-result-year">${movie.ano || ''}</div>
        </div>
      </div>
    `;
  });
  
  adminSearchResults.innerHTML = html;
  adminSearchResults.classList.remove('hidden');
  
  document.querySelectorAll('.admin-search-item').forEach(item => {
    item.addEventListener('click', function() {
      const movieId = this.dataset.movieId;
      const movie = allMovies.find(m => m.id === movieId);
      if (movie) {
        selectMovieForAdmin(movie);
      }
    });
  });
});

function selectMovieForAdmin(movie) {
  selectedMovieForAdmin = movie;
  adminSelectedMovie.classList.remove('hidden');
  adminSelectedTitle.textContent = movie.nome;
  adminSelectedYear.textContent = movie.ano || '';
  
  if (movie.poster) {
    adminSelectedPoster.innerHTML = `<img src="${movie.poster}" alt="${movie.nome}">`;
  } else {
    adminSelectedPoster.innerHTML = `<div class="no-poster">${movie.nome}</div>`;
  }
  
  adminSearchResults.classList.add('hidden');
  adminSearchInput.value = '';
  
  const existingTab = document.getElementById('tab-existing');
  let confirmBtn = existingTab.querySelector('.admin-confirm-btn');
  
  if (!confirmBtn) {
    confirmBtn = document.createElement('button');
    confirmBtn.className = 'admin-confirm-btn';
    confirmBtn.textContent = 'Definir como Filme da Semana';
    confirmBtn.id = 'adminConfirmBtn';
    existingTab.appendChild(confirmBtn);
    
    confirmBtn.addEventListener('click', async function() {
      if (!selectedMovieForAdmin) {
        showToast('warning', 'Nenhum filme selecionado', 'Selecione um filme para definir como da semana.');
        return;
      }
      
      this.disabled = true;
      this.textContent = 'Salvando...';
      
      try {
        await setDoc(doc(db, 'config', 'featured'), {
          movieId: selectedMovieForAdmin.id,
          updatedAt: serverTimestamp(),
          updatedBy: currentUser?.uid || 'admin'
        });
        
        showToast('success', 'Filme da semana atualizado!', `${selectedMovieForAdmin.nome} é agora o filme da semana.`);
        closeAdminModalFunc();
        await loadFeaturedMovie();
        
      } catch (error) {
        console.error('Erro ao salvar filme da semana:', error);
        showToast('error', 'Erro', 'Não foi possível salvar o filme da semana.');
      } finally {
        this.disabled = false;
        this.textContent = 'Definir como Filme da Semana';
      }
    });
  }
}

// ===== ADMIN: CREATE MOVIE (função auxiliar para console) =====
async function createMovie(movieData) {
  try {
    const docRef = await addDoc(collection(db, 'filmes'), {
      ...movieData,
      createdAt: serverTimestamp(),
      avaliacoes: 0,
      totalAvaliacoes: 0
    });
    showToast('success', 'Filme adicionado!', `${movieData.nome} foi adicionado ao catálogo.`);
    await loadMovies();
    return docRef.id;
  } catch (error) {
    console.error('Erro ao adicionar filme:', error);
    showToast('error', 'Erro', 'Não foi possível adicionar o filme.');
    return null;
  }
}
window.createMovie = createMovie;

// ===== EVENT LISTENERS =====
userProfile.addEventListener('click', () => {
  window.location.href = 'perfil.html';
});

notificationBtn.addEventListener('click', openNotifications);
closeNotifications.addEventListener('click', () => {
  notificationModal.classList.add('hidden');
});

notificationModal.addEventListener('click', (e) => {
  if (e.target === notificationModal) {
    notificationModal.classList.add('hidden');
  }
});

adminBtn.addEventListener('click', openAdminModal);
adminFeaturedBtn.addEventListener('click', openAdminModal);
closeAdminModal.addEventListener('click', closeAdminModalFunc);

adminModal.addEventListener('click', (e) => {
  if (e.target === adminModal) {
    closeAdminModalFunc();
  }
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.admin-search')) {
    adminSearchResults.classList.add('hidden');
  }
});

// ===== AUTH STATE =====
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    await loadUserData(user);
    checkAdmin(user);
    await loadMovies();
    await loadFeaturedMovie();
    loadReviews();
    loadNotifications();
    
    if (user.email === 'contato.lucadesousa@gmail.com') {
      console.log('Admin logado');
    }
  } else {
    window.location.href = 'index.html';
  }
});

console.log('Cine Clube Xiquete - Menu carregado!');