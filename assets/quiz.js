// 문제은행: 범위·유형·문항 수 선택 → 출제 횟수 기반 랜덤 추출 → 풀이·채점·복습.

// Power of two choices: 후보 두 개를 무작위로 뽑아 출제 횟수가 적은 쪽을 고른다.
// 완전 랜덤보다 출제 횟수가 고르게 퍼지고, 항상 최소값만 고르는 방식보다 순서가 덜 고정된다.
function pick(pool, n, seen, rand = Math.random) {
  const left = pool.slice(), out = [];
  while (out.length < n && left.length) {
    const a = Math.floor(rand() * left.length), b = Math.floor(rand() * left.length);
    const i = (seen[left[b].id] || 0) < (seen[left[a].id] || 0) ? b : a;
    out.push(left[i]);
    left[i] = left[left.length - 1];
    left.pop();
  }
  return out;
}
const norm = (s) => String(s).toLowerCase().replace(/[\s.,·・\-–—()（）\[\]「」『』'"‘’“”?!:;/]/g, '');

if (typeof module !== 'undefined') module.exports = { pick, norm };
else (function () {
  const CH = ['지방자치의 본질', '지방정부', '지방정부의 특례와 특별지방행정기관', '우리나라 지방자치의 역사',
    '지방정부의 사무 및 배분 방식', '정부 간 관계 및 광역행정', '지방정부의 권력구조와 로컬 거버넌스'];
  const TYPES = { mc: '객관식', ox: 'OX', short: '단답형', essay: '서술형' };
  const QB = window.QB || [];
  const $ = (s, el = document) => el.querySelector(s);
  const app = $('#quiz');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };
  let seen = store.get('qb-seen', {});
  let cfg = store.get('qb-cfg', { ch: [1, 2, 3, 4, 5, 6, 7], types: Object.keys(TYPES), n: 20 });
  let run; // { list, i, results: [{q, ok, given}] }

  const filtered = () => QB.filter((q) => cfg.ch.includes(q.ch) && cfg.types.includes(q.type));

  function setup() {
    const chips = (name, items, chosen) => items.map(([v, label]) =>
      `<label class="chip"><input type="checkbox" name="${name}" value="${v}" ${chosen.includes(v) ? 'checked' : ''}><span>${label}</span></label>`).join('');
    const chCount = (c) => QB.filter((q) => q.ch === c).length;
    const tyCount = (t) => QB.filter((q) => q.type === t).length;
    app.innerHTML = `<div id="setup">
      <section class="panel"><h2>범위</h2>
        <div class="chips">${chips('ch', CH.map((t, i) => [i + 1, `제${i + 1}장 <span class="muted">${chCount(i + 1)}</span>`]), cfg.ch)}</div>
        <div class="row"><button class="btn" type="button" data-all="ch">전체 선택</button><button class="btn" type="button" data-none="ch">전체 해제</button></div>
      </section>
      <section class="panel"><h2>유형</h2>
        <div class="chips">${chips('type', Object.entries(TYPES).map(([k, v]) => [k, `${v} <span class="muted">${tyCount(k)}</span>`]), cfg.types)}</div>
      </section>
      <section class="panel"><h2>문항 수</h2>
        <div class="row" style="margin-top:0"><input type="number" id="n" min="1" value="${cfg.n}" inputmode="numeric" aria-label="문항 수">
          <span class="muted" id="avail"></span></div>
        <div class="row"><button class="btn primary" id="start" type="button">문제 풀기 시작</button></div>
        <p class="muted">두 문제를 무작위로 골라 그중 덜 출제된 문제를 내기 때문에, 여러 번 풀어도 특정 문제로 치우치지 않습니다.</p>
        <div class="row"><button class="btn" id="reset" type="button">출제 기록 초기화</button><span class="muted" id="seen-info"></span></div>
      </section></div>`;
    const box = $('#setup');
    const read = () => {
      cfg.ch = [...app.querySelectorAll('[name=ch]:checked')].map((e) => +e.value);
      cfg.types = [...app.querySelectorAll('[name=type]:checked')].map((e) => e.value);
      cfg.n = Math.max(1, parseInt($('#n').value, 10) || 1);
      const total = filtered().length;
      $('#avail').textContent = `선택 범위 문제 ${total}개`;
      $('#start').disabled = total === 0;
      const shown = Object.values(seen).reduce((a, b) => a + b, 0);
      $('#seen-info').textContent = shown ? `지금까지 ${shown}회 출제됨` : '';
    };
    box.addEventListener('change', read);
    box.addEventListener('input', read);
    app.querySelectorAll('[data-all],[data-none]').forEach((b) => b.addEventListener('click', () => {
      app.querySelectorAll(`[name=${b.dataset.all || b.dataset.none}]`).forEach((e) => { e.checked = !!b.dataset.all; });
      read();
    }));
    $('#reset').addEventListener('click', () => { seen = {}; store.set('qb-seen', seen); read(); });
    $('#start').addEventListener('click', () => {
      read();
      store.set('qb-cfg', cfg);
      start(pick(filtered(), cfg.n, seen));
    });
    read();
  }

  function start(list) {
    run = { list, i: 0, results: [] };
    show();
  }

  function show() {
    const q = run.list[run.i];
    seen[q.id] = (seen[q.id] || 0) + 1;
    store.set('qb-seen', seen);
    const pct = (run.i / run.list.length) * 100;
    let input = '';
    if (q.type === 'mc') input = `<div class="choices">${q.choices.map((c, i) =>
      `<button class="choice" type="button" data-i="${i}"><span class="num">${i + 1}</span><span>${esc(c)}</span></button>`).join('')}</div>`;
    else if (q.type === 'ox') input = `<div class="choices ox"><button class="choice" type="button" data-v="1">O</button><button class="choice" type="button" data-v="0">X</button></div>`;
    else if (q.type === 'short') input = `<form id="f"><input type="text" id="ans" autocomplete="off" placeholder="정답 입력" aria-label="정답"><div class="q-actions"><button class="btn primary">확인</button></div></form>`;
    else input = `<textarea id="ans" placeholder="답안을 작성해 보세요 (비워 두고 확인해도 됩니다)" aria-label="답안"></textarea><div class="q-actions"><button class="btn primary" id="check" type="button">모범답안 확인</button></div>`;
    app.innerHTML = `<div class="progress"><i style="transform:scaleX(${pct / 100})"></i></div>
      <section class="panel">
        <div class="q-meta"><span>${run.i + 1} / ${run.list.length}</span><span>제${q.ch}장 · ${TYPES[q.type]}</span></div>
        <p class="q-text">${esc(q.q)}</p>
        ${input}
        <div id="fb"></div>
      </section>
      <div class="row"><button class="btn" id="quit" type="button">그만 풀고 결과 보기</button></div>`;
    $('#quit').addEventListener('click', finish);
    if (q.type === 'mc' || q.type === 'ox') {
      app.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
        const given = q.type === 'mc' ? +b.dataset.i : b.dataset.v === '1';
        const ok = given === q.answer;
        app.querySelectorAll('.choice').forEach((c) => {
          c.disabled = true;
          const v = q.type === 'mc' ? +c.dataset.i : c.dataset.v === '1';
          if (v === q.answer) c.classList.add('right');
          else if (c === b) c.classList.add('wrong');
        });
        const label = q.type === 'mc' ? `${q.answer + 1}번` : q.answer ? 'O' : 'X';
        grade(q, ok, q.type === 'mc' ? q.choices[given] : given ? 'O' : 'X', `정답: ${label}`);
      }));
    } else if (q.type === 'short') {
      const f = $('#f');
      $('#ans').focus({ preventScroll: true });
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        const given = $('#ans').value;
        const ok = q.answer.some((a) => norm(a) === norm(given));
        $('#ans').disabled = true;
        f.querySelector('button').remove();
        grade(q, ok, given, `정답: ${q.answer.join(' / ')}`);
      });
    } else {
      $('#check').addEventListener('click', () => {
        const given = $('#ans').value;
        const g = norm(given);
        $('#ans').disabled = true;
        $('#check').parentElement.remove();
        const pts = (q.points || []).map((p) => g && g.includes(norm(p)) ? `<li class="pt-hit">${esc(p)} (포함)</li>` : `<li>${esc(p)}</li>`).join('');
        $('#fb').innerHTML = `<div class="feedback"><b>모범답안</b><p>${esc(q.answer)}</p>
          ${pts ? `<b>채점 핵심어</b><ul>${pts}</ul>` : ''}${q.exp ? `<p>${esc(q.exp)}</p>` : ''}</div>
          <div class="q-actions"><button class="btn" id="self-no" type="button">틀림으로 처리</button><button class="btn primary" id="self-ok" type="button">맞음으로 처리</button></div>`;
        const done = (ok) => { run.results.push({ q, ok, given }); next(); };
        $('#self-ok').addEventListener('click', () => done(true));
        $('#self-no').addEventListener('click', () => done(false));
      });
    }
  }

  function grade(q, ok, given, answerLine) {
    run.results.push({ q, ok, given });
    $('#fb').innerHTML = `<div class="feedback ${ok ? 'ok' : 'no'}"><b>${ok ? '정답' : '오답'}</b> · ${esc(answerLine)}${q.exp ? `<p>${esc(q.exp)}</p>` : ''}</div>
      <div class="q-actions"><button class="btn primary" id="next" type="button">${run.i + 1 < run.list.length ? '다음 문제' : '결과 보기'}</button></div>`;
    $('#next').addEventListener('click', next);
    $('#next').focus({ preventScroll: true });
  }

  function next() {
    run.i += 1;
    if (run.i < run.list.length) { show(); scrollTo(0, 0); } else finish();
  }

  function finish() {
    const r = run.results, ok = r.filter((x) => x.ok).length;
    const wrong = r.filter((x) => !x.ok);
    const answerText = (q) => q.type === 'mc' ? `${q.answer + 1}번 ${q.choices[q.answer]}` :
      q.type === 'ox' ? (q.answer ? 'O' : 'X') : q.type === 'short' ? q.answer.join(' / ') : q.answer;
    app.innerHTML = `<section class="panel"><h2>결과</h2>
        <div class="score">${ok} / ${r.length}</div>
        <p class="muted">${r.length ? `정답률 ${Math.round((ok / r.length) * 100)}%` : '푼 문제가 없습니다.'}</p>
        <div class="row">
          <button class="btn primary" id="again" type="button">같은 설정으로 새로 뽑기</button>
          ${wrong.length ? '<button class="btn" id="retry" type="button">틀린 문제 다시 풀기</button>' : ''}
          <button class="btn" id="back" type="button">설정으로</button>
        </div></section>
      ${wrong.length ? `<section class="panel"><h2>틀린 문제 ${wrong.length}개</h2>${wrong.map(({ q, given }) => `
        <div class="review-item"><span class="tag">제${q.ch}장</span><span class="tag">${TYPES[q.type]}</span>
          <p class="q-text" style="font-size:16px;margin:8px 0">${esc(q.q)}</p>
          ${q.type === 'mc' ? `<ol>${q.choices.map((c) => `<li>${esc(c)}</li>`).join('')}</ol>` : ''}
          <p class="muted">내 답: ${esc(given === '' ? '(미작성)' : given)}</p>
          <p><b>정답:</b> ${esc(answerText(q))}</p>${q.exp ? `<p class="muted">${esc(q.exp)}</p>` : ''}</div>`).join('')}</section>` : ''}`;
    $('#again').addEventListener('click', () => start(pick(filtered(), cfg.n, seen)));
    $('#retry')?.addEventListener('click', () => start(wrong.map((x) => x.q)));
    $('#back').addEventListener('click', setup);
    scrollTo(0, 0);
  }

  setup();
})();
