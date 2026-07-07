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
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  addDoc,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment
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
const movieContent = document.getElementById('movieContent');
const moviePoster = document.getElementById('moviePoster');
const movieTitle = document.getElementById('movieTitle');
const movieYear = document.getElementById('movieYear');
const movieGenre = document.getElementById('movieGenre');
const movieDirector = document.getElementById('movieDirector');
const movieStars = document.getElementById('movieStars');
const movieRatingValue = document.getElementById('movieRatingValue');
const movieRatingCount = document.getElementById('movieRatingCount');
const movieSinopse = document.getElementById('movieSinopse');
const commentsList = document.getElementById('commentsList');

// My Review
const myReviewForm = document.getElementById('myReviewForm');
const myReviewDisplay = document.getElementById('myReviewDisplay');
const myRatingStars = document.getElementById('myRatingStars');
const myRatingLabel = document.getElementById('myRatingLabel');
const myReviewText = document.getElementById('myReviewText');
const submitReviewBtn = document.getElementById('submitReviewBtn');
const deleteReviewBtn = document.getElementById('deleteReviewBtn');
const deleteReviewBtn2 = document.getElementById('deleteReviewBtn2');
const editReviewBtn = document.getElementById('editReviewBtn');
const myReviewStars = document.getElementById('myReviewStars');
const myReviewScore = document.getElementById('myReviewScore');
const myReviewTextDisplay = document.getElementById('myReviewTextDisplay');

let currentUser = null;
let currentUserData = null;
let movieId = null;
let movieData = null;
let userReview = null;
let allComments = [];
let selectedRating = 0;
let isEditing = false;

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

// ===== STAR RATING INPUT =====
function setupStarRating() {
  if (!myRatingStars) return;
  
  const container = myRatingStars;
  container.innerHTML = '';
  container.style.cssText = 'display:flex;gap:2px;';
  
  for (let i = 0; i < 5; i++) {
    const wrapper = document.createElement('div');
    wrapper.className = 'star-wrapper';
    wrapper.style.cssText = 'position:relative;display:inline-block;width:2rem;height:2rem;font-size:2rem;line-height:1;cursor:pointer;';
    wrapper.dataset.starIndex = i;
    
    // Estrela base (vazia) - sempre visível
    const base = document.createElement('span');
    base.className = 'star-base';
    base.textContent = '☆';
    base.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;color:#444;text-align:center;line-height:1;font-size:inherit;z-index:1;pointer-events:none;display:flex;align-items:center;justify-content:center;';
    
    // Meia estrela esquerda pintada (MEE) - aparece quando rating >= i+0.5
    const halfLeft = document.createElement('span');
    halfLeft.className = 'star-half-left';
    halfLeft.textContent = '★';
    halfLeft.style.cssText = 'position:absolute;top:0;left:0;width:50%;height:100%;color:#f5a623;overflow:hidden;z-index:2;pointer-events:none;line-height:1;font-size:inherit;opacity:0;transition:opacity 0.15s;display:flex;align-items:center;justify-content:flex-start;';
    
    // Estrela inteira pintada - aparece quando rating >= i+1
    const fullStar = document.createElement('span');
    fullStar.className = 'star-full';
    fullStar.textContent = '★';
    fullStar.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;color:#f5a623;z-index:3;pointer-events:none;line-height:1;font-size:inherit;opacity:0;transition:opacity 0.15s;display:flex;align-items:center;justify-content:center;';
    
    // Área clicável - metade esquerda
    const clickLeft = document.createElement('div');
    clickLeft.className = 'click-left';
    clickLeft.style.cssText = 'position:absolute;top:0;left:0;width:50%;height:100%;z-index:5;cursor:pointer;';
    clickLeft.dataset.starIndex = i;
    clickLeft.dataset.half = 'left';
    
    // Área clicável - metade direita
    const clickRight = document.createElement('div');
    clickRight.className = 'click-right';
    clickRight.style.cssText = 'position:absolute;top:0;left:50%;width:50%;height:100%;z-index:5;cursor:pointer;';
    clickRight.dataset.starIndex = i;
    clickRight.dataset.half = 'right';
    
    // Evento da metade esquerda
    clickLeft.addEventListener('click', function(e) {
      e.stopPropagation();
      const starIndex = parseInt(this.dataset.starIndex);
      selectedRating = starIndex + 0.5;
      updateStarDisplay(selectedRating);
      if (myRatingLabel) myRatingLabel.textContent = `${selectedRating.toFixed(1)} estrelas`;
    });
    
    // Evento da metade direita
    clickRight.addEventListener('click', function(e) {
      e.stopPropagation();
      const starIndex = parseInt(this.dataset.starIndex);
      selectedRating = starIndex + 1;
      updateStarDisplay(selectedRating);
      if (myRatingLabel) myRatingLabel.textContent = `${selectedRating.toFixed(1)} estrelas`;
    });
    
    // Hover
    const hoverHandler = function(e) {
      const starIndex = parseInt(this.dataset.starIndex);
      const isRight = this.dataset.half === 'right';
      const wrappers = container.querySelectorAll('.star-wrapper');
      
      wrappers.forEach((w, idx) => {
        const half = w.querySelector('.star-half-left');
        const full = w.querySelector('.star-full');
        
        if (idx < starIndex) {
          half.style.opacity = '0';
          full.style.opacity = '1';
        } else if (idx === starIndex) {
          if (isRight) {
            half.style.opacity = '0';
            full.style.opacity = '1';
          } else {
            half.style.opacity = '1';
            full.style.opacity = '0';
          }
        } else {
          half.style.opacity = '0';
          full.style.opacity = '0';
        }
      });
    };
    
    const leaveHandler = function() {
      updateStarDisplay(selectedRating);
    };
    
    clickLeft.addEventListener('mouseenter', hoverHandler);
    clickRight.addEventListener('mouseenter', hoverHandler);
    clickLeft.addEventListener('mouseleave', leaveHandler);
    clickRight.addEventListener('mouseleave', leaveHandler);
    
    wrapper.appendChild(base);
    wrapper.appendChild(halfLeft);
    wrapper.appendChild(fullStar);
    wrapper.appendChild(clickLeft);
    wrapper.appendChild(clickRight);
    container.appendChild(wrapper);
  }
}

