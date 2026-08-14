// ============================================
// 검색/필터바 렌더 + 게임 카드 그리드 + 검색·필터·정렬
// ============================================

const state = {
  keyword: '',
  category: '전체',
  sort: 'latest', // 'latest' | 'popular'
};

// --- 필터바 렌더 ---
function renderFilterBar() {
  const el = document.getElementById('filterBarPlaceholder');
  el.innerHTML = `
    <div class="filter-bar">
      <div class="search-box">
        <svg class="icon" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" id="searchInput" placeholder="게임 제목으로 검색" autocomplete="off">
      </div>

      <div class="filter-pills" id="categoryPills">
        ${CATEGORIES.map(cat => `
          <button type="button" class="pill ${cat === state.category ? 'active' : ''}" data-category="${cat}">${cat}</button>
        `).join('')}
      </div>

      <select id="sortSelect" class="sort-select">
        <option value="latest" ${state.sort === 'latest' ? 'selected' : ''}>최신순</option>
        <option value="popular" ${state.sort === 'popular' ? 'selected' : ''}>인기순</option>
      </select>
    </div>
  `;

  document.getElementById('searchInput').addEventListener('input', (e) => {
    state.keyword = e.target.value.trim();
    renderGrid();
  });

  document.getElementById('categoryPills').addEventListener('click', (e) => {
    const btn = e.target.closest('.pill');
    if (!btn) return;
    state.category = btn.dataset.category;
    renderFilterBar(); // active 상태 갱신을 위해 다시 렌더
    renderGrid();
  });

  document.getElementById('sortSelect').addEventListener('change', (e) => {
    state.sort = e.target.value;
    renderGrid();
  });
}

// --- 필터링 + 정렬 ---
function getFilteredGames() {
  let list = GAMES.filter(g => {
    const matchKeyword = g.title.toLowerCase().includes(state.keyword.toLowerCase());
    const matchCategory = state.category === '전체' || g.category === state.category;
    return matchKeyword && matchCategory;
  });

  if (state.sort === 'latest') {
    list = list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } else {
    list = list.sort((a, b) => b.plays - a.plays);
  }
  return list;
}

// --- Supabase에서 게임 목록 불러오기 ---
async function loadGames() {
  const { data, error } = await sb
    .from('games')
    .select('*, profiles(display_name)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('게임 목록을 불러오지 못했습니다:', error.message);
    GAMES = [];
    return;
  }
  GAMES = data;
}

// --- 게임 카드 그리드 렌더 ---
function renderGrid() {
  const grid = document.getElementById('gameGrid');
  const games = getFilteredGames();

  if (games.length === 0) {
    grid.innerHTML = `<p class="empty-state">검색 결과가 없습니다.</p>`;
    return;
  }

  grid.innerHTML = `
    <div class="game-grid">
      ${games.map(g => `
        <article class="game-card" data-id="${g.id}" tabindex="0">
          <div class="card-thumb">
            <svg class="icon" viewBox="0 0 24 24">
              <line x1="6" y1="12" x2="10" y2="12"/>
              <line x1="8" y1="10" x2="8" y2="14"/>
              <circle cx="16" cy="11" r="1"/>
              <circle cx="18.5" cy="13.5" r="1"/>
              <path d="M7 6h10a5 5 0 0 1 5 5v3a4 4 0 0 1-4 4c-1 0-1.6-.4-2.3-1.1L14 15.3a3 3 0 0 0-2-.8h0a3 3 0 0 0-2 .8l-1.7 1.6C7.6 17.6 7 18 6 18a4 4 0 0 1-4-4v-3a5 5 0 0 1 5-5z"/>
            </svg>
          </div>
          <div class="card-body">
            <span class="tag">${g.category}</span>
            <h3 class="card-title">${g.title}</h3>
            <p class="card-meta">by ${g.profiles?.display_name ?? '익명'} · 플레이 ${g.plays.toLocaleString()}회</p>
          </div>
        </article>
      `).join('')}
    </div>
  `;

  // 카드 클릭 → 재생 모달 오픈
  grid.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = Number(card.dataset.id);
      const game = GAMES.find(g => g.id === id);
      if (game) openPlayModal(game);
    });
  });
}

