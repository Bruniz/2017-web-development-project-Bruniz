import React from 'react';
import ReactDOM from 'react-dom';
import SPMS from './SPMS';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<SPMS />, document.getElementById('root'));
registerServiceWorker();