function updateStarDisplay(rating) {
  if (!myRatingStars) return;
  const wrappers = myRatingStars.querySelectorAll('.star-wrapper');
  
  wrappers.forEach((wrapper, idx) => {
    const half = wrapper.querySelector('.star-half-left');
    const full = wrapper.querySelector('.star-full');
    
    const starValue = idx + 1;
    const halfValue = idx + 0.5;
    
    if (rating >= starValue) {
      // Estrela inteira - mostra ★ inteiro
      half.style.opacity = '0';
      full.style.opacity = '1';
    } else if (rating >= halfValue && rating < starValue) {
      // Só a metade esquerda pintada
      half.style.opacity = '1';
      full.style.opacity = '0';
    } else {
      // Vazia
      half.style.opacity = '0';
      full.style.opacity = '0';
    }
  });
}

function resetStarDisplay() {
  selectedRating = 0;
  if (!myRatingStars) return;
  const wrappers = myRatingStars.querySelectorAll('.star-wrapper');
  wrappers.forEach(wrapper => {
    const half = wrapper.querySelector('.star-half-left');
    const full = wrapper.querySelector('.star-full');
    half.style.opacity = '0';
    full.style.opacity = '0';
  });
  if (myRatingLabel) myRatingLabel.textContent = 'Selecione uma nota';
}

// ===== GENERATE STARS HTML =====
function generateStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  
  let html = '';
  for (let i = 0; i < full; i++) html += '★';
  if (half) html += '★';
  for (let i = 0; i < empty; i++) html += '☆';
  
  return html;
}

