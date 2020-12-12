/** @type {WebGLRenderingContext} */
let gl;
let program;
let canvas;
let aspect;

// Positions
let mViewLoc, mProjectionLoc, mNormalsLoc, mViewNormalsLoc, mModelViewLoc;
let mView, mProjection;

// Lighting
let lighting = OFF;
let lightMode = POINT;
let lightPosition = [0.0, 1.3, 1.8, 1.0];
let shininess = 6.0;
let materialAmbient = [1.0, 0.0, 0.0];
let materialDiffuse = [1.0, 0.0, 0.0];
let materialSpecular = [1.0, 1.0, 1.0];
let lightAmbient = [0.2, 0.2, 0.2];
let lightDiffuse = [0.2, 0.2, 0.2];
let lightSpecular = [1.0, 1.0, 1.0];

let lightingLoc, lightModeLoc, projectionLoc, lightPositionLoc, shininessLoc, materialAmbientLoc, materialDiffuseLoc,
    materialSpecularLoc, lightAmbientLoc, lightDiffuseLoc, lightSpecularLoc;

// Texture
let texture;
let texturing = OFF;
let currentMapping = ORTHOGONAL;

let texturingLoc, currentMappingLoc;

let currentObject = CUBE;
let currentProjection = AXON;
let currentProjectionValues = [frontView, dimetry, perspect];

let theta = 60;
let gamma = 60;

let perspD = 1.5;

let DRAWING_MODE = WIREFRAME;
let Z_BUFFER = false;
let CULLING = false;

// TODO limit
let mScale = 1;

function fit_canvas_to_window() {
    // TODO find better values
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight / 2;

    aspect = canvas.width / canvas.height;
    gl.viewport(0, 0, canvas.width, canvas.height);
}

window.onresize = function () {
    fit_canvas_to_window();
}

