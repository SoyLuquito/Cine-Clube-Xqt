import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  collection,
  query,
  where,
  getDocs
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const loginSection = document.getElementById('login-section');
const registerSection = document.getElementById('register-section');
const goToRegister = document.getElementById('go-to-register');
const goToLogin = document.getElementById('go-to-login');

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

// Login fields
const loginLogin = document.getElementById('login-login');
const loginSenha = document.getElementById('login-senha');

// Register fields
const regNome = document.getElementById('reg-nome');
const regEmail = document.getElementById('reg-email');
const regLogin = document.getElementById('reg-login');
const regSenha = document.getElementById('reg-senha');
const regConfirma = document.getElementById('reg-confirma');

// ===== SISTEMA DE NOTIFICAÇÕES =====
function showNotification(type, title, message, duration = 4000) {
  const container = document.getElementById('notification-container');
  
  // Criar elemento da notificação
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  
  // Ícones SVG por tipo
  const icons = {
    success: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    `,
    error: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    `,
    info: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
    `,
    warning: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 9v4"/>
        <path d="M12 17h.01"/>
        <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z"/>
      </svg>
    `
  };
  
  notification.innerHTML = `
    <div class="notification-icon">${icons[type] || icons.info}</div>
    <div class="notification-content">
      <div class="notification-title">${title}</div>
      <div class="notification-message">${message}</div>
    </div>
    <button class="notification-close" aria-label="Fechar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  `;
  
  // Adicionar ao container
  container.appendChild(notification);
  
  // Botão fechar
  const closeBtn = notification.querySelector('.notification-close');
  closeBtn.addEventListener('click', () => {
    removeNotification(notification);
  });
  
  // Auto remover após duração
  if (duration > 0) {
    setTimeout(() => {
      removeNotification(notification);
    }, duration);
  }
  
  return notification;
}

function removeNotification(notification) {
  if (notification.classList.contains('hiding')) return;
  
  notification.classList.add('hiding');
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 300);
}

// ===== TOGGLE BETWEEN LOGIN AND REGISTER =====
function showLogin() {
  loginSection.classList.remove('hidden');
  registerSection.classList.add('hidden');
}

function showRegister() {
  registerSection.classList.remove('hidden');
  loginSection.classList.add('hidden');
}

goToRegister.addEventListener('click', (e) => {
  e.preventDefault();
  showRegister();
});

goToLogin.addEventListener('click', (e) => {
  e.preventDefault();
  showLogin();
});

// ===== TOGGLE PASSWORD =====
const toggleButtons = document.querySelectorAll('.toggle-password');

toggleButtons.forEach(button => {
  button.addEventListener('click', function(e) {
    e.preventDefault();
    const wrapper = this.closest('.password-wrapper');
    const input = wrapper.querySelector('input');
    
    if (!input) return;

    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    
    const svg = this.querySelector('svg');
    if (isPassword) {
      svg.innerHTML = `
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      `;
    } else {
      svg.innerHTML = `
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      `;
    }
  });
});

// ===== EMAIL VALIDATION =====
regEmail.addEventListener('input', function() {
  let value = this.value.replace(/\s/g, '');
  this.value = value;

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const wrapper = this.closest('.input-wrapper');
  
  if (this.value.length > 0 && !emailPattern.test(this.value)) {
    wrapper.classList.add('error');
  } else {
    wrapper.classList.remove('error');
  }
});

// ===== PASSWORD CONFIRMATION VALIDATION =====
regConfirma.addEventListener('input', function() {
  const senha = regSenha.value;
  const confirma = this.value;
  const wrapper = this.closest('.input-wrapper');

  if (confirma.length > 0 && senha !== confirma) {
    wrapper.classList.add('error');
  } else {
    wrapper.classList.remove('error');
  }
});

regSenha.addEventListener('input', function() {
  if (regConfirma.value.length > 0) {
    const event = new Event('input');
    regConfirma.dispatchEvent(event);
  }
});

// ===== CHECK IF LOGIN EXISTS =====
async function checkLoginExists(login) {
  try {
    const docRef = doc(db, 'usuarios', login);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.error('Erro ao verificar login:', error);
    try {
      const usuariosRef = collection(db, 'usuarios');
      const q = query(usuariosRef, where('login', '==', login));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error2) {
      console.error('Erro no fallback:', error2);
      return false;
    }
  }
}

