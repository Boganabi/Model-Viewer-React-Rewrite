import { useEffect } from "react";

export default function IFrameResizer() {
  useEffect(() => {
    if(!window) {
      console.warn('[ModelViewer]: no window')
      return
    }
    if (!window.iFrameResizer) {
      console.warn('[ModelViewer]: rendered but no iFrameResizer')
      return
    }
    window.iFrameResizer = {
      onMessage: function (message) {
        // alert("Got message from parent");
        console.log("message", message);
      },
    };
  }, []);

  return <></>;
}