function setupTexture() {
    // Create a texture.
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Fill the texture with a 1x1 blue pixel.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        new Uint8Array([0, 0, 255, 255]));
    // Asynchronously load an image
    var image = new Image();
    image.src = "textures/image.jpg";
    image.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        // setup of texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
    };
}

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);

    fit_canvas_to_window();
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    setupTexture();

    // Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Matrices
    mViewLoc = gl.getUniformLocation(program, "mView");
    mProjectionLoc = gl.getUniformLocation(program, "mProjection");
    mNormalsLoc = gl.getUniformLocation(program, "mNormals");
    mViewNormalsLoc = gl.getUniformLocation(program, "mViewNormals");
    mModelViewLoc = gl.getUniformLocation(program, "mModelView");

    // Light
    lightingLoc = gl.getUniformLocation(program, "lighting");
    lightPositionLoc = gl.getUniformLocation(program, "lightPosition");
    projectionLoc = gl.getUniformLocation(program, "projection");
    shininessLoc = gl.getUniformLocation(program, "shininess");
    materialAmbientLoc = gl.getUniformLocation(program, "materialAmb");
    materialDiffuseLoc = gl.getUniformLocation(program, "materialDif");
    materialSpecularLoc = gl.getUniformLocation(program, "materialSpe");
    lightAmbientLoc = gl.getUniformLocation(program, "lightAmb");
    lightDiffuseLoc = gl.getUniformLocation(program, "lightDif");
    lightSpecularLoc = gl.getUniformLocation(program, "lightSpe");

    // Texture
    texturingLoc = gl.getUniformLocation(program, "texturing");
    currentMappingLoc = gl.getUniformLocation(program, "mapping");

    currentProjectionValues[currentProjection]();

    cubeInit(gl);
    sphereInit(gl);
    cylinderInit(gl);
    torusInit(gl);
    paraboloidInit(gl);

    // Get the element with id="defaultOpen" and click on it
    document.getElementById("new_cube").onclick = () => { currentObject = CUBE };
    document.getElementById("new_sphere").onclick = () => { currentObject = SPHERE };
    document.getElementById("new_cylinder").onclick = () => { currentObject = CYLINDER };
    document.getElementById("new_torus").onclick = () => { currentObject = TORUS };
    document.getElementById("new_paraboloid").onclick = () => { currentObject = PARABOLOID };

    // Ortho Projection
    document.getElementById("orthoTab").onclick = () => {
        currentProjection = ORTHO;
        openPage('ortho-proj', document.getElementById("orthoTab"), 'red');
    }

    document.getElementById("ortho-front-view").onclick = () => { currentProjectionValues[ORTHO] = frontView; currentProjection = ORTHO; };
    document.getElementById("ortho-top-view").onclick = () => { currentProjectionValues[ORTHO] = topView; currentProjection = ORTHO; };
    document.getElementById("ortho-side-view").onclick = () => { currentProjectionValues[ORTHO] = sideView; currentProjection = ORTHO; };

    // Axonometric Projection
    document.getElementById("axonTab").onclick = () => {
        currentProjection = AXON;
        openPage('axon-proj', document.getElementById("axonTab"), 'darkorange');
    }

    document.getElementById("axonTab").click();


    document.getElementById("axon-iso").onclick = () => {
        lock_sliders();
        currentProjectionValues[AXON] = isometry;
        currentProjection = AXON;
    };
    document.getElementById("axon-dim").onclick = () => {
        lock_sliders();
        currentProjectionValues[AXON] = dimetry;
        currentProjection = AXON;

    };
    document.getElementById("axon-tri").onclick = () => {
        lock_sliders();
        currentProjectionValues[AXON] = trimetry;
        currentProjection = AXON;

    };
    document.getElementById("axon-free").onclick = () => {
        document.getElementById('gamma').disabled = false;
        document.getElementById('theta').disabled = false;
        currentProjectionValues[AXON] = axonometric;
        currentProjection = AXON;
    };

    document.getElementById("gamma").oninput = () => {
        gamma = parseFloat(document.getElementById('gamma').value, 10);
    };
    document.getElementById("theta").oninput = () => {
        theta = parseFloat(document.getElementById('theta').value, 10);
    };

    // Perspective Projection
    document.getElementById("perspTab").onclick = () => {
        currentProjection = PERSP;
        openPage('persp-proj', document.getElementById("perspTab"), 'gold');
    }

    document.getElementById("persp-d").oninput = () => {
        perspD = parseFloat(document.getElementById("persp-d").value, 10);
    }

    // Lighting
    document.getElementById("lightTab").onclick = () => {
        openPage('lighting', document.getElementById("lightTab"), 'limegreen');
    }

    document.getElementById('light-switch').onclick = () => {
        lighting = !lighting;
    }

    document.getElementById("light-direction").onchange = () => { lightMode = document.getElementById("light-direction").value == "DIRECTIONAL" ? DIRECTIONAL : POINT };

    document.getElementById("shininess").oninput = () => { lightPosition[0] = parseFloat(document.getElementById("shininess").value, 10) };

    document.getElementById("light-x").onchange = () => { lightPosition[0] = parseFloat(document.getElementById("light-x").value, 10) };
    document.getElementById("light-y").onchange = () => { lightPosition[1] = parseFloat(document.getElementById("light-y").value, 10) };
    document.getElementById("light-z").onchange = () => { lightPosition[2] = parseFloat(document.getElementById("light-z").value, 10) };

    document.getElementById("mat-amb-x").onchange = () => { materialAmbient[0] = parseFloat(document.getElementById("mat-amb-x").value, 10) };
    document.getElementById("mat-amb-y").onchange = () => { materialAmbient[1] = parseFloat(document.getElementById("mat-amb-y").value, 10) };
    document.getElementById("mat-amb-z").onchange = () => { materialAmbient[2] = parseFloat(document.getElementById("mat-amb-z").value, 10) };

    document.getElementById("mat-dif-x").onchange = () => { materialDiffuse[0] = parseFloat(document.getElementById("mat-dif-x").value, 10) };
    document.getElementById("mat-dif-y").onchange = () => { materialDiffuse[1] = parseFloat(document.getElementById("mat-dif-y").value, 10) };
    document.getElementById("mat-dif-z").onchange = () => { materialDiffuse[2] = parseFloat(document.getElementById("mat-dif-z").value, 10) };

    document.getElementById("mat-spec-x").onchange = () => { materialSpecular[0] = parseFloat(document.getElementById("mat-spec-x").value, 10) };
    document.getElementById("mat-spec-y").onchange = () => { materialSpecular[1] = parseFloat(document.getElementById("mat-spec-y").value, 10) };
    document.getElementById("mat-spec-z").onchange = () => { materialSpecular[2] = parseFloat(document.getElementById("mat-spec-z").value, 10) };

    document.getElementById("light-amb-x").onchange = () => { lightAmbient[0] = parseFloat(document.getElementById("light-amb-x").value, 10) };
    document.getElementById("light-amb-y").onchange = () => { lightAmbient[1] = parseFloat(document.getElementById("light-amb-y").value, 10) };
    document.getElementById("light-amb-z").onchange = () => { lightAmbient[2] = parseFloat(document.getElementById("light-amb-z").value, 10) };

    document.getElementById("light-dif-x").onchange = () => { lightDiffuse[0] = parseFloat(document.getElementById("light-dif-x").value, 10) };
    document.getElementById("light-dif-y").onchange = () => { lightDiffuse[1] = parseFloat(document.getElementById("light-dif-y").value, 10) };
    document.getElementById("light-dif-z").onchange = () => { lightDiffuse[2] = parseFloat(document.getElementById("light-dif-z").value, 10) };

    document.getElementById("light-spec-x").onchange = () => { lightSpecular[0] = parseFloat(document.getElementById("light-spec-x").value, 10) };
    document.getElementById("light-spec-y").onchange = () => { lightSpecular[1] = parseFloat(document.getElementById("light-spec-y").value, 10) };
    document.getElementById("light-spec-z").onchange = () => { lightSpecular[2] = parseFloat(document.getElementById("light-spec-z").value, 10) };

    // Texture
    document.getElementById("textureTab").onclick = () => {
        openPage('texture', document.getElementById("textureTab"), 'blue');
    }

    document.getElementById('texture-switch').onclick = () => {
        texturing = !texturing;
    }

    document.getElementById("tex-cylinder").onclick = () => { currentMapping = CYLINDRICAL };
    document.getElementById("tex-sphere").onclick = () => { currentMapping = SPHERICAL };
    document.getElementById("tex-orthogonal").onclick = () => { currentMapping = ORTHOGONAL; };

    canvas.onwheel = e => {
        mScale += (mScale + e.deltaY * 0.001) > 0.05 ? e.deltaY * 0.001 : 0;
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

function getOrtho() {
    if (aspect >= 1) {
        mProjection = ortho(-mScale * aspect, mScale * aspect, -mScale, mScale, -10, 10);
    } else {
        mProjection = ortho(-mScale, mScale, -mScale / aspect, mScale / aspect, -10, 10);
    }
}

function axonometric() {
    // Max = Map ⋅ Rx(γ) ⋅ Ry(θ)
    rotationMatrix = mult(mat4(), mult(rotateX(gamma), rotateY(theta)));

    let eye = [rotationMatrix[2][0], rotationMatrix[2][1], rotationMatrix[2][2]];
    let up = [rotationMatrix[1][0], rotationMatrix[1][1], rotationMatrix[1][2]];

    mView = lookAt(eye, [0, 0, 0], up);

    getOrtho();
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
    getOrtho();
}

function topView() {
    mView = lookAt([0, 1, 0], [0, 0, 0], [1, 0, 0]);
    getOrtho();
}

function sideView() {
    mView = lookAt([1, 0, 0], [0, 0, 0], [0, 1, 0]);
    getOrtho();
}

function perspect() {
    let fovy = 2 * Math.atan(mScale / perspD) * 180 / Math.PI;
    mView = lookAt([0, 0, perspD], [0, 0, 0], [0, 1, 0]);
    mProjection = perspective(fovy, aspect, 0.1, mScale * 20);
}

function lock_sliders() {
    //document.querySelectorAll('input[name="proj"]:checked')[0].id
    document.getElementById('gamma').disabled = true;
    document.getElementById('theta').disabled = true;
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER);

    mNormalsLoc = gl.getUniformLocation(program, "mNormals");
    mViewNormalsLoc = gl.getUniformLocation(program, "mViewNormals");

    gl.uniformMatrix4fv(mViewLoc, false, flatten(mView));

    // Update projection
    currentProjectionValues[currentProjection]();
    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(mProjection));

    // Texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
    gl.uniform1f(texturingLoc, texturing);
    gl.uniform1f(currentMappingLoc, currentMapping);

    // mModelView = mView since mModel is I4
    gl.uniform1f(lightingLoc, lighting);
    lightPosition[3] = lightMode == DIRECTIONAL ? 0.0 : 1.0;
    gl.uniform4fv(lightPositionLoc, lightPosition);
    gl.uniform1f(projectionLoc, currentProjection == PERSP ? 1.0 : 0.0);
    gl.uniform1f(shininessLoc, shininess);
    gl.uniform3fv(materialAmbientLoc, materialAmbient);
    gl.uniform3fv(materialDiffuseLoc, materialDiffuse);
    gl.uniform3fv(materialSpecularLoc, materialSpecular);
    gl.uniform3fv(lightAmbientLoc, lightAmbient);
    gl.uniform3fv(lightDiffuseLoc, lightDiffuse);
    gl.uniform3fv(lightSpecularLoc, lightSpecular);

    gl.uniformMatrix4fv(mModelViewLoc, false, flatten(mView));
    gl.uniformMatrix4fv(mNormalsLoc, false, flatten(normalMatrix(mView)));
    gl.uniformMatrix4fv(mViewNormalsLoc, false, flatten(normalMatrix(mView)));

    drawPrimitive(currentObject);

    window.requestAnimationFrame(render);
}