// ===== REGISTER =====
registerForm.addEventListener('submit', async function(e) {
  e.preventDefault();

  const nome = regNome.value.trim();
  const email = regEmail.value.trim();
  const login = regLogin.value.trim();
  const senha = regSenha.value.trim();
  const confirma = regConfirma.value.trim();

  // Validations
  if (!nome || !email || !login || !senha || !confirma) {
    showNotification('error', 'Campos incompletos', 'Preencha todos os campos para continuar.');
    return;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    showNotification('error', 'Email inválido', 'Por favor, insira um email válido (ex: usuario@dominio.com).');
    regEmail.focus();
    return;
  }

  if (senha.length < 6) {
    showNotification('error', 'Senha fraca', 'A senha deve ter pelo menos 6 caracteres.');
    regSenha.focus();
    return;
  }

  if (senha !== confirma) {
    showNotification('error', 'Senhas não coincidem', 'Verifique se as senhas digitadas são iguais.');
    regConfirma.focus();
    return;
  }

  // Check if login already exists
  const loginExists = await checkLoginExists(login);
  if (loginExists) {
    showNotification('error', 'Login indisponível', 'Este login já está em uso. Escolha outro.');
    regLogin.focus();
    regLogin.select();
    return;
  }

  // Desabilitar botão
  const submitBtn = registerForm.querySelector('.btn-primary');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Criando conta...';

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
    const user = userCredential.user;

    await updateProfile(user, {
      displayName: nome
    });

    await setDoc(doc(db, 'usuarios', login), {
      uid: user.uid,
      nome: nome,
      email: email,
      login: login,
      createdAt: new Date().toISOString()
    });

    console.log('Usuário criado com sucesso!');
    showNotification('success', 'Conta criada! 🎬', 'Bem-vindo(a) ao Cine Clube Xiquete!');
    
    setTimeout(() => {
      window.location.href = 'menu.html';
    }, 1500);
    
  } catch (error) {
    console.error('Erro no cadastro:', error);
    
    let message = 'Ocorreu um erro ao criar sua conta. Tente novamente.';
    if (error.code === 'auth/email-already-in-use') {
      message = 'Este email já está cadastrado. Faça login ou use outro email.';
    } else if (error.code === 'auth/weak-password') {
      message = 'A senha é muito fraca. Use pelo menos 6 caracteres com letras e números.';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Email inválido. Verifique o formato.';
    }
    
    showNotification('error', 'Erro no cadastro', message);
    
    submitBtn.disabled = false;
    submitBtn.textContent = 'criar conta';
  }
});

// ===== LOGIN =====
loginForm.addEventListener('submit', async function(e) {
  e.preventDefault();

  const login = loginLogin.value.trim();
  const senha = loginSenha.value.trim();

  if (!login || !senha) {
    showNotification('error', 'Campos incompletos', 'Preencha login e senha.');
    return;
  }

  const submitBtn = loginForm.querySelector('.btn-primary');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Entrando...';

  try {
    const docRef = doc(db, 'usuarios', login);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      showNotification('error', 'Login não encontrado', 'Verifique seu login ou cadastre-se.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'entrar';
      return;
    }

    const userData = docSnap.data();
    const email = userData.email;

    await signInWithEmailAndPassword(auth, email, senha);
    
    console.log('Login realizado com sucesso!');
    showNotification('success', 'Bem-vindo(a)! 🎬', 'Login realizado com sucesso!');
    
    setTimeout(() => {
      window.location.href = 'menu.html';
    }, 1500);
    
  } catch (error) {
    console.error('Erro no login:', error);
    
    let message = 'Ocorreu um erro ao fazer login. Tente novamente.';
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      message = 'Login ou senha incorretos. Verifique seus dados.';
    } else if (error.code === 'auth/too-many-requests') {
      message = 'Muitas tentativas falhas. Tente novamente mais tarde.';
    }
    
    showNotification('error', 'Erro no login', message);
    
    submitBtn.disabled = false;
    submitBtn.textContent = 'entrar';
  }
});

// ===== INIT =====
showLogin();

setTimeout(() => {
  const firstInput = loginSection.querySelector('input');
  if (firstInput) firstInput.focus();
}, 200);