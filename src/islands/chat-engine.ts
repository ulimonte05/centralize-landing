// Motor de escenas (plan §6.5). Vanilla TS, sin dependencias. Dos instancias por página (hero y Un día), DOM separado.
import { SCENES, TOTAL, DIA_IDS, MINI_IDS, AUTO_IDS, type Escena, type Mensaje, type Artefacto } from '@/lib/scenes';
import { renderMessages, renderPanel, sceneMessages, ICONS, SYS_ROW } from '@/lib/render';
import { matchScene } from '@/lib/match';

type Mode = 'hero' | 'panel';
interface Token { dead: boolean }

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T | null;
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll(s)] as T[];
const reduced = () => document.documentElement.classList.contains('motion-reduced') || matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => matchMedia('(max-width: 1023px)').matches;
const track = (name: string, data: Record<string, string>) => { try { (window as any).va?.('event', { name, data }); } catch { /* noop */ } };
const AUTO = new URLSearchParams(location.search).has('auto') && !reduced();

/* "Viste n de 15 pedidos" */
const VISTOS_KEY = 'centralito.vistos';
const vistos = (): string[] => { try { return JSON.parse(sessionStorage.getItem(VISTOS_KEY) || '[]'); } catch { return []; } };
function marcarVisto(id: string) {
  const v = vistos(); if (!v.includes(id)) v.push(id);
  try { sessionStorage.setItem(VISTOS_KEY, JSON.stringify(v)); } catch { /* noop */ }
  pintarVistos();
  $$(`[data-scene-trigger="${id}"]`).forEach(b => b.classList.add('done'));
}
function pintarVistos() {
  const n = vistos().length;
  $$('[data-vistos]').forEach(el => {
    const done = n >= TOTAL;
    el.innerHTML = done ? `Viste los ${TOTAL}. El siguiente lo hacés vos: <a class="link" href="/contratar" data-cta="contratar" data-section="vistos">Probar gratis</a>` : `Viste ${n} de ${TOTAL} pedidos`;
  });
}

class ChatInstance {
  root: HTMLElement; name: string; mode: Mode;
  msgs: HTMLElement; composer: HTMLElement; announce: HTMLElement; notif: HTMLElement | null;
  panel: HTMLElement | null; pila: Artefacto[] = [];
  sceneId = ''; scene!: Escena; token: Token = { dead: true }; paused = false; played = new Set<string>();
  playing = false; atQuestion = false; pendingBranch: Record<string, Mensaje[]> = {}; msgCount = 0;
  onNext: (() => void) | null = null; waiters: (() => void)[] = []; seen = false; autoTimer = 0;

  constructor(root: HTMLElement) {
    this.root = root; this.name = root.dataset.chat || 'chat'; this.mode = (root.dataset.mode as Mode) || 'hero';
    this.msgs = $('.msgs', root)!; this.composer = $('.composer', root)!; this.announce = $('[data-announce]', root)!; this.notif = $('.notif', root);
    this.panel = root.dataset.panelFor ? $(`[data-panel="${root.dataset.panelFor}"]`) : null;
    this.sceneId = root.dataset.scene || '';
    if (this.sceneId) { this.scene = SCENES[this.sceneId]; this.pendingBranch = sceneMessages(this.scene, this.mode).ramas; }
    root.addEventListener('click', e => this.onClick(e));
    const form = $<HTMLFormElement>('form[data-composer]', root);
    if (form) { form.addEventListener('submit', e => { e.preventDefault(); const inp = $<HTMLInputElement>('.c-input', form)!; const v = inp.value; inp.value = ''; this.enviar(v); }); const inp = $<HTMLInputElement>('.c-input', form)!; inp.addEventListener('input', () => form.classList.toggle('has-text', !!inp.value)); }
    root.addEventListener('keydown', e => { if (e.key === 'Escape') this.setPaused(true); });
    if (this.panel && this.sceneId) this.setPanel(this.scene);
  }

