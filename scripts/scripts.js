import {
  sampleRUM,
  buildBlock,
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlock,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForLCP,
  loadBlocks,
  loadCSS,
  getMetadata,
} from './lib-franklin.js';

const LCP_BLOCKS = []; // add your LCP blocks to the list

export const isMobile = (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
export const isDesktop = window.matchMedia('(min-width: 900px)').matches;

export function createEl(name, attributes = {}, content = '', parentEl = null) {
  const el = document.createElement(name);

  Object.keys(attributes).forEach((key) => {
    el.setAttribute(key, attributes[key]);
  });
  if (content) {
    if (typeof content === 'string') {
      el.innerHTML = content;
    } else if (content instanceof NodeList) {
      content.forEach((itemEl) => {
        el.append(itemEl);
      });
    } else if (content instanceof HTMLCollection) {
      Array.from(content).forEach((itemEl) => {
        el.append(itemEl);
      });
    } else {
      el.append(content);
    }
  }
  if (parentEl) {
    parentEl.append(el);
  }
  return el;
}

export function makeFriendy(string) {
  return string?.toLowerCase().trim().replace(' ', '-');
}

export async function getJSON(pathToJSON) {
  let dataObj;
  try {
    const resp = await fetch(pathToJSON);
    dataObj = await resp.json();
  } catch (error) {
    console.error('Fetching JSON failed', error);
  }
  return dataObj;
}

export function template(strings, ...keys) {
  return (...values) => {
    const dict = values[values.length - 1] || {};
    const result = [strings[0]];
    keys.forEach((key, i) => {
      const value = Number.isInteger(key) ? values[key] : dict[key];
      result.push(value, strings[i + 1]);
    });
    return result.join('');
  };
}

async function loadTemplate(doc, theTemplateName) {
  const templateName = makeFriendy(theTemplateName);
  try {
    const cssLoaded = new Promise((resolve) => {
      loadCSS(`${window.hlx.codeBasePath}/templates/${templateName}/${templateName}.css`, resolve);
    });
    const decorationComplete = new Promise((resolve) => {
      (async () => {
        try {
          const mod = await import(`../templates/${templateName}/${templateName}.js`);
          if (mod.default) {
            await mod.default(doc);
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log(`failed to load module for ${templateName}`, error);
        }
        resolve();
      })();
    });
    await Promise.all([cssLoaded, decorationComplete]);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`failed to load block ${templateName}`, error);
  }
}

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} mainEl The container element
 */
function buildHeroBlock(mainEl) {
  const h1 = mainEl.querySelector('h1');
  const picture = mainEl.querySelector('picture');
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    mainEl.prepend(section);
  }
}

function buildCarouselBlock(mainEl) {
  const columnEls = document.querySelectorAll('.columns > div > div');
  columnEls.forEach((columnEl) => {
    const columnChildren = columnEl.children;
    if (columnChildren.length > 1) {
      let isCarousel = true;
      Array.from(columnChildren).every((childEl) => {
        isCarousel = (childEl.tagName === 'P'
          && childEl.children.length === 1
          && childEl.children[0].tagName === 'PICTURE');
        return isCarousel;
      });

      if (isCarousel) {
        const pictureEls = columnEl.querySelectorAll('picture');
        const blockEl = buildBlock('carousel', { elems: pictureEls });
        blockEl.classList.add('block');
        columnEl.innerHTML = blockEl.outerHTML;
      }
    }
  });
}

function buildRoundCardsBlock(mainEl) {
  const columnEls = document.querySelectorAll('.columns');
  columnEls.forEach((columnEl) => {
    const listEls = columnEl.querySelectorAll('ul');
    listEls.forEach((listEl) => {
      if (listEl.querySelector('picture')) { // This list needs to have a picture
        const itemEls = listEl.querySelectorAll('li');
        const rows = [];
        itemEls.forEach((itemEl) => {
          const brEl = itemEl.querySelector('br');
          if (brEl) {
            brEl.remove();
          }
          rows.push([createEl('div', {}, itemEl.children)]);
        });
        const blockEl = buildBlock('round-cards', rows);
        blockEl.classList.add('block');
        listEl.outerHTML = blockEl.outerHTML;
      }
    });
  });
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

function bindEvents() {
  // if (isDesktop) {
  //   document.addEventListener(SCROLL, () => {
  //     alreadyRevealed = true;
  //     revealBackground();
  //   });
  // }
}

function decorateButtons(element) {
  element.querySelectorAll('a').forEach((a) => {
    a.title = a.title || a.textContent;
    if (a.href !== a.textContent) {
      const up = a.parentElement;
      const twoup = a.parentElement.parentElement;
      if (!a.querySelector('img')) {
        if (up.childNodes.length === 1 && (up.tagName === 'P' || up.tagName === 'DIV')) {
          // by default, don't touch them
        }
        if ((up.childNodes.length === 1 && up.tagName === 'STRONG'
          && twoup.childNodes.length === 1 && twoup.tagName === 'P')) {
          a.className = 'button primary';
          twoup.classList.add('button-container');
        }
        if (up.childNodes.length === 1 && up.tagName === 'EM'
          && twoup.childNodes.length === 1 && twoup.tagName === 'P') {
          a.className = 'button secondary';
          twoup.classList.add('button-container');
        }
      }
    }
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} mainEl The container element
 */
function buildAutoBlocks(mainEl) {
  try {
    // buildHeroBlock(main);
    buildCarouselBlock(mainEl);
    buildRoundCardsBlock(mainEl);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Override
 * Decorates all blocks in a container element and also column block.
 * @param {Element} main The container element
 */
// export function decorateBlocks(main) {
//   main
//     .querySelectorAll('div.section > div > div, .columns .block')
//     .forEach(decorateBlock);
// }

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  bindEvents();
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await waitForLCP(LCP_BLOCKS);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const templateName = getMetadata('template');
  if (templateName) {
    loadTemplate(doc, templateName);
  }

  const main = doc.querySelector('main');
  await loadBlocks(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();

  sampleRUM('lazy');
  sampleRUM.observe(main.querySelectorAll('div[data-block-name]'));
  sampleRUM.observe(main.querySelectorAll('picture > img'));
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
  // window.setTimeout(() => { // Start the reveal even if they haven't scrolled
  //   if (isDesktop && !alreadyRevealed) {
  //     revealBackground();
  //   }
  // }, 2000);
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
