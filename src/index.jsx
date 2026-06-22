import React from 'react';
import ReactDOM from 'react-dom/client';
// import '@iframe-resizer/child'
import testimg from "./test_screenshot.png";
import './styles.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';

// createRoot(document.getElementById('root')).render(<App />);

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <BrowserRouter>
            {/* <App /> */}
            {/* <script src="https://cdn.jsdelivr.net/npm/@iframe-resizer/child@4.2.11"></script> */}
            <script src="https://cdn.jsdelivr.net/npm/iframe-resizer@4.4.5/js/iframeResizer.contentWindow.min.js"></script>
            <img src={testimg} />
        </BrowserRouter>
        {/* <script
            async
            src="/node_modules/@iframe-resizer/child/index.umd.js"
        ></script> */}
    </React.StrictMode>
)

// special symbols index: https://www.toptal.com/designers/htmlarrows/symbols/ 