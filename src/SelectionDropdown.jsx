import React, { useState, useEffect } from 'react';

export default function SelectionDropdown(props){

    // https://www.robinwieruch.de/react-dropdown/

    const [open, setOpen] = useState(false);

    const handleOpen = () => {
        setOpen(!open);
    };

    return(
        <>
            <div className="dropdown">
                {React.cloneElement(props.trigger, {
                    onClick: handleOpen,
                })}
                {open ? (
                    <ul className="menu">
                        {props.menu.map((menuItem, index) => (
                            <li key={index} className="menu-item">
                                {React.cloneElement(menuItem, {
                                    onClick: () => {
                                        menuItem.props.onClick();
                                        setOpen(false);
                                    }
                                })}
                            </li>
                        ))}
                    </ul>
                ) : null}
            </div>
        </>
    )
}