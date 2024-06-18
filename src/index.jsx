import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';

// createRoot(document.getElementById('root')).render(<App />);

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>
)

// special symbols index: https://www.toptal.com/designers/htmlarrows/symbols/ 