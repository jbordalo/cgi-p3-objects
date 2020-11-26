/** @type {WebGLRenderingContext} */
var gl;
let program;

var instances = [];

var mModelLoc;
var mView, mProjection;

let OFF = 0;
let ON = 1;
let WIREFRAME = 0;
let FILLED = 1;

let DRAWING_MODE = WIREFRAME;
let Z_BUFFER = OFF;
let CULLING = OFF;

window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    // Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

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
    pyramidInit(gl);
    paraboloidInit(gl);

    document.getElementById("new_cube").onclick = function () {
        instances.push({ t: mat4(), p: cubeDrawWireFrame });
        reset_sliders();
    };

    document.getElementById("new_sphere").onclick = function () {
        instances.push({ t: mat4(), p: sphereDrawWireFrame });
        reset_sliders();
    };

    document.getElementById("new_cylinder").onclick = function () {
        instances.push({ t: mat4(), p: cylinderDrawWireFrame });
        reset_sliders();
    };

    document.getElementById("new_torus").onclick = function () {
        instances.push({ t: mat4(), p: torusDrawFilled });
        reset_sliders();
    };

    document.getElementById("new_pyramid").onclick = function () {
        instances.push({ t: mat4(), p: pyramidDrawWireFrame });
        reset_sliders();
    };

    document.getElementById("reset_current").onclick = function () {
        instances[instances.length - 1].t = mat4();
        reset_sliders();
    };

    document.getElementById("reset_all").onclick = function () {
        instances = [];
        reset_sliders();
    };

    document.getElementById("l-factor").oninput = updateProj;
    document.getElementById("alpha").oninput = updateProj;

    document.getElementById("tx").oninput = update_ctm;
    document.getElementById("ty").oninput = update_ctm;
    document.getElementById("tz").oninput = update_ctm;
    document.getElementById("rx").oninput = update_ctm;
    document.getElementById("ry").oninput = update_ctm;
    document.getElementById("rz").oninput = update_ctm;
    document.getElementById("sx").oninput = update_ctm;
    document.getElementById("sy").oninput = update_ctm;
    document.getElementById("sz").oninput = update_ctm;


    render();
}

function updateProj() {
    let lFactor = parseFloat(document.getElementById("l-factor").value);
    let alpha = radians(parseFloat(document.getElementById("alpha").value));

    mProjection = mat4();
    mProjection[0][2] = -lFactor * Math.cos(alpha);
    mProjection[1][2] = -lFactor * Math.sin(alpha);
    mProjection[2][2] = -1;
}


function update_ctm() {
    if (instances.length == 0) return;

    let tx = parseFloat(document.getElementById('tx').value);
    let ty = parseFloat(document.getElementById('ty').value);
    let tz = parseFloat(document.getElementById('tz').value);
    let rx = parseFloat(document.getElementById('rx').value);
    let ry = parseFloat(document.getElementById('ry').value);
    let rz = parseFloat(document.getElementById('rz').value);
    let sx = parseFloat(document.getElementById('sx').value);
    let sy = parseFloat(document.getElementById('sy').value);
    let sz = parseFloat(document.getElementById('sz').value);

    let m = mult(translate([tx, ty, tz]),
        mult(rotateZ(rz),
            mult(rotateY(ry),
                mult(rotateX(rx),
                    scalem([sx, sy, sz])))));
    instances[instances.length - 1].t = m;
}

function reset_sliders() {
    update_sliders([0, 0, 0], [0, 0, 0], [1, 1, 1], [0, 0]);
}

function update_sliders(t, r, s, p) {
    document.getElementById("tx").value = t[0];
    document.getElementById("ty").value = t[1];
    document.getElementById("tz").value = t[2];
    document.getElementById("rx").value = r[0];
    document.getElementById("ry").value = r[1];
    document.getElementById("rz").value = r[2];
    document.getElementById("sx").value = s[0];
    document.getElementById("sy").value = s[1];
    document.getElementById("sz").value = s[2];
    document.getElementById("l-factor").value = p[0];
    document.getElementById("alpha").value = p[1];
}

function render() {
    mView = mat4();

    gl.uniformMatrix4fv(mviewLoc, false, flatten(mView));
    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(mProjection));

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER);

    // Draw stored primitives
    for (const i of instances) {
        let t = i.t;
        let p = i.p;

        gl.uniformMatrix4fv(mModelLoc, false, flatten(t));
        p(gl, program);
    }
    window.requestAnimationFrame(render);
}