// ===== LOAD MOVIE DATA =====
async function loadMovie() {
  const params = new URLSearchParams(window.location.search);
  movieId = params.get('id');
  
  if (!movieId) {
    showToast('error', 'Erro', 'ID do filme não encontrado.');
    setTimeout(() => window.location.href = 'menu.html', 2000);
    return;
  }
  
  try {
    const movieDoc = await getDoc(doc(db, 'filmes', movieId));
    if (!movieDoc.exists()) {
      showToast('error', 'Erro', 'Filme não encontrado.');
      setTimeout(() => window.location.href = 'menu.html', 2000);
      return;
    }
    
    movieData = { id: movieDoc.id, ...movieDoc.data() };
    displayMovie(movieData);
    
    if (loading) {
      loading.classList.add('hidden');
      loading.style.display = 'none';
    }
    if (movieContent) {
      movieContent.classList.remove('hidden');
      movieContent.style.display = 'block';
    }
    
    if (currentUser) {
      await loadUserReview();
    }
    loadComments();
    
  } catch (error) {
    console.error('Erro ao carregar filme:', error);
    showToast('error', 'Erro', 'Não foi possível carregar o filme.');
    if (loading) {
      loading.innerHTML = `
        <div style="text-align:center;color:#666;">
          <p style="font-size:1.2rem;margin-bottom:8px;">Erro ao carregar</p>
          <p style="font-size:0.9rem;">Tente novamente mais tarde.</p>
          <button onclick="window.location.href='menu.html'" style="margin-top:16px;padding:10px 24px;background:#fd77cb;border:none;border-radius:12px;color:white;font-weight:600;cursor:pointer;">Voltar ao Menu</button>
        </div>
      `;
      loading.style.display = 'block';
    }
  }
}

function displayMovie(movie) {
  if (movie.poster && moviePoster) {
    moviePoster.src = movie.poster;
    moviePoster.style.display = 'block';
  } else if (moviePoster) {
    moviePoster.style.display = 'none';
  }
  
  if (movieTitle) movieTitle.textContent = movie.nome || 'Título desconhecido';
  if (movieYear) movieYear.textContent = movie.ano || 'Ano desconhecido';
  if (movieGenre) movieGenre.textContent = movie.genero || 'Gênero desconhecido';
  if (movieDirector) movieDirector.textContent = movie.diretor || 'Diretor não informado';
  if (movieSinopse) movieSinopse.textContent = movie.sinopse || 'Sinopse não disponível.';
  
  const rating = movie.avaliacoes || 0;
  const count = movie.totalAvaliacoes || 0;
  if (movieStars) movieStars.textContent = generateStars(rating);
  if (movieRatingValue) movieRatingValue.textContent = rating.toFixed(1);
  if (movieRatingCount) movieRatingCount.textContent = `(${count} avaliações)`;
  
  displayCategories(movie);
}

function displayCategories(movie) {
  const categories = ['fotografia', 'som', 'atuacao', 'roteiro', 'direcao', 'montagem', 'direcaoArte'];
  
  categories.forEach(cat => {
    const avg = movie[`media_${cat}`] || 0;
    const starsEl = document.getElementById(`cat-${cat}`);
    const scoreEl = document.getElementById(`cat-score-${cat}`);
    
    if (starsEl && scoreEl) {
      if (avg > 0) {
        starsEl.textContent = generateStars(avg);
        scoreEl.textContent = avg.toFixed(1);
      } else {
        starsEl.textContent = '☆☆☆☆☆';
        scoreEl.textContent = '-';
      }
    }
  });
}

// ===== LOAD USER REVIEW =====
async function loadUserReview() {
  if (!currentUser || !movieId) return;
  
  try {
    const reviewsRef = collection(db, 'avaliacoes');
    const q = query(
      reviewsRef,
      where('filmeId', '==', movieId),
      where('uid', '==', currentUser.uid)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      userReview = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
      displayUserReview(userReview);
    } else {
      showReviewForm();
    }
  } catch (error) {
    console.error('Erro ao carregar avaliação do usuário:', error);
  }
}

