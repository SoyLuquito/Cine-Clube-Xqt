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
const editReviewBtn = document.getElementById('editReviewBtn');
const deleteReviewBtn2 = document.getElementById('deleteReviewBtn2');
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

// ===== FUNÇÕES DO MODAL DE CONFIRMAÇÃO =====
function showConfirmModal(options) {
    return new Promise((resolve) => {
        const existing = document.querySelector('.confirm-modal-overlay');
        if (existing) existing.remove();
        
        const overlay = document.createElement('div');
        overlay.className = 'confirm-modal-overlay';
        
        const iconMap = {
            warning: '⚠️',
            info: 'ℹ️',
            danger: '⚠️'
        };
        
        overlay.innerHTML = `
            <div class="confirm-modal">
                <div class="confirm-icon ${options.type || 'warning'}">
                    ${iconMap[options.type] || '⚠️'}
                </div>
                <div class="confirm-title">${options.title || 'Confirmar'}</div>
                <div class="confirm-message">${options.message || 'Tem certeza?'}</div>
                <div class="confirm-actions">
                    <button class="btn-cancel" id="confirmCancel">${options.cancelText || 'Cancelar'}</button>
                    <button class="btn-confirm ${options.danger ? 'danger' : ''}" id="confirmOk">${options.confirmText || 'Confirmar'}</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                overlay.remove();
                resolve(false);
            }
        });
        
        const cancelBtn = overlay.querySelector('#confirmCancel');
        cancelBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            overlay.remove();
            resolve(false);
        });
        
        const confirmBtn = overlay.querySelector('#confirmOk');
        confirmBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            overlay.remove();
            resolve(true);
        });
        
        const escHandler = function(e) {
            if (e.key === 'Escape') {
                if (document.body.contains(overlay)) {
                    overlay.remove();
                    document.removeEventListener('keydown', escHandler);
                    resolve(false);
                }
            }
        };
        document.addEventListener('keydown', escHandler);
    });
}

// ===== TOGGLE REPLY FORM =====
function toggleReplyForm(e) {
  e.stopPropagation();
  const commentId = this.dataset.commentId;
  const wrapper = document.querySelector(`.reply-form-wrapper[data-comment-id="${commentId}"]`);
  
  if (!wrapper) return;
  
  document.querySelectorAll('.reply-form-wrapper').forEach(w => {
    if (w !== wrapper) w.style.display = 'none';
  });
  
  wrapper.style.display = wrapper.style.display === 'none' ? 'block' : 'none';
  
  if (wrapper.style.display === 'block') {
    const textarea = wrapper.querySelector('.reply-textarea');
    if (textarea) textarea.focus();
  }
}

// ===== SUBMIT REPLY =====
async function submitReply(e) {
  e.stopPropagation();
  const btn = this;
  const commentId = btn.dataset.commentId;
  const wrapper = document.querySelector(`.reply-form-wrapper[data-comment-id="${commentId}"]`);
  
  if (!wrapper) {
    showToast('error', 'Erro', 'Formulário não encontrado.');
    return;
  }
  
  const textarea = wrapper.querySelector('.reply-textarea');
  const texto = textarea.value.trim();
  
  if (!currentUser) {
    showToast('warning', 'Atenção', 'Faça login para responder.');
    return;
  }
  
  if (!texto) {
    showToast('warning', 'Aviso', 'Escreva uma resposta.');
    return;
  }
  
  btn.disabled = true;
  btn.textContent = 'Enviando...';
  
  try {
    const now = new Date();
    const replyData = {
      id: now.getTime().toString(),
      texto: texto,
      uid: currentUser.uid,
      nomeUsuario: currentUserData?.nome || currentUser.displayName || 'Usuário',
      loginUsuario: currentUserData?.login || 'usuario',
      fotoUsuario: currentUserData?.fotoPerfil || '',
      curtidas: 0,
      usuariosCurtiram: [],
      createdAt: now.toISOString()
    };
    
    // 🔥 GARANTE QUE O DOCUMENTO EXISTE NA COLEÇÃO 'comentarios'
    const commentRef = doc(db, 'comentarios', commentId);
    let commentDoc = await getDoc(commentRef);
    
    // Se não existe, cria um
    if (!commentDoc.exists()) {
      // Busca da coleção 'avaliacoes'
      const reviewRef = doc(db, 'avaliacoes', commentId);
      const reviewDoc = await getDoc(reviewRef);
      
      if (!reviewDoc.exists()) {
        showToast('error', 'Erro', 'Resenha não encontrada.');
        return;
      }
      
      const reviewData = reviewDoc.data();
      
      // Cria o documento na coleção 'comentarios'
      await setDoc(commentRef, {
        filmeId: reviewData.filmeId || movieId,
        uid: reviewData.uid || '',
        nomeUsuario: reviewData.nomeUsuario || 'Usuário',
        loginUsuario: reviewData.loginUsuario || 'usuario',
        fotoUsuario: reviewData.fotoUsuario || '',
        comentario: reviewData.comentario || '',
        nota: reviewData.nota || 0,
        curtidas: reviewData.curtidas || 0,
        usuariosCurtiram: reviewData.usuariosCurtiram || [],
        respostas: [replyData],
        createdAt: reviewData.createdAt || serverTimestamp()
      });
      
      console.log('✅ Documento criado com resposta:', replyData);
    } else {
      // Documento existe, adiciona a resposta
      const data = commentDoc.data();
      const respostas = data.respostas || [];
      respostas.push(replyData);
      
      await updateDoc(commentRef, {
        respostas: respostas
      });
      
      console.log('✅ Resposta adicionada ao documento existente:', replyData);
    }
    
    textarea.value = '';
    wrapper.style.display = 'none';
    showToast('success', 'Resposta enviada!', 'Sua resposta foi publicada.');
    
    // 🔥 RECARREGA OS COMENTÁRIOS PARA MOSTRAR A RESPOSTA
    loadComments();
    
  } catch (error) {
    console.error('❌ Erro ao enviar resposta:', error);
    showToast('error', 'Erro', 'Não foi possível enviar a resposta.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Responder';
  }
}

// ===== HANDLE COMMENT LIKE - SIMPLIFICADO =====
async function handleCommentLike(e) {
  e.stopPropagation();
  const btn = e.currentTarget;
  const commentId = btn.dataset.commentId;
  
  if (!currentUser) {
    showToast('warning', 'Atenção', 'Faça login para curtir resenhas.');
    return;
  }
  
  try {
    const userUid = currentUser.uid;
    
    // 1. BUSCA O ESTADO ATUAL NA COLEÇÃO 'avaliacoes'
    const reviewRef = doc(db, 'avaliacoes', commentId);
    const reviewDoc = await getDoc(reviewRef);
    
    if (!reviewDoc.exists()) {
      showToast('warning', 'Aviso', 'Avaliação não encontrada.');
      return;
    }
    
    const reviewData = reviewDoc.data();
    const usuariosCurtiram = reviewData.usuariosCurtiram || [];
    const hasLiked = usuariosCurtiram.includes(userUid);
    const curtidas = reviewData.curtidas || 0;
    
    // 2. ATUALIZA A COLEÇÃO 'avaliacoes'
    if (hasLiked) {
      await updateDoc(reviewRef, {
        curtidas: curtidas - 1,
        usuariosCurtiram: arrayRemove(userUid)
      });
    } else {
      await updateDoc(reviewRef, {
        curtidas: curtidas + 1,
        usuariosCurtiram: arrayUnion(userUid)
      });
    }
    
    // 3. TAMBÉM ATUALIZA A COLEÇÃO 'comentarios' (se existir)
    const commentRef = doc(db, 'comentarios', commentId);
    const commentDoc = await getDoc(commentRef);
    
    if (commentDoc.exists()) {
      const commentData = commentDoc.data();
      const commentCurtidas = commentData.curtidas || 0;
      const commentUsuariosCurtiram = commentData.usuariosCurtiram || [];
      const commentHasLiked = commentUsuariosCurtiram.includes(userUid);
      
      if (commentHasLiked !== hasLiked) {
        if (hasLiked) {
          await updateDoc(commentRef, {
            curtidas: commentCurtidas - 1,
            usuariosCurtiram: arrayRemove(userUid)
          });
        } else {
          await updateDoc(commentRef, {
            curtidas: commentCurtidas + 1,
            usuariosCurtiram: arrayUnion(userUid)
          });
        }
      }
    }
    
    // 4. ATUALIZA A INTERFACE DIRETAMENTE
    const svg = btn.querySelector('svg');
    const countSpan = btn.querySelector('span');
    const novoValor = hasLiked ? curtidas - 1 : curtidas + 1;
    
    if (hasLiked) {
      btn.classList.remove('liked');
      if (svg) svg.setAttribute('fill', 'none');
    } else {
      btn.classList.add('liked');
      if (svg) svg.setAttribute('fill', '#fd77cb');
    }
    countSpan.textContent = novoValor;
    
  } catch (error) {
    console.error('❌ Erro ao curtir:', error);
    showToast('error', 'Erro', 'Não foi possível curtir.');
  }
}

// ===== HANDLE REPLY LIKE =====
async function handleReplyLike(e) {
  e.stopPropagation();
  const btn = this;
  const replyId = btn.dataset.replyId;
  const commentId = btn.dataset.commentId;
  
  if (!currentUser) {
    showToast('warning', 'Atenção', 'Faça login para curtir.');
    return;
  }
  
  try {
    const commentRef = doc(db, 'comentarios', commentId);
    let commentDoc = await getDoc(commentRef);
    
    if (!commentDoc.exists()) {
      showToast('warning', 'Aviso', 'Resenha não encontrada.');
      return;
    }
    
    const data = commentDoc.data();
    const replies = data.respostas || [];
    const replyIndex = replies.findIndex(r => r.id === replyId);
    
    if (replyIndex === -1) {
      showToast('warning', 'Aviso', 'Resposta não encontrada.');
      return;
    }
    
    const reply = replies[replyIndex];
    const usuariosCurtiram = reply.usuariosCurtiram || [];
    const hasLiked = usuariosCurtiram.includes(currentUser.uid);
    
    let updatedReplies = [...replies];
    
    if (hasLiked) {
      updatedReplies[replyIndex] = {
        ...reply,
        curtidas: Math.max(0, (reply.curtidas || 0) - 1),
        usuariosCurtiram: usuariosCurtiram.filter(uid => uid !== currentUser.uid)
      };
    } else {
      updatedReplies[replyIndex] = {
        ...reply,
        curtidas: (reply.curtidas || 0) + 1,
        usuariosCurtiram: [...usuariosCurtiram, currentUser.uid]
      };
    }
    
    await updateDoc(commentRef, {
      respostas: updatedReplies
    });
    
    loadComments();
    
  } catch (error) {
    console.error('Erro ao curtir resposta:', error);
    showToast('error', 'Erro', 'Não foi possível curtir.');
  }
}

// ===== OPEN EDIT REPLY MODAL =====
function openEditReplyModal(e) {
  e.stopPropagation();
  const btn = this;
  const replyId = btn.dataset.replyId;
  const commentId = btn.dataset.commentId;
  
  const commentItem = document.querySelector(`.comment-item[data-comment-id="${commentId}"]`);
  if (!commentItem) return;
  
  const replyItem = commentItem.querySelector(`.reply-item[data-reply-id="${replyId}"]`);
  if (!replyItem) return;
  
  const replyText = replyItem.querySelector('.reply-text');
  if (!replyText) return;
  
  const modal = document.getElementById('editReplyModal');
  const textarea = document.getElementById('editReplyText');
  
  if (modal && textarea) {
    textarea.value = replyText.textContent;
    modal.classList.remove('hidden');
    textarea.focus();
    
    modal.dataset.replyId = replyId;
    modal.dataset.commentId = commentId;
  }
}

// ===== SAVE EDITED REPLY =====
async function saveEditedReply() {
  const modal = document.getElementById('editReplyModal');
  const textarea = document.getElementById('editReplyText');
  const novoTexto = textarea.value.trim();
  
  if (!novoTexto) {
    showToast('warning', 'Aviso', 'Escreva a resposta.');
    return;
  }
  
  const replyId = modal.dataset.replyId;
  const commentId = modal.dataset.commentId;
  
  if (!replyId || !commentId) return;
  
  try {
    const commentRef = doc(db, 'comentarios', commentId);
    const commentDoc = await getDoc(commentRef);
    
    if (!commentDoc.exists()) return;
    
    const data = commentDoc.data();
    const replies = data.respostas || [];
    const replyIndex = replies.findIndex(r => r.id === replyId);
    
    if (replyIndex === -1) return;
    
    const updatedReplies = [...replies];
    updatedReplies[replyIndex] = {
      ...updatedReplies[replyIndex],
      texto: novoTexto
    };
    
    await updateDoc(commentRef, {
      respostas: updatedReplies
    });
    
    modal.classList.add('hidden');
    showToast('success', 'Atualizado!', 'Sua resposta foi editada.');
    loadComments();
    
  } catch (error) {
    console.error('Erro ao editar resposta:', error);
    showToast('error', 'Erro', 'Não foi possível editar.');
  }
}

// ===== DELETE REPLY =====
async function deleteReply(e) {
  e.stopPropagation();
  const btn = this;
  const replyId = btn.dataset.replyId;
  const commentId = btn.dataset.commentId;
  
  const confirmed = await showConfirmModal({
    title: 'Excluir Resposta',
    message: 'Tem certeza que deseja excluir esta resposta?',
    type: 'danger',
    danger: true,
    confirmText: 'Excluir',
    cancelText: 'Cancelar'
  });
  
  if (!confirmed) return;
  
  try {
    const commentRef = doc(db, 'comentarios', commentId);
    const commentDoc = await getDoc(commentRef);
    
    if (!commentDoc.exists()) return;
    
    const data = commentDoc.data();
    const replies = data.respostas || [];
    const updatedReplies = replies.filter(r => r.id !== replyId);
    
    await updateDoc(commentRef, {
      respostas: updatedReplies
    });
    
    showToast('info', 'Excluída', 'Resposta removida.');
    loadComments();
    
  } catch (error) {
    console.error('Erro ao excluir resposta:', error);
    showToast('error', 'Erro', 'Não foi possível excluir.');
  }
}

// ===== DISPLAY COMMENTS - LÊ DA AVALIACAO =====
function displayComments(comments) {
  if (!commentsList) return;
  
  if (comments.length === 0) {
    commentsList.innerHTML = '<div class="no-comments">Nenhuma resenha ainda. Seja o primeiro!</div>';
    return;
  }
  
  let html = '';
  comments.forEach(comment => {
    const initial = (comment.nomeUsuario || 'U').charAt(0).toUpperCase();
    const stars = comment.nota ? generateStars(comment.nota) : '';
    
    // 🔥 SE FOR UMA AVALIAÇÃO (tem nota), USA OS DADOS DA COLEÇÃO 'avaliacoes'
    const isReview = comment.nota && comment.nota > 0;
    
    // 🔥 BUSCA O ESTADO REAL NA COLEÇÃO 'avaliacoes'
    // Vamos armazenar os dados iniciais e atualizar depois
    let isLiked = false;
    let curtidas = comment.curtidas || 0;
    
    // Verifica se o usuário já curtiu baseado no array do comentário
    const usuariosCurtiram = comment.usuariosCurtiram || [];
    isLiked = usuariosCurtiram.includes(currentUser?.uid);
    
    // Para avaliações, vamos buscar o dado correto da coleção 'avaliacoes'
    // e atualizar o botão depois que a página carregar
    const commentId = comment.id;
    
    const replies = comment.respostas || [];
    
    html += `
      <div class="comment-item" data-comment-id="${comment.id}">
        <div class="comment-header" onclick="window.location.href='perfil.html?uid=${comment.uid}'">
          <div class="comment-avatar">
            ${comment.fotoUsuario ? `<img src="${comment.fotoUsuario}" alt="">` : initial}
          </div>
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
          <button class="comment-action-btn like-btn ${isLiked ? 'liked' : ''}" data-comment-id="${comment.id}" data-is-review="${isReview}">
            <svg viewBox="0 0 24 24" fill="${isLiked ? '#fd77cb' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
              <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
            </svg>
            <span>${curtidas}</span>
          </button>
          <button class="reply-btn" data-comment-id="${comment.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
            Responder
          </button>
        </div>
        
        ${replies.length > 0 ? `
          <div class="comment-replies">
            ${replies.map(reply => {
              const replyInitial = (reply.nomeUsuario || 'U').charAt(0).toUpperCase();
              const replyIsLiked = currentUser && reply.usuariosCurtiram?.includes(currentUser.uid);
              const replyIsOwner = currentUser && reply.uid === currentUser.uid;
              
              return `
                <div class="reply-item" data-reply-id="${reply.id}" data-comment-id="${comment.id}">
                  <div class="reply-header" onclick="window.location.href='perfil.html?uid=${reply.uid}'">
                    <div class="reply-avatar">
                      ${reply.fotoUsuario ? `<img src="${reply.fotoUsuario}" alt="">` : replyInitial}
                    </div>
                    <div class="reply-user">
                      <div class="reply-username">${reply.nomeUsuario || 'Usuário'}</div>
                      <div class="reply-userlogin">@${reply.loginUsuario || 'usuario'}</div>
                    </div>
                    <div style="margin-left:auto;color:#666;font-size:0.65rem;">
                      ${reply.createdAt ? formatTime(reply.createdAt) : ''}
                    </div>
                  </div>
                  <div class="reply-text">${reply.texto}</div>
                  <div class="reply-actions">
                    <button class="reply-action-btn like-reply-btn ${replyIsLiked ? 'liked' : ''}" data-reply-id="${reply.id}" data-comment-id="${comment.id}">
                      <svg viewBox="0 0 24 24" fill="${replyIsLiked ? '#fd77cb' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                        <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                      </svg>
                      <span>${reply.curtidas || 0}</span>
                    </button>
                    ${replyIsOwner ? `
                      <button class="reply-action-btn edit-reply-btn" data-reply-id="${reply.id}" data-comment-id="${comment.id}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M12 20h9"/>
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                        </svg>
                        Editar
                      </button>
                      <button class="reply-action-btn delete-reply-btn" data-reply-id="${reply.id}" data-comment-id="${comment.id}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          <line x1="10" y1="11" x2="10" y2="17"/>
                          <line x1="14" y1="11" x2="14" y2="17"/>
                        </svg>
                        Excluir
                      </button>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : ''}
        
        <div class="reply-form-wrapper" style="display:none;" data-comment-id="${comment.id}">
          <div class="reply-form">
            <textarea class="reply-textarea" placeholder="Escreva uma resposta..." rows="2"></textarea>
            <button class="btn-reply submit-reply-btn" data-comment-id="${comment.id}">Responder</button>
          </div>
        </div>
      </div>
    `;
  });
  
  commentsList.innerHTML = html;
  
  // 🔥 DEPOIS DE RENDERIZAR, BUSCA OS DADOS REAIS DA COLEÇÃO 'avaliacoes' E ATUALIZA
  document.querySelectorAll('.like-btn').forEach(async (btn) => {
    const commentId = btn.dataset.commentId;
    const isReview = btn.dataset.isReview === 'true';
    
    if (isReview && currentUser) {
      try {
        const reviewRef = doc(db, 'avaliacoes', commentId);
        const reviewDoc = await getDoc(reviewRef);
        
        if (reviewDoc.exists()) {
          const reviewData = reviewDoc.data();
          const usuariosCurtiram = reviewData.usuariosCurtiram || [];
          const isLiked = usuariosCurtiram.includes(currentUser.uid);
          const curtidas = reviewData.curtidas || 0;
          
          const svg = btn.querySelector('svg');
          const countSpan = btn.querySelector('span');
          
          if (isLiked) {
            btn.classList.add('liked');
            if (svg) svg.setAttribute('fill', '#fd77cb');
          } else {
            btn.classList.remove('liked');
            if (svg) svg.setAttribute('fill', 'none');
          }
          countSpan.textContent = curtidas;
        }
      } catch (error) {
        // Se der erro, mantém o valor do comentário
      }
    }
    
    btn.addEventListener('click', handleCommentLike);
  });
  
  document.querySelectorAll('.like-reply-btn').forEach(btn => {
    btn.addEventListener('click', handleReplyLike);
  });
  
  document.querySelectorAll('.reply-btn').forEach(btn => {
    btn.addEventListener('click', toggleReplyForm);
  });
  
  document.querySelectorAll('.submit-reply-btn').forEach(btn => {
    btn.addEventListener('click', submitReply);
  });
  
  document.querySelectorAll('.edit-reply-btn').forEach(btn => {
    btn.addEventListener('click', openEditReplyModal);
  });
  
  document.querySelectorAll('.delete-reply-btn').forEach(btn => {
    btn.addEventListener('click', deleteReply);
  });
}

// ===== LOAD COMMENTS =====
function loadComments() {
  if (!movieId) return;
  
  const allComments = [];
  let loadedCount = 0;
  let totalToLoad = 2;
  
  function checkAndDisplay() {
    loadedCount++;
    if (loadedCount === totalToLoad) {
      // 🔥 GARANTE QUE OS COMENTÁRIOS DA COLEÇÃO 'comentarios' TENHAM PRIORIDADE
      // Remove duplicatas (prioriza os da coleção 'comentarios')
      const uniqueComments = [];
      const seenIds = new Set();
      
      // Primeiro adiciona os da coleção 'comentarios' (têm respostas)
      const commentsFromComentarios = allComments.filter(c => c._tipo === 'comentario');
      const commentsFromAvaliacoes = allComments.filter(c => c._tipo === 'avaliacao');
      
      // Adiciona os comentários primeiro (prioridade)
      commentsFromComentarios.forEach(c => {
        if (!seenIds.has(c.id)) {
          seenIds.add(c.id);
          uniqueComments.push(c);
        }
      });
      
      // Depois adiciona as avaliações que não têm comentário
      commentsFromAvaliacoes.forEach(c => {
        if (!seenIds.has(c.id)) {
          seenIds.add(c.id);
          uniqueComments.push(c);
        }
      });
      
      // Ordena por data
      uniqueComments.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      
      displayComments(uniqueComments);
    }
  }
  
  // 1. Carrega da coleção 'comentarios'
  const commentsRef = collection(db, 'comentarios');
  const q1 = query(commentsRef, where('filmeId', '==', movieId));
  
  onSnapshot(q1, (snapshot) => {
    // Remove comentários antigos
    const existingIds = allComments.map(c => c.id);
    snapshot.forEach((doc) => {
      const data = doc.data();
      const index = allComments.findIndex(c => c.id === doc.id);
      if (index !== -1) {
        allComments[index] = { id: doc.id, ...data, _tipo: 'comentario' };
      } else {
        allComments.push({ id: doc.id, ...data, _tipo: 'comentario' });
      }
    });
    checkAndDisplay();
  }, (error) => {
    console.error('Erro ao carregar comentários:', error);
    loadedCount++;
    if (loadedCount === totalToLoad) {
      displayComments(allComments);
    }
  });
  
  // 2. Carrega da coleção 'avaliacoes'
  const reviewsRef = collection(db, 'avaliacoes');
  const q2 = query(reviewsRef, where('filmeId', '==', movieId));
  
  onSnapshot(q2, (snapshot) => {
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.comentario && data.comentario.trim()) {
        const exists = allComments.some(c => c.id === doc.id);
        if (!exists) {
          allComments.push({ 
            id: doc.id, 
            ...data, 
            _tipo: 'avaliacao',
            respostas: []
          });
        }
      }
    });
    checkAndDisplay();
  }, (error) => {
    console.error('Erro ao carregar avaliações:', error);
    loadedCount++;
    if (loadedCount === totalToLoad) {
      displayComments(allComments);
    }
  });
}