  /* ---- carga ---- */
  load(id: string, play: boolean, branch?: string, propio?: string) {
    let scene = SCENES[id]; if (!scene) return;
    if (propio) { const src = sceneMessages(scene, this.mode); const i = src.mensajes.findIndex(m => m.de === 'asesor'); const mensajes = src.mensajes.map((m, k) => k === i ? { ...m, texto: propio, adjuntos: undefined, instant: true } : m); scene = { ...scene, mensajes, variante_hero: undefined, ramas: src.ramas } as Escena; }
    this.loadScene(scene, play, branch);
  }
  loadScene(scene: Escena, play: boolean, branch?: string) {
    const id = scene.id;
    this.kill(); this.scene = scene; this.sceneId = id; this.root.dataset.scene = id; this.atQuestion = false;
    const { mensajes, ramas } = sceneMessages(scene, this.mode);
    this.pendingBranch = ramas; this.msgCount = mensajes.length;
    const anim = play && !reduced();
    this.msgs.setAttribute('aria-busy', 'true');
    this.msgs.innerHTML = renderMessages(mensajes, scene.hora, this.mode, anim ? 'pending' : 'show') + SYS_ROW;
    this.msgs.style.setProperty('--ty', '0px');
    this.root.classList.remove('is-done');
    this.hideFoot();
    if (this.notif) this.notif.classList.remove('on');
    if (this.panel) this.setPanel(scene);
    this.msgs.removeAttribute('aria-busy');
    this.say(`Escena: ${scene.titulo}, ${mensajes.length} mensajes`);
    this.root.dispatchEvent(new CustomEvent('chat:load', { bubbles: true, detail: { id, instance: this.name } }));
    if (anim) this.play();
    else {
      // estado final sin animación; si ya se eligió una rama, se pinta también
      if (branch && ramas[branch]) this.appendBranch(branch, false);
      const last = mensajes[mensajes.length - 1];
      if (!last.respuestas_rapidas || branch) this.finish(false);
      else this.atQuestion = true;
      this.applyPanelActions(mensajes);
      this.fit();
    }
  }

  setPanel(scene: Escena) {
    if (!this.panel) return;
    if (scene.mini) { this.panel.innerHTML = renderPanel({ tipo: 'pila' }, { pila: this.pila }); this.panel.dataset.estado = 'pila'; return; }
    const first = [...scene.mensajes].find(m => m.panel);
    if (!first?.panel) { this.panel.innerHTML = renderPanel(null); delete this.panel.dataset.estado; return; }
    this.panel.innerHTML = renderPanel(first.panel);
    this.panel.dataset.estado = first.panel.estado || 'base';
  }
  applyPanelActions(list: Mensaje[]) {
    if (!this.panel) return;
    list.forEach(m => { if (m.panel?.estado) this.panel!.dataset.estado = m.panel.estado; if (m.panel_accion) this.panelAction(m.panel_accion); });
  }
  panelAction(a: string) {
    if (!this.panel) return;
    const map: Record<string, string> = { 'agenda-nueva': 'nueva', 'acm-pdf': 'pdf', 'base-xls': 'xls', 'base-sin-etiquetar': 'sin-etiquetar' };
    if (map[a]) this.panel.dataset.estado = map[a];
  }

