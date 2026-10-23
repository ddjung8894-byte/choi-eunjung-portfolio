(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* 고정 헤더 높이에 맞춰 앵커 이동 시 제목이 가려지지 않게 한다. */
  const header = $('.site-header');
  if (header) {
    const syncHeaderHeight = () => document.documentElement.style.setProperty('--header-height', `${header.getBoundingClientRect().height}px`);
    syncHeaderHeight();
    if ('ResizeObserver' in window) new ResizeObserver(syncHeaderHeight).observe(header);
    else window.addEventListener('resize', syncHeaderHeight);
  }

  /* 흐름이 화면에 들어오면 한 번만 순서대로 나타낸다. 기본 상태는 항상 읽을 수 있다. */
  const processMap = $('.process-map');
  if (processMap && 'IntersectionObserver' in window) {
    const processObserver = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        processMap.classList.add('is-revealed');
        processObserver.disconnect();
      }
    }, { threshold: 0.25 });
    processObserver.observe(processMap);
  }

  /* 주소의 #c-... 로 들어오면 해당 경력 행(과 그것을 감싼 접힘 목록)을 펼친다 */
  const openDetails = id => {
    let el = document.getElementById(id);
    if (!el || el.tagName !== 'DETAILS') return;
    for (let p = el; p; p = p.parentElement.closest('details')) p.open = true;
  };
  const openFromHash = () => location.hash && openDetails(location.hash.slice(1));
  window.addEventListener('hashchange', openFromHash);
  openFromHash();
  $$('a[href^="#c-"]').forEach(a => a.addEventListener('click', () => openDetails(a.getAttribute('href').slice(1))));

  /* 이메일 주소 복사: 메일 앱이 없는 PC에서도 연락할 수 있게 */
  $$('[data-copy]').forEach(btn => btn.addEventListener('click', async () => {
    const status = $('.copy-status');
    const text = btn.dataset.copy;
    const legacyCopy = () => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      btn.focus();
      return ok;
    };
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch { ok = legacyCopy(); }
    status.textContent = ok
      ? '이메일 주소를 복사했습니다. 메일 쓰기 화면에 붙여 넣어 주세요.'
      : `복사하지 못했습니다. ${text} 를 직접 선택해 복사해 주세요.`;
  }));

  const wire = (dlg, onClose) => {
    $('.dlg-close', dlg).addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', onClose);
  };

  /* 원본 이미지 보기 */
  const wd = $('#work-dialog');
  if (wd) {
    let opener = null;
    wire(wd, () => { $('#dialog-images').textContent = ''; opener && opener.focus(); });
    $$('[data-work]').forEach(btn => btn.addEventListener('click', () => {
      opener = btn;
      $('#dialog-label').textContent = btn.dataset.label || '';
      $('#dialog-title').textContent = btn.dataset.title || '';
      $('#dialog-description').textContent = btn.dataset.description || '';
      const box = $('#dialog-images');
      box.textContent = '';
      (btn.dataset.images || '').split(',').filter(Boolean).forEach((src, i) => {
        const img = new Image();
        img.src = src.trim();
        img.alt = `${btn.dataset.title} 원본 ${i + 1}`;
        img.decoding = 'async';
        box.appendChild(img);
      });
      wd.showModal();
    }));
  }

  /* 영상: 누를 때만 불러온다 */
  const vd = $('#video-dialog');
  if (vd) {
    const video = $('#portfolio-video');
    const err = $('.video-error', vd);
    let opener = null;
    wire(vd, () => {
      video.pause();
      video.removeAttribute('src');
      video.removeAttribute('poster');
      video.load();
      err.hidden = true;
      opener && opener.focus();
    });
    video.addEventListener('error', () => {
      if (!video.getAttribute('src')) return;
      err.textContent = '영상을 불러오지 못했습니다. 잠시 뒤 다시 눌러 주세요.';
      err.hidden = false;
    });
    $$('[data-video]').forEach(btn => btn.addEventListener('click', () => {
      opener = btn;
      $('#video-dialog-title').textContent = btn.dataset.title || '';
      $('#video-dialog-description').textContent = btn.dataset.description || '';
      err.hidden = true;
      video.poster = btn.dataset.poster || '';
      video.src = btn.dataset.video;
      vd.showModal();
      const p = video.play();
      if (p && p.catch) p.catch(() => {});
    }));
  }
})();
