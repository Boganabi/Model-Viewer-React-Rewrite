import React, { Suspense, useEffect, useState, } from 'react';
import * as THREE from 'three';
// import axios from 'redaxios';
import axios from 'axios';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, TransformControls, useCursor, Icosahedron } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { useControls } from 'leva';
import create from 'zustand';
import PopupMenu from './Popup.jsx';
import Widget from './TopLeftWidget.jsx';
import Loader from './Loader.jsx';
import doKey from './KeyboardFunctions.jsx';

/*
TODO LIST
label matching
reconstruction matching
R&D on VR/AR
email with needs on server/capabilities and link to github
*/

// end day: 2/22 was last day

const useStore = create((set) => ({ target: null, setTarget: (target) => set({ target }) }));

const exporter = new GLTFExporter();

var tempHex;
var lastSelected;
var url = "";

var objRef;

var sceneUrl;
var filetype;

// var popupIsOpen = false;
var widgetShown = false;

const RATE = 0.1;

const delay = ms => new Promise(
    resolve => setTimeout(resolve, ms)
)

function Scene(props) {
    const setTarget = useStore((state) => state.setTarget);
    const [hovered, setHovered] = useState(false);
    useCursor(hovered);

    const { scene, camera } = useThree();
    const { gl } = useThree();

    if (props.modelURL && props.modelURL !== url) {
        if(props.ext === "glb"){
            const gltf = useLoader(GLTFLoader, props.modelURL);
            // model = gltf.scene;
            props.changeModel(gltf.scene);
            // console.log(model);

            if(props.imgName){
                // this sucks but i cant think of another way to detect when the model finishes loading, it keeps taking screenshot too early
                const getScreenshot = async event => {
                    await delay(1000);
                    
                    // upload model first
                    // const arrayBuffer = gltf.parser.parse(model).serialize();
                    // const arrayBuffer = gltf.parser.buffer;
                    // console.log(arrayBuffer);
                    exporter.parse(
                        props.getModel, 
                        async function (result){
                            // const arrayBuffer = result instanceof ArrayBuffer ? result : result.buffer;
                            // const modelBlob = new Blob([result], { type: 'application/octet-stream' });
                            // const modelBlob = new Blob(arrayBuffer, { type: 'application/gltf-buffer' });
                            var newResult;
                            var type;
                            if(result instanceof ArrayBuffer){
                                newResult = result;
                                type = "application/octet-stream";
                            }
                            else{
                                newResult = JSON.stringify(result, null, 2);
                                type = "text/plain";
                            }
                            const modelBlob = new Blob([newResult], { type: type });
                            console.log(modelBlob);
                            const form = new FormData();
                            form.append('model', modelBlob);
                            form.append('modelname', props.imgName);
                            // console.log(props.imgName);
                            
                            // for(const val of form.values()){
                            //     console.log(val);
                            // }

                            // send post request
                            const request = await axios.post('http://139.182.76.138:8000/uploadmodel', form, { 
                                headers: {
                                    'Content-Type': 'multipart/form-data'
                                } 
                            });
                            // ; boundary=${formData.getBoundary()}
                            // const request = await axios.post('http://localhost:8000/uploadmodel', form);
                            // console.log(request);
                        },
                        { binary: true }
                    );
                    
                    // send img of model
                    const screenshot = gl.domElement.toDataURL('image/png').replace('image/png', 'image/octet-stream');

                    // need to turn the screenshot into a blob before doing things with it
                    const screenshotBlob = dataURLtoBlob(screenshot);

                    const formData = new FormData();
                    formData.append("image", screenshotBlob);
                    formData.append("filename", props.imgName.split(".")[0] + ".png");

                    // for(const val of formData.values()){
                    //     console.log(val)
                    // }

                    const result = await axios.post('http://139.182.76.138:8000/upload', formData, { headers: {'Content-Type': 'multipart/form-data'} });
                    // console.log(result);

                    // helper function to convert data URL to blob, written with chatgpt
                    function dataURLtoBlob(dataURL) {
                        const arr = dataURL.split(',');
                        const mime = arr[0].match(/:(.*?);/)[1];
                        const bstr = atob(arr[1]);
                        let n = bstr.length;
                        const u8arr = new Uint8Array(n);
                        while (n--) {
                            u8arr[n] = bstr.charCodeAt(n);
                        }
                        return new Blob([u8arr], { type: mime });
                    }                    
                    
                }
                getScreenshot();
            }
        }
        if(props.ext === "obj"){
            const obj = useLoader(OBJLoader, props.modelURL);
            // model = obj;
            props.changeModel(obj);
        }
        url = props.modelURL;
    }

    // handle a keypress here
    useEffect(() => {
        function handleKeyDown(e) {
            // do action on key press
            // need to check if popup is open
            if(!props.popupIsOpen && !widgetShown){
                const parent = findParentModel(props.getModel);
                const childIndex = doKey(e, parent, camera, scene, objRef, RATE);
                if(childIndex >= 0){
                    // need to get the parent object of all children
                    selectedObj(parent.children[childIndex]);
                }
            }
        }

        // console.log(props.getModel)

        document.addEventListener('keydown', handleKeyDown);

        // cleanup the event listener
        return function cleanup() {
            document.removeEventListener('keydown', handleKeyDown);
        }
    }, []);
    // add this to the primitive model line to set pointer (causes lag spike) onPointerOver = {() => { if(hovered == false) setHovered(true) }} onPointerOut = {() => { if(hovered == true) setHovered(false) }}
    return (
        <>
            {props.getModel && <primitive {...props} onClick = {(e) => {setTarget(e.object); selectedObj(e.object); e.stopPropagation()} }  object = {props.getModel} />}
            {!props.getModel &&  <>
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

    if(object){

        tempHex = object.material.emissive.getHex();
        lastSelected.material.emissive.setHex(tempHex);

        const m = object.material.clone();
        m.emissive.setHex(0xff0000);
        object.material = m;
        
    }
    else{
        if(lastSelected){
           lastSelected.material.emissive.setHex(tempHex); 
        }
    }
    
    lastSelected = object;
}

// helper function to get the parts of the model
function findParentModel(child){
    // console.log(child);
    if(child){
        if (child.children[0] instanceof THREE.Mesh){
            return child
        }
        return findParentModel(child.children[0]);
    }
    else{
        return child;
    }
}

export default function App() {
    const { target, setTarget } = useStore();
    const { mode } = useControls({ 
        mode: { 
            value: 'translate', 
            options: ['translate', 'rotate'] 
        }
    });
    const [model, setModel] = useState();
    const [listShown, setShowList] = useState(false);
    // save data in login form here so its persistent
    const [uploadData, setUploadData] = useState();
    // this might be janky but its what i can find to update this component when props change
    const [checkedURL, changeURL] = useState(sceneUrl);
    const [extension, updateExt] = useState(filetype);
    const [img, setImg] = useState();
    const [numChildren, setNumChildren] = useState(0);
    const [labels, setLabels] = useState();
    const [popupIsOpen, setPopupIsOpen] = useState(false);
    const callbackFunction = (childData, isUploaded, preview) => {
        if(isUploaded){
            sceneUrl = URL.createObjectURL(childData);
            filetype = childData.name.split(".")[1];
        }
        else {
            sceneUrl = childData;
            // since file will always be a glb on the database (for small storage) then we can just set the filetype to glb
            filetype = "glb";
        }
        setImg(preview);
        changeURL(sceneUrl);
        updateExt(filetype);
        // should fix bug where switching models does not deselect objects
        setTarget(null);
        setShowList(false);
    }

    useEffect(() => {
        if(model){
            setNumChildren(findParentModel(model).children.length);
        }
        if(model && listShown === true){
            const parent = findParentModel(model);
            selectedObj(parent.children[0]);
        }
    }, [model, checkedURL]);

    function setIsOpen(bool) {
        // popupIsOpen = bool;
        setPopupIsOpen(bool);
    }

    function showList(show){
        setShowList(show);
        widgetShown = show;
    }

    function checkUploadData(newdata){
        // console.log(newdata);
        setUploadData(newdata);
    }

    function getNext(index){
        const parent = findParentModel(model);
        selectedObj(parent.children[index]);
        // console.log(numChildren);
    }

    function finishLabelling(labels){
        setShowList(false);
        widgetShown = false;

        // send labels to login component and show popup
        setLabels(labels);
        // setOpenPopup(!openPopup);
        setPopupIsOpen(true);
        selectedObj(null);
    }

    return (
        <>
            {/* <PopupMenu callback={callbackFunction} setter={setIsOpen} flag={popupIsOpen} updateList={ () => showList(true) } saveData={checkUploadData} savedFormData={uploadData} labels={labels} /> */}
            <PopupMenu callback={callbackFunction} setter={setIsOpen} updateList={ () => showList(true) } saveData={checkUploadData} savedFormData={uploadData} labels={labels} getOpen={popupIsOpen} />
            {numChildren != 0 && listShown && <Widget updateList={ () => showList(false) } childCount={numChildren} nextPiece={getNext} finishModelLabels={finishLabelling} />} 
            <Canvas gl={{ preserveDrawingBuffer: true }} dpr = {[1, 2]} onPointerMissed = {() => { setTarget(null); selectedObj(null) }}>
                <color attach="background" args={["#d3d3d3"]} />
                <Suspense fallback = {<Loader />}>
                    <Scene modelURL={checkedURL} ext={extension} imgName={img} test={widgetShown} changeModel={setModel} getModel={model} popupOpen={popupIsOpen} />
                    {target && <TransformControls object = {target} mode = {mode} />}
                    <ambientLight intensity={0.5} />
                    {/* <hemisphereLight skyColor="#FFFFFF" groundColor="#444444" intensity={1} /> */}
                    <spotLight position = {[10, 10, 10]} angle = {0.15} penumbra = {1} intensity={2} castShadow />
                    <pointLight position = {[-10, -10, -10]} intensity={1} />
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
