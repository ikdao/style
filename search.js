export default function uiQ({
  inputId,
  containerId,
  selector = '[search]',
  getText,
  onSelect
}) {
  const input = document.getElementById(inputId);
  const box = document.getElementById(containerId);
  let list = [];
  let index = -1;

  const extract = getText || (el => {
    return [
      el.textContent,
      el.getAttribute('title'),
      el.getAttribute('alt'),
      el.getAttribute('aria-label'),
      el.getAttribute('data-label')
    ].filter(Boolean).join(' ').toLowerCase();
  });

  const update = q => {
    const all = box.querySelectorAll(selector);
    list = [];
    index = -1;

    all.forEach(el => {
      const text = extract(el);
      const match = text.includes(q);
      el.style.display = match ? '' : 'none';
      if (match) list.push(el);
    });
  };

  const keys = e => {
    if (!list.length) return;
    if (e.key === 'ArrowDown') index = (index + 1) % list.length;
    else if (e.key === 'ArrowUp') index = (index - 1 + list.length) % list.length;
    else if (e.key === 'Enter' && list[index] && onSelect) return onSelect(list[index]);
    else return;

    list.forEach((el, i) => el.classList.toggle('active-search-item', i === index));
    list[index].scrollIntoView({ block: 'nearest' });
    e.preventDefault();
  };

  input.addEventListener('input', () => update(input.value.trim().toLowerCase()));
  input.addEventListener('keydown', keys);
}
