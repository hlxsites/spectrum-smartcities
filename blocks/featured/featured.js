export default async function decorate(blockEl) {
  const imgEl = blockEl.querySelector('img');
  const picEl = blockEl.querySelector(':scope > div > div:first-child');
  picEl.style.backgroundImage = `url("${imgEl.src}")`;
  imgEl.remove();
}