// ============================================
// 재생 모달 (iframe 팝업)
// ============================================

function initPlayModal() {
  const modal = document.getElementById('playModal');
  modal.classList.add('modal-overlay');
  modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <h3 id="playModalTitle"></h3>
        <button type="button" class="icon-btn" id="closePlayModal" aria-label="닫기">
          <svg class="icon" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <iframe id="playFrame" class="play-frame" title="게임 화면"
                sandbox="allow-scripts allow-pointer-lock allow-forms allow-popups"></iframe>
      </div>
    </div>
  `;

  document.getElementById('closePlayModal').addEventListener('click', closePlayModal);

  // 오버레이(바깥 영역) 클릭 시 닫기 — 모달 박스 클릭은 제외
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closePlayModal();
  });

  // ESC 키로 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closePlayModal();
  });
}

function getGamePublicUrl(filePath) {
  const { data } = sb.storage.from('game-files').getPublicUrl(filePath);
  return data.publicUrl;
}

async function openPlayModal(game) {
  document.getElementById('playModalTitle').textContent = game.title;

  const frame = document.getElementById('playFrame');
  frame.srcdoc = '<p style="font-family:sans-serif;color:#787774;padding:20px">불러오는 중...</p>';

  document.getElementById('playModal').classList.add('is-open');
  document.body.style.overflow = 'hidden';

  // Supabase Storage가 공개 버킷의 HTML을 text/plain으로 강제 서빙하기 때문에
  // <iframe src="..."> 로는 실행이 안 됨 → fetch로 원문을 받아 srcdoc에 주입해서 실행시킨다.
  try {
    const res = await fetch(getGamePublicUrl(game.file_path));
    if (!res.ok) throw new Error(`파일을 불러오지 못했습니다 (${res.status})`);
    frame.srcdoc = await res.text();
  } catch (err) {
    frame.srcdoc = `<p style="font-family:sans-serif;color:#E03E3E;padding:20px">게임을 불러오지 못했습니다: ${err.message}</p>`;
    return;
  }

  // 플레이 수 증가 (낙관적 업데이트 + 서버 반영)
  game.plays += 1;
  renderGrid();
  sb.rpc('increment_plays', { game_id: game.id }).then(({ error }) => {
    if (error) console.error('플레이 수 반영 실패:', error.message);
  });
}

function closePlayModal() {
  document.getElementById('playModal').classList.remove('is-open');
  document.getElementById('playFrame').srcdoc = '';
  document.body.style.overflow = '';
}

// ============================================
// 업로드 모달 (Storage 업로드 + DB 저장, 로그인 필수)
// ============================================

function initUploadModal() {
  const modal = document.getElementById('uploadModal');
  modal.classList.add('modal-overlay');
  const gameCategories = CATEGORIES.filter(c => c !== '전체');

  modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <h3>게임 업로드</h3>
        <button type="button" class="icon-btn" id="closeUploadModal" aria-label="닫기">
          <svg class="icon" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <form id="uploadForm">
          <div class="field">
            <label for="uploadTitle">게임 제목</label>
            <input type="text" id="uploadTitle" placeholder="예: 스페이스 러너" required>
          </div>
          <div class="field">
            <label for="uploadCategory">카테고리</label>
            <select id="uploadCategory">
              ${gameCategories.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>게임 파일 (.html 단일 파일, 최대 5MB)</label>
            <label class="file-drop" id="fileDrop" for="uploadFile">
              <svg class="icon" viewBox="0 0 24 24">
                <path d="M12 19V5"/>
                <path d="M5 12l7-7 7 7"/>
              </svg>
              <span id="fileDropText">HTML 파일을 선택하거나 끌어다 놓으세요</span>
            </label>
            <input type="file" id="uploadFile" accept=".html,text/html" hidden>
          </div>
          <p class="auth-error" id="uploadError"></p>
          <button type="submit" class="btn btn-block" id="uploadSubmitBtn">업로드하기</button>
        </form>
      </div>
    </div>
  `;

  const openBtn = document.getElementById('openUploadBtn');
  const fileInput = document.getElementById('uploadFile');
  const fileDropText = document.getElementById('fileDropText');
  const form = document.getElementById('uploadForm');

  openBtn.addEventListener('click', () => {
    if (!currentUser) {
      showToast('업로드는 관리자 로그인 후 이용할 수 있어요.');
      openAuthModal('signin');
      return;
    }
    if (!isAdmin) {
      showToast('업로드는 관리자만 가능합니다.');
      return;
    }
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  });

  document.getElementById('closeUploadModal').addEventListener('click', closeUploadModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeUploadModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeUploadModal();
  });

  const fileDrop = document.getElementById('fileDrop');

  fileInput.addEventListener('change', () => {
    fileDropText.textContent = fileInput.files[0] ? fileInput.files[0].name : 'HTML 파일을 선택하거나 끌어다 놓으세요';
  });

  // 드래그 앤 드롭 지원
  ['dragenter', 'dragover'].forEach(evt => {
    fileDrop.addEventListener(evt, (e) => {
      e.preventDefault();
      fileDrop.classList.add('dragover');
    });
  });
  ['dragleave', 'drop'].forEach(evt => {
    fileDrop.addEventListener(evt, (e) => {
      e.preventDefault();
      fileDrop.classList.remove('dragover');
    });
  });
  fileDrop.addEventListener('drop', (e) => {
    const dropped = e.dataTransfer.files;
    if (dropped.length) {
      fileInput.files = dropped;
      fileDropText.textContent = dropped[0].name;
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser || !isAdmin) return; // 방어적 체크 (버튼 단계에서 이미 막힘)

    const errorEl = document.getElementById('uploadError');
    const submitBtn = document.getElementById('uploadSubmitBtn');
    errorEl.textContent = '';

    const title = document.getElementById('uploadTitle').value.trim();
    const category = document.getElementById('uploadCategory').value;
    const file = fileInput.files[0];

    if (!title) return;
    if (!file) {
      errorEl.textContent = '게임 파일(.html)을 선택해주세요.';
      return;
    }
    if (!file.name.toLowerCase().endsWith('.html')) {
      errorEl.textContent = 'HTML 파일만 업로드할 수 있어요.';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '업로드 중...';

    const filePath = `${currentUser.id}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await sb.storage
      .from('game-files')
      .upload(filePath, file, { contentType: 'text/html' });

    if (uploadError) {
      errorEl.textContent = `파일 업로드 실패: ${uploadError.message}`;
      submitBtn.disabled = false;
      submitBtn.textContent = '업로드하기';
      return;
    }

    const { error: insertError } = await sb.from('games').insert({
      title,
      category,
      author_id: currentUser.id,
      file_path: filePath,
    });

    submitBtn.disabled = false;
    submitBtn.textContent = '업로드하기';

    if (insertError) {
      await sb.storage.from('game-files').remove([filePath]); // 롤백
      errorEl.textContent = `등록 실패: ${insertError.message}`;
      return;
    }

    // 새로 올린 게임이 바로 보이도록 필터 초기화 후 목록 새로고침
    state.keyword = '';
    state.category = '전체';
    state.sort = 'latest';
    renderFilterBar();
    await loadGames();
    renderGrid();

    form.reset();
    fileDropText.textContent = 'HTML 파일을 선택하거나 끌어다 놓으세요';
    closeUploadModal();
    showToast(`"${title}" 업로드 완료!`);
  });
}

function closeUploadModal() {
  document.getElementById('uploadModal').classList.remove('is-open');
  document.body.style.overflow = '';
}

// --- 토스트 알림 ---
function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

// --- 초기 실행 ---
async function init() {
  renderFilterBar();
  document.getElementById('gameGrid').innerHTML = `<p class="empty-state">불러오는 중...</p>`;
  await loadGames();
  renderGrid();
  initPlayModal();
  initUploadModal();
}
init();
