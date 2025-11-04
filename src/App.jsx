import React, { Suspense, useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
// import axios from 'redaxios';
import axios from 'axios';
import { Canvas, useLoader, useThree, useFrame, addEffect } from '@react-three/fiber';
import { OrbitControls, TransformControls, useCursor, Icosahedron } from '@react-three/drei';
import { Select } from '@react-three/postprocessing';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { Leva, useControls } from 'leva';
import { useSearchParams } from 'react-router-dom';
import { useDrag } from '@use-gesture/react';
import create from 'zustand';
import PopupMenu from './Popup.jsx';
import Widget from './TopLeftWidget.jsx';
import Loader from './Loader.jsx';
import doKey from './KeyboardFunctions.jsx';
import LabelMatching from './LabelMatching.jsx';
import Reconstruction from './Reconstruction.jsx';
import SelectionDropdown from './SelectionDropdown.jsx';
import Controls from './Controls.jsx';
import Effects from './PostEffects.jsx';
import Annotation from './Annotation.jsx';

/*
TODO LIST
fix performance issues (camera animation, annotation occlusion)
*/

const useStore = create((set) => ({ target: null, setTarget: (target) => set({ target }) }));

const exporter = new GLTFExporter();

var tempHex;
var lastSelected = [];
var url = "";

var objRef;
var modelRef; // weird dumb bug with scene and props

var sceneUrl;
var filetype;

// var popupIsOpen = false;
var widgetShown = false;
var enableKeys = true;

// kept here due to app rerendering
const reconstructedObjs = new Set();
let reconstrucScore = 0;

const RATE = 0.1;

const delay = ms => new Promise(
    resolve => setTimeout(resolve, ms)
)

function Scene(props) {
    const setTarget = useStore((state) => state.setTarget);
    const [hovered, setHovered] = useState(false);
    const [canDrag, setCanDrag] = useState(false);
    const [annotationData, setAnnotationData] = useState();
    const [annotations, setAnnotations] = useState([]);
    const [selectedAnnotation, setSelectedAnnotation] = useState(-1);
    // const [occlusionBox, setOcclusionBox] = useState();

    const moveList = useRef([]); // bc standard variable was always refreshed and stateful caused too many rerenders
    var undoIndex = useRef(-1);
    const clickHandledRef = useRef(false); // to indicate whether the annotation has already handled the click condition, since race condition was occuring
    var currSelectedNum = useRef(-2); // moved here bc react thinks its funny to constantly mount and remount my components
    var sceneModel = useRef();
    var iframe_id = useRef(-1);

    var useMouse = false;
    var plane = new THREE.Plane(new THREE.Vector3(0,1,0), 0);
    var raycaster = new THREE.Raycaster();
    var intersect = new THREE.Vector3();
    var reloadModel = false;

    useCursor(hovered);

    const { scene, camera, size, viewport } = useThree();
    const aspect = size.width / viewport.width;
    const { gl } = useThree();

    //workaround for weird ghosting bug from postprocessing
    addEffect(() => {
        gl.setRenderTarget(null);
        gl.clear()
    });

    // helper function to fit the model to screen
    const fitCameraToObject = function(camera, object, offset) { // may need to add controls here as parameter
        offset = offset || 2.25; // default value if not passed

        object = findParentModel(object);

        const boundingBox = new THREE.Box3();

        // get bounding box of object
        boundingBox.setFromObject(object);

        const {center, size} = getBoundsOfObject(object);

        // get the max side of the bounding box (fits to width OR height as needed)
        const maxDim = Math.max(size.x, size.y, size.z);

        camera.position.x = center.x;
        camera.position.y = center.y;
        camera.position.z = (offset * (maxDim / 2) / Math.cos(camera.fov / 2)) + center.z;

        camera.lookAt(center);
    }

    // makes off centered models centered in 3D space
    const centerModel = function(model){
        model = findParentModel(model);
        const {center, size} = getBoundsOfObject(model);

        // offset model by center of bounding box
        model.position.x -= center.x
        model.position.y -= center.y
        model.position.z -= center.z
    }

    if ((props.modelURL && props.modelURL !== url && props.ext)) {
        var newModel;
        // console.log(props.ext);
        if(props.ext === "glb"){
            // console.log("in glb");
            const gltf = useLoader(GLTFLoader, props.modelURL);
            newModel = gltf.scene;
            // props.changeModel(gltf.scene);
            // // console.log(model);
            // centerModel(gltf.scene);
            // fitCameraToObject(camera, gltf.scene);

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
                            const request = await axios.post(props.backend + 'uploadmodel', form, { 
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

                    const result = await axios.post(props.backend + 'upload', formData, { headers: {'Content-Type': 'multipart/form-data'} });
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
            newModel = obj;
            // props.changeModel(obj);
            // centerModel(obj);
            // fitCameraToObject(camera, obj);
        }
        if(props.ext === "stl"){
            // console.log("using stl!!!!");
            const s = useLoader(STLLoader, props.modelURL);
            let newmat = Number(props.stlMatColor);
            const mat = new THREE.MeshStandardMaterial();
            mat.color.set(newmat);
            const mesh = new THREE.Mesh(s, mat);
            newModel = new THREE.Group().add(mesh); // s;
            // props.changeModel(s);
            // centerModel(s);
            // fitCameraToObject(camera, s);
        }

        if(newModel){
            props.changeModel(newModel);
            if(props.modelOffset){
                newModel.position.x += props.modelOffset.x;
                newModel.position.y += props.modelOffset.y;
                newModel.position.z += props.modelOffset.z;
            }
            else{
                centerModel(newModel);
            }
            fitCameraToObject(camera, newModel, props.camOffset);
        }
        url = props.modelURL;

        reloadModel = false;
    }

    // handle a keypress here
    useEffect(() => {
        const returnChannel = "*";
        function handleKeyDown(e) {
            // do action on key press
            // need to check if popup is open
            // console.log(props.getModel); // commented bc theres a bug in props where this is not getting updated
            if(!props.popupIsOpen && !widgetShown && enableKeys){
                // console.log(modelRef);
                // const parent = findParentModel(props.getModel);
                const parent = findParentModel(modelRef);
                const childIndex = doKey(e, parent, camera, scene, objRef, RATE);
                if(childIndex >= 0){
                    // need to get the parent object of all children
                    const newSelectedObject = parent.children[childIndex]
                    selectedObj(newSelectedObject);
                    setTarget(newSelectedObject);
                    props.selectedIndex(newSelectedObject);
                }
                if(childIndex === -1 && modelRef.children.length != 1){
                    // alt key pressed
                    useMouse = !useMouse;
                    props.doControls(!useMouse);
                    setCanDrag(useMouse); // weird workaround bc of strange state updating
                }
                if(childIndex === -2){
                    // undo move
                    let lastMove = moveList.current[undoIndex.current - 1]; // moveList.current.pop();
                    if(lastMove){
                        lastMove.item.position.set(lastMove.pos.x, lastMove.pos.y, lastMove.pos.z);
                        undoIndex.current--;
                    }
                }
                if(childIndex === -3){
                    // redo move
                    let nextMove = moveList.current[undoIndex.current];
                    if(nextMove){
                        nextMove.item.position.set(nextMove.pos.x, nextMove.pos.y, nextMove.pos.z);
                        undoIndex.current++;
                    }
                }
                props.snap();
            }
        }

        function returnState(event){
            // alert("return state hit!");
            // const savedModel = JSON.parse(JSON.stringify(modelRef));
            // console.log(props.currSelectIndex);
            const modelStructureData = {
                // model: savedModel,
                // selectedIndex: props.selectedIndex(props.currSelect)
                // selectedIndex: props.currSelectIndex
                selectedIndex: currSelectedNum.current
            }
            window.parent.postMessage(
                {modelStructureData},
                returnChannel
            );
        }

        const setScene = (event) => {
            // console.log(event.data);
            // const objectLoader = new THREE.ObjectLoader();
            // const objectModel = objectLoader.parse(event.data.modelInfo.model);
            // props.changeModel(objectModel);
            // alert(event.data.modelInfo.selectedIndex);
            // props.pieceSelect(event.data.modelInfo.selectedIndex);
            const objToSelect = sceneModel.current.children[event.data.modelInfo.selectedIndex];
            if(objToSelect){
                setTarget(objToSelect);
                selectedObj(objToSelect);
            }
            else{
                console.log("index too large: " + index + " of maximum " + model.children.length);
            }
        }

        const setAnnotations = (event) => {
            console.log("setting annotation file");
            setAnnotations(event.currentTarget.value);
        }

        function receiveMessage(){
            alert("Message received!");
        }

        document.addEventListener('keydown', handleKeyDown);

        // window.addEventListener('save3DModel', returnState);
        // window.addEventListener('load3DModel', setScene);
        // window.addEventListener('setAnnotations', setAnnotations);
        window.addEventListener('message', (event) => {
            // console.log(event.data);
            // alert("a post message appeared")
            if(event.data === "save3DModel"){
                returnState(event);
            }
            if(event.data.type === "load3DModel"){
                // alert("received post message in load");
                setScene(event);
            }
            if(event.data.message === "ready"){
                // console.log("check ready");
                iframe_id = event.data.id;
                if(sceneModel.current){
                    const currStatus = {
                        info: "isReady",
                        id: iframe_id,
                        status: true
                    }
                    window.parent.postMessage(currStatus, returnChannel);
                }
                else{
                    console.log(props.getModel);
                    const currStatus = {
                        info: "isReady",
                        id: iframe_id,
                        status: false
                    }
                    window.parent.postMessage(currStatus, returnChannel);
                }
            }
            if(event.data === "pieceCount"){
                if(sceneModel.current){
                    const counts = {
                        info: "count",
                        num: sceneModel.current.children.length
                    }
                    window.parent.postMessage(counts, returnChannel);
                }
                else{
                    const counts = {
                        info: "count",
                        num: -1
                    }
                    window.parent.postMessage(counts, returnChannel);
                }
            }
        });

        // get list of annotations from json object
        if(props.jsonURL){
            let annoQuery = props.jsonURL;
            if(!annoQuery.includes("direct=true")){
                if(!annoQuery.includes("?")){
                    annoQuery += "?";
                }
                else{
                    annoQuery += "&";
                }
                annoQuery += "direct=true";
            }
            fetch(annoQuery).then((res) => res.json()).then((data) => {
                // console.log(data);
                setAnnotationData(data);
                
            });
        }

        // cleanup the event listener
        return function cleanup() {
            document.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('getState', returnState);
            window.removeEventListener('setState', setScene);
            window.removeEventListener('setAnnotations', setAnnotations);
            window.removeEventListener('message', (event) => {console.log("logged message!!"); alert("Message received!")})
        }
    }, []);

    useEffect(() => {
        // assign each annotation to an object
        if(annotationData && props.getModel){
            var a = [];
            for(let i = 0; i < annotationData.annotations.length; i++){
                // let annotationIndex = Object.keys(annotationData.annotations[i])[0];
                let annotationIndex = annotationData.annotations[i].index;
                // let annotationText = Object.values(annotationData.annotations[i])[0];
                let annotationText = annotationData.annotations[i].text;
                let annotationPos = annotationData.annotations[i].position;
                let annotationCam = annotationData.annotations[i].camPos;
                let annotatedPiece = props.getModel.children[annotationIndex];
                if(annotatedPiece){
                    a.push({
                        piece: annotatedPiece,
                        index: annotationIndex,
                        text: annotationText,
                        pos: annotationPos,
                        camPos: annotationCam
                    }); // add html in the jsx below
                }
                else{
                    console.log("No piece found at index " + annotationIndex + " that matches an annotation");
                }
            }
            // console.log(a);
            setAnnotations(a);
        }
    }, [props.getModel, annotationData]); // since both model loading and fetching annotations is async

    // is this hacky?
    useEffect(() => {
        if(props.getModel){
            sceneModel.current = props.getModel;
        }
    }, [props.getModel]);

    useEffect(() => {
        // console.log("new index ", selectedAnnotation);
        if(selectedAnnotation > -1){
            props.changeAutoRot(false);
            props.pieceSelect(selectedAnnotation);
        }
        else{
            // props.changeAutoRot(true);
        }
    }, [selectedAnnotation])

    // useEffect(() => {
    //     console.log("extension changed");
    //     reloadModel = true;
    // }, [props.ext]);

    const bind = useDrag(({ down, movement: [mx, my] }) => {
        if((canDrag || props.menuMouse) && props.currSelect && down){
            // set plane to cover the camera viewport somehow
            plane.setFromNormalAndCoplanarPoint(camera.position.clone().normalize(), props.currSelect.position);
            // move object relative to plane
            raycaster.setFromCamera(new THREE.Vector2(mx / (aspect * 2), -my / (aspect * 2)), camera);
            raycaster.ray.intersectPlane(plane, intersect);
            props.currSelect.position.set(intersect.x, intersect.y, intersect.z);
            props.snap();
        }
    });

    // animations
    let mixer;
    if(props.getModel?.animations.length){
        mixer = new THREE.AnimationMixer(props.getModel);
        props.getModel.animations.forEach(clip => {
            const action = mixer.clipAction(clip);
            action.play();
        });
    }

    useFrame((state, delta) => {
        mixer?.update(delta);
    });

    function addMove(piece){
        if(piece){
            let move = {
                item: piece,
                rot: piece.rotation.clone(),
                pos: piece.position.clone()
            };
            let prevMove = moveList.current[moveList.current.length - 1];
            if(prevMove != move){
                // remove any undone moves
                moveList.current = moveList.current.slice(0, undoIndex.current);
                moveList.current.push(move);
                undoIndex.current++;
            }
        }
    }

    function getObjectCenter(object){
        const boundingBox = new THREE.Box3();

        // get bounding box of object
        boundingBox.setFromObject(object);

        var centerVec = new THREE.Vector3();
        return boundingBox.getCenter(centerVec);
    }

    function findObjectIndex(obj){
        // const parent = findParentModel(model);
        // theres a really weird bug here where model isnt defined when the tab key is used but in every other case it works fine. so this is my goofy workaround
        for(let i = 0; i < modelRef.children.length; i++){
            if(modelRef.children[i] === obj){
                // setSelectedIndex(i);
                console.log("selected", i);
                currSelectedNum.current = i;
                console.log(currSelectedNum.current);
                // return i;
                break;
            }
        }
        // return -1;
    }

    function handleClickMiss(){
        if(!clickHandledRef.current){
            setSelectedAnnotation(-1);
        }
        clickHandledRef.current = false; // reset whether handled or not   
    }

    // props.selectedIndex(e.object);
    // add this to the primitive model line to set pointer (causes lag spike): onPointerOver = {() => { if(hovered == false) setHovered(true) }} onPointerOut = {() => { if(hovered == true) setHovered(false) }}
    return (
        <>
            {!props.modelHidden && <>
                {props.getModel && <>
                        <primitive {...props} {...bind()} onPointerMissed = {() => { handleClickMiss() }} onClick = {(e) => { setSelectedAnnotation(-1); setTarget(e.object); selectedObj(e.object); findObjectIndex(e.object); e.stopPropagation()} } onMouseUp={ () => { addMove(props.currSelect) } } object = {props.getModel} />
                        {annotations.map((o, index) => (
                            <Annotation key={index} i={index} info={o} select={selectedAnnotation} setAnnotation={setSelectedAnnotation} cam={camera} handleref={clickHandledRef} boxSize={props.hideAnno} /> 
                        ))}
                    </>}
                    {/* occluBox={occlusionBox} */}
                {!props.getModel &&  <>
                                <Icosahedron><meshStandardMaterial color="black" wireframe /></Icosahedron>
                                <Icosahedron><meshStandardMaterial color="hotpink" /></Icosahedron>
                            </>}
            </>}
        </>
    );
}

function selectedObj(object, deselect = true, color = 0xff0000){
    
    // if(!lastSelected){
    //     lastSelected = object;
    // }
    if(lastSelected.length === 0){
        lastSelected.push(object);
    }

    objRef = object;

    if(object){

        // tempHex = object.material.emissive.getHex();
        // console.log(tempHex);
        if(deselect){
            for(let i = 0; i < lastSelected.length; i++){
                if(lastSelected[i]){
                    lastSelected[i].material.emissive.setHex(0);
                }   
            }
        }
        const m = object.material.clone();
        m.emissive.setHex(color);
        object.material = m;
        
    }
    else{
        if(lastSelected){
            if(deselect){
                for(let i = 0; i < lastSelected.length; i++){
                    if(lastSelected[i]){
                        lastSelected[i].material.emissive.setHex(0);
                    }
                }
            }
        }
    }
    
    //lastSelected = object;
    lastSelected.push(object);
}

// helper function to get the parts of the model
function findParentModel(child){
    // console.log(child);
    if(child){
        if(!child.children){
            return child;
        }
        if (child.children[0] instanceof THREE.Mesh || child.children[0].isObject3D){
            return child
        }
        return findParentModel(child.children[0]);
    }
    else{
        return child;
    }
}

function getBoundsOfObject(object){
    object = findParentModel(object);

    const boundingBox = new THREE.Box3();

    // get bounding box of object
    boundingBox.setFromObject(object);

    var centerVec = new THREE.Vector3();
    const center = boundingBox.getCenter(centerVec);

    let measure = new THREE.Vector3();
    const size = boundingBox.getSize(measure);

    return {center, size};
}

export default function App() {

    // const BACKEND = "https://137.184.187.45:80/api/"; // http://139.182.76.138:8000/
    const BACKEND = "https://devapp02.libretexts.org/api/"; // MODIFY THIS ONCE URL FOR 3D MODEL AVAILABLE
    // const BACKEND = "http://127.0.0.1:8000/api/";
    let count = 0;

    const inputAttempt = [];
    const { target, setTarget } = useStore();
    const [{ mode, showTransformControls, enableHDRI, useMouse, BGColor }, set] = useControls(() => ({ 
        mode: { 
            value: 'translate', 
            options: ['translate', 'rotate'] 
        },
        showTransformControls: {
            value: false,
        },
        enableHDRI: {
            value: true,
        },
        useMouse: {
            value: false,
        },
        // BGColor: {
        //     value: "#d3d3d3",
        // }
    }));

    // search params
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchModelID, setSearchModelID] = useState();
    const [searchMode, setSearchMode] = useState();
    const [searchBGColor, setSearchBGColor] = useState("#d3d3d3");
    const [searchPiece, setSearchPiece] = useState();
    const [searchModelOffset, setModelOffset] = useState();
    const [searchCameraOffset, setCameraOffset] = useState(2.25);
    const [selectionColor, setSelectionColor] = useState(2.25);
    const [showPanel, setShowPanel] = useState(false);
    const [paramAutoSpin, setParamAutoSpin] = useState(true);
    const [annotations, setAnnotations] = useState();
    const [stlmat, setStlMat] = useState(0xffffff);
    const [hideDist, setHideDist] = useState(5);
    const [hideModel, setHideModel] = useState(false);

    const [model, setModel] = useState();
    const [backgroundurl, setbackgroundurl] = useState();
    // const [currSelectedNum, setSelectedIndex] = useState(-1);
    const [nameAttempt, setNameAttempt] = useState("");
    const [listShown, setShowList] = useState(false);
    // save data in login form here so its persistent
    const [uploadData, setUploadData] = useState();
    // this might be janky but its what i can find to update this component when props change
    const [checkedURL, changeURL] = useState(sceneUrl);
    const [extension, updateExt] = useState(filetype);
    const [img, setImg] = useState();
    const [numChildren, setNumChildren] = useState(0);
    const [children, setChildren] = useState();
    const [labels, setLabels] = useState();
    const [popupIsOpen, setPopupIsOpen] = useState(false);
    const [matchers, setMatchers] = useState();
    const [score, setScore] = useState({userScore: -1, totalScore: -1});
    const [reconstruct, setReconstruct] = useState({currScore: 0, total: 0});
    const [showIcon, setShowIcon] = useState(false);
    const [canRotate, setCanRotate] = useState(true);
    const [autoRot, setAutoRot] = useState(true);
    const [enableContrls, setEnableControls] = useState(true);

    // to handle via url which types can be shown
    const [allowJigsaw, setAllowJigsaw] = useState(false);
    const [allowSelectPiece, setAllowSelectPiece] = useState(false);
    const [allowTextInput, setAllowTextInput] = useState(false);

    // var currSelectedNum = useRef(-2);

    const callbackFunction = (childData, isUploaded, preview) => {
        // console.log(childData);
        if(isUploaded){
            sceneUrl = URL.createObjectURL(childData);
            filetype = childData.name.split(".")[1];
        }
        else {
            sceneUrl = childData;
            // since file will always be a glb on the database (for small storage) then we can just set the filetype to glb
            // filetype = "stl";

            // requirements change, filetype could be anything. so fetch the file type:
            (async () => {
                // await delay(1000);
                const response = await fetch(sceneUrl, {
                    method: 'HEAD'
                });
                const r = response.headers.get('Content-Disposition');
                // console.log(r);
                if(!r){
                    const backup = response.headers.get('Content-Type');
                    filetype = backup.slice(-3);
                    if(filetype === "ary"){
                        filetype = "glb"; // probably a stupid fix but glb files return "gltf-binary" as content type
                    }
                }
                else{
                    filetype = r.slice(-3); // since only the last three letters are important
                }
                // console.log(response.headers.get('Content-Disposition'));
                // console.log(filetype);
                updateExt(filetype);
            })();
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
            // console.log(model);
            const newChildren = findParentModel(model).children;
            setNumChildren(newChildren.length);
            setChildren(newChildren);
            setReconstruct({currScore: 0, total: newChildren.length});
            reconstrucScore = 0;
        }
        if(model && listShown === true){
            const parent = findParentModel(model);
            selectedObj(parent.children[0]);
        }
        // console.log(model);
        modelRef = model;

        // check to make sure that if a selected piece was passed to select it, just in case it was not selected before
        if(searchPiece){
            // selectPiece(searchPiece);
            // console.log(searchPiece);
            // if(searchPiece.length == 1){
            //     selectPiece(searchPiece[0]);
            // }
            // else{
            //     for(let i = 0; i < searchPiece.length; i++){
            //         selectPiece(searchPiece[i], false);
            //     }
            // }
            for(let i = 0; i < searchPiece.length; i++){
                // console.log(lastColor);
                if(selectionColor[i]){
                    selectPiece(searchPiece[i], false, selectionColor[i]);
                }
                else{
                    selectPiece(searchPiece[i], false);
                }
            }
        }
    }, [model, checkedURL, extension]);

    useEffect(() => {
        if(target){
            setAutoRot(false);
        }
        else{
            if(paramAutoSpin){
                setAutoRot(true);
            }
        }
    }, [target]);

    useEffect(() => {
        // reload the model
        if(searchModelID){
            // check if passed URL contains direct=true
            let modelQuery = searchModelID;
            if(!modelQuery.includes("direct=true")){
                if(!modelQuery.includes("?")){
                    modelQuery += "?";
                }
                else{
                    modelQuery += "&";
                }
                modelQuery += "direct=true";
            }
            // since GLTF loader just needs a URL, i think this should work
            callbackFunction(modelQuery);
            // make a request to tempdata
            // axios({
            //     method: 'get',
            //     url: modelQuery,
            //     // params: {
            //     //     id: searchModelID
            //     // }
            // })
            // .then(function (response) {
            //     // handle success
            //     // const newURL = "/" + response.data[0].filecall;

            //     // props.matchers(response.data[0].labels)
            //     console.log(response);

            //     callbackFunction(response.data);
            // })
            // .catch(function (error) {
            //     // handle error
            //     console.log("There was an error from Axios: \n" + error);
            // })
            // .then(function () {
            //     // always executed
            // })
        }
    }, [searchModelID]);

    useEffect(() => {
        // hide different buttons based on mode
        // can be: jigsaw, selection, textInput, or none
        if(searchMode == 'jigsaw'){
            setAllowJigsaw(true);
            setAllowSelectPiece(false);
            setAllowTextInput(false);
        }
        else if(searchMode == 'selection'){
            setAllowJigsaw(false);
            setAllowSelectPiece(true);
            setAllowTextInput(false);
        }
        else if(searchMode == 'textInput'){
            setAllowJigsaw(false);
            setAllowSelectPiece(false);
            setAllowTextInput(true);
        }
        else{
            setAllowJigsaw(false);
            setAllowSelectPiece(false);
            setAllowTextInput(false);
        }
    }, [searchMode]);

    useEffect(() => {
        if(model){
            if(searchPiece){
                // if(searchPiece.length == 1){
                //     selectPiece(searchPiece[0]);
                // }
                //else{
                var lastColor;
                for(let i = 0; i < searchPiece.length; i++){
                    if(selectionColor[i]){
                        lastColor = selectionColor[i];
                    }
                    if(lastColor){
                        selectPiece(searchPiece[i], false, lastColor);
                    }
                    else{
                        selectPiece(searchPiece[i], false);
                    }
                }
                //}
            }
        }
        else{
            if(searchPiece){
                console.log("no model available to select piece");
            }
        }
    }, [searchPiece, selectionColor]);

    // useEffect(() => {
    //     // change BG color here
    //     if(searchBGColor != null){
    //         set({ BGColor: searchBGColor })
    //     }
    // }, [searchBGColor]);

    useEffect(() => {
        const showHideIcon = (event) => setShowIcon(event.currentTarget.value);

        window.addEventListener("showAdmin", showHideIcon);

        const MID = searchParams.get("modelID"); 
        const mode = searchParams.get("mode"); // either jigsaw, selection, textInput or none
        const bgcolor = searchParams.get("BGColor"); // omit the leading #
        const bgimg = searchParams.get("BGImage");
        const selectedpiece = searchParams.get("piece");
        const modelOffset = searchParams.get("modelOffset");
        const camOffset = searchParams.get("cameraOffset");
        const selColor = searchParams.get("selectionColor");
        const showPanel = searchParams.get("panel");
        const spin = searchParams.get("autospin");
        const jsonurl = searchParams.get("annotations");
        const stlColor = searchParams.get("STLmatCol");
        const hiddenDist = searchParams.get("hideDistance");
        const shouldHideModel = searchParams.get("hideModel");

        // searchParams.forEach((param) => {
        //     console.log(param);
        // });

        if(MID){
            setSearchModelID(MID);
        }
        if(mode){
            setSearchMode(mode);
        }
        if(bgcolor != null){
            setSearchBGColor("#" + bgcolor);
        }
        if(bgimg){
            setbackgroundurl(bgimg);
        }
        if(selectedpiece){
            const pieces = selectedpiece.split(",");
            var piecesToSelect = [];
            for(let i = 0; i < pieces.length; i++){
                // check p is number then add to array
                let q = Number(pieces[i]);
                if(!isNaN(q)){
                    piecesToSelect.push(q);
                }
            }
            setSearchPiece(piecesToSelect);
        }
        if(modelOffset){
            const dims = modelOffset.split(",");
            if(dims.length <= 2){
                console.log("not enough dimensions given to form offset!");
            }
            else{
                var offset = {
                    x: dims[0],
                    y: dims[1],
                    z: dims[2]
                };
                setModelOffset(offset);
            }
        }
        if(camOffset){
            setCameraOffset(camOffset);
        }
        if(selColor){
            // parse into array
            const colors = selColor.split(",");
            var newColors = [];
            for(let i = 0; i < colors.length; i++){
                // add the leading 0x and add to array
                // const c = Number(colors[i]); // to make it a hex value
                const colorToAdd = "0x" + colors[i];
                // const c = Number(colorToAdd);
                newColors.push(colorToAdd);
            }
            setSelectionColor(newColors);
        }
        if(showPanel){
            setShowPanel(true);
        }
        if(spin){
            setAutoRot(false);
            setParamAutoSpin(false);
        }
        if(jsonurl){
            setAnnotations(jsonurl);
        }
        if(stlColor){
            setStlMat("0x" + stlColor);
        }
        if(hiddenDist){
            setHideDist(hiddenDist);
        }
        if(shouldHideModel){
            setHideModel(true);
        }

        return () => {
            window.removeEventListener("showAdmin", showHideIcon);
        }
    }, []);

    // function to handle everything about selecting a piece
    function selectPiece(index, deselect = true, color = 0xff0000){
        if(model){
            const objToSelect = model.children[index];
            // setSelectedIndex(index); // when selecting multiple, last index is the one that will be used for tabbing
            // currSelectedNum.current = index;
            // alert(index);
            if(objToSelect){
                setTarget(objToSelect);
                selectedObj(objToSelect, deselect, color);
            }
            else{
                console.log("index too large: " + index + " of maximum " + model.children.length);
            }
        }
        else{
            console.log("No model loaded yet!");
        }
    }

    function startMatching() {
        if(matchers && model){
            const parent = findParentModel(model);
            selectedObj(parent.children[0]);
        }
    }

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

    function getNext(attempt){
        count += 1;
        const parent = findParentModel(model);
        selectedObj(parent.children[count]);
        inputAttempt.push(attempt);
        if(count >= parent.children.length){
            let total = matchers.length;
            inputAttempt.forEach((element, i) => {
                if(element != matchers[i]){
                    total -= 1;
                }
            });
            setScore({userScore: total, totalScore: parent.children.length});
        }
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

    function enableDisableKeys(bool){
        enableKeys = bool;
    }

    function scramble(){
        // console.log("boop");
        // setReconstruct({...reconstruct, currScore: 1});
        const {size, center} = getBoundsOfObject(model);
        const min = {
            x: size.x * -1, 
            y: size.y * -1, 
            z: size.z * -1
        }; // i do this because min = -size results in NaN
        const max = size;
        // console.log(min);
        // console.log(max);
        const parent = findParentModel(model);
        parent.children.forEach((part) => {
            const randX = min.x + (Math.random() * (max.x - min.x));
            const randY = min.y + (Math.random() * (max.y - min.y));
            const randZ = min.z + (Math.random() * (max.z - min.z));
            part.translateX(randX);
            part.translateY(randY);
            part.translateZ(randZ);
            // console.log(randX);
            // console.log(randY);
            // console.log(randZ);
        })
    }

    function checkSnapObject(){
        if(objRef){
            // console.log(target.position);
            const zero = new THREE.Vector3(0,0,0)
            // const dist = target.position.distanceTo(zero);
            const dist = objRef.position.distanceTo(zero);
            // console.log(dist);
            if(dist < 0.1){
                // target.position.set(0,0,0);
                objRef.position.set(0,0,0);
                // if(!reconstructedObjs.has(target)){
                //     reconstructedObjs.add(target);
                //     reconstrucScore += 1;
                //     setReconstruct({...reconstruct, currScore: reconstrucScore});
                // }
                // console.log(reconstrucScore);
                if(reconstructedObjs.has(objRef.uuid) === false){
                    reconstructedObjs.add(objRef.uuid);
                    reconstrucScore += 1;
                    setReconstruct({...reconstruct, currScore: reconstrucScore});
                    // console.log("simulate post message with total correct " + reconstrucScore + " and total " + reconstruct.total);
                    // console.log(objRef.uuid);
                    // console.log(reconstrucScore);
                }
                // console.log(reconstrucScore);
                // console.log(reconstructedObjs);
            }
            else{
                // if(reconstructedObjs.has(target)){
                //     reconstructedObjs.delete(target);
                //     reconstrucScore -= 1;
                // }
                if(reconstructedObjs.has(objRef.uuid)){
                    reconstructedObjs.delete(objRef.uuid);
                    reconstrucScore -= 1;
                    // console.log("simulate post message with total correct " + reconstrucScore + " and total " + reconstruct.total);
                    // console.log("removed");
                    // console.log(reconstructedObjs);
                }
            }
        }
    }

    // function findObjectIndex(obj){
    //     // const parent = findParentModel(model);
    //     // theres a really weird bug here where model isnt defined when the tab key is used but in every other case it works fine. so this is my goofy workaround
    //     for(let i = 0; i < modelRef.children.length; i++){
    //         if(modelRef.children[i] === obj){
    //             // setSelectedIndex(i);
    //             console.log("selected", i);
    //             currSelectedNum.current = i;
    //             console.log(currSelectedNum.current);
    //             // return i;
    //             break;
    //         }
    //     }
    //     // return -1;
    // }

    const handleDropdownSelection = (index) => {
        // console.log(index);
        const parent = findParentModel(model);
        selectedObj(parent.children[index]);
        setTarget(parent.children[index]);
        setSelectedIndex(index);
    }

    const handleSubmission = () => {
        // console.log("simulate post message with index " + currSelectedNum);
        console.log("simulate post message with name attempt: " + nameAttempt);
    }

    return (
        <>
            {/* <PopupMenu callback={callbackFunction} setter={setIsOpen} flag={popupIsOpen} updateList={ () => showList(true) } saveData={checkUploadData} savedFormData={uploadData} labels={labels} /> */}
            {showIcon && <PopupMenu callback={callbackFunction} setter={setIsOpen} updateList={ () => showList(true) } saveData={checkUploadData} savedFormData={uploadData} labels={labels} getOpen={popupIsOpen} backend={BACKEND} updateLabels={setMatchers} />}
            {numChildren != 0 && listShown && allowTextInput && <Widget updateList={ () => showList(false) } childCount={numChildren} nextPiece={getNext} finishModelLabels={finishLabelling} />} 
            {/* {matchers && <LabelMatching nextMatch={getNext} disableKeys={enableDisableKeys} finalScore={score} startMatch={startMatching} />} */}
            {!listShown && /*!matchers &&*/ model && allowJigsaw && <Reconstruction scrambler={scramble} reconScore={reconstruct} model={model} />}
            {children && allowSelectPiece && <SelectionDropdown trigger={<button className="clickable">Choose model part</button>} menu={
                children.map((child, i) => (
                    // return <button onClick={handleDropdownSelection(i)}>{i}</button>
                    React.createElement('button', {onClick : () => handleDropdownSelection(i)}, i)
                ))
            }/>}
            <Leva collapsed hidden={!model || model.children?.length === 1 || showPanel} />
            {target && allowTextInput && <>
                <button className="clickable submit" onClick={handleSubmission}>Submit</button>
                <input placeholder="Enter name of this piece..." onChange={event => setNameAttempt(event.target.value)} className='nameentry' onFocus={() => enableDisableKeys(false)} onBlur={() => enableDisableKeys(true)} />
            </>}
            <Controls />
            <Canvas gl={{ preserveDrawingBuffer: true }} dpr = {[1, 2]} onPointerMissed = {() => { setTarget(null); selectedObj(null); }}>
                {/* <color attach="background" args={[BGColor]} /> */}
                <color attach="background" args={[searchBGColor]} />
                <Suspense fallback = {<Loader />}>
                    {/* TransformControls is not playing nice with postprocessing so i need to disable postprocessing when controls are active selectedIndex={findObjectIndex} currSelectIndex={currSelectedNum.current} /}
                    {/* {!TransformControls.visible &&  */}
                    <Select enabled for="SSR">
                        <Scene modelURL={checkedURL} ext={extension} imgName={img} test={widgetShown} changeModel={setModel} getModel={model} currSelect={target} popupOpen={popupIsOpen} backend={BACKEND} snap={checkSnapObject} modelOffset={searchModelOffset} camOffset={searchCameraOffset} doControls={setEnableControls} changeAutoRot={setAutoRot} menuMouse={useMouse} stlMatColor={stlmat} jsonURL={annotations} pieceSelect={selectPiece} hideAnno={hideDist} modelHidden={hideModel} />
                        <Effects enabled={enableHDRI} location={backgroundurl} />
                    </Select>
                    {target && enableContrls && <TransformControls object = {target} mode = {mode} onChange={() => checkSnapObject()} onMouseUp={() => { setCanRotate(true) }} onMouseDown={() => { setCanRotate(false); setAutoRot(false); }} showX={showTransformControls} showY={showTransformControls} showZ={showTransformControls} />}
                    {!backgroundurl && <>
                        <ambientLight intensity={2.5} />
                        {/* <hemisphereLight skyColor="#FFFFFF" groundColor="#444444" intensity={1} /> */}
                        <spotLight position = {[10, 10, 10]} angle = {0.15} penumbra = {1} intensity={4} castShadow decay={0} />
                        <pointLight position = {[-10, -10, -10]} intensity={2} decay={0} />
                    </>}
                    {enableContrls && <OrbitControls autoRotate={autoRot} enableRotate={canRotate && !useMouse} mouseButtons={{
                        MIDDLE: THREE.MOUSE.ZOOM,
                        LEFT: THREE.MOUSE.ROTATE,
                        RIGHT: THREE.MOUSE.PAN,
                    }}
                    />}
                    {/* Just here to serve as a point of reference */}
                    {/* <mesh position={[0,0,0]} scale={0.05} >
                        <sphereGeometry />
                        <meshStandardMaterial color="black" transparent />
                    </mesh> */}
                </Suspense>
            </Canvas>
        </>
    );
}
