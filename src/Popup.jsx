import React, { useState, useEffect } from 'react';
import Popup from 'reactjs-popup';
import Card from './Card.jsx';
import Login from './Login.jsx';
import axios from 'redaxios';
import 'reactjs-popup/dist/index.css';

var fileuploaded;

var names = [];

export default function PopupMenu(props){

    const [query, setQuery] = useState("");

    const uploadedFile = (event, flag) => {
        fileuploaded = event.target.files[0];
        if(flag) {
            props.callback(fileuploaded, true, event.target.files[0].name);
        }
        else{
            props.callback(fileuploaded, true, undefined);
        }
    }

    function checkData(d) {
        // console.log(d);
        props.saveData(d);
    }

    const databaseFile = (file) => {
        props.callback(file, false, undefined);
    }

    const [creds, setCreds] = useState(); // state has to be held here so that it doesnt reset every time the popup is opened

    useEffect(() => {
        // get all values from the database
        axios({
            method: 'get',
            // url: 'http://localhost:8000/getall',
            url: 'http://139.182.76.138:8000/getall',
        })
        .then(function (response) {
            // handle success
            // consider memoizing this in the future
            names = response.data.rows;
        })
        .catch(function (error) {
            // handle error
            console.log("There was an error from Axios: \n" + error);
        })
        .then(function () {
            // always executed
        })
    }, []);

    return(
        <div className='upperLeftContainer'>
            <button className='clickable' onClick={() => props.setter(!props.getOpen)} >&#9881;</button>
            {/* <Popup modal className='popupContent' trigger={<button className='clickable' >&#9881;</button>} onOpen={() => { props.setter(true) }} onClose={() => { props.setter(false) }} open={props.setOpen} > */}
            <Popup modal className='popupContent' onOpen={() => { props.setter(true) }} onClose={() => { props.setter(false) }} open={props.getOpen} >
            {/* <Popup modal className='popupContent' open={props.open} onClose={() => { props.setter(false) }} > */}
                { close => (
                    <div className='centeredBoi'>
                        <button className='close' onClick={ () => close() }>&times;</button>
                        <h2 className='betterText'>Select or Upload a model</h2>
                        <br />
                        <label className='fileLabel' htmlFor="test">
                            <div className="fileUpload">Click or drop a file here!</div>
                            <input id="file-upload" type="file" name="file" accept='.glb, .obj' onChange={e => { uploadedFile(e); close() }}/>
                        </label>
                        <br />
                        <div className='searchwrapper'>
                            <input placeholder="Search by class or name..." onChange={event => setQuery(event.target.value)} className='searchbar' />
                        </div>
                        <div className="something">
                            {/* consider making these load as the user scrolls 
                                add searchbar here to filter by class types and name */}
                            <ul id="cards" style={{listStyleType: "none"}}>
                                {
                                    names && names.map((name, i) => {
                                        // name holds each attribute corresponding to a column in the database
                                        if(query === "" || name.filename.toLowerCase().includes(query.toLowerCase()) || (name.classtype && name.classtype.toLowerCase().includes(query.toLowerCase()))){
                                            return <Card key={i} filename={name.filename} modelid={name.id} imgURL={name.preview} callback={e => { databaseFile(e); close() }} />
                                        }
                                    })
                                }
                                {
                                    !names && <>
                                        <h2 className='betterText'>Loading available models...</h2>
                                    </>
                                }
                            </ul>
                        </div>
                        <Login callback={ setCreds } creds={creds} gotNewModel={e => { uploadedFile(e, true); close() }} updateList={ () => {props.updateList(); close()} } saveUploadData={checkData} savedFormData={props.savedFormData} addLabels={e => { uploadedFile(e); props.updateList(); close() }} labels={props.labels} />
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
