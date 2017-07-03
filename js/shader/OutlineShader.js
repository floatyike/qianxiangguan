/**
 * Created by Vertex on 17/3/17.
 */

THREE.OutlineShader = {
    uniforms: {
        offset: {type:'f', value: 1}
    },
    vertexShader: [
        'uniform float offset;',
        'void main(){',
        'vec4 pos = modelViewMatrix * vec4( position + normal * offset, 1.0 );',
        'gl_Position = projectionMatrix * pos;',
        '}'
    ].join( "\n" ),
    fragmentShader: [
        'void main(){',
        'gl_FragColor = vec4(0.984, 0.804, 0.355, 1.0);',
        '}'
    ].join( "\n" )
};