// ===== RENDER ALL COMMENTS =====
function renderAllComments(comments) {
  const uniqueComments = [];
  const seenIds = new Set();
  
  comments.forEach(comment => {
    if (!seenIds.has(comment.id)) {
      seenIds.add(comment.id);
      uniqueComments.push(comment);
    }
  });
  
  uniqueComments.sort((a, b) => {
    const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
    const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
    return dateB - dateA;
  });
  
  displayComments(uniqueComments);
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
    
    const base = document.createElement('span');
    base.className = 'star-base';
    base.textContent = '☆';
    base.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;color:#444;text-align:center;line-height:1;font-size:inherit;z-index:1;pointer-events:none;display:flex;align-items:center;justify-content:center;';
    
    const halfLeft = document.createElement('span');
    halfLeft.className = 'star-half-left';
    halfLeft.textContent = '★';
    halfLeft.style.cssText = 'position:absolute;top:0;left:0;width:50%;height:100%;color:#f5a623;overflow:hidden;z-index:2;pointer-events:none;line-height:1;font-size:inherit;opacity:0;transition:opacity 0.15s;display:flex;align-items:center;justify-content:flex-start;';
    
    const fullStar = document.createElement('span');
    fullStar.className = 'star-full';
    fullStar.textContent = '★';
    fullStar.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;color:#f5a623;z-index:3;pointer-events:none;line-height:1;font-size:inherit;opacity:0;transition:opacity 0.15s;display:flex;align-items:center;justify-content:center;';
    
    const clickLeft = document.createElement('div');
    clickLeft.className = 'click-left';
    clickLeft.style.cssText = 'position:absolute;top:0;left:0;width:50%;height:100%;z-index:5;cursor:pointer;';
    clickLeft.dataset.starIndex = i;
    clickLeft.dataset.half = 'left';
    
    const clickRight = document.createElement('div');
    clickRight.className = 'click-right';
    clickRight.style.cssText = 'position:absolute;top:0;left:50%;width:50%;height:100%;z-index:5;cursor:pointer;';
    clickRight.dataset.starIndex = i;
    clickRight.dataset.half = 'right';
    
    clickLeft.addEventListener('click', function(e) {
      e.stopPropagation();
      const starIndex = parseInt(this.dataset.starIndex);
      selectedRating = starIndex + 0.5;
      updateStarDisplay(selectedRating);
      if (myRatingLabel) myRatingLabel.textContent = `${selectedRating.toFixed(1)} estrelas`;
    });
    
    clickRight.addEventListener('click', function(e) {
      e.stopPropagation();
      const starIndex = parseInt(this.dataset.starIndex);
      selectedRating = starIndex + 1;
      updateStarDisplay(selectedRating);
      if (myRatingLabel) myRatingLabel.textContent = `${selectedRating.toFixed(1)} estrelas`;
    });
    
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
      await loadTechnicalReviews();
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
        poster: movieData.poster || '',
        uid: currentUser.uid,
        nomeUsuario: currentUserData?.nome || currentUser.displayName || 'Usuário',
        loginUsuario: currentUserData?.login || 'usuario',
        fotoUsuario: currentUserData?.fotoPerfil || '',
        nota: selectedRating,
        comentario: comentario,
        curtidas: 0,
        usuariosCurtiram: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      let reviewRef;
      let isUpdate = false;
      let commentId = null;
      
      if (userReview) {
        reviewRef = doc(db, 'avaliacoes', userReview.id);
        await updateDoc(reviewRef, {
          nota: selectedRating,
          comentario: comentario,
          updatedAt: serverTimestamp()
        });
        isUpdate = true;
        userReview.nota = selectedRating;
        userReview.comentario = comentario;
        commentId = userReview.id;
      } else {
        reviewRef = await addDoc(collection(db, 'avaliacoes'), reviewData);
        userReview = { id: reviewRef.id, ...reviewData };
        commentId = reviewRef.id;
        
        await setDoc(doc(db, 'comentarios', commentId), {
          filmeId: movieId,
          uid: currentUser.uid,
          nomeUsuario: currentUserData?.nome || currentUser.displayName || 'Usuário',
          loginUsuario: currentUserData?.login || 'usuario',
          fotoUsuario: currentUserData?.fotoPerfil || '',
          comentario: comentario,
          nota: selectedRating,
          curtidas: 0,
          usuariosCurtiram: [],
          respostas: [],
          createdAt: serverTimestamp()
        });
        
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
      
      displayUserReview(userReview);
      loadComments();
      
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      showToast('error', 'Erro', 'Não foi possível salvar sua avaliação.');
    } finally {
      this.disabled = false;
      this.textContent = 'Enviar Avaliação';
    }
  });
}

