import { Html } from '@react-three/drei';

export default function Annotation(props){

    function parseToCoords(info){
        // console.log(position);
        let x = Number(info.pos.x) + info.piece.position.x;
        let y = Number(info.pos.y) + info.piece.position.y;
        let z = Number(info.pos.z) + info.piece.position.z;
        let pos = [x, y, z];
        // console.log(pos);
        return pos;
    }

    return (
        <Html
            // transform
            // sprite
            // center
            // distanceFactor={0.0002}
            // position={getObjectCenter(o.piece)}
            position={parseToCoords(props.info)}
            zIndexRange={[99,0]}
            // occlude
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