import React from 'react';
import axios from 'redaxios';

export default function Card(props){

    const cardClicked = (id) => {
        // here is where we make axios request
    
        // make GET request to local server
        axios({
            method: 'get',
            url: 'http://139.182.76.138:8000/testdata',
            params: {
                id: id
            }
        })
        .then(function (response) {
            // handle success
            const newURL = "/" + response.data[0].filecall;

            props.callback(newURL);
        })
        .catch(function (error) {
            // handle error
            console.log("There was an error from Axios: \n" + error);
        })
        .then(function () {
            // always executed
        })
    }

    return (
        <>
            <li className='row'>
                <div className="column">
                    <div className="card" id="cardSelection" onClick={() => cardClicked(props.modelid)}>
                        <img src={props.imgURL} alt="preview" width="120" height="100" />
                        <div className="container">
                            <h4><b>{props.filename}</b></h4>
                        </div>
                    </div>
                </div>
            </li>
        </>
    )
}