// ===== EDITAR AVALIAÇÃO =====
if (editReviewBtn) {
    editReviewBtn.addEventListener('click', async function(e) {
        e.stopPropagation();
        if (!userReview) return;
        
        const confirmed = await showConfirmModal({
            title: 'Editar Avaliação',
            message: 'Deseja editar sua avaliação de "' + movieData.nome + '"?',
            type: 'info',
            confirmText: 'Editar',
            cancelText: 'Cancelar'
        });
        
        if (!confirmed) return;
        
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

// ===== EXCLUIR AVALIAÇÃO =====
async function deleteReviewWithConfirm() {
    if (!userReview) return;
    
    const confirmed = await showConfirmModal({
        title: 'Excluir Avaliação',
        message: 'Tem certeza que deseja excluir sua avaliação de "' + movieData.nome + '"? Esta ação não pode ser desfeita.',
        type: 'danger',
        danger: true,
        confirmText: 'Excluir',
        cancelText: 'Cancelar'
    });
    
    if (!confirmed) return;
    
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

if (deleteReviewBtn2) {
    const newDeleteBtn = deleteReviewBtn2.cloneNode(true);
    deleteReviewBtn2.parentNode.replaceChild(newDeleteBtn, deleteReviewBtn2);
    newDeleteBtn.addEventListener('click', deleteReviewWithConfirm);
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
        
        let currentRating = 0;
        const scoreEl = document.getElementById(`tech-score-${cat}`);
        
        for (let i = 0; i < 5; i++) {
            const wrapper = document.createElement('div');
            wrapper.className = 'tech-star-wrapper';
            wrapper.style.cssText = 'position:relative;display:inline-block;width:1.2rem;height:1.2rem;font-size:1.2rem;line-height:1;cursor:pointer;';
            wrapper.dataset.starIndex = i;
            wrapper.dataset.category = cat;
            
            const base = document.createElement('span');
            base.className = 'tech-star-base';
            base.textContent = '☆';
            base.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;color:#444;text-align:center;line-height:1;font-size:inherit;z-index:1;pointer-events:none;display:flex;align-items:center;justify-content:center;';
            
            const halfLeft = document.createElement('span');
            halfLeft.className = 'tech-star-half-left';
            halfLeft.textContent = '★';
            halfLeft.style.cssText = 'position:absolute;top:0;left:0;width:50%;height:100%;color:#f5a623;overflow:hidden;z-index:2;pointer-events:none;line-height:1;font-size:inherit;opacity:0;transition:opacity 0.15s;display:flex;align-items:center;justify-content:flex-start;';
            
            const fullStar = document.createElement('span');
            fullStar.className = 'tech-star-full';
            fullStar.textContent = '★';
            fullStar.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;color:#f5a623;z-index:3;pointer-events:none;line-height:1;font-size:inherit;opacity:0;transition:opacity 0.15s;display:flex;align-items:center;justify-content:center;';
            
            const clickLeft = document.createElement('div');
            clickLeft.className = 'tech-click-left';
            clickLeft.style.cssText = 'position:absolute;top:0;left:0;width:50%;height:100%;z-index:5;cursor:pointer;';
            clickLeft.dataset.starIndex = i;
            clickLeft.dataset.category = cat;
            clickLeft.dataset.half = 'left';
            
            const clickRight = document.createElement('div');
            clickRight.className = 'tech-click-right';
            clickRight.style.cssText = 'position:absolute;top:0;left:50%;width:50%;height:100%;z-index:5;cursor:pointer;';
            clickRight.dataset.starIndex = i;
            clickRight.dataset.category = cat;
            clickRight.dataset.half = 'right';
            
            clickLeft.addEventListener('click', function(e) {
                e.stopPropagation();
                const starIndex = parseInt(this.dataset.starIndex);
                const category = this.dataset.category;
                currentRating = starIndex + 0.5;
                updateTechStarDisplay(category, currentRating);
                if (scoreEl) {
                    scoreEl.textContent = currentRating.toFixed(1);
                }
                container.dataset.rating = currentRating;
            });
            
            clickRight.addEventListener('click', function(e) {
                e.stopPropagation();
                const starIndex = parseInt(this.dataset.starIndex);
                const category = this.dataset.category;
                currentRating = starIndex + 1;
                updateTechStarDisplay(category, currentRating);
                if (scoreEl) {
                    scoreEl.textContent = currentRating.toFixed(1);
                }
                container.dataset.rating = currentRating;
            });
            
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
                const currentRatingValue = parseFloat(container.dataset.rating) || 0;
                updateTechStarDisplay(cat, currentRatingValue);
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
        
        container.dataset.rating = 0;
    });
}

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
            const container = document.getElementById(`tech-${cat}`);
            if (!container) return;
            
            const rating = parseFloat(container.dataset.rating) || 0;
            if (rating > 0) {
                technicalRatings[cat] = rating;
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
            
            const dataToSave = {
                ...technicalRatings,
                filmeId: movieId,
                uid: currentUser.uid,
                nomeUsuario: currentUserData?.nome || currentUser.displayName || 'Usuário',
                loginUsuario: currentUserData?.login || 'usuario',
                updatedAt: serverTimestamp()
            };
            
            if (!snapshot.empty) {
                const docId = snapshot.docs[0].id;
                await updateDoc(doc(db, 'avaliacoes_tecnicas', docId), dataToSave);
                showToast('success', 'Atualizado!', 'Suas avaliações técnicas foram atualizadas.');
            } else {
                dataToSave.createdAt = serverTimestamp();
                await addDoc(collection(db, 'avaliacoes_tecnicas'), dataToSave);
                showToast('success', 'Salvo!', 'Suas avaliações técnicas foram salvas.');
            }
            
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

// ===== CARREGAR AVALIAÇÕES TÉCNICAS SALVAS =====
async function loadTechnicalReviews() {
    if (!currentUser || !movieId) return;
    
    try {
        const techRef = collection(db, 'avaliacoes_tecnicas');
        const q = query(
            techRef,
            where('filmeId', '==', movieId),
            where('uid', '==', currentUser.uid)
        );
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
            const data = snapshot.docs[0].data();
            const categories = ['fotografia', 'som', 'atuacao', 'roteiro', 'direcao', 'montagem', 'direcaoArte'];
            
            categories.forEach(cat => {
                if (data[cat] && data[cat] > 0) {
                    const container = document.getElementById(`tech-${cat}`);
                    if (container) {
                        container.dataset.rating = data[cat];
                        updateTechStarDisplay(cat, data[cat]);
                        
                        const scoreEl = document.getElementById(`tech-score-${cat}`);
                        if (scoreEl) {
                            scoreEl.textContent = data[cat].toFixed(1);
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Erro ao carregar avaliações técnicas:', error);
    }
}

// ===== EVENTOS DO MODAL DE EDIÇÃO =====
const closeEditReplyModal = document.getElementById('closeEditReplyModal');
if (closeEditReplyModal) {
    closeEditReplyModal.addEventListener('click', () => {
        document.getElementById('editReplyModal').classList.add('hidden');
    });
}

const editReplyModal = document.getElementById('editReplyModal');
if (editReplyModal) {
    editReplyModal.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            editReplyModal.classList.add('hidden');
        }
    });
}

const saveEditReplyBtn = document.getElementById('saveEditReplyBtn');
if (saveEditReplyBtn) {
    saveEditReplyBtn.addEventListener('click', saveEditedReply);
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('editReplyModal');
        if (modal) modal.classList.add('hidden');
    }
});

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
      await loadTechnicalReviews();
      loadComments();
    }
  }
});

// ===== INICIALIZAR MODAL DE EDIÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('editReplyModal');
    if (modal) {
        modal.classList.add('hidden');
    }
});

console.log('Cine Clube Xiquete - Filme carregado!');