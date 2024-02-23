import React, { useState, useEffect } from 'react';

export default function(props) {

    const [showText, setShowText] = useState(false);
    const [score, setScore] = useState("");

    function handleClick() {
        setShowText(true);
        props.scrambler();
    }

    useEffect(() => {
        setShowText(false);
    }, [props.model]);

    useEffect(() => {
        const newScore = "Score: " + props.reconScore.currScore + "/" + props.reconScore.total;
        setScore(newScore);
    }, [props.reconScore]);

    return (
        <>
            <div className='reconstruction'>
                {!showText && <button className='clickable' onClick={handleClick}>Start Reconstruction</button>}
                {showText && <p className='betterText'>{score}</p>}
            </div>
        </>
    )
}