  /* ---- reproducción ---- */
  async play() {
    this.kill(); const token: Token = { dead: false }; this.token = token; this.playing = true; this.root.classList.add('is-playing');
    const { mensajes } = sceneMessages(this.scene, this.mode);
    await this.wait(400, token); if (token.dead) return;
    await this.run(mensajes, 0, token);
  }
  async run(list: Mensaje[], offset: number, token: Token) {
    for (let i = 0; i < list.length; i++) {
      const m = list[i]; const el = $(`.m[data-i="${i + offset}"]`, this.msgs); if (!el || token.dead) return;
      if (m.de === 'asesor') {
        if ((m as any).instant) { this.reveal(el); await this.wait(500, token); if (token.dead) return; continue; }
        await this.wait(350, token); if (token.dead) return;
        await this.typeOut(m, token); if (token.dead) return;
        this.reveal(el);
        await this.wait(m.hold_ms ?? 900, token); if (token.dead) return;
      } else {
        if (m.notificacion && this.notif) { this.notif.classList.add('on'); await this.wait(1400, token); this.notif.classList.remove('on'); if (token.dead) return; }
        const typing = document.createElement('div'); typing.className = 'typing'; typing.setAttribute('aria-hidden', 'true'); typing.innerHTML = '<i></i><i></i><i></i>';
        el.before(typing); this.fit(typing);
        await this.wait(m.typing_ms ?? 1100, token); typing.remove(); if (token.dead) return;
        this.reveal(el);
        if (m.panel?.estado && this.panel) this.panel.dataset.estado = m.panel.estado;
        if (m.panel_accion) this.panelAction(m.panel_accion);
        if (m.respuestas_rapidas?.length) {
          this.atQuestion = true;
          this.say(m.anuncio || `Centralito pregunta: ${m.texto} Elegí ${m.respuestas_rapidas.join(' o ')}`);
          this.showFoot('next');
          if (AUTO) { this.autoTimer = window.setTimeout(() => { if (!token.dead && this.atQuestion) this.choose(m.rama_stand || m.respuestas_rapidas![0], true); }, 5000); }
          this.playing = false; return; // espera sin límite
        }
        await this.wait(m.hold_ms ?? 1600, token); if (token.dead) return;
      }
    }
    this.finish(true);
  }
  reveal(el: HTMLElement) { el.classList.remove('pending'); el.classList.add('show'); this.fit(el); }
  fit(last?: HTMLElement) {
    const l = last || [...$$('.m.show, .typing, .sys.show', this.msgs)].pop(); if (!l) return;
    const bottom = l.offsetTop + l.offsetHeight + 14;
    const over = bottom - this.msgs.parentElement!.clientHeight;
    this.msgs.style.setProperty('--ty', `${-Math.max(0, over)}px`);
  }
  async typeOut(m: Mensaje, token: Token) {
    const inp = $<HTMLInputElement>('.c-input', this.composer); const txtEl = $('.c-txt', this.composer); const txt = { set textContent(v: string) { if (inp) inp.value = v; else if (txtEl) txtEl.textContent = v; } }; const text = m.adjuntos?.length ? `Adjuntando ${m.adjuntos.length} archivo${m.adjuntos.length > 1 ? 's' : ''}… ${m.texto}` : m.texto;
    this.composer.classList.add('typing');
    const dur = m.type_ms ?? Math.max(400, Math.min(1200, text.length * 20)); const t0 = performance.now();
    while (!token.dead) {
      if (this.paused) { await this.wait(50, token); continue; }
      const k = Math.min(1, (performance.now() - t0) / dur); txt.textContent = text.slice(0, Math.ceil(text.length * k));
      if (k >= 1) break; await this.sleep(24);
    }
    if (token.dead) return;
    await this.wait(220, token); this.composer.classList.add('sending'); await this.wait(140, token);
    this.composer.classList.remove('typing', 'sending'); txt.textContent = '';
  }
  /* el visitante escribe su propio pedido (sandbox) */
  enviar(texto: string) {
    const t = texto.trim(); if (!t) return;
    const id = matchScene(t);
    track('demo_interact', { section: id || 'sin-match', cta: 'escribio' });
    if (id) { $$(`[data-scene-trigger][data-target="${this.name}"]`).forEach(x => x.setAttribute('aria-pressed', String(x.dataset.sceneTrigger === id))); this.load(id, true, undefined, t); return; }
    const noVistos = Object.keys(SCENES).filter(k => !vistos().includes(k)).slice(0, 3);
    const labels = Object.fromEntries(noVistos.map(k => [k, SCENES[k].chip]));
    const fallback: Escena = { id: 'fallback', hora: SCENES['resumen-del-dia'].hora, titulo: 'Eso no está en la demo', chip: '', mensajes: [
      { de: 'asesor', texto: t, instant: true } as Mensaje,
      { de: 'centralito', texto: 'Eso todavía no lo muestro en esta demo. En tu Centralito real lo pedís así nomás. Acá podés probar, por ejemplo:', typing_ms: 1100, artefacto: { tipo: 'sugerencias', ids: noVistos, labels, target: this.name } },
    ], antes: '', despues: '', wa_text: t, etiqueta: SCENES['resumen-del-dia'].etiqueta };
    this.loadScene(fallback, true);
  }
  async choose(reply: string, auto = false) {
    if (!this.atQuestion) return; this.atQuestion = false; clearTimeout(this.autoTimer);
    const qr = $$('.qr', this.msgs).pop(); if (qr) { qr.classList.add('press'); $$('button', qr).forEach(b => { (b as HTMLButtonElement).disabled = true; b.classList.toggle('chosen', b.dataset.reply === reply); }); }
    track('demo_interact', { section: this.sceneId, cta: reply.toLowerCase().startsWith('dale') ? 'dale' : 'todavia_no' });
    this.hideFoot();
    const branch = this.pendingBranch[reply]; if (!branch) { this.finish(true); return; }
    if (reduced() || !this.token || this.token.dead) { this.appendBranch(reply, false); this.applyPanelActions(branch); this.finish(false); return; }
    const token: Token = { dead: false }; this.token = token; this.playing = true;
    const offset = this.msgCount; this.appendBranch(reply, true); this.msgCount += branch.length;
    await this.run(branch, offset, token);
  }
  appendBranch(reply: string, pending: boolean) {
    const branch = this.pendingBranch[reply]; if (!branch) return;
    const offset = $$('.m', this.msgs).length;
    const sys = $('.sys', this.msgs); const html = renderMessages(branch, this.scene.hora, this.mode, pending ? 'pending' : 'show', offset);
    if (sys) sys.insertAdjacentHTML('beforebegin', html); else this.msgs.insertAdjacentHTML('beforeend', html);
    if (!pending) this.fit();
  }
  finish(animated: boolean) {
    this.playing = false; this.root.classList.remove('is-playing'); this.root.classList.add('is-done');
    if (SCENES[this.sceneId] && (animated || !this.played.has(this.sceneId))) { track('demo_complete', { section: this.sceneId }); }
    if (SCENES[this.sceneId]) { this.played.add(this.sceneId); marcarVisto(this.sceneId); }
    if (this.scene.mini && this.scene.pila) { this.pila.push(this.scene.pila); if (this.panel) { this.panel.innerHTML = renderPanel({ tipo: 'pila' }, { pila: this.pila }); } }
    this.showFoot('done');
    this.root.dispatchEvent(new CustomEvent('chat:done', { bubbles: true, detail: { id: this.sceneId, instance: this.name } }));
    if ((this.name === 'hero' || this.name === 'sandbox') && !reduced()) { $$('.pill.sugerida').forEach(p => p.classList.remove('sugerida')); const next = $$(`[data-scene-trigger][data-target="${this.name}"]`).find(b => !vistos().includes(b.dataset.sceneTrigger || '')); if (next) { next.classList.add('sugerida'); setTimeout(() => next.classList.remove('sugerida'), 3400); } }
    if (AUTO && this.onNext) this.autoTimer = window.setTimeout(() => this.onNext && this.onNext(), 5000);
  }
  showAll() {
    this.kill(); $$('.typing', this.msgs).forEach(t => t.remove()); this.composer.classList.remove('typing', 'sending'); ($('.c-txt', this.composer)!).textContent = '';
    if (this.notif) this.notif.classList.remove('on');
    $$('.m.pending', this.msgs).forEach(el => { el.classList.remove('pending'); el.classList.add('show'); });
    const { mensajes } = sceneMessages(this.scene, this.mode); this.applyPanelActions(mensajes);
    const lastQ = $$('.qr', this.msgs).pop(); const open = lastQ && !$('.chosen', lastQ);
    if (open) { this.atQuestion = true; this.showFoot('next'); } else { this.finish(false); }
    this.fit(); track('demo_interact', { section: this.sceneId, cta: 'ver_todo' });
  }
  kill() { this.token.dead = true; this.playing = false; clearTimeout(this.autoTimer); this.setPaused(false); }
  setPaused(p: boolean) {
    this.paused = p; const b = $('[data-act="pause"]', this.root); if (!b) return;
    b.setAttribute('aria-pressed', String(p)); ($('.t', b)!).textContent = p ? 'Seguir' : 'Pausar'; ($('.i', b)!).innerHTML = p ? ICONS.play : ICONS.pause;
    this.root.classList.toggle('is-paused', p);
    if (!p) this.wake();
  }
  sleep(ms: number) { return new Promise<void>(r => setTimeout(r, ms)); }
  blocked() { return this.paused || document.hidden || !this.inView(); }
  /* espera con un solo temporizador (sin polling: en pestañas en segundo plano Chrome frena los timers a 1/s) */
  async wait(ms: number, token: Token) {
    let left = ms;
    while (left > 0 && !token.dead) {
      if (this.blocked()) { await new Promise<void>(r => { this.waiters.push(r); setTimeout(r, 1000); }); continue; }
      const t0 = performance.now();
      await new Promise<void>(r => { const t = setTimeout(r, left); this.waiters.push(() => { clearTimeout(t); r(); }); });
      left -= performance.now() - t0;
    }
  }
  wake() { this.waiters.splice(0).forEach(w => w()); }
  inView() { const r = this.root.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; }
  showFoot(which: 'next' | 'done') {
    const sys = $('.sys', this.msgs); if (!sys) return;
    const rep = $('[data-act="replay"]', sys)!, next = $('[data-act="next"]', sys)!;
    rep.hidden = which !== 'done'; next.hidden = !this.onNext; next.textContent = this.nextLabel;
    if (!rep.hidden || !next.hidden) { sys.classList.remove('pending'); sys.classList.add('show'); this.fit(sys); }
  }
  hideFoot() { const sys = $('.sys', this.msgs); if (!sys) return; sys.classList.remove('show'); sys.classList.add('pending'); }
  nextLabel = 'Siguiente momento →';
  say(t: string) { if (!this.inView()) return; this.announce.textContent = ''; setTimeout(() => { this.announce.textContent = t; }, 30); }

