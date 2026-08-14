// ============================================
// 검색/필터바 렌더 + 게임 카드 그리드 + 검색·필터·정렬
// ============================================

const state = {
  keyword: '',
  category: '전체',
  sort: 'latest', // 'latest' | 'popular'
};

// 로그인한 사용자의 게임별 최고 점수 (game_id -> score)
let myScores = {};

// --- 게임 카드 썸네일 아이콘 ---
// 제목이 일치하는 게임은 전용 아이콘을, 그 외에는 카테고리 기본 아이콘을 보여준다.
// (기존 디자인 시스템의 라인 아이콘 스타일(.icon)을 그대로 따름 — 색/두께는 CSS 토큰이 담당)
const GAME_ICONS = {
  '벽돌깨기': '<rect x="3" y="4" width="6" height="3"/><rect x="10" y="4" width="6" height="3"/><rect x="17" y="4" width="4" height="3"/><rect x="5" y="9" width="6" height="3"/><rect x="12" y="9" width="6" height="3"/><circle cx="12" cy="18" r="2"/>',
  '업 다운 숫자 맞추기 !': '<path d="M12 3v7"/><path d="M8 7l4-4 4 4"/><path d="M12 21v-7"/><path d="M8 17l4 4 4-4"/>',
  '두더지 잡기': '<ellipse cx="12" cy="19" rx="8" ry="2"/><path d="M8 19c0-5 2-9 4-9s4 4 4 9"/><circle cx="10" cy="13" r="1"/><circle cx="14" cy="13" r="1"/>',
  '점프 러너': '<path d="M3 19q9-16 18 0"/><rect x="9" y="15" width="4" height="4"/>',
  '2048 미니': '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/>',
  '카드 짝맞추기': '<rect x="3" y="5" width="10" height="14" rx="2"/><rect x="11" y="5" width="10" height="14" rx="2"/>',
  '클릭 스피드 챌린지': '<circle cx="12" cy="12" r="4"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="M2 12h3"/><path d="M19 12h3"/>',
  '색깔 기억하기': '<circle cx="12" cy="12" r="9"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/>',
  '풍선 터뜨리기': '<ellipse cx="12" cy="9" rx="6" ry="7"/><path d="M12 16l-1.5 3h3z"/><path d="M12 19v3"/>',
  '틱택토 vs AI': '<path d="M9 3v18"/><path d="M15 3v18"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M10.5 10.5l3 3"/><path d="M13.5 10.5l-3 3"/>',
  '컬러 채우기': '<path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z"/>',
  '미니 오목': '<path d="M3 8h18"/><path d="M3 14h18"/><path d="M8 3v18"/><path d="M14 3v18"/><circle cx="8" cy="8" r="1.6"/><circle cx="14" cy="14" r="1.6"/>',
  '3차선 카레이싱': '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/><path d="M12 4v6"/><path d="M6.5 15.5l4-2.5"/><path d="M17.5 15.5l-4-2.5"/>',
  '커브 도로 레이싱': '<path d="M8 21C8 15 4 13 4 9S8 3 8 3"/><path d="M16 21c0-6-4-8-4-12s4-6 4-6"/>',
  '코인 레이싱': '<circle cx="12" cy="12" r="8"/><path d="M12 8v8"/><path d="M9.5 10a2.5 2.5 0 0 1 2.5-2c1.4 0 2.5.9 2.5 2s-1.1 2-2.5 2-2.5.9-2.5 2 1.1 2 2.5 2 2.5-.9 2.5-2"/>',
  '스페이스 슈터': '<path d="M12 2c3 3 4 7 4 11l-4 3-4-3c0-4 1-8 4-11z"/><path d="M9 15l-3 4h3z"/><path d="M15 15l3 4h-3z"/><circle cx="12" cy="9" r="1.4"/>',
  '갤럭시 슈팅': '<ellipse cx="12" cy="12" rx="9" ry="3"/><path d="M8 12c0-3 2-6 4-6s4 3 4 6"/><circle cx="12" cy="9" r="1"/>',
  '타겟 슈팅': '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="M2 12h3"/><path d="M19 12h3"/>',
};

