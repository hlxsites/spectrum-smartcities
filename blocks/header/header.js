import {
  getMetadata,
  decorateIcons,
} from '../../scripts/lib-franklin.js';
import {
  isDesktop,
  createEl,
} from '../../scripts/scripts.js';

export default async function decorate(block) {
  // fetch nav content
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta).pathname : '/nav';
  const navResp = await fetch(`${navPath}.plain.html`);

  if (navResp.ok) {
    const html = await navResp.text();

    // decorate nav DOM
    const navEl = document.createElement('nav');
    navEl.id = 'nav';

    block.append(navEl);

    const logoLinkEl = createEl('a', {
      class: 'logo',
      href: '/',
    }, `
      <img src="/assets/logo.svg" alt="Spectrum Smart Cities Home"/>
    `);
    navEl.prepend(logoLinkEl);

    const modalEl = createEl('div', {
      class: 'menu-modal',
    }, `
      <div class="modal-header">
        <img class="modal-logo" src="/assets/menu-logo.svg"/>
        <a class="modal-close" href="#">✕</a>
      </div>
    `, document.body);

    const modalBodyEl = createEl('div', {
      class: 'modal-body',
    }, html, modalEl);

    const socialsResp = await fetch('/socials.plain.html');
    if (socialsResp.ok) {
      const socialHtml = await socialsResp.text();
      modalBodyEl.append(createEl('div', {
        class: 'social-buttons',
      }, socialHtml));
      const socialButtonEls = modalBodyEl.querySelectorAll('.social-buttons a');
      socialButtonEls.forEach((buttonEl) => {
        buttonEl.setAttribute('title', buttonEl.href);
      });
    }

    const hamburgerEl = createEl('a', {
      class: 'modal-open',
      href: '#',
    }, '☰', navEl);

    hamburgerEl.addEventListener('click', () => {
      modalEl.style.display = 'flex';
      setTimeout(() => modalEl.classList.add('show'), 1);
      const modalCloseEl = modalEl.querySelector('.modal-close');
      modalCloseEl.addEventListener('click', () => {
        modalEl.addEventListener('transitionend', () => {
          modalEl.style.display = 'none';
        }, { once: true });
        modalEl.classList.remove('show');
      }, { once: true });
    });

    decorateIcons(modalEl);
  }
}
