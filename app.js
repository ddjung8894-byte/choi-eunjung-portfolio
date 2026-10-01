'use strict';
const navigationLinks = [...document.querySelectorAll('.section-nav a')];
const sections = navigationLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
const navigationShell = document.querySelector('.navigation-shell');
const setCurrentSection = () => {
  let activeId = '';
  const activeBoundary = navigationShell.getBoundingClientRect().height + 48;
  for (const section of sections) if (section.getBoundingClientRect().top <= activeBoundary) activeId = section.id;
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 6) activeId = 'contact';
  navigationLinks.forEach(link => {
    if (link.hash === '#' + activeId) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
};
let scrollPending = false;
window.addEventListener('scroll', () => {
  if (!scrollPending) requestAnimationFrame(() => { setCurrentSection(); scrollPending = false; });
  scrollPending = true;
}, { passive: true });
setCurrentSection();
const updateNavigationSize = () => {
  document.documentElement.style.setProperty('--navigation-height', `${navigationShell.getBoundingClientRect().height}px`);
  setCurrentSection();
};
new ResizeObserver(updateNavigationSize).observe(navigationShell);
updateNavigationSize();

const workDialog = document.querySelector('#work-dialog');
let previouslyFocused;
const closeDialog = () => workDialog.close();
document.querySelector('.close-dialog').addEventListener('click', closeDialog);
workDialog.addEventListener('close', () => { previouslyFocused?.focus({ preventScroll: true }); });
workDialog.addEventListener('click', event => {
  if (event.target !== workDialog) return;
  const box = workDialog.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeDialog();
});
document.querySelectorAll('[data-work]').forEach(button => {
  button.addEventListener('click', () => {
    previouslyFocused = button;
    document.querySelector('#dialog-title').textContent = button.dataset.title;
    document.querySelector('#dialog-label').textContent = button.dataset.label;
    document.querySelector('#dialog-description').textContent = button.dataset.description;
    const images = button.dataset.images.split(',').map(source => {
      const img = document.createElement('img');
      img.src = source;
      img.alt = button.dataset.title + ' 보관 작업물';
      return img;
    });
    document.querySelector('#dialog-images').replaceChildren(...images);
    workDialog.showModal();
    workDialog.scrollTop = 0;
  });
});
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const hero = document.querySelector('.hero');
const portrait = document.querySelector('.portrait');
const portraitFrame = document.querySelector('.portrait-frame');
const helloReplay = document.querySelector('.hello-replay');
const motionToggle = document.querySelector('.motion-toggle');
let savedMotion = null;
try { savedMotion = localStorage.getItem('eunjung-motion'); } catch {}
const motionAllowed = () => savedMotion === 'on' || (savedMotion !== 'off' && !motionPreference.matches);
const runningMotions = new Set();
let greetingMotions = [];
let entranceObserver;
let pointerFrame = 0;

const move = (element, frames, options) => {
  if (!element || !motionAllowed()) return null;
  const animation = element.animate(frames, {duration: 650, easing: 'cubic-bezier(.2,.75,.2,1)', ...options});
  runningMotions.add(animation);
  animation.finished.catch(() => {}).finally(() => runningMotions.delete(animation));
  return animation;
};

const greet = () => {
  greetingMotions.forEach(animation => animation?.cancel());
  greetingMotions = [];
  if (!motionAllowed()) return;
  document.querySelectorAll('.intro-word').forEach((word, index) => {
    greetingMotions.push(move(word, [{transform:'translateY(105%)'}, {transform:'translateY(0)'}], {duration:850, delay:index*140, fill:'backwards'}));
  });
  greetingMotions.push(move(document.querySelector('.name-mark'), [{transform:'scaleX(0)'}, {transform:'scaleX(1)'}], {duration:650, delay:630, fill:'backwards'}));
  greetingMotions.push(move(document.querySelector('.wave-hand'), [
    {transform:'rotate(0deg)',offset:0}, {transform:'rotate(21deg)',offset:.15},
    {transform:'rotate(-12deg)',offset:.3}, {transform:'rotate(20deg)',offset:.45},
    {transform:'rotate(-8deg)',offset:.6}, {transform:'rotate(15deg)',offset:.75},
    {transform:'rotate(0deg)',offset:1}
  ], {duration:1400,delay:500,easing:'ease-in-out'}));
  greetingMotions.push(move(portrait, [{transform:'translateY(24px) rotate(-4deg)',opacity:.35}, {transform:'translateY(0) rotate(2deg)',opacity:1}], {duration:1000,delay:120,fill:'backwards'}));
  greetingMotions.push(move(document.querySelector('.portrait-note'), [{transform:'translateY(12px) rotate(-14deg)',opacity:0}, {transform:'translateY(0) rotate(-7deg)',opacity:1}], {duration:600,delay:680,fill:'backwards'}));
};

helloReplay.addEventListener('click', greet);
const resetPortrait = () => {
  cancelAnimationFrame(pointerFrame);
  pointerFrame = 0;
  portraitFrame.style.removeProperty('--photo-x');
  portraitFrame.style.removeProperty('--photo-y');
};
portrait.addEventListener('pointermove', event => {
  if (!motionAllowed() || !finePointer.matches) return;
  const {clientX,clientY} = event;
  cancelAnimationFrame(pointerFrame);
  pointerFrame = requestAnimationFrame(() => {
    const box=portrait.getBoundingClientRect();
    const x=Math.max(-.5,Math.min(.5,(clientX-box.left)/box.width-.5));
    const y=Math.max(-.5,Math.min(.5,(clientY-box.top)/box.height-.5));
    portraitFrame.style.setProperty('--photo-x',`${-y*9}deg`);
    portraitFrame.style.setProperty('--photo-y',`${x*9}deg`);
    pointerFrame=0;
  });
});
portrait.addEventListener('pointerleave',resetPortrait);
portrait.addEventListener('pointercancel',resetPortrait);

const setupEntrances = () => {
  entranceObserver?.disconnect();
  const enabled=motionAllowed();
  document.documentElement.classList.toggle('motion-enabled',enabled);
  document.documentElement.classList.toggle('motion-disabled',!enabled);
  motionToggle.setAttribute('aria-pressed',String(enabled));
  motionToggle.textContent=enabled ? '모션 끄기' : '모션 켜기';
  helloReplay.hidden=!enabled;
  if (!enabled) {
    runningMotions.forEach(animation=>animation.cancel());
    resetPortrait();
    return;
  }
  entranceObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if (!entry.isIntersecting) return;
      const item=entry.target;
      if (!item.dataset.motionSeen) {
        item.dataset.motionSeen='true';
        move(item,[{opacity:.3,transform:'translateY(22px)'},{opacity:1,transform:'translateY(0)'}],{duration:650});
      }
      entranceObserver.unobserve(item);
    });
  },{threshold:.12,rootMargin:'0px 0px -24px 0px'});
  document.querySelectorAll('.section-heading,.skill-card,.work-card,.app-card').forEach(item=>entranceObserver.observe(item));
};
motionToggle.addEventListener('click',()=>{
  savedMotion=motionAllowed() ? 'off' : 'on';
  try { localStorage.setItem('eunjung-motion',savedMotion); } catch {}
  setupEntrances();
  if (motionAllowed()) greet();
});
motionPreference.addEventListener('change',setupEntrances);
finePointer.addEventListener('change',resetPortrait);
document.addEventListener('visibilitychange',()=>{
  if (document.hidden) {runningMotions.forEach(animation=>animation.cancel());resetPortrait();}
});
setupEntrances();
requestAnimationFrame(greet);
