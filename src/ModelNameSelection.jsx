import React, { useState, useEffect } from "react";

export default function Namer(props){

    const [input, setInput] = useState("");
    const [counter, setCounter] = useState(0);

    function handleClick() {
        // store input in list of objects
        // props.names.push({counter : input});
        props.names.push(input);

        // clear input field
        setInput("");

        // increment counter 
        if(counter >= props.count - 1){
            // remove the widget from view
            // setCounter(counter + 1);
            props.hideWidget();
        }
        else{
            // console.log(props.names);
            setCounter(counter + 1);
        }
    }

    useEffect(() => {
        // console.log("updated");
        // select next piece
        props.nextPiece(counter);
    }, [counter])

    return (
        <div style={{paddingBottom: "5px"}}>
            <input type="text" size="60" placeholder="Enter the name of the selected part" className='inputDesign' onChange={(e) => { setInput(e.target.value) }} value={input} />
            <button className="clickable" onClick={handleClick}>Next</button>
        </div>
    )
}