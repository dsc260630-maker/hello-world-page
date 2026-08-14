// ============================================
// 로그인 / 회원가입 / 로그아웃
// ============================================

let currentUser = null;
let isAdmin = false;
let authMode = 'signin'; // 'signin' | 'signup'

// --- 헤더의 로그인 상태 영역 렌더 ---
function renderAuthArea() {
  const el = document.getElementById('authArea');
  if (currentUser) {
    el.innerHTML = `
      <span class="user-email">${currentUser.email}${isAdmin ? '<span class="admin-badge">관리자</span>' : ''}</span>
      <button type="button" class="btn-ghost" id="logoutBtn">로그아웃</button>
    `;
    document.getElementById('logoutBtn').addEventListener('click', async () => {
      await sb.auth.signOut();
      showToast('로그아웃되었습니다.');
    });
  } else {
    el.innerHTML = `
      <button type="button" class="btn-ghost" id="openAuthBtn">로그인</button>
    `;
    document.getElementById('openAuthBtn').addEventListener('click', () => openAuthModal('signin'));
  }
}

// --- 로그인/회원가입 모달 ---
function initAuthModal() {
  const modal = document.getElementById('authModal');
  modal.classList.add('modal-overlay');
  modal.innerHTML = `
    <div class="modal-box modal-auth">
      <div class="modal-header">
        <h3 id="authModalTitle">로그인</h3>
        <button type="button" class="icon-btn" id="closeAuthModal" aria-label="닫기">
          <svg class="icon" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="auth-tabs" id="authTabs">
          <button type="button" class="auth-tab active" data-mode="signin">로그인</button>
          <button type="button" class="auth-tab" data-mode="signup">회원가입</button>
        </div>
        <form id="authForm">
          <div class="field">
            <label for="authEmail">이메일</label>
            <input type="email" id="authEmail" placeholder="you@example.com" required>
          </div>
          <div class="field">
            <label for="authPassword">비밀번호</label>
            <input type="password" id="authPassword" placeholder="6자 이상" minlength="6" required>
          </div>
          <p class="auth-error" id="authError"></p>
          <button type="submit" class="btn btn-block" id="authSubmitBtn">로그인</button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('closeAuthModal').addEventListener('click', closeAuthModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeAuthModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeAuthModal();
  });

  document.getElementById('authTabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.auth-tab');
    if (!tab) return;
    setAuthMode(tab.dataset.mode);
  });

  document.getElementById('authForm').addEventListener('submit', handleAuthSubmit);
}

function setAuthMode(mode) {
  authMode = mode;
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.mode === mode);
  });
  document.getElementById('authModalTitle').textContent = mode === 'signin' ? '로그인' : '회원가입';
  document.getElementById('authSubmitBtn').textContent = mode === 'signin' ? '로그인' : '회원가입';
  document.getElementById('authError').textContent = '';
}

function openAuthModal(mode = 'signin') {
  setAuthMode(mode);
  document.getElementById('authForm').reset();
  document.getElementById('authModal').classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeAuthModal() {
  document.getElementById('authModal').classList.remove('is-open');
  document.body.style.overflow = '';
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const errorEl = document.getElementById('authError');
  const submitBtn = document.getElementById('authSubmitBtn');

  errorEl.textContent = '';
  submitBtn.disabled = true;

  const { error } = authMode === 'signin'
    ? await sb.auth.signInWithPassword({ email, password })
    : await sb.auth.signUp({ email, password });

  submitBtn.disabled = false;

  if (error) {
    errorEl.textContent = error.message;
    return;
  }

  closeAuthModal();
  showToast(authMode === 'signin' ? '로그인되었습니다.' : '회원가입이 완료됐습니다.');
}

// --- 세션 상태 구독 (로그인 시 관리자 여부도 함께 확인) ---
sb.auth.onAuthStateChange(async (_event, session) => {
  currentUser = session ? session.user : null;

  if (currentUser) {
    const { data } = await sb.from('profiles').select('is_admin').eq('id', currentUser.id).single();
    isAdmin = data?.is_admin ?? false;
  } else {
    isAdmin = false;
  }

  renderAuthArea();
  // 페이지 최초 로드 시 이 콜백이 app.js보다 먼저 실행될 수 있어서 존재 여부를 확인하고 호출
  if (typeof loadMyScores === 'function') loadMyScores();
});

initAuthModal();
