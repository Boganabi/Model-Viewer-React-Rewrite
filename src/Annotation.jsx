import { Html } from '@react-three/drei';
import { useState, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import JEASINGS from 'https://esm.sh/jeasings';

export default function Annotation(props){

    var currPos = useRef(); // setting as state in below function causes infinite rerender
    var occlusionBox = useRef(new THREE.Box3());

    function parseToCoords(info, useCam){
        // console.log(position);
        let currObj = useCam ? info.camPos : info.pos;
        let x = Number(currObj.x) + info.piece.position.x;
        let y = Number(currObj.y) + info.piece.position.y;
        let z = Number(currObj.z) + info.piece.position.z;
        let pos;
        if(useCam){
            pos = new THREE.Vector3(x, y, z);
        }
        else{
            pos = [x, y, z];
            currPos.current = pos;
            occlusionBox.current.setFromCenterAndSize(new THREE.Vector3(pos[0], pos[1], pos[2]), new THREE.Vector3(props.boxSize, props.boxSize, props.boxSize));
        }
        // console.log(pos);
        return pos;
    }

    useFrame(() => {
        JEASINGS.update();
        // if(!props.occluBox.containsPoint(currPos.current) && !hidden){
        //     setHidden(true);
        // }
        // else if(props.occluBox.containsPoint(currPos.current) && hidden){
        //     setHidden(false);
        // }

        if(occlusionBox.current.containsPoint(camera.position)){
            // since camera is close to annotation
            setHidden(false);
        }
        else if(hidden == false){
            // hidden is false but camera not in occlusion box
            setHidden(true);
        }
    })

    const [hidden, setHidden] = useState();

    const camera = useThree(state => state.camera);

    return (
        <Html
            // transform
            // sprite
            // center
            // distanceFactor={0.0002}
            // position={getObjectCenter(o.piece)}
            position={parseToCoords(props.info, false)}
            zIndexRange={[99,0]}
            // occlude
            onOcclude={setHidden}
            style={{
                transition: 'all 0.5s',
                opacity: hidden ? 0 : 1,
                transform: `scale(${hidden ? 0.5 : 1})`
            }}
        >
            {/* <div className="annotation">{props.info.text}</div> */}
            {/* <div className="annotation">{o.index}</div> */}
            <svg height="34" width="34" transform="translate(-16 -16)" style={{ cursor: 'pointer' }}>
                <circle
                    cx="17"
                    cy="17"
                    r="16"
                    stroke="white"
                    strokeWidth="2"
                    fill="rgba(0,0,0,.50)"
                    onPointerUp={() => {

                        if(props.allowSelected){
                            // change camera location
                            const cam_pos = parseToCoords(props.info, true);
                            new JEASINGS.JEasing(camera.position)
                                .to(
                                    {
                                        x: cam_pos.x,
                                        y: cam_pos.y,
                                        z: cam_pos.z
                                    },
                                    1000
                                )
                                .easing(JEASINGS.Cubic.Out)
                                .start();

                            props.handleref.current = true;
                            props.setAnnotation(props.info.index);
                        }
                    }}
                />
                <text x={props.i + 1 > 9 ? '8' : '12'} y="22" fill="white" fontSize={17} fontFamily="monospace" style={{ pointerEvents: 'none' }}>
                    {Number(props.i) + 1}
                </text>
            </svg>
            {props.info.index === props.select && (
                <div className="annotation">{props.info.text}</div>
            )}
        </Html>
    )
}