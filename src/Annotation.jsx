import { Html } from '@react-three/drei';
import { useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import JEASINGS from 'https://esm.sh/jeasings';

export default function Annotation(props){

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
        }
        // console.log(pos);
        return pos;
    }

    useFrame(() => {
        JEASINGS.update();
    })

    const [hidden, setHidden] = useState();

    const camera = useThree(state => state.camera);
    // const { scene, camera, size, viewport } = useThree();

    // useFrame(state => {
    //     if(props.info.index === props.select){
    //         state.camera.lookAt(parseToCoords(props.info, false));
    //         // state.camera.position.lerp(parseToCoords(props.info, true), 0.01);
    //         // state.camera.updateProjectionMatrix();
    //     }
    //     // return null;
    // })

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
                        // console.log("hello from", props.info.index, "and", props.select);
                        props.setAnnotation(props.info.index);
                        
                        // change what camera is looking at
                        // todo

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
                            .onUpdate(() => {
                                camera.lookAt(parseToCoords(props.info, false));
                            })
                            .start();
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