function displayUserReview(review) {
  if (myReviewForm) myReviewForm.style.display = 'none';
  if (myReviewDisplay) myReviewDisplay.style.display = 'block';
  
  if (myReviewStars) myReviewStars.textContent = generateStars(review.nota || 0);
  if (myReviewScore) myReviewScore.textContent = review.nota ? `${review.nota.toFixed(1)} estrelas` : 'Sem nota';
  if (myReviewTextDisplay) myReviewTextDisplay.textContent = review.comentario || 'Sem resenha.';
}

function showReviewForm() {
  if (myReviewForm) myReviewForm.style.display = 'block';
  if (myReviewDisplay) myReviewDisplay.style.display = 'none';
  resetStarDisplay();
  if (myReviewText) myReviewText.value = '';
  selectedRating = 0;
  isEditing = false;
  if (submitReviewBtn) submitReviewBtn.textContent = 'Enviar Avaliação';
}

// ===== CREATE NOTIFICATION =====
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

// ===== SUBMIT REVIEW =====
if (submitReviewBtn) {
  submitReviewBtn.addEventListener('click', async function() {
    if (!currentUser) {
      showToast('warning', 'Atenção', 'Faça login para avaliar o filme.');
      return;
    }
    
    if (selectedRating === 0) {
      showToast('warning', 'Atenção', 'Selecione uma nota para o filme.');
      return;
    }
    
    const comentario = myReviewText ? myReviewText.value.trim() : '';
    
    this.disabled = true;
    this.textContent = 'Salvando...';
    
    try {
      const reviewData = {
        filmeId: movieId,
        nomeFilme: movieData.nome,
        uid: currentUser.uid,
        nomeUsuario: currentUserData?.nome || currentUser.displayName || 'Usuário',
        loginUsuario: currentUserData?.login || 'usuario',
        nota: selectedRating,
        comentario: comentario,
        curtidas: 0,
        usuariosCurtiram: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      let reviewRef;
      let isUpdate = false;
      
      if (userReview) {
        reviewRef = doc(db, 'avaliacoes', userReview.id);
        await updateDoc(reviewRef, {
          nota: selectedRating,
          comentario: comentario,
          updatedAt: serverTimestamp()
        });
        isUpdate = true;
      } else {
        reviewRef = await addDoc(collection(db, 'avaliacoes'), reviewData);
        userReview = { id: reviewRef.id, ...reviewData };
        
        await createNotification({
          tipo: 'nova_avaliacao',
          mensagem: `${currentUserData?.nome || 'Alguém'} avaliou "${movieData.nome}" com ${selectedRating.toFixed(1)} estrelas`,
          usuarioOrigem: currentUser.uid,
          usuarioDestino: 'todos',
          filmeId: movieId,
          avaliacaoId: reviewRef.id,
          data: new Date().toISOString()
        });
      }
      
      await updateMovieRating();
      
      showToast('success', isUpdate ? 'Avaliação atualizada!' : 'Avaliação enviada!', 
        `Sua avaliação de ${movieData.nome} foi salva.`);
      
      displayUserReview({ ...userReview, nota: selectedRating, comentario: comentario });
      
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      showToast('error', 'Erro', 'Não foi possível salvar sua avaliação.');
    } finally {
      this.disabled = false;
      this.textContent = 'Enviar Avaliação';
    }
  });
}

// ===== UPDATE MOVIE RATING =====
async function updateMovieRating() {
  try {
    const reviewsRef = collection(db, 'avaliacoes');
    const q = query(reviewsRef, where('filmeId', '==', movieId));
    const snapshot = await getDocs(q);
    
    let total = 0;
    let count = 0;
    const categoryTotals = {
      fotografia: { total: 0, count: 0 },
      som: { total: 0, count: 0 },
      atuacao: { total: 0, count: 0 },
      roteiro: { total: 0, count: 0 },
      direcao: { total: 0, count: 0 },
      montagem: { total: 0, count: 0 },
      direcaoArte: { total: 0, count: 0 }
    };
    
    const techRef = collection(db, 'avaliacoes_tecnicas');
    const techQ = query(techRef, where('filmeId', '==', movieId));
    const techSnapshot = await getDocs(techQ);
    
    techSnapshot.forEach(doc => {
      const data = doc.data();
      ['fotografia', 'som', 'atuacao', 'roteiro', 'direcao', 'montagem', 'direcaoArte'].forEach(cat => {
        if (data[cat]) {
          categoryTotals[cat].total += data[cat];
          categoryTotals[cat].count++;
        }
      });
    });
    
    snapshot.forEach(doc => {
      const data = doc.data();
      total += data.nota || 0;
      count++;
    });
    
    const avg = count > 0 ? total / count : 0;
    const updateData = {
      avaliacoes: avg,
      totalAvaliacoes: count
    };
    
    Object.keys(categoryTotals).forEach(cat => {
      const { total: catTotal, count: catCount } = categoryTotals[cat];
      updateData[`media_${cat}`] = catCount > 0 ? catTotal / catCount : 0;
      updateData[`total_${cat}`] = catCount;
    });
    
    await updateDoc(doc(db, 'filmes', movieId), updateData);
    
    displayMovie({ ...movieData, ...updateData });
    
  } catch (error) {
    console.error('Erro ao atualizar nota do filme:', error);
  }
}

// ===== DELETE REVIEW =====
async function deleteReview() {
  if (!userReview) return;
  
  if (!confirm('Tem certeza que deseja excluir sua avaliação?')) return;
  
  try {
    await deleteDoc(doc(db, 'avaliacoes', userReview.id));
    userReview = null;
    await updateMovieRating();
    showToast('info', 'Avaliação excluída', 'Sua avaliação foi removida.');
    showReviewForm();
  } catch (error) {
    console.error('Erro ao excluir avaliação:', error);
    showToast('error', 'Erro', 'Não foi possível excluir sua avaliação.');
  }
}

if (deleteReviewBtn) deleteReviewBtn.addEventListener('click', deleteReview);
if (deleteReviewBtn2) deleteReviewBtn2.addEventListener('click', deleteReview);

if (editReviewBtn) {
  editReviewBtn.addEventListener('click', function() {
    if (!userReview) return;
    selectedRating = userReview.nota || 0;
    if (myReviewText) myReviewText.value = userReview.comentario || '';
    updateStarDisplay(selectedRating);
    if (myRatingLabel) myRatingLabel.textContent = `${selectedRating.toFixed(1)} estrelas`;
    if (myReviewForm) myReviewForm.style.display = 'block';
    if (myReviewDisplay) myReviewDisplay.style.display = 'none';
    isEditing = true;
    if (submitReviewBtn) submitReviewBtn.textContent = 'Atualizar Avaliação';
  });
}

// ===== LOAD COMMENTS =====
function loadComments() {
  if (!movieId) return;
  
  const commentsRef = collection(db, 'comentarios');
  const q = query(commentsRef, where('filmeId', '==', movieId));
  
  onSnapshot(q, (snapshot) => {
    allComments = [];
    snapshot.forEach((doc) => {
      allComments.push({ id: doc.id, ...doc.data() });
    });
    displayComments(allComments);
  }, (error) => {
    console.error('Erro ao carregar comentários:', error);
    if (commentsList) commentsList.innerHTML = '<div class="no-comments">Erro ao carregar resenhas</div>';
  });
}

function displayComments(comments) {
  if (!commentsList) return;
  
  if (comments.length === 0) {
    commentsList.innerHTML = '<div class="no-comments">Nenhuma resenha ainda. Seja o primeiro!</div>';
    return;
  }
  
  const sorted = [...comments].sort((a, b) => (b.curtidas || 0) - (a.curtidas || 0));
  
  let html = '';
  sorted.forEach(comment => {
    const initial = (comment.nomeUsuario || 'U').charAt(0).toUpperCase();
    const stars = generateStars(comment.nota || 0);
    const isLiked = currentUser && comment.usuariosCurtiram?.includes(currentUser.uid);
    
    html += `
      <div class="comment-item" data-comment-id="${comment.id}">
        <div class="comment-header" onclick="window.location.href='perfil.html?uid=${comment.uid}'">
          <div class="comment-avatar">${initial}</div>
          <div class="comment-user">
            <div class="comment-username">${comment.nomeUsuario || 'Usuário'}</div>
            <div class="comment-userlogin">@${comment.loginUsuario || 'usuario'}</div>
          </div>
          <div style="margin-left:auto;color:#666;font-size:0.75rem;">
            ${comment.createdAt ? formatTime(comment.createdAt) : ''}
          </div>
        </div>
        ${comment.nota ? `<div class="comment-rating">${stars}</div>` : ''}
        ${comment.comentario ? `<div class="comment-text">${comment.comentario}</div>` : ''}
        <div class="comment-actions">
          <button class="comment-action-btn like-btn ${isLiked ? 'liked' : ''}" data-comment-id="${comment.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
              <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
            </svg>
            <span>${comment.curtidas || 0}</span>
          </button>
        </div>
      </div>
    `;
  });
  
  commentsList.innerHTML = html;
  
  document.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', handleCommentLike);
  });
}

