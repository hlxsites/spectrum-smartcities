import {
  createEl,
  isDesktop,
} from '../../scripts/scripts.js';

function buildHeroBlock(mainEl) {
  const pictureEl = mainEl.querySelector(':scope > .section:first-child > div:first-child picture');
  if (pictureEl) {
    const h1El = pictureEl.parentElement.nextSibling;
    // eslint-disable-next-line no-bitwise
    if (h1El && h1El.tagName === 'H1' && (h1El.compareDocumentPosition(pictureEl) & Node.DOCUMENT_POSITION_PRECEDING)) {
      pictureEl.closest('p').classList.add('hero');
    }
  }
}

function decorateFAQ(mainEl) {
  const faqEl = mainEl.querySelector('#faq');
  if (faqEl) {
    const sectionEl = faqEl.closest('.section');
    sectionEl.classList.add('faq');
  }
}

// eslint-disable-next-line no-unused-vars
export default async function decorate(doc) {
  const mainEl = document.querySelector('main');

  buildHeroBlock(mainEl);
  decorateFAQ(mainEl);

  const coverEl = createEl('div', {
    class: 'background-cover',
  }, '', mainEl);

  let alreadyRevealed = false;
  let bodyHeight;
  let coverHeight;

  function revealBackground() {
    bodyHeight = mainEl.offsetHeight;
    coverHeight = coverHeight || bodyHeight;
    const scrollLocation = parseInt(document.documentElement.scrollTop, 10);
    const windowHeight = window.innerHeight;
    coverHeight = (coverHeight > 0) ? bodyHeight - (scrollLocation + (windowHeight)) : 1;
    coverEl.style.height = `${coverHeight}px`;
  }

  if (isDesktop) {
    document.addEventListener('scroll', () => {
      alreadyRevealed = true;
      revealBackground();
    });

    const sectionEls = document.querySelectorAll('.section, .columns > div');
    if (sectionEls && sectionEls.length > 1) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      }, {
        root: null,
        threshold: 0,
        rootMargin: '0px 0px -50px 0px',
      });

      sectionEls.forEach((section) => {
        observer.observe(section);
      });
    } else {
      const sectionEl = document.querySelector('.section');
      if (sectionEl) {
        sectionEl.style.opacity = 1;
      }
    }

    setTimeout(() => {
      if (!alreadyRevealed) {
        revealBackground();
      }
    }, 4000);
  }
}
