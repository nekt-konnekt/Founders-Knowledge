(() => {
  const title = document.title.replace(' — Founders Knowledge', '').trim();
  const description = document.querySelector('meta[name="description"]')?.content || '';
  const url = window.location.href.split('#')[0];
  const message = description ? title + ' — ' + description : title;
  const whatsapp = document.querySelector('[data-share-whatsapp]');
  const linkedin = document.querySelector('[data-share-linkedin]');
  const xShare = document.querySelector('[data-share-x]');
  const native = document.querySelector('[data-share-native]');
  const copy = document.querySelector('[data-copy-share]');
  const status = document.querySelector('.knowledge-share-status');
  whatsapp.href = 'https://wa.me/?text=' + encodeURIComponent(message + String.fromCharCode(10) + url);
  linkedin.href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url);
  xShare.href = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(message) + '&url=' + encodeURIComponent(url);
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
