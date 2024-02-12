import React, { useState, useEffect } from 'react';


export default function LabelMatching(props){

    const [input, setInput] = useState("");
    const [shownScore, setShownScore] = useState();
    const [startMatching, setStartMatching] = useState(false);

    function handleClick() {
        // console.log(input);
        setInput("");
        props.nextMatch(input);
    }

    useEffect(() => {
        if(props.finalScore.userScore > -1){
            setShownScore("Score: " + props.finalScore.userScore + "/" + props.finalScore.totalScore);
        }
    }, [props.finalScore]);

    return (
        <>
            <div className='matcher'>
                { !startMatching && <button className="clickable" onClick={() => {setStartMatching(true); props.startMatch(); }}>Start Name Matching</button> }
                { startMatching && 
                <>
                    <input type="text" size="60" placeholder="What is the selected part?" className='inputDesign' onChange={(e) => { setInput(e.target.value); }} value={input} onFocus={() => props.disableKeys(false)} onBlur={() => props.disableKeys(true)} />
                    <button className="clickable" onClick={handleClick}>Check</button>
                    <br/>
                    { props.finalScore.userScore > -1 && <p className='betterText'>{shownScore}</p> }
                </> }
             </div>
        </>
    )
}