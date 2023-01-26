import React, { Suspense, useEffect, useState, } from 'react';
import * as THREE from 'three';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, TransformControls, useCursor, Icosahedron } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { useControls } from 'leva';
import create from 'zustand';
import PopupMenu from './Popup.js';
import Loader from './Loader.js';
import doKey from './KeyboardFunctions.js';
import Outline from './Outline.js';

/*
TODO LIST
get individual pieces to light up (test with tram model, that is the only problem one)
add obj file compatibility
maybe streamline the card viewing thing, access parts of the database for each card so they dont have to edit code to add models
fix the alignment of cards when in fullscreen mode
*/

const useStore = create((set) => ({ target: null, setTarget: (target) => set({ target }) }));

var tempHex;
var lastSelected;
var url = "";

var model;
var cameraRef;
var sceneRef;
var objRef;

var sceneUrl;

const RATE = 0.1;

function Scene(props) {
    const setTarget = useStore((state) => state.setTarget);
    const [hovered, setHovered] = useState(false);
    useCursor(hovered);

    useThree(({scene, camera}) => {
        cameraRef = camera;
        sceneRef = scene;
    });

    if (props.modelURL && props.modelURL !== url) {
        const gltf = useLoader(GLTFLoader, props.modelURL);
        model = gltf.scene;
        url = props.modelURL;
    }

    // handle a keypress here
    useEffect(() => {
        function handleKeyDown(e) {
            // do action on key press
            const childIndex = doKey(e, model, cameraRef, sceneRef, objRef, RATE);
            if(childIndex >= 0){
                selectedObj(model.children[childIndex]);
            }
        }

        document.addEventListener('keydown', handleKeyDown);
        
        // cleanup the event listener
        return function cleanup() {
            document.removeEventListener('keydown', handleKeyDown);
        }
    }, []);

    return (
        <>
            {model && <primitive {...props} onClick = {(e) => {setTarget(e.object); selectedObj(e.object); e.stopPropagation()} } onPointerOver = {() => setHovered(true)} onPointerOut = {() => setHovered(false)} object = {model} />}
            {!model &&  <>
                            <Icosahedron><meshStandardMaterial color="black" wireframe /></Icosahedron>
                            <Icosahedron><meshStandardMaterial color="hotpink" /></Icosahedron>
                        </>}
        </>
    );
}

function selectedObj(object){
    
    if(!lastSelected){
        lastSelected = object;
    }

    objRef = object;

    tempHex = object.material.emissive.getHex();
    lastSelected.material.emissive.setHex(tempHex);

    object.material.emissive.setHex(0xff0000);

    lastSelected = object;
}

export default function App() {
    const { target, setTarget } = useStore();
    const { mode } = useControls({ mode: { value: 'translate', options: ['translate', 'rotate'] } });
    // this might be janky but its what i can find to update this component when props change
    const [checkedURL, changeURL] = useState(sceneUrl);
    const callbackFunction = (childData, isUploaded) => {
        if(isUploaded){
            sceneUrl = URL.createObjectURL(childData);
        }
        else {
            sceneUrl = childData;
        }
        changeURL(sceneUrl);
    }
    return (
        <>
            <PopupMenu callback={callbackFunction} />
            <Canvas dpr = {[1, 2]} onPointerMissed = {() => setTarget(null)}>
                <color attach="background" args={["#d3d3d3"]} />
                <Suspense fallback = {<Loader />}>
                    <Scene modelURL={checkedURL} />
                    {target && <TransformControls object = {target} mode = {mode} />}
                    <ambientLight intensity = {0.5} />
                    <spotLight position = {[10, 10, 10]} angle = {0.15} penumbra = {1} />
                    <pointLight position = {[-10, -10, -10]} />
                    <OrbitControls enablePan={false} mouseButtons={{
                        MIDDLE: THREE.MOUSE.ZOOM,
                        RIGHT: THREE.MOUSE.ROTATE,
                    }}
                    />
                </Suspense>
            </Canvas>
        </>
    );
}
