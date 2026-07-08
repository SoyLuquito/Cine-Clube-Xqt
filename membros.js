import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { 
  getFirestore, 
  collection,
  query,
  getDocs,
  orderBy
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
const membersContent = document.getElementById('membersContent');
const membersGrid = document.getElementById('membersGrid');
const membersCount = document.getElementById('membersCount');

let allMembers = [];

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

// ===== LOAD MEMBERS =====
async function loadMembers() {
  try {
    const usuariosRef = collection(db, 'usuarios');
    const q = query(usuariosRef, orderBy('nome'));
    const querySnapshot = await getDocs(q);
    
    allMembers = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Pular o admin se quiser (opcional)
      // if (data.email !== 'contato.lucadesousa@gmail.com') {
        allMembers.push({ id: doc.id, ...data });
      // }
    });
    
    displayMembers(allMembers);
    
    loading.classList.add('hidden');
    loading.style.display = 'none';
    membersContent.classList.remove('hidden');
    membersContent.style.display = 'block';
    
  } catch (error) {
    console.error('Erro ao carregar membros:', error);
    showToast('error', 'Erro', 'Não foi possível carregar a lista de membros.');
    loading.innerHTML = `
      <div style="text-align:center;color:#666;">
        <p style="font-size:1.2rem;margin-bottom:8px;">Erro ao carregar</p>
        <p style="font-size:0.9rem;">Tente novamente mais tarde.</p>
        <button onclick="window.location.href='menu.html'" style="margin-top:16px;padding:10px 24px;background:#fd77cb;border:none;border-radius:12px;color:white;font-weight:600;cursor:pointer;">Voltar ao Menu</button>
      </div>
    `;
  }
}

// ===== DISPLAY MEMBERS =====
function displayMembers(members) {
  if (members.length === 0) {
    membersGrid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;color:#666;padding:40px 20px;">
        <p style="font-size:1.1rem;margin-bottom:8px;">Nenhum membro encontrado</p>
        <p style="font-size:0.9rem;">Ainda não há usuários cadastrados no clube.</p>
      </div>
    `;
    membersCount.textContent = '0 membros';
    return;
  }
  
  membersCount.textContent = `${members.length} ${members.length === 1 ? 'membro' : 'membros'}`;
  
  let html = '';
  members.forEach(member => {
    const nome = member.nome || 'Usuário';
    const login = member.login || 'usuario';
    const initial = nome.charAt(0).toUpperCase();
    const bio = member.bio || '';
    
    html += `
      <div class="member-card" onclick="window.location.href='perfil.html?uid=${member.uid}'">
        <div class="member-avatar">
          ${member.fotoPerfil ? `<img src="${member.fotoPerfil}" alt="${nome}">` : 
            `<span>${initial}</span>`}
        </div>
        <div class="member-name">${nome}</div>
        <div class="member-login">@${login}</div>
        ${bio ? `<div class="member-bio">${bio}</div>` : ''}
      </div>
    `;
  });
  
  membersGrid.innerHTML = html;
}

// ===== INIT =====
// Verificar autenticação
onAuthStateChanged(auth, async (user) => {
  if (user) {
    await loadMembers();
  } else {
    window.location.href = 'index.html';
  }
});

console.log('Cine Clube Xiquete - Membros carregado!');