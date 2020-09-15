const SERVER = process.env.COVID_SERVER;

export function downloadUrl(url, name) {
  const a = document.createElement('a');
  a.download = name;
  a.href = url;
  a.style.position = 'absolute';
  a.style.left = '-10000px';
  a.style.top = '-10000px';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function downloadMap(params) {
  const p = new URLSearchParams(params);
  p.delete('mode');

  downloadUrl(`${SERVER}/api/screenshot/map?${p.toString()}`, 'COVIDCast Map.png');
}
