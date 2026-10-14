const $ = (id) => document.getElementById(id);
const state = { messages: [], busy: false, configured: false, page: 'chat' };
const presets = {
  openrouter: { base: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4o-mini' },
  gemini: { base: 'https://generativelanguage.googleapis.com/v1beta/openai/', model: 'gemini-2.0-flash' },
  openai: { base: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  groq: { base: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
  custom: { base: '', model: '' }
};
let toastTimer;
function toast(message) { const el = $('toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2800); }
function setPage(page) {
  state.page = page;
  $('chatPage').classList.toggle('hidden', page !== 'chat');
  $('settingsPage').classList.toggle('hidden', page !== 'settings');
  $('chatNav').classList.toggle('active', page === 'chat');
  $('settingsNav').classList.toggle('active', page === 'settings');
  $('pageTitle').textContent = page === 'chat' ? 'Vamos pensar juntos.' : 'Configurar o Innovai.';
  $('sidebar').classList.remove('open');
}
function escapeHtml(value) { return value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function safeMessageHtml(value) {
  const links = [];
  let html = escapeHtml(value).replace(/\[([^\]]{1,180})\]\((https?:\/\/[^\s)]+)\)/g, (_, label, url) => {
    const token = `__INNOVAI_LINK_${links.length}__`;
    links.push(`<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`);
    return token;
  });
  html = html.replace(/(^|\s)(https?:\/\/[^\s<]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>');
  links.forEach((link, index) => { html = html.replace(`__INNOVAI_LINK_${index}__`, link); });
  return html.replace(/\n/g, '<br>');
}
function renderMessage(role, content) {
  const row = document.createElement('article'); row.className = `message ${role}`;
  if (role === 'assistant') { const avatar = document.createElement('div'); avatar.className = 'avatar'; avatar.textContent = 'i'; row.appendChild(avatar); }
  const bubble = document.createElement('div'); bubble.className = 'bubble'; bubble.innerHTML = safeMessageHtml(content); row.appendChild(bubble);
  $('messages').appendChild(row); $('welcome').classList.add('hidden');
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}
function resetChat() { state.messages = []; $('messages').innerHTML = ''; $('welcome').classList.remove('hidden'); $('messageInput').value = ''; $('messageInput').focus(); setPage('chat'); }
function autoResize() { const input = $('messageInput'); input.style.height = 'auto'; input.style.height = `${Math.min(input.scrollHeight, 180)}px`; }
async function api(path, body) {
  const response = await fetch(path, { method: body ? 'POST' : 'GET', headers: body ? {'Content-Type':'application/json'} : {}, body: body ? JSON.stringify(body) : undefined, credentials: 'same-origin' });
  let data = {}; try { data = await response.json(); } catch (_) {}
  if (!response.ok) throw new Error(data.error || 'Ocorreu um erro. Tente novamente.');
  return data;
}
async function refreshStatus() {
  try { const s = await api('/api/status'); state.configured = s.configured; $('connectionState').textContent = s.configured ? `API configurada · ${s.model}` : 'Configure sua API'; }
  catch (_) { $('connectionState').textContent = 'Conexão indisponível'; }
}
async function sendMessage(text) {
  const content = (text ?? $('messageInput').value).trim();
  if (!content || state.busy) return;
  state.messages.push({ role: 'user', content }); renderMessage('user', content); $('messageInput').value = ''; autoResize(); state.busy = true; $('sendBtn').disabled = true; $('typing').classList.remove('hidden');
  try {
    const data = await api('/api/chat', { messages: state.messages.slice(-24) });
    state.messages.push({ role: 'assistant', content: data.answer }); renderMessage('assistant', data.answer);
  } catch (err) {
    const msg = err.message;
    if (msg.includes('chave de API')) { $('settingsMessage').textContent = msg; setPage('settings'); }
    else toast(msg);
    state.messages.pop();
  } finally { state.busy = false; $('sendBtn').disabled = false; $('typing').classList.add('hidden'); $('messageInput').focus(); }
}
$('composer').addEventListener('submit', e => { e.preventDefault(); sendMessage(); });
$('messageInput').addEventListener('input', autoResize);
$('messageInput').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('composer').requestSubmit(); } });
$('newChat').addEventListener('click', resetChat);
$('chatNav').addEventListener('click', () => setPage('chat'));
$('settingsNav').addEventListener('click', () => setPage('settings'));
$('settingsShortcut').addEventListener('click', () => setPage('settings'));
$('menuToggle').addEventListener('click', () => $('sidebar').classList.toggle('open'));
document.querySelectorAll('.suggestion').forEach(btn => btn.addEventListener('click', () => sendMessage(btn.dataset.prompt)));
$('provider').addEventListener('change', () => { const p = presets[$('provider').value]; if (p.base) $('baseUrl').value = p.base; if (p.model) $('model').value = p.model; });
$('showKey').addEventListener('click', () => { const input = $('apiKey'); input.type = input.type === 'password' ? 'text' : 'password'; $('showKey').textContent = input.type === 'password' ? 'Mostrar' : 'Ocultar'; });
$('settingsForm').addEventListener('submit', async e => {
  e.preventDefault(); const button = $('saveConfig'); button.disabled = true; button.textContent = 'Salvando…'; $('settingsMessage').textContent = '';
  try { const result = await api('/api/config', { api_key: $('apiKey').value, base_url: $('baseUrl').value, model: $('model').value }); state.configured = true; $('apiKey').value = ''; $('settingsMessage').textContent = result.message; $('connectionState').textContent = `API configurada · ${$('model').value}`; toast('Configuração salva.'); }
  catch (err) { $('settingsMessage').textContent = err.message; }
  finally { button.disabled = false; button.textContent = 'Salvar configuração'; }
});
$('forgetKey').addEventListener('click', async () => { try { await api('/api/forget-key', {}); state.configured = false; $('apiKey').value = ''; $('connectionState').textContent = 'Configure sua API'; $('settingsMessage').textContent = 'Chave removida da memória temporária.'; toast('Chave apagada.'); } catch (err) { $('settingsMessage').textContent = err.message; } });
refreshStatus();
