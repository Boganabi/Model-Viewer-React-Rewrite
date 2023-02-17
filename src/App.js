import React, { Suspense, useEffect, useState, } from 'react';
import * as THREE from 'three';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, TransformControls, useCursor, Icosahedron } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { useControls } from 'leva';
import create from 'zustand';
import PopupMenu from './Popup.js';
import Loader from './Loader.js';
import doKey from './KeyboardFunctions.js';

/*
TODO LIST
wait for AWS to be set up
*/

const useStore = create((set) => ({ target: null, setTarget: (target) => set({ target }) }));

var tempHex;
var lastSelected;
var url = "";

var model;
var objRef;

var sceneUrl;
var filetype;

var popupIsOpen = false;

const RATE = 0.1;

function Scene(props) {
    const setTarget = useStore((state) => state.setTarget);
    const [hovered, setHovered] = useState(false);
    useCursor(hovered);

    const { scene, camera } = useThree();

    if (props.modelURL && props.modelURL !== url) {
        if(props.ext === "glb"){
            const gltf = useLoader(GLTFLoader, props.modelURL);
            model = gltf.scene;
        }
        if(props.ext === "obj"){
            const obj = useLoader(OBJLoader, props.modelURL);
            model = obj;
        }
        url = props.modelURL;
    }

    // handle a keypress here
    useEffect(() => {
        function handleKeyDown(e) {
            // do action on key press
            // need to check if popup is open
            if(!popupIsOpen){
                const childIndex = doKey(e, model, camera, scene, objRef, RATE);
                if(childIndex >= 0){
                    selectedObj(model.children[childIndex]);
                }
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

    const m = object.material.clone();
    m.emissive.setHex(0xff0000);
    object.material = m;

    lastSelected = object;
}

export default function App() {
    const { target, setTarget } = useStore();
    const { mode } = useControls({ mode: { value: 'translate', options: ['translate', 'rotate'] } });
    // this might be janky but its what i can find to update this component when props change
    const [checkedURL, changeURL] = useState(sceneUrl);
    const [extension, updateExt] = useState(filetype);
    const callbackFunction = (childData, isUploaded) => {
        if(isUploaded){
            sceneUrl = URL.createObjectURL(childData);
            filetype = childData.name.split(".")[1];
        }
        else {
            sceneUrl = childData;
            // since file will always be a glb on the database (for small storage) then we can just set the filetype to glb
            filetype = "glb";
        }
        changeURL(sceneUrl);
        updateExt(filetype);
    }

    function setIsOpen(bool) {
        popupIsOpen = bool;
    }

    return (
        <>
            <PopupMenu callback={callbackFunction} setter={setIsOpen} flag={popupIsOpen}/>
            <Canvas dpr = {[1, 2]} onPointerMissed = {() => setTarget(null)}>
                <color attach="background" args={["#d3d3d3"]} />
                <Suspense fallback = {<Loader />}>
                    <Scene modelURL={checkedURL} ext={extension} />
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
