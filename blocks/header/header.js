import {
  getMetadata,
  decorateIcons,
  Consts,
} from '../../scripts/lib-franklin.js';
import {
  isDesktop,
  createEl,
} from '../../scripts/scripts.js';

const {
  A, DIV, CLICK, NAV, NONE, SHOW,
} = Consts;

export default async function decorate(block) {
  // fetch nav content
  const navMeta = getMetadata(NAV);
  const navPath = navMeta ? new URL(navMeta).pathname : '/nav';
  const navResp = await fetch(`${navPath}.plain.html`);

  if (navResp.ok) {
    const html = await navResp.text();

    // decorate nav DOM
    const navEl = document.createElement(NAV);
    navEl.id = NAV;

    block.append(navEl);

    const logoLinkEl = createEl(A, {
      class: 'logo',
      href: '/',
    }, `
      <img src="/assets/logo.svg" alt="Spectrum Smart Cities Home"/>
    `);
    navEl.prepend(logoLinkEl);

    const modalEl = createEl(DIV, {
      class: 'menu-modal',
    }, `
      <div class="modal-header">
        <img class="modal-logo" src="/assets/menu-logo.svg"/>
        <a class="modal-close" href="#">✕</a>
      </div>
    `, document.body);

    const modalBodyEl = createEl(DIV, {
      class: 'modal-body',
    }, html, modalEl);

    const socialsResp = await fetch('/socials.plain.html');
    if (socialsResp.ok) {
      const socialHtml = await socialsResp.text();
      modalBodyEl.append(createEl(DIV, {
        class: 'social-buttons',
      }, socialHtml));
      const socialButtonEls = modalBodyEl.querySelectorAll('.social-buttons a');
      socialButtonEls.forEach((buttonEl) => {
        buttonEl.setAttribute('title', buttonEl.href);
      });
    }

    const hamburgerEl = createEl(A, {
      class: 'modal-open',
      href: '#',
    }, '☰', navEl);

    hamburgerEl.addEventListener(CLICK, () => {
      modalEl.style.display = 'flex';
      setTimeout(() => modalEl.classList.add(SHOW), 1);
      const modalCloseEl = modalEl.querySelector('.modal-close');
      modalCloseEl.addEventListener(CLICK, () => {
        modalEl.addEventListener('transitionend', () => {
          modalEl.style.display = NONE;
        }, { once: true });
        modalEl.classList.remove(SHOW);
      }, { once: true });
    });

    decorateIcons(modalEl);
  }
}