  onClick(e: Event) {
    const t = e.target as HTMLElement; const btn = t.closest('button') as HTMLButtonElement | null; if (!btn) return;
    if (AUTO && !btn.dataset.reply) { /* cualquier clic cancela el stand */ (window as any).__autoCancel?.(); }
    if (btn.dataset.reply) { this.choose(btn.dataset.reply); return; }
    if (btn.dataset.copy !== undefined) { navigator.clipboard?.writeText(btn.dataset.copy || ''); btn.textContent = 'Copiado'; btn.classList.add('ok'); return; }
    switch (btn.dataset.act) {
      case 'pause': this.setPaused(!this.paused); track('demo_interact', { section: this.sceneId, cta: 'pause' }); break;
      case 'all': this.showAll(); break;
      case 'replay': this.load(this.sceneId, true); track('demo_interact', { section: this.sceneId, cta: 'repeat' }); break;
      case 'next': this.onNext?.(); break;
    }
  }
  /* primera reproducción al entrar en vista */
  arm(delay: number) {
    this.fit();
    if (this.seen || reduced()) return;
    const start = () => {
      if (this.seen) return; this.seen = true;
      const go = () => { if (!this.played.has(this.sceneId) && !this.playing) this.load(this.sceneId, true); };
      if (isMobile()) { let fired = false; const f = () => { if (fired) return; fired = true; removeEventListener('scroll', f); go(); }; addEventListener('scroll', f, { passive: true, once: true }); setTimeout(f, 1800); }
      else setTimeout(go, delay);
    };
    // si ya está a la vista, arranca sin esperar al observer (que en algunas pestañas en segundo plano no dispara)
    const r = this.root.getBoundingClientRect(); const vis = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0);
    if (vis >= r.height * 0.5) { start(); return; }
    const io = new IntersectionObserver(entries => { if (!entries.some(en => en.intersectionRatio >= 0.5)) return; io.disconnect(); start(); }, { threshold: [0.5] });
    io.observe(this.root);
  }
}

