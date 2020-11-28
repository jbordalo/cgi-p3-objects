/** @type {WebGLRenderingContext} */
var gl;
let program;
let canvas;
let aspect;

var mModelLoc;
var mView, mProjection;

let currentObject = CUBE;

let DRAWING_MODE = WIREFRAME;
let Z_BUFFER = false;
let CULLING = false;

function fit_canvas_to_window() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    aspect = canvas.width / canvas.height;
    gl.viewport(0, 0, canvas.width, canvas.height);

}
window.onresize = function () {
    fit_canvas_to_window();
}

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);

    fit_canvas_to_window();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    mModelLoc = gl.getUniformLocation(program, "mModel");
    mviewLoc = gl.getUniformLocation(program, "mView");
    mProjectionLoc = gl.getUniformLocation(program, "mProjection");

    updateProj();

    cubeInit(gl);
    sphereInit(gl);
    cylinderInit(gl);
    torusInit(gl);
    paraboloidInit(gl);

    document.getElementById("new_cube").onclick = () => { currentObject = CUBE };
    document.getElementById("new_sphere").onclick = () => { currentObject = SPHERE };
    document.getElementById("new_cylinder").onclick = () => { currentObject = CYLINDER };
    document.getElementById("new_torus").onclick = () => { currentObject = TORUS };
    document.getElementById("new_paraboloid").onclick = () => { currentObject = PARABOLOID };

    // Perspective Projection

    document.getElementById("ortho-alcado-princ").onclick = frontView;
    document.getElementById("ortho-plant").onclick = sideView;
    document.getElementById("ortho-alcado-lat").onclick = sideView;

    // Axonometric Projection

    document.getElementById("axon-iso").onclick = () => {
        document.getElementById('gamma').disabled = true;
        document.getElementById('theta').disabled = true;
        isometry();
    };
    document.getElementById("axon-dim").onclick = () => {
        document.getElementById('gamma').disabled = true;
        document.getElementById('theta').disabled = true;
        dimetry();
    };
    document.getElementById("axon-tri").onclick = () => {
        document.getElementById('gamma').disabled = true;
        document.getElementById('theta').disabled = true;
        trimetry();
    };
    document.getElementById("axon-free").onclick = () => {
        document.getElementById('gamma').disabled = false;
        document.getElementById('theta').disabled = false;
        axonometric(parseFloat(document.getElementById('gamma').value, 10), parseFloat(document.getElementById('theta').value));
    };

    document.getElementById("gamma").oninput = () => {
        // let gamma = parseFloat(document.getElementById('gamma').value, 10);
        axonometric(parseFloat(document.getElementById('gamma').value, 10), parseFloat(document.getElementById('theta').value))
    };
    document.getElementById("theta").oninput = () => {
        // let theta = parseFloat(document.getElementById('theta').value, 10);
        axonometric(parseFloat(document.getElementById('gamma').value, 10), parseFloat(document.getElementById('theta').value))
    };

    // Perspective Projection
    // TODO

    document.getElementById("reset_current").onclick = function () {
        reset_sliders();
    };

    document.getElementById("reset_all").onclick = function () {
        reset_sliders();
    };


    document.addEventListener('keydown', e => {
        const keyName = e.key;
        switch (keyName.toUpperCase()) {
            case "W":
                console.log("W");
                DRAWING_MODE = WIREFRAME;
                break;
            case "F":
                console.log("F");
                DRAWING_MODE = FILLED;
                break;
            case "Z":
                console.log("Z");
                zBuffer();
                Z_BUFFER ? console.log("Z-Buffer on") : console.log("Z-Buffer off");
                break;
            case "B":
                console.log("B");
                cullFace();
                CULLING ? console.log("Culling on") : console.log("Culling off");
                break;
            default:
                console.error("Unrecognized key");
                break;
        }
    });

    render();
}

function drawPrimitive(shape) {
    switch (shape) {
        case CUBE:
            cubeDraw(gl, program, DRAWING_MODE);
            break;
        case SPHERE:
            sphereDraw(gl, program, DRAWING_MODE);
            break;
        case CYLINDER:
            cylinderDraw(gl, program, DRAWING_MODE);
            break;
        case PARABOLOID:
            paraboloidDraw(gl, program, DRAWING_MODE);
            break;
        case TORUS:
            torusDraw(gl, program, DRAWING_MODE);
            break;
        default:
            break;
    }
}

function zBuffer() {
    Z_BUFFER = !Z_BUFFER;
    if (Z_BUFFER)
        gl.enable(gl.DEPTH_TEST);
    else gl.disable(gl.DEPTH_TEST);
}

function cullFace() {
    CULLING = !CULLING;
    if (CULLING)
        gl.enable(gl.CULL_FACE);
    else gl.disable(gl.CULL_FACE);
}

function axonometric(gamma, theta) {
    // Max = Map ⋅ Rx(γ) ⋅ Ry(θ)
    aux = mat4();
    aux[2][2] = 0;
    mProjection = mult(mult(aux, rotate(radians(gamma), [1, 0, 0])), rotate(radians(theta), [0, 1, 0]));
}

function isometry() {
    // A=42º, B=7º
    let A = radians(42);
    let B = radians(7);
    let theta = Math.atan(Math.sqrt(Math.tan(A) / Math.tan(B))) - Math.PI / 2;
    console.log(theta);
    let gamma = Math.asin(Math.sqrt(Math.tan(A) * Math.tan(B)));
    console.log(gamma)
    aux = mat4();
    aux[2][2] = 0;
    mProjection = mult(mult(aux, rotate(gamma, [1, 0, 0])), rotate(theta, [0, 1, 0]));
}


function frontView() {
    mProjection = mat4();
    mProjection[2][2] = 0;
}

function plant() {
    mProjection = mat4();
    // mProjection[1][1] = 0;
    // mProjection[1][2] = -1;
    mProjection[2][2] = 0;
    mProjection = mult(mProjection, rotate(radians(90), [1, 0, 0]))
}

function sideView() {
    mProjection = mat4();
    mProjection[0][0] = 0;
    mProjection[0][2] = 1
    mProjection[2][2] = 0;
}

function updateProj() {
    // let gamma = parseFloat(document.getElementById("gamma").value);
    // let theta = radians(parseFloat(document.getElementById("theta").value));

    mProjection = mat4();
    // mProjection[0][2] = -lFactor * Math.cos(alpha);
    // mProjection[1][2] = -lFactor * Math.sin(alpha);
    // mProjection[2][2] = -1;
}


function reset_sliders() {
    document.getElementById('gamma').disabled = true;
    document.getElementById('theta').disabled = true;
    update_sliders([0, 0]);
}

function update_sliders(p) {
    document.getElementById("gamma").value = p[0];
    document.getElementById("theta").value = p[1];
}

function render() {
    mView = mat4();

    gl.uniformMatrix4fv(mviewLoc, false, flatten(mView));
    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(mProjection));

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER);

    gl.uniformMatrix4fv(mModelLoc, false, flatten(mProjection));
    drawPrimitive(currentObject);

    window.requestAnimationFrame(render);
}