// ===== HANDLE COMMENT LIKE =====
async function handleCommentLike(e) {
  e.stopPropagation();
  const btn = e.currentTarget;
  const commentId = btn.dataset.commentId;
  
  if (!currentUser) {
    showToast('warning', 'Atenção', 'Faça login para curtir resenhas.');
    return;
  }
  
  try {
    const commentRef = doc(db, 'comentarios', commentId);
    const commentDoc = await getDoc(commentRef);
    
    if (!commentDoc.exists()) return;
    
    const data = commentDoc.data();
    const usuariosCurtiram = data.usuariosCurtiram || [];
    const hasLiked = usuariosCurtiram.includes(currentUser.uid);
    
    if (hasLiked) {
      await updateDoc(commentRef, {
        curtidas: increment(-1),
        usuariosCurtiram: arrayRemove(currentUser.uid)
      });
      btn.classList.remove('liked');
    } else {
      await updateDoc(commentRef, {
        curtidas: increment(1),
        usuariosCurtiram: arrayUnion(currentUser.uid)
      });
      btn.classList.add('liked');
    }
    
  } catch (error) {
    console.error('Erro ao curtir comentário:', error);
    showToast('error', 'Erro', 'Não foi possível curtir a resenha.');
  }
}

// ===== FORMAT TIME =====
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