// 아이콘이 등록되지 않은 게임(새로 업로드된 게임 등)을 위한 카테고리별 기본 아이콘
const CATEGORY_ICONS = {
  '액션': '<path d="M13 2 4 14h6l-1 8 9-12h-6z"/>',
  '퍼즐': '<path d="M6 3h6v3a2 2 0 1 0 0 4v0-4H3v6h3a2 2 0 1 1 0 4H3v5h6a2 2 0 1 1 4 0h6v-6a2 2 0 1 1 0-4v-6h-6a2 2 0 1 1-4 0V3z"/>',
  '캐주얼': '<path d="M12 2l2.5 6.5L21 9l-5 4.5L17.5 20 12 16.5 6.5 20 8 13.5 3 9l6.5-.5z"/>',
  '전략': '<path d="M9 3h6v3H9z"/><path d="M8 6h8l-1 5H9z"/><path d="M12 11v6"/><path d="M8 21h8"/><path d="M9 21c0-2 1.5-3 3-3s3 1 3 3"/>',
  '레이싱': '<path d="M4 4v16"/><path d="M4 5h6l2 2h8v6h-8l-2-2H4"/>',
  '슈팅': '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="M2 12h3"/><path d="M19 12h3"/>',
};

const DEFAULT_ICON = '<line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><circle cx="16" cy="11" r="1"/><circle cx="18.5" cy="13.5" r="1"/><path d="M7 6h10a5 5 0 0 1 5 5v3a4 4 0 0 1-4 4c-1 0-1.6-.4-2.3-1.1L14 15.3a3 3 0 0 0-2-.8h0a3 3 0 0 0-2 .8l-1.7 1.6C7.6 17.6 7 18 6 18a4 4 0 0 1-4-4v-3a5 5 0 0 1 5-5z"/>';

function getGameThumbIcon(game) {
  return GAME_ICONS[game.title] || CATEGORY_ICONS[game.category] || DEFAULT_ICON;
}

// --- 내 최고 점수 목록 불러오기 (로그인 상태 바뀔 때 auth.js에서 호출) ---
async function loadMyScores() {
  if (!currentUser) {
    myScores = {};
    renderGrid();
    return;
  }
  const { data, error } = await sb.from('high_scores').select('game_id, score');
  if (error) {
    console.error('점수 기록을 불러오지 못했습니다:', error.message);
    return;
  }
  myScores = {};
  for (const row of data) myScores[row.game_id] = row.score;
  renderGrid();
}

