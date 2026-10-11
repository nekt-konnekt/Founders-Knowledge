(() => {
  const title = document.title.replace(' — Founders Knowledge', '').trim();
  const description = document.querySelector('meta[name="description"]')?.content || '';
  const url = window.location.href.split('#')[0];
  const message = description ? title + ' — ' + description : title;

  const root = document.createElement('aside');
  root.className = 'share-float';
  root.innerHTML = `
    <div class="share-float-panel" id="share-float-panel" role="group" aria-label="Share this knowledge">
      <div class="share-float-heading"><span>Share this knowledge</span><button class="share-float-close" type="button" aria-label="Close share menu" data-share-close>×</button></div>
      <div class="share-float-actions">
        <button type="button" data-share-native hidden>Share…</button>
        <a data-share-whatsapp target="_blank" rel="noopener noreferrer">WhatsApp</a>
        <a data-share-linkedin target="_blank" rel="noopener noreferrer">LinkedIn</a>
        <a data-share-x target="_blank" rel="noopener noreferrer">X</a>
        <button type="button" data-copy-share>Copy link</button>
      </div>
      <p class="share-float-status" aria-live="polite"></p>
    </div>
    <button class="share-float-trigger" type="button" aria-expanded="false" aria-controls="share-float-panel">
      <span class="share-float-icon" aria-hidden="true">↗</span><span>Share knowledge</span>
    </button>`;
  document.body.appendChild(root);

  const trigger = root.querySelector('.share-float-trigger');
  const panel = root.querySelector('.share-float-panel');
  const status = root.querySelector('.share-float-status');
  const native = root.querySelector('[data-share-native]');
  const copy = root.querySelector('[data-copy-share]');
  root.querySelector('[data-share-whatsapp]').href = 'https://wa.me/?text=' + encodeURIComponent(message + String.fromCharCode(10) + url);
  root.querySelector('[data-share-linkedin]').href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url);
  root.querySelector('[data-share-x]').href = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(message) + '&url=' + encodeURIComponent(url);

  function setOpen(open) {
    root.classList.toggle('is-open', open);
    trigger.setAttribute('aria-expanded', String(open));
    if (open) panel.querySelector('button:not([hidden]), a')?.focus();
  }
  trigger.addEventListener('click', () => setOpen(!root.classList.contains('is-open')));
  root.querySelector('[data-share-close]').addEventListener('click', () => { setOpen(false); trigger.focus(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && root.classList.contains('is-open')) { setOpen(false); trigger.focus(); }
  });
  document.addEventListener('click', event => {
    if (!root.contains(event.target)) setOpen(false);
  });

  if (navigator.share) {
    native.hidden = false;
    native.addEventListener('click', async () => {
      try { await navigator.share({ title, text: description, url }); }
      catch (error) { if (error.name !== 'AbortError') status.textContent = 'Sharing is unavailable right now.'; }
    });
  }

  copy.addEventListener('click', async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const field = document.createElement('textarea');
        field.value = url;
        field.setAttribute('readonly', '');
        field.style.position = 'absolute';
        field.style.left = '-9999px';
        document.body.appendChild(field);
        field.select();
        const copied = document.execCommand('copy');
        field.remove();
        if (!copied) throw new Error('Copy failed');
      }
      status.textContent = 'Link copied. Share it wherever your people are.';
      copy.textContent = 'Copied';
      window.setTimeout(() => { copy.textContent = 'Copy link'; }, 1800);
    } catch {
      status.textContent = 'Could not copy automatically. Copy the page address from your browser.';
    }
  });
})();