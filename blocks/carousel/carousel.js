import {
  createEl,
} from '../../scripts/scripts.js';

export default async function decorate(blockEl) {
  const pictureEls = blockEl.querySelectorAll('picture');

  const carouselEl = createEl('div', {
    class: 'viewport',
  }, `
    <div class="carousel-frame">
      <div class="carousel-content">
        <ul class="scroll">
        </ul>
      </div>
    </div>
    <ul class="indicators">
    </ul>
  `);

  const scrollEl = carouselEl.querySelector('.scroll');
  const indicatorsEl = carouselEl.querySelector('.indicators');

  pictureEls.forEach((pictureEl) => {
    createEl('li', {
      class: 'scroll-item-outer',
    }, `
      <div class="scroll-item">
        ${pictureEl.outerHTML}
      </div>
    `, scrollEl);

    createEl('li', {
      class: 'indicator',
    }, `
      <button class="indicator-button"></button>
    `, indicatorsEl);
  });

  blockEl.innerHTML = carouselEl.outerHTML;

  function easingOutQuint(x, t, b, c, d) {
    const addT = (t1, t2) => t1 + t2;
    const f = c * (addT(t, t / d - 1) * t * t * t * t + 1) + b;
    return f;
  }

  function smoothScrollPolyfill(node, key, target) {
    const startTime = Date.now();
    const offset = node[key];
    const gap = target - offset;
    const duration = 1000;
    let interrupt = false;

    const cancel = () => {
      interrupt = true;
      node.removeEventListener('wheel', cancel);
      node.removeEventListener('touchstart', cancel);
    };

    const step = () => {
      const elapsed = Date.now() - startTime;
      const percentage = elapsed / duration;

      if (interrupt) {
        return;
      }

      if (percentage > 1) {
        node.removeEventListener('wheel', cancel);
        node.removeEventListener('touchstart', cancel);
        return;
      }

      node[key] = easingOutQuint(0, elapsed, offset, gap, duration);
      requestAnimationFrame(step);
    };

    node.addEventListener('wheel', cancel, { passive: true });
    node.addEventListener('touchstart', cancel, { passive: true });

    step();

    return cancel;
  }

  function testSupportsSmoothScroll() {
    let supports = false;
    try {
      const div = document.createElement('div');
      div.scrollTo({
        top: 0,
        get behavior() {
          supports = true;
          return 'smooth';
        },
      });
    } catch (err) { 
      // Edge throws an error
    } 
    return supports;
  }

  const hasNativeSmoothScroll = testSupportsSmoothScroll();

  function smoothScroll(node, topOrLeft, horizontal) {
    if (hasNativeSmoothScroll) {
      return node.scrollTo({
        [horizontal ? 'left' : 'top']: topOrLeft,
        behavior: 'smooth',
      });
    }
    return smoothScrollPolyfill(node, horizontal ? 'scrollLeft' : 'scrollTop', topOrLeft);
  }

  function debounce(func, ms) {
    let timeout;
    return () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        timeout = null;
        func();
      }, ms);
    };
  }

  const indicators = document.querySelectorAll('.indicator-button');
  const scroller = document.querySelector('.scroll');

  function setAriaLabels() {
    indicators.forEach((indicator, i) => {
      indicator.setAttribute('aria-label', `Scroll to item #${i + 1}`);
    });
  }

  function setAriaPressed(index) {
    indicators.forEach((indicator, i) => {
      indicator.setAttribute('aria-pressed', !!(i === index));
    });
  }

  indicators.forEach((indicator, i) => {
    indicator.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      setAriaPressed(i);
      const scrollLeft = Math.floor(scroller.scrollWidth * (i / 4));
      smoothScroll(scroller, scrollLeft, true);
    });
  });

  scroller.addEventListener('scroll', debounce(() => {
    let index = Math.round((scroller.scrollLeft / scroller.scrollWidth) * 4);
    setAriaPressed(index);
  }, 200));

  setAriaLabels();
}
