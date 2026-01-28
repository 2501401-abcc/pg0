document.addEventListener('DOMContentLoaded', () => {
  //共通：localStorage読み込み
  function loadMemos(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveMemos(key, memos) {
    localStorage.setItem(key, JSON.stringify(memos));
  }

  //HOME(index.html) の「全体検索」
  const homeSearchInput = document.getElementById('homeSearchInput');
  const homeSearchList = document.getElementById('homeSearchList');
  const homeSearchCount = document.getElementById('homeSearchCount');
  const homeSearchClearBtn = document.getElementById('homeSearchClearBtn');

  if (homeSearchInput && homeSearchList) {
    // working + learning をまとめて取得
    const all = [
      ...loadMemos('memo_working').map(m => ({ ...m, area: 'working' })),
      ...loadMemos('memo_learning').map(m => ({ ...m, area: 'learning' })),
    ];

    function areaLabel(a) {
      return a === 'working' ? '職場関連' : '学習関連';
    }

    function renderHomeSearch() {
      const q = homeSearchInput.value.trim().toLowerCase();
      homeSearchList.innerHTML = '';

      const view = q
        ? all.filter(m =>
            (m.title || '').toLowerCase().includes(q) ||
            (m.content || '').toLowerCase().includes(q)
          )
        : [];

      if (homeSearchCount) homeSearchCount.textContent = String(view.length);

      if (!q) {
        const li = document.createElement('li');
        //li.textContent = '検索キーワードを入力すると結果が出ます。';
        li.textContent = ' ';
        homeSearchList.appendChild(li);
        return;
      }

      if (view.length === 0) {
        const li = document.createElement('li');
        li.textContent = '検索結果がありません。';
        homeSearchList.appendChild(li);
        return;
      }

      // 新しい順
      view.sort((a, b) => (b.id || 0) - (a.id || 0));

      view.forEach(m => {
        const li = document.createElement('li');
        li.className = 'list-item';

        const title = document.createElement('p');
        title.textContent = `【${areaLabel(m.area)}】${m.title || '(no title)'}`;

        const time = document.createElement('p');
        time.textContent = m.createdAt || '';

        const content = document.createElement('p');
        content.textContent = m.content || '';

        // ここはCSSで好きに整えてOK
        li.append(title, time, content);
        homeSearchList.appendChild(li);
      });
    }

    homeSearchInput.addEventListener('input', renderHomeSearch);

    if (homeSearchClearBtn) {
      homeSearchClearBtn.addEventListener('click', () => {
        homeSearchInput.value = '';
        renderHomeSearch();
      });
    }

    renderHomeSearch();
    return; //HOMEのときはここで終了（下のworking/learning処理は不要）
  }
  //B) Working/Learning ページ（メモ追加・検索・一括削除・修正・削除）
  const form = document.getElementById('memoForm');
  if (!form) return;

  const area = form.dataset.area; // "working" or "learning"
  const storageKey = 'memo_' + area;

  // 入力欄
  const titleInput = document.getElementById('titleInput');
  const contentInput = document.getElementById('contentInput');

  // 一覧
  const memoList = document.getElementById('memoList');

  // 検索・一括削除
  const searchInput = document.getElementById('searchInput');
  const searchClearBtn = document.getElementById('searchClearBtn');
  const deleteAllBtn = document.getElementById('deleteAllBtn');
  const countLabel = document.getElementById('countLabel');

  // 日時表示欄（ある場合）
  const dateTimePreview = document.getElementById('dateTimePreview');

  // クリアボタン（ある場合）
  const clearFormBtn = document.getElementById('clearFormBtn');

  let memos = loadMemos(storageKey);

  function updateCount(n) {
    if (countLabel) countLabel.textContent = String(n);
  }

  function nowText() {
    return new Date().toLocaleString();
  }

  //タイトル入力時点で日時を同期表示
  if (titleInput && dateTimePreview) {
    titleInput.addEventListener('input', () => {
      if (titleInput.value.trim() === '') {
        dateTimePreview.textContent = '--:-- / ----/--/--';
      } else {
        dateTimePreview.textContent = nowText();
      }
    });
  }

  function render() {
    memoList.innerHTML = '';

    const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const view = q
      ? memos.filter(m =>
          (m.title || '').toLowerCase().includes(q) ||
          (m.content || '').toLowerCase().includes(q)
        )
      : memos;

    updateCount(view.length);

    if (view.length === 0) {
      const li = document.createElement('li');
      li.textContent = q ? '検索結果がありません。' : 'まだメモがありません。';
      memoList.appendChild(li);
      return;
    }

    view.forEach(memo => {
      const li = document.createElement('li');

      const titleBtn = document.createElement('button');
      titleBtn.type = 'button';
      titleBtn.className = 'title-btn';
      titleBtn.textContent = memo.title;

      const detail = document.createElement('div');
      detail.style.display = 'none';
      detail.className = 'memo-detail';

      const time = document.createElement('p');
      time.className = 'memo-time';
      time.textContent = memo.createdAt;

      const content = document.createElement('p');
      content.textContent = memo.content;

      const editBtn = document.createElement('button');
      editBtn.textContent = '修正';

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '削除';

      //押しても「画面は変わらない」：この中で開閉だけ
      titleBtn.onclick = () => {
        detail.style.display = detail.style.display === 'none' ? 'block' : 'none';
      };

      // 修正：入力欄に戻す（更新扱い）
      editBtn.onclick = () => {
        titleInput.value = memo.title;
        contentInput.value = memo.content;
        if (dateTimePreview) dateTimePreview.textContent = memo.createdAt;

        memos = memos.filter(m => m.id !== memo.id);
        saveMemos(storageKey, memos);
        render();
      };

      //個別削除
      deleteBtn.onclick = () => {
        memos = memos.filter(m => m.id !== memo.id);
        saveMemos(storageKey, memos);
        render();
      };

      detail.append(time, content, editBtn, deleteBtn);
      li.append(titleBtn, detail);
      memoList.appendChild(li);
    });
  }

  //追加
  form.onsubmit = e => {
    e.preventDefault();

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    if (!title || !content) {
      alert('タイトルと内容を入力してください');
      return;
    }

    const createdAt = dateTimePreview ? dateTimePreview.textContent : nowText();

    memos.unshift({
      id: Date.now(),
      title,
      content,
      createdAt: createdAt
    });

    titleInput.value = '';
    contentInput.value = '';
    if (dateTimePreview) dateTimePreview.textContent = '--:-- / ----/--/--';

    saveMemos(storageKey, memos);
    render();
  };

  //入力クリア
  if (clearFormBtn) {
    clearFormBtn.addEventListener('click', () => {
      titleInput.value = '';
      contentInput.value = '';
      if (dateTimePreview) dateTimePreview.textContent = '--:-- / ----/--/--';
    });
  }

  //検索（入力したら即反映）
  if (searchInput) {
    searchInput.addEventListener('input', render);
  }

  //検索クリア
  if (searchClearBtn) {
    searchClearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      render();
    });
  }

  //一括削除
  if (deleteAllBtn) {
    deleteAllBtn.addEventListener('click', () => {
      memos = [];
      saveMemos(storageKey, memos);
      render();
    });
  }

  render();
});