// ===== LOAD USER DATA =====
async function loadUserData(user) {
  try {
    const usuariosRef = collection(db, 'usuarios');
    const q = query(usuariosRef, where('uid', '==', user.uid));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      currentUserData = { id: doc.id, ...doc.data() };
    }
  } catch (error) {
    console.error('Erro ao carregar dados do usuário:', error);
  }
}

// ===== TOGGLE CATEGORIAS TÉCNICAS =====
const toggleCategoriesBtn = document.getElementById('toggleCategoriesBtn');
const technicalCategories = document.getElementById('technicalCategories');
let categoriesVisible = false;

if (toggleCategoriesBtn) {
    toggleCategoriesBtn.addEventListener('click', function() {
        categoriesVisible = !categoriesVisible;
        if (categoriesVisible) {
            technicalCategories.classList.remove('hidden');
            this.querySelector('.arrow-icon').classList.add('open');
        } else {
            technicalCategories.classList.add('hidden');
            this.querySelector('.arrow-icon').classList.remove('open');
        }
    });
}

// ===== SETUP ESTRELAS DAS CATEGORIAS TÉCNICAS =====
function setupTechnicalStars() {
    const categories = ['fotografia', 'som', 'atuacao', 'roteiro', 'direcao', 'montagem', 'direcaoArte'];
    
    categories.forEach(cat => {
        const container = document.getElementById(`tech-${cat}`);
        if (!container) return;
        
        container.innerHTML = '';
        container.style.cssText = 'display:flex;gap:2px;';
        
        // Armazenar a nota atual de cada categoria
        let currentRating = 0;
        const scoreEl = document.getElementById(`tech-score-${cat}`);
        
        for (let i = 0; i < 5; i++) {
            const wrapper = document.createElement('div');
            wrapper.className = 'tech-star-wrapper';
            wrapper.style.cssText = 'position:relative;display:inline-block;width:1.2rem;height:1.2rem;font-size:1.2rem;line-height:1;cursor:pointer;';
            wrapper.dataset.starIndex = i;
            wrapper.dataset.category = cat;
            
            // Estrela base (vazia)
            const base = document.createElement('span');
            base.className = 'tech-star-base';
            base.textContent = '☆';
            base.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;color:#444;text-align:center;line-height:1;font-size:inherit;z-index:1;pointer-events:none;display:flex;align-items:center;justify-content:center;';
            
            // Meia estrela esquerda
            const halfLeft = document.createElement('span');
            halfLeft.className = 'tech-star-half-left';
            halfLeft.textContent = '★';
            halfLeft.style.cssText = 'position:absolute;top:0;left:0;width:50%;height:100%;color:#f5a623;overflow:hidden;z-index:2;pointer-events:none;line-height:1;font-size:inherit;opacity:0;transition:opacity 0.15s;display:flex;align-items:center;justify-content:flex-start;';
            
            // Estrela inteira
            const fullStar = document.createElement('span');
            fullStar.className = 'tech-star-full';
            fullStar.textContent = '★';
            fullStar.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;color:#f5a623;z-index:3;pointer-events:none;line-height:1;font-size:inherit;opacity:0;transition:opacity 0.15s;display:flex;align-items:center;justify-content:center;';
            
            // Área clicável - metade esquerda
            const clickLeft = document.createElement('div');
            clickLeft.className = 'tech-click-left';
            clickLeft.style.cssText = 'position:absolute;top:0;left:0;width:50%;height:100%;z-index:5;cursor:pointer;';
            clickLeft.dataset.starIndex = i;
            clickLeft.dataset.category = cat;
            clickLeft.dataset.half = 'left';
            
            // Área clicável - metade direita
            const clickRight = document.createElement('div');
            clickRight.className = 'tech-click-right';
            clickRight.style.cssText = 'position:absolute;top:0;left:50%;width:50%;height:100%;z-index:5;cursor:pointer;';
            clickRight.dataset.starIndex = i;
            clickRight.dataset.category = cat;
            clickRight.dataset.half = 'right';
            
            // Evento da metade esquerda
            clickLeft.addEventListener('click', function(e) {
                e.stopPropagation();
                const starIndex = parseInt(this.dataset.starIndex);
                const category = this.dataset.category;
                currentRating = starIndex + 0.5;
                updateTechStarDisplay(category, currentRating);
                if (scoreEl) {
                    scoreEl.textContent = currentRating.toFixed(1);
                }
            });
            
            // Evento da metade direita
            clickRight.addEventListener('click', function(e) {
                e.stopPropagation();
                const starIndex = parseInt(this.dataset.starIndex);
                const category = this.dataset.category;
                currentRating = starIndex + 1;
                updateTechStarDisplay(category, currentRating);
                if (scoreEl) {
                    scoreEl.textContent = currentRating.toFixed(1);
                }
            });
            
            // Hover
            const hoverHandler = function(e) {
                const starIndex = parseInt(this.dataset.starIndex);
                const isRight = this.dataset.half === 'right';
                const category = this.dataset.category;
                const wrappers = container.querySelectorAll('.tech-star-wrapper');
                
                wrappers.forEach((w, idx) => {
                    const half = w.querySelector('.tech-star-half-left');
                    const full = w.querySelector('.tech-star-full');
                    
                    if (idx < starIndex) {
                        half.style.opacity = '0';
                        full.style.opacity = '1';
                    } else if (idx === starIndex) {
                        if (isRight) {
                            half.style.opacity = '0';
                            full.style.opacity = '1';
                        } else {
                            half.style.opacity = '1';
                            full.style.opacity = '0';
                        }
                    } else {
                        half.style.opacity = '0';
                        full.style.opacity = '0';
                    }
                });
            };
            
            const leaveHandler = function() {
                updateTechStarDisplay(cat, currentRating);
            };
            
            clickLeft.addEventListener('mouseenter', hoverHandler);
            clickRight.addEventListener('mouseenter', hoverHandler);
            clickLeft.addEventListener('mouseleave', leaveHandler);
            clickRight.addEventListener('mouseleave', leaveHandler);
            
            wrapper.appendChild(base);
            wrapper.appendChild(halfLeft);
            wrapper.appendChild(fullStar);
            wrapper.appendChild(clickLeft);
            wrapper.appendChild(clickRight);
            container.appendChild(wrapper);
        }
    });
}

