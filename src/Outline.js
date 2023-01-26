import React, { useEffect, useRef, useMemo, useState } from 'react';
import { Vector2 } from 'three';
import { useThree, useFrame, extend } from '@react-three/fiber';
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader";

extend({ EffectComposer, RenderPass, OutlinePass, ShaderPass })

// create an outline around a clicked object
// use this as reference https://codesandbox.io/s/mq5oy?file=/src/index.js:1615-2595 

// currently not in use because I cannot get it to work, standin is used for now
const context = React.createContext()
export default function Outline ({ children }) {
    const { gl, scene, camera, size } = useThree()
    const composer = useRef()
    const [hovered, set] = useState([])
    const aspect = useMemo(() => new Vector2(size.width, size.height), [size])
    useEffect(() => composer.current.setSize(size.width, size.height), [size])
    useFrame(() => composer.current.render(), 1)
    return (
        <context.Provider value={set}>
            {children}
            <effectComposer ref={composer} args={[gl]}>
                <renderPass attachArray="passes" args={[scene, camera]} />
                    <outlinePass
                        attachArray="passes"
                        args={[aspect, scene, camera]}
                        selectedObjects={hovered}
                        visibleEdgeColor="green"
                        edgeStrength={50}
                        edgeThickness={1}
                    />
                <shaderPass attachArray="passes" args={[FXAAShader]} uniforms-resolution-value={[1 / size.width, 1 / size.height]} />
            </effectComposer>
        </context.Provider>
    )
}