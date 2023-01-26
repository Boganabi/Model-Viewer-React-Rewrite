import React from 'react';
import Popup from 'reactjs-popup';
import Card from './Card.js';
import 'reactjs-popup/dist/index.css';

var fileuploaded;

export default function PopupMenu(props){

    const uploadedFile = (event) => {
        fileuploaded = event.target.files[0];
        props.callback(fileuploaded, true);
    }

    const databaseFile = (file) => {
        props.callback(file, false);
    }

    return(
        <div className='upperLeftContainer'>
            <Popup trigger={<button className='clickable'>&#9881;</button>} modal className='popupContent'>
                {close => (
                    <div className='centeredBoi'>
                        <button className='close' onClick={close}>&times;</button>
                        <h2 className='betterText'>Select or Upload a model</h2>
                        <br />
                        <label className='fileLabel' htmlFor="test">
                            <div className="fileUpload">Click or drop a file here!</div>
                            <input id="file-upload" type="file" name="file" onChange={e => { uploadedFile(e); close() }}/>
                        </label>
                        <br />
                        <div className="something">
                            <ul id="cards" style={{listStyleType: "none"}}>
                                <Card filename="fancyskull" modelid="0" callback={e => { databaseFile(e); close() }} />
                                <Card filename="diamond" modelid="1" callback={e => { databaseFile(e); close() }} />
                                <Card filename="milw-ep2" modelid="2" callback={e => { databaseFile(e); close() }} />
                            </ul>
                        </div>
                        <div className='bottomPage'>
                            <button className='clickable' onClick={close}>Close</button>
                        </div>
                    </div>
                )}
            </Popup>
        </div>
    );
}
