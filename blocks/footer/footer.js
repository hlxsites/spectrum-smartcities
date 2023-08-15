import { readBlockConfig, decorateIcons } from '../../scripts/lib-franklin.js';
import { createEl } from '../../scripts/scripts.js';

/**
 * loads and decorates the footer
 * @param {Element} blockEl The footer block element
 */
export default async function decorate(blockEl) {
  const cfg = readBlockConfig(blockEl);

  blockEl.innerHTML = '';

  createEl('div', {
    class: 'logo',
  }, `
    <img src="/assets/menu-logo.svg" alt="Spectrum Smart Cities Home"/>
  `, blockEl);

  // fetch footer content
  const footerPath = cfg.footer || '/footer';
  const resp = await fetch(`${footerPath}.plain.html`, window.location.pathname.endsWith('/footer') ? { cache: 'reload' } : {});

  if (resp.ok) {
    const html = await resp.text();

    // decorate footer DOM
    const footerMenuEl = document.createElement('div');
    footerMenuEl.innerHTML = html;

    const socialsResp = await fetch('/socials.plain.html');
    if (socialsResp.ok) {
      const socialHtml = await socialsResp.text();
      footerMenuEl.append(createEl('div', {
        class: 'social-buttons',
      }, socialHtml));
      const socialButtonEls = footerMenuEl.querySelectorAll('.social-buttons a');
      socialButtonEls.forEach((buttonEl) => {
        buttonEl.setAttribute('title', buttonEl.href);
      });
    }

    decorateIcons(footerMenuEl);
    blockEl.append(footerMenuEl);
  }
}
