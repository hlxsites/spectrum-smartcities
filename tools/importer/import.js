/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* global WebImporter */
/* eslint-disable no-console, class-methods-use-this */

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

const createMetadata = (main, document) => {
  const meta = {};

  const title = document.querySelector('title');
  if (title) {
    meta.Title = title.textContent.replace(/[\n\t]/gm, '');
  }

  const desc = document.querySelector('[property="og:description"]');
  if (desc) {
    meta.Description = desc.content;
  }

  const img = document.querySelector('[property="og:image"]');
  if (img && img.content) {
    const el = document.createElement('img');
    el.src = img.content;
    meta.Image = el;
  }

  const block = WebImporter.Blocks.getMetadataBlock(document, meta);
  main.append(block);

  return meta;
};

export default {
  /**
   * Apply DOM operations to the provided document and return an array of
   * objects ({ element: HTMLElement, path: string }) to be transformed to Markdown.
   * @param {HTMLDocument} document The document
   * @param {string} url The url of the page imported
   * @param {string} html The raw html (the document is cleaned up during preprocessing)
   * @param {object} params Object containing some parameters given by the import process.
   * @returns {Array} The { element, path } pairs to be transformed
   */
  transform: ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => {
    // define the main element: the one that will be transformed to Markdown
    const main = document.body;

    // use helper method to remove header, footer, etc.
    WebImporter.DOMUtils.remove(main, [
      '.header',
      '.footer',
      'script',
      'iframe',
      'noscript',
      'br',
      '.animated-image-with-mask',
    ]);

    /** Fix Links */
    const HLXHOST = 'https://main--spectrum-smartcities--hlxsites.hlx.page';
    const linkEls = document.querySelectorAll('a');
    linkEls.forEach((linkEl) => {
      let { href } = linkEl;
      if (href.endsWith('/')) {
        href = href.substring(0, href.lastIndexOf('/'));
      }
      if (href.endsWith('.html')) {
        href = href.substring(0, href.lastIndexOf('.'));
      }
      if (href.startsWith('/') || href.startsWith('https://spectrumsmartcities.com')) {
        linkEl.href = `${HLXHOST}${href}`;
      }
    });

    /** Fix Arrows */
    const arrowImgEls = main.querySelectorAll('img[src="https://assets.spectrumenterprise.com/is/image/spectrument/arrow-navy"]');
    arrowImgEls.forEach((arrowImgEl) => {
      arrowImgEl.replaceWith(':arrowdown:');
    });

    /** Fix Headers */
    const firstFakeHeaderEl = main.querySelector('.h1:first-child');
    firstFakeHeaderEl.outerHTML = createEl('h1', {}, `${firstFakeHeaderEl.textContent}`).outerHTML;

    const lastFakeHeaderEl = main.querySelector('.h1:last-child');
    if (lastFakeHeaderEl) {
      const lfhpEl = lastFakeHeaderEl.closest('.default-bg');
      lfhpEl.innerHTML = WebImporter.DOMUtils.createTable([
        ['Columns'],
        ['', lfhpEl.outerHTML],
      ], document).outerHTML;
    }

    const fakeHeader1Els = document.querySelectorAll('h2.h1');
    fakeHeader1Els.forEach((fakeHeaderEl) => {
      fakeHeaderEl.innerHTML = createEl('h2', {}, `<strong>${fakeHeaderEl.textContent}</strong>`).outerHTML;
    });

    const fakeHeader4Els = document.querySelectorAll('.h4');
    fakeHeader4Els.forEach((fakeHeaderEl) => {
      fakeHeaderEl.innerHTML = createEl('h3', {}, fakeHeaderEl.textContent).outerHTML;
    });

    const shortH1Els = document.querySelectorAll('h1, .h1');
    shortH1Els.forEach((shortH1El) => {
      const text = shortH1El.textContent.trim();
      if (text.split(' ').length === 2) {
        shortH1El.innerHTML = `<strong>${text.replace(' ', '<br/>')}</strong>`;
      }
    });

    /**
     * Build Blocks
     * */

    /** Breadcrumb Section */
    const breadCrumbEl = main.querySelector('.breadcrumbs-container');
    if (breadCrumbEl) {
      const breadCrumbEls = breadCrumbEl.querySelectorAll('a, li > span');
      const bcLinksEl = document.createElement('div');
      breadCrumbEls.forEach((bcLinkEl) => {
        bcLinksEl.append(bcLinkEl);
      });
      const cells = [
        ['Breadcrumb'],
        [bcLinksEl],
      ];
      const breadCrumbBlockEl = WebImporter.DOMUtils.createTable(cells, document);
      breadCrumbEl.outerHTML = breadCrumbBlockEl.outerHTML;
    }

    /** Featured Block */
    const featuredSectionEls = main.querySelectorAll('.featured-section-wrapper');
    featuredSectionEls.forEach((sectionEl) => {
      const featuredImageEl = WebImporter.DOMUtils.replaceBackgroundByImg(
        sectionEl.querySelector('.featured-main-image'), document);
      const cells = [
        ['Featured'],
        [featuredImageEl, sectionEl.querySelector('.featured-section-text')],
      ];
      const featuredBlockEl = WebImporter.DOMUtils.createTable(cells, document);
      sectionEl.innerHTML = featuredBlockEl.outerHTML;
    });

    /** Related Resources Section */
    const relatedResourceListEls = main.querySelectorAll('.relatedResources .resources');
    relatedResourceListEls.forEach((resourceListEl) => {
      const cells = [
        ['Cards'],
      ];
      const resourceEls = resourceListEl.querySelectorAll('.relatedResourceItem');
      resourceEls.forEach((resourceEl) => {
        if (resourceEl.children.length) {
          const textEls = document.createElement('div');
          textEls.append(resourceEl.querySelector('.related-resource-title') || '');
          textEls.append(resourceEl.querySelector('.related-resource-subtext') || '');
          textEls.append(resourceEl.querySelector('a') || '');
          const row = [
            (resourceEl.querySelector('img') || ''),
            textEls,
          ];
          cells.push(row);
        }
      });
      resourceListEl.innerHTML = WebImporter.DOMUtils.createTable(cells, document).outerHTML;
    });

    /** Resources Section */
    const resourceListEls = main.querySelectorAll('.featuredRow .resources');
    resourceListEls.forEach((resourceListEl) => {
      const cells = [
        ['Cards'],
      ];
      const resourceEls = resourceListEl.querySelectorAll('.featuredRowItem');
      resourceEls.forEach((resourceEl) => {
        if (resourceEl.children.length) {
          const textEls = document.createElement('div');
          textEls.append(resourceEl.querySelector('.featured-row-item-title'));
          const eyebrowEls = resourceEl.querySelectorAll('.featured-row-eyebrows > h6');
          const tagListEL = document.createElement('ul');
          eyebrowEls.forEach((ebEl) => {
            const sEl = document.createElement('li');
            sEl.textContent = ebEl.textContent.trim();
            tagListEL.append(sEl);
          });
          textEls.append(tagListEL);
          textEls.append(resourceEl.querySelector('.featured-row-item-author')?.textContent || '');

          const row = [
            WebImporter.DOMUtils.replaceBackgroundByImg(resourceEl.querySelector('.featured-row-item-image'), document),
            textEls,
          ];
          cells.push(row);
        }
      });
      resourceListEl.innerHTML = WebImporter.DOMUtils.createTable(cells, document).outerHTML;
    });

    /** Filtered Results Section */
    const filteredResultsListEls = main.querySelectorAll('.filteredResults');
    filteredResultsListEls.forEach((resourceListEl) => {
      const cells = [
        ['Cards'],
      ];
      const resourceEls = resourceListEl.querySelectorAll('.resource-item');
      resourceEls.forEach((resourceEl) => {
        const textEls = document.createElement('div');
        textEls.append(resourceEl.querySelector('.resource-title'));
        const eyebrowEls = resourceEl.querySelectorAll('.resource-eyebrows > h6');
        const tagListEL = document.createElement('ul');
        eyebrowEls.forEach((ebEl) => {
          const sEl = document.createElement('li');
          sEl.textContent = ebEl.textContent.trim();
          console.log('t', sEl.textContent);
          tagListEL.append(sEl);
        });
        textEls.append(tagListEL);
        textEls.append(resourceEl.querySelector('.resource-author')?.textContent || '');

        const row = [
          textEls,
        ];
        cells.push(row);
      });
      resourceListEl.innerHTML = WebImporter.DOMUtils.createTable(cells, document).outerHTML;
    });

    // create the metadata block and append it to the main element
    createMetadata(main, document);

    return [{
      element: main,
      path: WebImporter.FileUtils.sanitizePath(new URL(url).pathname.replace(/\.html$/, '').replace(/\/$/, '')),
    }];
  },
};