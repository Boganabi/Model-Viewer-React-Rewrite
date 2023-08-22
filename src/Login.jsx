import React, { useState } from 'react';
import axios from 'redaxios';
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBrN_Di0NzuUUjJ9W9otiEA29G_QlM3QA8",
    authDomain: "threedmodeling-9fabd.firebaseapp.com",
    projectId: "threedmodeling-9fabd",
    storageBucket: "threedmodeling-9fabd.appspot.com",
    messagingSenderId: "636943078987",
    appId: "1:636943078987:web:1fc2de11dd542e4b509fce",
    measurementId: "G-Z0N5LZCQDF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default function Login(props) {
    // how to add firebase login https://firebase.google.com/docs/auth/web/firebaseui 

    // note for future: on popup docs theres a nested part worth looking at
    // https://react-popup.elazizi.com/component-api
    const [err, setErr] = useState(false);
    const [status, setStatus] = useState("Upload a file here to add it to the database!");

    function submittedForm() {

        const em = document.getElementById("emailField");
        const pa = document.getElementById("passwordField");

        const email = em.value;
        const password = pa.value;

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // signed in
                props.callback(userCredential);
                setErr(false);
            })
            .catch((error) => {
                console.log(error);
                setErr(true);
            })
    }

    const handleKeyDown = (event) => {
        if (event.key === 'Enter'){
            submittedForm();
        }
    }
    
    function uploadToDatabase(file) {
        // load model and download screenshot
        props.gotNewModel(file);

        // make POST request to local server and upload with image
        axios({
            method: 'post',
            url: 'http://localhost:8000/testdata',
            params: {
                filename: file.target.files[0].name.split(".")[0],
                image: file.target.files[0].name.split(".")[0]
            }
        })
        .then(function (response) {
            // handle success
            console.log(response);
            setStatus("Uploaded sucessfully");
        })
        .catch(function (error) {
            // handle error
            console.log("There was an error from Axios: \n" + error);
            setStatus("An error occurred, please try again");
        })
        .then(function () {
            // always executed
        })
    }

    return (
        <>
            { !props.creds && <>
                <div className='loginArea'>
                    <h3 className='betterText'>Login for admin functions</h3>
                    <div className='inputWrapper'>
                        <input type="email" placeholder='Email' className='inputDesign' id='emailField'></input>
                    </div>
                    <br />
                    <div className='inputWrapper'>
                        <input type="password" placeholder='Password' className='inputDesign' id='passwordField' onKeyDown={handleKeyDown}></input>
                    </div>
                    <br />
                    <button className='clickable' onClick={ () => submittedForm() }>Login</button>
                    { err && <>
                        <p className='betterText'>Error signing in, please try again</p>
                    </> }
                </div> 
            </> }
            { props.creds && <> 
                <div className='databaseUploadArea'>
                    <p className='betterText'>Signed in as {props.creds.user.email}</p>
                    <label className='fileLabel' htmlFor="test">
                        <div className="fileUpload">{status}</div>
                        <input id="file-upload" type="file" name="file" accept=".glb" onChange={e => { uploadToDatabase(e); }}/>
                    </label>
                </div>
            </>}
        </>
    )
}