import React from "react";
import ReactDOM from "react-dom/client";
import testimg from "./test_screenshot.png";
import "./styles.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import IFrameResizer from "./IFrameResizer.jsx";

// createRoot(document.getElementById('root')).render(<App />);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <IFrameResizer />
      <img src={testimg} />
    </BrowserRouter>
  </React.StrictMode>,
);

// special symbols index: https://www.toptal.com/designers/htmlarrows/symbols/
