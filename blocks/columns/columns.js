export default function decorate(blockEl) {
  const cols = [...blockEl.firstElementChild.children];
  blockEl.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...blockEl.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });

  if (blockEl.classList.contains('network')) {
    blockEl.closest('.section').classList.add('network-panel');
  }
}
