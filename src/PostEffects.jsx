// import { useLoader } from '@react-three/fiber'
import React, { useEffect } from 'react';
import { ToneMapping, EffectComposer, SSR, Bloom, LUT } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { useControls } from 'leva';
import { Environment } from '@react-three/drei';
// import { LUTCubeLoader } from 'postprocessing'

export default function Effects(props) {
  // const texture = useLoader(LUTCubeLoader, '/F-6800-STD.cube')
  // const { enabled, ...props } = useControls({
  //   enabled: true,/*
  //   temporalResolve: true,
  //   STRETCH_MISSED_RAYS: true,
  //   USE_MRT: true,
  //   USE_NORMALMAP: true,
  //   USE_ROUGHNESSMAP: true,
  //   ENABLE_JITTERING: true,
  //   ENABLE_BLUR: true,
  //   temporalResolveMix: { value: 0.9, min: 0, max: 1 },
  //   temporalResolveCorrectionMix: { value: 0.4, min: 0, max: 1 },
  //   maxSamples: { value: 0, min: 0, max: 1 },
  //   resolutionScale: { value: 1, min: 0, max: 1 },
  //   blurMix: { value: 0.2, min: 0, max: 1 },
  //   blurExponent: { value: 10, min: 0, max: 20 },
  //   blurKernelSize: { value: 1, min: 0, max: 10 },
  //   rayStep: { value: 0.5, min: 0, max: 1 },
  //   intensity: { value: 1, min: 0, max: 5 },
  //   maxRoughness: { value: 1, min: 0, max: 1 },
  //   jitter: { value: 0.3, min: 0, max: 5 },
  //   jitterSpread: { value: 0.25, min: 0, max: 1 },
  //   jitterRough: { value: 0.1, min: 0, max: 1 },
  //   roughnessFadeOut: { value: 1, min: 0, max: 1 },
  //   rayFadeOut: { value: 0, min: 0, max: 1 },
  //   MAX_STEPS: { value: 20, min: 0, max: 20 },
  //   NUM_BINARY_SEARCH_STEPS: { value: 6, min: 0, max: 10 },
  //   maxDepthDifference: { value: 10, min: 0, max: 10 },
  //   maxDepth: { value: 1, min: 0, max: 1 },
  //   thickness: { value: 10, min: 0, max: 10 },
  //   ior: { value: 1.45, min: 0, max: 2 }*/
  // })

  return (
     props.enabled && (
       <EffectComposer disableNormalPass smaa={false}>
         { /* this gives the original color back, since the EffectComposer disables normal tonemapping */ }
         {/* <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
         <SSR /> */}
         {/* <Bloom luminanceThreshold={0.5} mipmapBlur luminanceSmoothing={0} intensity={1.5} /> */}
         {/* <LUT lut={texture} /> */}
         <Environment background files="brown_photostudio_02_4k.hdr" />
       </EffectComposer>
     )
  )
}

// import { useThree, useFrame } from '@react-three/fiber';
// import { SSRPass } from 'three/addons/postprocessing/SSRPass.js';
// import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';

// export default function Effects(props){
//   let {gl, scene, camera} = useThree();
//   // let sce = props.scene;
//   // let cam = props.camera;

//   const params = {
//     enableSSR: true,
//     autoRotate: true,
//     otherMeshes: true,
//     groundReflector: true,
//   };

//   let composer = new EffectComposer(gl);

//   let ssrPass = new SSRPass( {
//     gl,
//     scene,
//     camera,
//     width: innerWidth,
//     height: innerHeight,
//     // groundReflector: params.groundReflector ? groundReflector : null,
//     // selects: params.groundReflector ? selects : null
//   });

//   composer.addPass(ssrPass);

//   // takes over render loop to add postprocessing effects
//   function Render(){
//     useFrame(({gl, scene, camera}) => {
//       if(params.enableSSR){
//         composer.render();
//       }
//     })
//   }

//   Render();

// }