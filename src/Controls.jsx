import React, { useState } from 'react';
import Popup from 'reactjs-popup';

export default function(props) {

    const [modalOpen, setOpen] = useState(false);

    return (
        <>
            <Popup modal style={{overflow: 'scroll'}} className='popupContent' trigger={<button className='clickable controls' >Show Controls</button>} onOpen={() => { setOpen(true) }} onClose={() => { setOpen(false) }} open={modalOpen}>
                <button className='close' onClick={ () => setOpen(false) }>&times;</button>
                <div className='centeredBoi'>
                    <h2>Controls</h2>
                    <div className='ControlDisplay'>
                        <p className='betterText'>Move selected piece: <b>w/a/s/d/q/e</b></p>
                        <p className='betterText'>Move entire model: <b>Shift + w/a/s/d/q/e</b></p>
                        <p className='betterText'>Rotate selected piece: <b>i/j/k/l/u/o</b></p>
                        <p className='betterText'>Rotate entire model: <b>Arrow Keys</b></p>
                        <p className='betterText'>Rotate: <b>Left Mouse</b></p>
                        <p className='betterText'>Zoom: <b>Scroll Wheel</b></p>
                        <p className='betterText'>Pan: <b>Right Mouse</b></p>
                        <p className='betterText'>Toggle move piece with mouse: <b>Space </b></p>
                        <p className='betterText'>Undo move: <b>z </b></p>
                        <p className='betterText'>Redo move <b>y </b></p>
                    </div>
                    {/* <div className='ControlKeys'> */}
                        {/* workaround for weird thing going in where bold text doesnt work with the css padding */}
                        {/* <div className='keysPadding'>
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
                        <div className='keysPadding'>
                            <b className='betterText'>Space</b>
                        </div> */}
                    {/* </div> */}
                </div>
            </ Popup>
        </>
    )
}