/** @type {WebGLRenderingContext} */
var gl;
let program;
let canvas;
let aspect;

var mModelLoc;
var mView, mProjection;

let currentObject = CUBE;
let currentProjection = dimetry;

let theta = 60;
let gamma = 60;

let DRAWING_MODE = WIREFRAME;
let Z_BUFFER = false;
let CULLING = false;

let mScale = 1;

function fit_canvas_to_window() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight / 2;

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

    currentProjection();

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

    document.getElementById("ortho-alcado-princ").onclick = () => { lock_sliders(); currentProjection = frontView };
    document.getElementById("ortho-plant").onclick = () => { lock_sliders(); currentProjection = plant };
    document.getElementById("ortho-alcado-lat").onclick = () => { lock_sliders(); currentProjection = sideView };

    // Axonometric Projection

    document.getElementById("axon-iso").onclick = () => {
        lock_sliders();
        currentProjection = isometry;
    };
    document.getElementById("axon-dim").onclick = () => {
        lock_sliders();
        currentProjection = dimetry;
    };
    document.getElementById("axon-tri").onclick = () => {
        lock_sliders();
        currentProjection = trimetry;
    };
    document.getElementById("axon-free").onclick = () => {
        document.getElementById('gamma').disabled = false;
        document.getElementById('theta').disabled = false;
        currentProjection = axonometric;
    };

    document.getElementById("gamma").oninput = () => {
        gamma = parseFloat(document.getElementById('gamma').value, 10);
        currentProjection = axonometric;
    };
    document.getElementById("theta").oninput = () => {
        theta = parseFloat(document.getElementById('theta').value, 10);
        currentProjection = axonometric;
    };

    // Perspective Projection
    document.getElementById("persp").onclick = () => {
        lock_sliders();
        currentProjection = perspect;
    }

    canvas.onwheel = e => {
        console.log(e);
        mScale += e.deltaY * 0.001;
    }

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
    if (Z_BUFFER) {
        gl.enable(gl.DEPTH_TEST);
        document.getElementById("z-buffer-stats").innerHTML = "ON";
        document.getElementById("z-buffer-stats").style.backgroundColor = "green";
    } else {
        gl.disable(gl.DEPTH_TEST);
        document.getElementById("z-buffer-stats").innerHTML = "OFF";
        document.getElementById("z-buffer-stats").style.backgroundColor = "red";
    }
}

function cullFace() {
    CULLING = !CULLING;
    if (CULLING) {
        gl.enable(gl.CULL_FACE);
        document.getElementById("culling-stats").innerHTML = "ON";
        document.getElementById("culling-stats").style.backgroundColor = "green";
    } else {
        gl.disable(gl.CULL_FACE);
        document.getElementById("culling-stats").innerHTML = "OFF";
        document.getElementById("culling-stats").style.backgroundColor = "red";
    }
}

function axonometric() {
    // Max = Map ⋅ Rx(γ) ⋅ Ry(θ)
    aux = mult(mat4(), mult(rotateX(gamma), rotateY(theta)));

    let eye = [aux[2][0], aux[2][1], aux[2][2]];

    mView = lookAt(eye, [0, 0, 0], [0, 1, 0]);
    mProjection = ortho(-mScale * aspect, mScale * aspect, -mScale, mScale, -10, 10);
}

function isometry() {
    let A = radians(30), B = radians(30);

    computeTheta(A, B);
    computeGamma(A, B);

    axonometric();
}

function dimetry() {
    // A=42º, B=7º
    let A = radians(42), B = radians(7);

    computeTheta(A, B);
    computeGamma(A, B);

    axonometric();
}

function trimetry() {
    // A=54º16', B=23º16'
    let A = radians(54 + minutesToDegrees(16));
    let B = radians(23 + minutesToDegrees(16));

    computeTheta(A, B);
    computeGamma(A, B);

    axonometric();
}

function computeTheta(A, B) {
    theta = Math.atan(Math.sqrt(Math.tan(A) / Math.tan(B))) - Math.PI / 2;
    // Change theta to degrees
    theta = 180 * theta / Math.PI;
    // Set the slider
    document.getElementById("theta").value = theta;
    return theta;
}

function computeGamma(A, B) {
    gamma = Math.asin(Math.sqrt(Math.tan(A) * Math.tan(B)));
    // Change gamma to degrees
    gamma = 180 * gamma / Math.PI;
    // Set the slider
    document.getElementById("gamma").value = gamma;
    return gamma;
}

function minutesToDegrees(minutes) {
    // 1º = 60'
    return minutes / 60;
}

function frontView() {
    mView = lookAt([0, 0, 1], [0, 0, 0], [0, 1, 0]);
    mProjection = ortho(-mScale * aspect, mScale * aspect, -mScale, mScale, -10, 10);
}

function plant() {
    mView = lookAt([0, 1, 0], [0, 0, 0], [1, 0, 0]);
    mProjection = ortho(-mScale * aspect, mScale * aspect, -mScale, mScale, -10, 10);
}

function sideView() {
    mView = lookAt([1, 0, 0], [0, 0, 0], [0, 1, 0]);
    mProjection = ortho(-mScale * aspect, mScale * aspect, -mScale, mScale, -10, 10);
}

function perspect() {
    mView = lookAt([0, 0, 1], [0, 0, 0], [0, 1, 0]);
    mProjection = perspective(60 * mScale, aspect * mScale, 0.1, 20);
}

function lock_sliders() {
    //document.querySelectorAll('input[name="proj"]:checked')[0].id
    document.getElementById('gamma').disabled = true;
    document.getElementById('theta').disabled = true;
}

function render() {
    gl.uniformMatrix4fv(mviewLoc, false, flatten(mView));
    currentProjection();
    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(mProjection));

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER);

    gl.uniformMatrix4fv(mModelLoc, false, flatten(mat4()));
    drawPrimitive(currentObject);

    window.requestAnimationFrame(render);
}
