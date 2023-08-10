import {
  createEl,
} from '../../scripts/scripts.js';

export default async function decorate(blockEl) {
  createEl('div', {
    class: 'viewport',
  }, `
    <div class="carousel-frame">
      <div class="carousel">
        <ul class="scroll">
          <li class="scroll-item-outer">
            <div class="scroll-item">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Cute_grey_kitten.jpg/1280px-Cute_grey_kitten.jpg" alt="Picture of a gray kitten looking at the camera" />
            </div>
          </li>
          <li class="scroll-item-outer">
            <div class="scroll-item">
              <img src="https://upload.wikimedia.org/wikipedia/commons/0/06/Kitten_in_Rizal_Park%2C_Manila.jpg" alt="Picture of a gray kitten looking at a branch"/>
            </div>
          </li>
          <li class="scroll-item-outer">
            <div class="scroll-item">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Red_Kitten_01.jpg/1280px-Red_Kitten_01.jpg" alt="Picture of an orange kitten looking at the camera" />
            </div>
          </li>
          <li class="scroll-item-outer">
            <div class="scroll-item">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Youngkitten.JPG/1280px-Youngkitten.JPG" alt="Picture of a young kitten opening its eyes"/>
            </div>
          </li>
        </ul>
      </div>
    </div>
    <ul class="indicators">
      <li class="indicator">
        <button class="indicator-button" aria-pressed="true"></button>
      </li>
      <li class="indicator">
        <button class="indicator-button"></button>
      </li>
      <li class="indicator">
        <button class="indicator-button"></button>
      </li>
      <li class="indicator">
        <button class="indicator-button"></button>
      </li>
    </ul>
  `, blockEl);

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
    } catch (err) { } // Edge throws an error
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
