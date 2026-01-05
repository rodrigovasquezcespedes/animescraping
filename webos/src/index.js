/* global ENACT_PACK_ISOMORPHIC */
import {render} from 'react-dom';

import App from './App';
import reportWebVitals from './reportWebVitals';

render(<App />, document.getElementById('root'));

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint.
// Learn more: https://github.com/enactjs/cli/blob/master/docs/measuring-performance.md
reportWebVitals();
