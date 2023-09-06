let grid;
let currentIteration = 0;
let size = 64;
let stopFlag = false;

// Initialize Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create geometry and material
//const geometry = new THREE.PlaneGeometry(size, size, size - 1, size - 1);
//const material = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
//const plane = new THREE.Mesh(geometry, material);
//scene.add(plane);

const geometry = new THREE.PlaneBufferGeometry(size, size, size - 1, size - 1);
const material = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
const plane = new THREE.Mesh(geometry, material);
scene.add(plane);

// Camera position
camera.position.z = 100;

async function initGrid() {
  const values = Array(size).fill(0).map(() => Array(size).fill(0));
  const centerX = Math.floor(size / 2);
  const centerY = Math.floor(size / 2);
  const radius = 10;

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const distance = Math.sqrt((i - centerX) ** 2 + (j - centerY) ** 2);
      if (distance <= radius) {
        values[i][j] = 10;
      }
    }
  }

  grid = tf.tensor2d(values, [size, size]);
  await updatePlot();

}

function getColor(value) {
  const color = new THREE.Color();
  color.setScalar(value / 10); // Assuming max value is 10
  return color;
}

function updateGrid() {
  grid = tf.tidy(() => {
    const north = grid.slice([0, 0], [size - 1, size]).pad([[1, 0], [0, 0]]);
    const south = grid.slice([1, 0], [size - 1, size]).pad([[0, 1], [0, 0]]);
    const west = grid.slice([0, 0], [size, size - 1]).pad([[0, 0], [1, 0]]);
    const east = grid.slice([0, 1], [size, size - 1]).pad([[0, 0], [0, 1]]);
    const newGrid = north.add(south).add(west).add(east).div(tf.scalar(4.0));
    return newGrid;
  });
}

//function updatePlot() {
//  grid.array().then(data => {
//    for (let i = 0; i < size; i++) {
//      for (let j = 0; j < size; j++) {
//        const value = data[i][j];
//        const color = getColor(value);
//        geometry.faces[2 * (i * size + j)].color = color;
//        geometry.faces[2 * (i * size + j) + 1].color = color;
//      }
//    }
//    geometry.colorsNeedUpdate = true;
//  });
//}

async function updatePlot() {
    const data = await grid.array();
    
    grid.array().then(data => {
      const colors = [];
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const value = data[i][j];
          const color = value / 10; // Assuming max value is 10
          colors.push(color, color, color); // RGB for each vertex
        }
      }
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    });
  }

function animationLoop() {
  if (stopFlag) return;

  if (currentIteration % 10 === 0) {
    updatePlot();
    document.getElementById('iterationCount').innerText = `Iteration: ${currentIteration}`;
  }

  updateGrid();
  currentIteration++;
  renderer.render(scene, camera);

  requestAnimationFrame(animationLoop);
}

window.onload = async () => {
  await initGrid();

  document.getElementById('startButton').addEventListener('click', () => {
    stopFlag = false;
    animationLoop();
  });

  document.getElementById('stopButton').addEventListener('click', () => {
    stopFlag = true;
  });
};
