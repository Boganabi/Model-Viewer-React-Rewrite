
var model;

export default function doKey(e, m, cameraRef, sceneRef, objRef, RATE) {
    model = m;

    e.preventDefault();
    switch (e.key) {
        case 'W':
            if(model){
                model.position.z += RATE;
            }
            break;

        case 'S':
            if(model){
                model.position.z -= RATE;   
            }
            break;

        case 'Q':
            if(model){
                model.position.y += RATE;   
            }
            break;

        case 'E':
            if(model){
                model.position.y -= RATE;   
            }
            break;

        case 'D':
            if(model){
                model.position.z += RATE;   
            }
            break;

        case 'A':
            if(model){
                model.position.z -= RATE;   
            }
            break;

        case 'n':
            cameraRef.position.z += RATE;
            break;

        case 'm':
            cameraRef.position.z -= RATE;
            break;

        case 'ArrowUp':
            sceneRef.rotateX(RATE);
            break;

        case 'ArrowDown':
            sceneRef.rotateX(-RATE);
            break;

        case 'ArrowLeft':
            sceneRef.rotateY(RATE);
            break;

        case 'ArrowRight':
            sceneRef.rotateY(-RATE);
            break;

        case 'w':
            if(objRef){
                objRef.position.z += RATE;
            }
            break;

        case 's':
            if(objRef){
                objRef.position.z -= RATE;
            }
            break;

        case 'q':
            if(objRef){
                objRef.position.y += RATE;
            }
            break;

        case 'e':
            if(objRef){
                objRef.position.y -= RATE;
            }
            break;

        case 'd':
            if(objRef){
                objRef.position.x += RATE;
            }
            break;

        case 'a':
            if(objRef){
                objRef.position.x -= RATE;
            }
            break;

        case 'i':
            if(objRef){
                objRef.rotateX(RATE);
            }
            break;

        case 'k':
            if(objRef){
                objRef.rotateX(-RATE);
            }
            break;

        case 'j':
            if(objRef){
                objRef.rotateY(RATE);
            }
            break;

        case 'l':
            if(objRef){
                objRef.rotateY(-RATE);
            }
            break;

        case 'u':
            if(objRef){
                objRef.rotateZ(RATE);
            }
            break;

        case 'o':
            if(objRef){
                objRef.rotateZ(-RATE);
            }
            break;

        case "Tab":
            if(objRef){
                // find a way to call selectedObj function back in app.js
                if(e.shiftKey){
                    return findNextChild(objRef, -1);
                }
                return findNextChild(objRef);
            }
            return 0;

        default:
            break;
    }
    return -1;
}

function findNextChild(child, range = 1){
    const i = model.children.indexOf(child);
    if(model.children[i + range]){
        return i + range;
    }
    return i;
}