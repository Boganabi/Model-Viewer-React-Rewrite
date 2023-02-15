import React, { useState, useEffect } from 'react';
import Popup from 'reactjs-popup';
import Card from './Card.js';
import Login from './Login.js';
import axios from 'axios';
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

    const [creds, setCreds] = useState(); // state has to be held here so that it doesnt reset every time the popup is opened

    // const [names, setNames] = useState();
    var names = [];

    useEffect(() => {
        // get all values from the database
        axios({
            method: 'get',
            url: 'http://localhost:8000/getall',
        })
        .then(function (response) {
            // handle success
            console.log(response);
            // setNames(response.data.rows);
            names = response.data.rows;
            console.log(response.data.rows);
            console.log(names);
        })
        .catch(function (error) {
            // handle error
            console.log("There was an error from Axios: \n" + error);
        })
        .then(function () {
            // always executed
        })
    }, []);

    // function loadAllNames() {
    //     // get all values from the database
    //     axios({
    //         method: 'get',
    //         url: 'http://localhost:8000/getall',
    //     })
    //     .then(function (response) {
    //         // handle success
    //         console.log(response);
    //         setNames(response.data.rows);
    //         console.log(response.data.rows);
    //     })
    //     .catch(function (error) {
    //         // handle error
    //         console.log("There was an error from Axios: \n" + error);
    //     })
    //     .then(function () {
    //         // always executed
    //     })
    // }

    return(
        <div className='upperLeftContainer'>
            <Popup modal className='popupContent' trigger={<button className='clickable'>&#9881;</button>} >
                { close => (
                    <div className='centeredBoi'>
                        <button className='close' onClick={ () => close() }>&times;</button>
                        <h2 className='betterText'>Select or Upload a model</h2>
                        <br />
                        <label className='fileLabel' htmlFor="test">
                            <div className="fileUpload">Click or drop a file here!</div>
                            <input id="file-upload" type="file" name="file" onChange={e => { uploadedFile(e); close() }}/>
                        </label>
                        <br />
                        <div className="something">
                            <ul id="cards" style={{listStyleType: "none"}}>
                                {/* <Card filename="fancyskull" modelid="1" callback={e => { databaseFile(e); close() }} />
                                <Card filename="diamond" modelid="2" callback={e => { databaseFile(e); close() }} />
                                <Card filename="milw-ep2" modelid="3" callback={e => { databaseFile(e); close() }} /> */}
                                {
                                    names && names.map((name, i) => {
                                        return <Card key={i} filename={name.filename} modelid={i + 1} callback={e => { databaseFile(e); close() }} />
                                    })
                                }
                                {
                                    !names && <>
                                        <h2 className='betterText'>Loading models...</h2>
                                    </>
                                }
                            </ul>
                        </div>
                        <Login callback={ setCreds } creds={creds}/>
                        <br />
                        <div className='bottomPage'>
                            <button className='clickable' onClick={ () => close() }>Close</button>
                        </div>
                    </div>
                )}
            </Popup>
        </div>
    );
}