/* ---------- arranque ---------- */
const instances: Record<string, ChatInstance> = {};
const wakeAll = () => Object.values(instances).forEach(i => i.wake());
export function init() {
  document.addEventListener('visibilitychange', wakeAll);
  let st = 0; addEventListener('scroll', () => { if (st) return; st = window.setTimeout(() => { st = 0; wakeAll(); }, 200); }, { passive: true });
  $$('[data-chat]').forEach(root => { const i = new ChatInstance(root); instances[i.name] = i; });
  pintarVistos();
  const vs = vistos(); vs.forEach(id => $$(`[data-scene-trigger="${id}"]`).forEach(b => b.classList.add('done')));

  // disparadores: carta, pills, chips, paradas
  document.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest('[data-scene-trigger]') as HTMLElement | null; if (!b) return;
    const id = b.dataset.sceneTrigger!, target = b.dataset.target || 'hero', inst = instances[target]; if (!inst) return;
    const dlg = b.closest('dialog') as HTMLDialogElement | null; if (dlg) dlg.close();
    if (b.closest('[data-rail]')) { (window as any).__railGo?.(id, true); return; }
    $$(`[data-scene-trigger][data-target="${target}"]`).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    const first = !inst.played.has(id);
    inst.load(id, first, undefined);
    if (!first) inst.showAll();
    if (inst.name === 'dia') { inst.onNext = null; if (SCENES[id].mini) railClear(); }
    track('demo_interact', { section: id, cta: b.closest('.otros') ? 'chip' : 'click' });
    if (isMobile()) { const r = inst.root.getBoundingClientRect(); const vis = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0); if (vis < r.height * 0.5) inst.root.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'nearest' }); }
  });

  // riel de Un día
  const rail = $('[data-rail]');
  const railClear = () => { if (!rail) return; $$('[role="tab"]', rail).forEach(t => t.setAttribute('aria-selected', 'false')); };
  const railGo = (id: string, play: boolean) => {
    const inst = instances['dia']; if (!inst || !rail) return;
    const tabs = $$('[role="tab"]', rail); const idx = DIA_IDS.indexOf(id);
    tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === idx)); t.tabIndex = k === idx ? 0 : -1; });
    rail.style.setProperty('--at', String(idx / 3));
    const clock = $('[data-clock]'); if (clock) clock.textContent = SCENES[id].hora;
    const ba = $('[data-ba]'); if (ba) ba.innerHTML = `<i>antes</i> <s>${SCENES[id].antes}</s> <i>→</i> <b>${SCENES[id].despues}</b>`;
    const ped = $<HTMLAnchorElement>('[data-pedir]'); if (ped) ped.href = `/empezar?pedido=${id}`;
    inst.onNext = idx < 3 ? () => railGo(DIA_IDS[idx + 1], true) : (AUTO ? () => autoNext(id) : null);
    inst.nextLabel = idx < 3 ? 'Siguiente momento →' : 'Volver al primero';
    if (idx === 3 && !AUTO) inst.onNext = () => railGo(DIA_IDS[0], true);
    const first = !inst.played.has(id);
    inst.load(id, play && first);
    if (play && !first) inst.showAll();
    history.replaceState(null, '', `${location.pathname}${location.search}#dia-${id}`);
    track('demo_interact', { section: id, cta: 'tab' });
  };
  (window as any).__railGo = railGo;
  if (rail) {
    rail.addEventListener('keydown', e => {
      const tabs = $$('[role="tab"]', rail); const cur = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); const n = (cur + (e.key === 'ArrowRight' ? 1 : -1) + 4) % 4; railGo(DIA_IDS[n], true); tabs[n].focus(); }
    });
    const dia = instances['dia']; if (dia) { dia.onNext = () => railGo(DIA_IDS[1], true); }
  }
  // modo stand
  const autoNext = (id: string) => { const k = AUTO_IDS.indexOf(id); const nid = AUTO_IDS[(k + 1) % AUTO_IDS.length]; if (DIA_IDS.includes(nid)) railGo(nid, true); else { const inst = instances['dia']; inst.onNext = () => autoNext(nid); inst.load(nid, true); } };
  if (AUTO) { (window as any).__autoCancel = () => { Object.values(instances).forEach(i => { i.onNext = null; clearTimeout(i.autoTimer); }); }; const dia = instances['dia']; if (dia) dia.onNext = () => autoNext('resumen-del-dia'); }

  // permalinks
  const h = location.hash.slice(1);
  if (h.startsWith('carta-') && instances['sandbox'] && SCENES[h.slice(6)]) { instances['sandbox'].load(h.slice(6), true); $$(`[data-scene-trigger][data-target="sandbox"]`).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.sceneTrigger === h.slice(6)))); }
  else if (h.startsWith('carta-') && instances['hero'] && SCENES[h.slice(6)]) { instances['hero'].load(h.slice(6), false); $$(`[data-scene-trigger="${h.slice(6)}"][data-target="hero"]`).forEach(b => b.setAttribute('aria-pressed', 'true')); }
  else if (h.startsWith('dia-') && instances['dia'] && SCENES[h.slice(4)]) { const id = h.slice(4); if (DIA_IDS.includes(id)) railGo(id, false); else instances['dia'].load(id, false); setTimeout(() => $('#dia')?.scrollIntoView({ block: 'start' }), 50); }
  else {
    instances['hero']?.arm(600);
    instances['dia']?.arm(300);
    instances['sandbox']?.arm(400);
  }
  $$('[data-chat]').forEach(r => r.classList.add('js-anim'));
  Object.values(instances).forEach(i => i.fit());
}
init();
