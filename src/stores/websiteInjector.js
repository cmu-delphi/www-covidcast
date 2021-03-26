import { currentMode } from '.';
import { modeByID } from '../modes';

let modeList = document.querySelector('.nav-container');
if (!modeList) {
  // create a dummy one
  modeList = document.createElement('div');
}

// inject shortcut handling
Array.from(modeList.querySelectorAll('li[data-mode] a')).forEach((mode) => {
  const modeId = mode.parentElement.dataset.mode;
  const modeObject = modeByID[modeId];
  if (modeObject) {
    mode.addEventListener('click', (e) => {
      e.preventDefault();
      currentMode.set(modeObject);
    });
  }
});

/**
 * @param {import('../modes').Mode} mode
 */
function syncMode(mode) {
  // update mode list
  const active = modeList.querySelector('.uk-active');
  if (active) {
    active.classList.remove('uk-active');
  }
  const newMode = modeList.querySelector(`[data-mode="${mode.id}"]`);
  if (newMode) {
    newMode.classList.add('uk-active');
  }
  // update breadcrumb
  const lastBreadcrumb = document.querySelector('.breadcrumb-menu li:last-of-type span');
  if (lastBreadcrumb) {
    lastBreadcrumb.textContent = mode.label;
  }
}

currentMode.subscribe(syncMode);
