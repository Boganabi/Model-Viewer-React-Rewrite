import React from 'react';
import Popup from 'reactjs-popup';

export default function(props) {

    return (
        <>
            <Popup modal style={{overflow: 'scroll'}} className='popupContent' trigger={<button className='clickable controls' >Show Controls</button>}>
                <div className='centeredBoi'>
                    <h2>Controls</h2>
                    <div className='ControlDisplay'>
                        <p className='betterText'>Move selected piece: </p>
                        <p className='betterText'>Move entire model: </p>
                        <p className='betterText'>Rotate selected piece: </p>
                        <p className='betterText'>Rotate entire model: </p>
                        <p className='betterText'>Rotate: </p>
                        <p className='betterText'>Zoom: </p>
                        <p className='betterText'>Pan: </p>
                    </div>
                    <div className='ControlKeys'>
                        {/* workaround for weird thing going in where bold text doesnt work with the css padding */}
                        <div className='keysPadding'>
                            <b className='betterText'>w/a/s/d/q/e</b>
                        </div>
                        <div className='keysPadding'>
                            <b className='betterText'>Shift + w/a/s/d/q/e</b>
                        </div>
                        <div className='keysPadding'>
                            <b className='betterText'>i/j/k/l/u/o</b>
                        </div>
                        <div className='keysPadding'>
                            <b className='betterText'>Arrow Keys</b>
                        </div>
                        <div className='keysPadding'>
                            <b className='betterText'>Left Mouse</b>
                        </div>
                        <div className='keysPadding'>
                            <b className='betterText'>Scroll Wheel</b>
                        </div>
                        <div className='keysPadding'>
                            <b className='betterText'>Right Mouse</b>
                        </div>
                    </div>
                </div>
            </ Popup>
        </>
    )
}