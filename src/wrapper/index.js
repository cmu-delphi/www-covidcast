import UIkit from 'uikit/dist/js/uikit.js';
import plugin from 'uikit/dist/js/uikit-icons.js';
import './style.scss';

window.UIkit = UIkit; // enforce global variable
window.DELPHI_COVIDCAST_PAGE = '/';

UIkit.use(plugin);