// --- 최고 점수 갱신 시도 (더 높을 때만 서버에 반영) ---
async function submitScore(gameId, score) {
  if (!currentUser) return;
  const prev = myScores[gameId] || 0;
  if (score <= prev) return;

  const { error } = await sb.rpc('submit_score', { p_game_id: gameId, p_score: score });
  if (error) {
    console.error('점수 기록 실패:', error.message);
    return;
  }
  myScores[gameId] = score;
  showToast(`최고 점수 갱신: ${score.toLocaleString()}`);
  renderGrid();
}

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
            <svg class="icon" viewBox="0 0 24 24">${getGameThumbIcon(g)}</svg>
          </div>
          <div class="card-body">
            <span class="tag">${g.category}</span>
            <h3 class="card-title">${g.title}</h3>
            <p class="card-meta">by ${g.profiles?.display_name ?? '익명'} · 플레이 ${g.plays.toLocaleString()}회</p>
            ${myScores[g.id] ? `<p class="card-meta">내 최고 점수: ${myScores[g.id].toLocaleString()}</p>` : ''}
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
        <div id="playStartScreen" class="play-start">
          <span class="tag" id="playStartTag"></span>
          <p class="card-meta" id="playStartScore"></p>
          <button type="button" class="btn" id="startGameBtn">시작하기</button>
        </div>
        <div id="playLoading" class="play-start" hidden>
          <p class="card-meta">불러오는 중...</p>
        </div>
        <iframe id="playFrame" class="play-frame" title="게임 화면" hidden
                sandbox="allow-scripts allow-pointer-lock allow-forms allow-popups"></iframe>
      </div>
    </div>
  `;

  document.getElementById('closePlayModal').addEventListener('click', closePlayModal);
  document.getElementById('startGameBtn').addEventListener('click', startPendingGame);

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

// 현재 재생 모달이 열려있는 동안의 점수 메시지 리스너 (닫을 때 반드시 해제)
let currentScoreHandler = null;
// 시작 대기 화면에서 "시작하기"를 누르면 실행할 게임
let pendingGame = null;
// 현재 iframe에 로드된 게임의 blob URL (닫거나 새로 시작할 때 해제)
let currentGameBlobUrl = null;

function openPlayModal(game) {
  pendingGame = game;

  document.getElementById('playModalTitle').textContent = game.title;
  document.getElementById('playStartTag').textContent = game.category;
  document.getElementById('playStartScore').textContent = myScores[game.id]
    ? `내 최고 점수: ${myScores[game.id].toLocaleString()}`
    : '아직 플레이 기록이 없어요';

  document.getElementById('playStartScreen').hidden = false;
  document.getElementById('playLoading').hidden = true;
  const frame = document.getElementById('playFrame');
  frame.hidden = true;
  frame.src = 'about:blank';
  if (currentGameBlobUrl) {
    URL.revokeObjectURL(currentGameBlobUrl);
    currentGameBlobUrl = null;
  }

  document.getElementById('playModal').classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

async function startPendingGame() {
  const game = pendingGame;
  if (!game) return;

  document.getElementById('playStartScreen').hidden = true;
  document.getElementById('playLoading').hidden = false;
  const frame = document.getElementById('playFrame');

  // 게임이 postMessage({ type: 'gamebox:score', score }) 로 점수를 보내오면 최고 점수 갱신 시도.
  // event.source로 지금 열려있는 게임 iframe이 보낸 메시지인지 확인해서 다른 메시지는 무시.
  if (currentScoreHandler) window.removeEventListener('message', currentScoreHandler);
  currentScoreHandler = (event) => {
    if (event.source !== frame.contentWindow) return;
    if (!event.data || event.data.type !== 'gamebox:score') return;
    const score = Math.floor(Number(event.data.score));
    if (!Number.isFinite(score) || score < 0) return;
    submitScore(game.id, score);
  };
  window.addEventListener('message', currentScoreHandler);

  // Supabase Storage가 공개 버킷의 HTML을 text/plain으로 강제 서빙하기 때문에
  // <iframe src="게임파일URL">로는 실행이 안 됨 → fetch로 원문을 받아온 뒤 blob URL을 만들어 그걸 src로 넣는다.
  // (참고: srcdoc으로 직접 주입하면 sandbox 처리된 opaque-origin 문서가 간헐적으로
  //  전혀 페인트되지 않는 채로 남는 브라우저 렌더링 버그가 있어 blob URL 방식으로 교체함)
  let blobUrl;
  try {
    const res = await fetch(getGamePublicUrl(game.file_path));
    if (!res.ok) throw new Error(`파일을 불러오지 못했습니다 (${res.status})`);
    const html = await res.text();
    blobUrl = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  } catch (err) {
    document.getElementById('playLoading').hidden = true;
    document.getElementById('playStartScreen').hidden = false;
    showToast(`게임을 불러오지 못했습니다: ${err.message}`);
    return;
  }

  document.getElementById('playLoading').hidden = true;
  frame.hidden = false;
  if (currentGameBlobUrl) URL.revokeObjectURL(currentGameBlobUrl);
  currentGameBlobUrl = blobUrl;
  frame.src = blobUrl;

  // 플레이 수 증가 (낙관적 업데이트 + 서버 반영)
  game.plays += 1;
  renderGrid();
  sb.rpc('increment_plays', { game_id: game.id }).then(({ error }) => {
    if (error) console.error('플레이 수 반영 실패:', error.message);
  });
}

function closePlayModal() {
  document.getElementById('playModal').classList.remove('is-open');
  document.getElementById('playFrame').src = 'about:blank';
  if (currentGameBlobUrl) {
    URL.revokeObjectURL(currentGameBlobUrl);
    currentGameBlobUrl = null;
  }
  document.body.style.overflow = '';
  pendingGame = null;
  if (currentScoreHandler) {
    window.removeEventListener('message', currentScoreHandler);
    currentScoreHandler = null;
  }
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
  // auth.js의 최초 로그인 상태 확인이 이 시점보다 먼저 끝났을 수 있으니 한 번 더 동기화
  loadMyScores();
}
init();
