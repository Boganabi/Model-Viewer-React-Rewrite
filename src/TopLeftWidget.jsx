import React from 'react';
import Namer from './ModelNameSelection.jsx';

export default function Widget(props){

    var names = [];

    return (
        <div className='namer'>
            <Namer count={props.childCount} nextPiece={props.nextPiece} names={names} hideWidget={() => props.finishModelLabels(names)} />
            <br />
            <button className='clickable' onClick={ () => props.updateList() }>Cancel</button>
        </div>
    )
}