// ===== FUNÇÃO PARA ATUALIZAR DISPLAY DAS ESTRELAS TÉCNICAS =====
function updateTechStarDisplay(category, rating) {
    const container = document.getElementById(`tech-${category}`);
    if (!container) return;
    
    const wrappers = container.querySelectorAll('.tech-star-wrapper');
    
    wrappers.forEach((wrapper, idx) => {
        const half = wrapper.querySelector('.tech-star-half-left');
        const full = wrapper.querySelector('.tech-star-full');
        
        const starValue = idx + 1;
        const halfValue = idx + 0.5;
        
        if (rating >= starValue) {
            half.style.opacity = '0';
            full.style.opacity = '1';
        } else if (rating >= halfValue && rating < starValue) {
            half.style.opacity = '1';
            full.style.opacity = '0';
        } else {
            half.style.opacity = '0';
            full.style.opacity = '0';
        }
    });
}

setupTechnicalStars();

// ===== SALVAR AVALIAÇÕES TÉCNICAS =====
const saveTechnicalBtn = document.getElementById('saveTechnicalBtn');

if (saveTechnicalBtn) {
    saveTechnicalBtn.addEventListener('click', async function() {
        if (!currentUser) {
            showToast('warning', 'Atenção', 'Faça login para avaliar as categorias técnicas.');
            return;
        }
        
        const categories = ['fotografia', 'som', 'atuacao', 'roteiro', 'direcao', 'montagem', 'direcaoArte'];
        const technicalRatings = {};
        let hasRating = false;
        
        categories.forEach(cat => {
            const stars = document.querySelectorAll(`#tech-${cat} .tech-star.active`);
            if (stars.length > 0) {
                technicalRatings[cat] = stars.length;
                hasRating = true;
            }
        });
        
        if (!hasRating) {
            showToast('warning', 'Aviso', 'Selecione pelo menos uma avaliação técnica.');
            return;
        }
        
        this.disabled = true;
        this.textContent = 'Salvando...';
        
        try {
            const techRef = collection(db, 'avaliacoes_tecnicas');
            const q = query(
                techRef,
                where('filmeId', '==', movieId),
                where('uid', '==', currentUser.uid)
            );
            const snapshot = await getDocs(q);
            
            if (!snapshot.empty) {
                const docId = snapshot.docs[0].id;
                await updateDoc(doc(db, 'avaliacoes_tecnicas', docId), {
                    ...technicalRatings,
                    updatedAt: serverTimestamp()
                });
            } else {
                await addDoc(collection(db, 'avaliacoes_tecnicas'), {
                    filmeId: movieId,
                    uid: currentUser.uid,
                    nomeUsuario: currentUserData?.nome || currentUser.displayName || 'Usuário',
                    ...technicalRatings,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            }
            
            showToast('success', 'Salvo!', 'Suas avaliações técnicas foram salvas.');
            await updateMovieRating();
            
        } catch (error) {
            console.error('Erro ao salvar avaliações técnicas:', error);
            showToast('error', 'Erro', 'Não foi possível salvar as avaliações técnicas.');
        } finally {
            this.disabled = false;
            this.textContent = 'Salvar Avaliações Técnicas';
        }
    });
}

// ===== INIT =====
setupStarRating();

if (loading) {
  loading.classList.remove('hidden');
  loading.style.display = 'flex';
}
if (movieContent) {
  movieContent.classList.add('hidden');
  movieContent.style.display = 'none';
}

loadMovie();

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    await loadUserData(user);
    if (movieData) {
      await loadUserReview();
      loadComments();
    }
  }
});

console.log('Cine Clube Xiquete - Filme carregado!');