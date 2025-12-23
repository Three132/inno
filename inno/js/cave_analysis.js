document.addEventListener('DOMContentLoaded', () => {

    // ---- Elements ----
    const btnCalc = document.getElementById('btn-calc');
    const inputLeft = document.getElementById('input-left');
    const inputRight = document.getElementById('input-right');
    const inputSize = document.getElementById('input-size');
    
    // Result Elements
    const caveResult = document.getElementById('cave-result');
    const resWidth = document.getElementById('res-width');
    const resAvg = document.getElementById('res-avg');
    const resSafety = document.getElementById('res-safety');
    const safetyBar = document.getElementById('safety-bar');

    if(btnCalc) {
        btnCalc.addEventListener('click', () => {
            // Get Values
            const left = parseFloat(inputLeft.value) || 0;
            const right = parseFloat(inputRight.value) || 0;
            const size = parseFloat(inputSize.value) || 0;

            // Calculations
            const totalWidth = left + right;
            const avgDist = totalWidth / 2;

            // UI Update
            caveResult.style.display = 'block';
            
            resWidth.innerText = totalWidth.toFixed(2) + "m";
            resAvg.innerText = avgDist.toFixed(2) + "m";

            // Safety Logic
            // If Reference Size (Clearance) is provided, compare it.
            // Else, use a default safety width of 3.0m for a standard rover.
            
            const requiredClearance = size > 0 ? size : 3.0; // Default 3m width needed
            
            let safetyStatus = "UNKNOWN";
            let barColor = "#ccc";
            let barWidth = "10%";

            if (totalWidth >= (requiredClearance * 1.5)) {
                safetyStatus = "SAFE (WIDE MARGIN)";
                barColor = "#00F0FF"; // Cyan
                barWidth = "90%";
                resSafety.style.color = "#00F0FF";
            } else if (totalWidth >= requiredClearance) {
                safetyStatus = "CAUTION (NARROW)";
                barColor = "#FFA500"; // Orange
                barWidth = "50%";
                resSafety.style.color = "#FFA500";
            } else {
                safetyStatus = "DANGER (IMPASSABLE)";
                barColor = "#FF2A6D"; // Red
                barWidth = "20%"; // Small gap
                resSafety.style.color = "#FF2A6D";
            }

            // Start Simulated Loading Sequence
            startLoadingSequence(() => {
                // Update 3D Simulation with Asymmetry
                // Pass Left, Right and Depth
                const depthInput = document.getElementById('input-depth');
                let depth = depthInput ? parseFloat(depthInput.value) : 500;
                
                // SECURITY CAP: Prevent geometry-induced crashes for extreme values
                if (depth > 1000) depth = 1000;
                if (depth < 5) depth = 5;
                
                update3DScene(left, right, depth, safetyStatus);
            });
        });
    }

    function startLoadingSequence(onComplete) {
        const shield = document.getElementById('loading-shield');
        const progress = document.getElementById('loading-progress');
        const textPct = document.getElementById('loading-text-pct');
        const status = document.getElementById('loading-status');
        
        if (!shield) { onComplete(); return; }

        shield.style.display = 'flex';
        let current = 0;
        const messages = [
            "Initializing LIDAR Array...",
            "Fetching Geological Strata...",
            "Calculating Volumetric Density...",
            "Synthesizing 3D Voxel Grid...",
            "Optimizing Mesh Topology...",
            "Applying Material Physics...",
            "Finalizing Environmental Rendering..."
        ];

        const interval = setInterval(() => {
            current += Math.random() * 3;
            if (current >= 100) {
                current = 100;
                clearInterval(interval);
                setTimeout(() => {
                    shield.style.display = 'none';
                    onComplete();
                }, 500);
            }
            progress.style.width = current + "%";
            textPct.innerText = Math.floor(current) + "%";
            
            // Cycle status messages
            const msgIdx = Math.floor((current / 100) * messages.length);
            status.innerText = messages[Math.min(msgIdx, messages.length - 1)];
        }, 80);
    }

    // ---- 3D Visualization Logic ----
    let scene, camera, renderer, tunnelMesh, controls, light, labelGroup;
    let isFlyMode = false;
    const velocity = new THREE.Vector3();
    const direction = new THREE.Vector3();
    const moveState = { forward: false, backward: false, left: false, right: false, up: false, down: false };
    const mouseState = { x: 0, y: 0 };
    
    const container = document.getElementById('3d-container');
    const loadingText = document.getElementById('loading-3d');

    function createLabel(text, x, y, z, color = "#00F0FF") {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        // UPGRADED Resolution for crystal clear clarity
        canvas.width = 512;
        canvas.height = 128;
        
        ctx.fillStyle = "rgba(0,0,0,0)";
        ctx.fillRect(0,0, 512, 128);
        
        // Sharper font rendering with backup
        ctx.font = "bold 60px JetBrains Mono, monospace";
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        
        // Add subtle shadow for legibility against busy textures
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 10;
        ctx.fillText(text, 256, 80);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(6, 1.5, 1); // Increased scale for legibility
        sprite.position.set(x, y, z);
        return sprite;
    }

    function init3D() {
        if(!container) return;
        if(renderer) return;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x020205); 
        scene.fog = new THREE.FogExp2(0x000000, 0.008); // Thinner fog for far sight at 500m

        camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 2000); // Increased far plane
        camera.position.set(0, 4, 15);

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.screenSpacePanning = true; // ALLOWS MOVING ANYWHERE (Right-click or two-finger drag)
        controls.minDistance = 0.5;
        controls.maxDistance = 1000;

        // Lighting System - VIVID MOBILE LIGHTING
        const ambientLight = new THREE.AmbientLight(0xffffff, 2.0); // Further boosted Global Ambient
        scene.add(ambientLight);
        
        // Mobile Spotlight (Follows Camera)
        light = new THREE.PointLight(0x00F0FF, 5.0, 300);
        light.position.set(0, 5, 15);
        scene.add(light);

        // Fill Light for shadowed areas
        const fillLight = new THREE.PointLight(0xffffff, 1.5, 500);
        fillLight.position.set(0, 20, 0);
        scene.add(fillLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
        dirLight.position.set(5, 10, 7);
        scene.add(dirLight);

        labelGroup = new THREE.Group();
        scene.add(labelGroup);

        if(loadingText) loadingText.innerHTML = "ELITE ENGINE ACTIVE: L-CLICK (ORBIT) | R-CLICK (PAN) | SCROLL (ZOOM)";

        // --- Fly Mode Switch Logic ---
        const btnFly = document.getElementById('btn-toggle-fly');
        if(btnFly) {
            btnFly.addEventListener('click', () => {
                isFlyMode = !isFlyMode;
                btnFly.innerText = isFlyMode ? "[ MODE: FLY ]" : "[ MODE: ORBIT ]";
                btnFly.style.background = isFlyMode ? "rgba(255, 42, 109, 0.3)" : "rgba(0, 240, 255, 0.2)";
                btnFly.style.borderColor = isFlyMode ? "#FF2A6D" : "#00F0FF";
                btnFly.style.color = isFlyMode ? "#FF2A6D" : "#00F0FF";
                
                if (controls) controls.enabled = !isFlyMode;
                if (isFlyMode) {
                    loadingText.style.display = 'block';
                    loadingText.innerHTML = "FLIGHT MODE: WASD (MOVE) | Q/E (UP/DOWN) | MOUSE (LOOK)";
                    setTimeout(() => { loadingText.style.display = 'none'; }, 2000);
                    
                    // Show mobile controls if on touch device (or always show in fly mode for simplicity)
                    const mobileControls = document.getElementById('mobile-controls');
                    if (mobileControls) mobileControls.style.display = 'block';
                } else {
                    const mobileControls = document.getElementById('mobile-controls');
                    if (mobileControls) mobileControls.style.display = 'none';
                }
            });
        }

        // --- Mobile Control Logic ---
        const joystickContainer = document.getElementById('joystick-container');
        const joystickKnob = document.getElementById('joystick-knob');
        const btnUp = document.getElementById('btn-up');
        const btnDown = document.getElementById('btn-down');

        let joystickActive = false;
        let joystickStart = { x: 0, y: 0 };

        if (joystickContainer && joystickKnob) {
            joystickContainer.addEventListener('touchstart', (e) => {
                joystickActive = true;
                const touch = e.touches[0];
                joystickStart = { x: touch.clientX, y: touch.clientY };
                e.preventDefault();
            }, { passive: false });

            window.addEventListener('touchmove', (e) => {
                if (!joystickActive) return;
                const touch = e.touches[0];
                const dx = touch.clientX - joystickStart.x;
                const dy = touch.clientY - joystickStart.y;
                const dist = Math.min(Math.sqrt(dx*dx + dy*dy), 40);
                const angle = Math.atan2(dy, dx);
                
                const moveX = Math.cos(angle) * dist;
                const moveY = Math.sin(angle) * dist;
                
                joystickKnob.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;
                
                // Map to moveState
                moveState.forward = dy < -10;
                moveState.backward = dy > 10;
                moveState.left = dx < -10;
                moveState.right = dx > 10;
            }, { passive: false });

            window.addEventListener('touchend', () => {
                joystickActive = false;
                joystickKnob.style.transform = `translate(-50%, -50%)`;
                moveState.forward = false;
                moveState.backward = false;
                moveState.left = false;
                moveState.right = false;
            });
        }

        if (btnUp) {
            btnUp.addEventListener('touchstart', (e) => { moveState.up = true; e.preventDefault(); }, { passive: false });
            btnUp.addEventListener('touchend', () => { moveState.up = false; });
        }
        if (btnDown) {
            btnDown.addEventListener('touchstart', (e) => { moveState.down = true; e.preventDefault(); }, { passive: false });
            btnDown.addEventListener('touchend', () => { moveState.down = false; });
        }

        // --- Keyboard Listeners ---
        window.addEventListener('keydown', (e) => {
            if (!isFlyMode) return;
            switch(e.code) {
                case 'KeyW': moveState.forward = true; break;
                case 'KeyS': moveState.backward = true; break;
                case 'KeyA': moveState.left = true; break;
                case 'KeyD': moveState.right = true; break;
                case 'KeyQ': moveState.up = true; break;
                case 'KeyE': moveState.down = true; break;
            }
        });

        window.addEventListener('keyup', (e) => {
            if (!isFlyMode) return;
            switch(e.code) {
                case 'KeyW': moveState.forward = false; break;
                case 'KeyS': moveState.backward = false; break;
                case 'KeyA': moveState.left = false; break;
                case 'KeyD': moveState.right = false; break;
                case 'KeyQ': moveState.up = false; break;
                case 'KeyE': moveState.down = false; break;
            }
        });

        // --- Mouse Look logic (Simplified) ---
        container.addEventListener('mousemove', (e) => {
            if (!isFlyMode) return;
            // Only look if clicking or if screen is locked (we use simple relative move for now)
            if (e.buttons === 1) {
                camera.rotation.y -= e.movementX * 0.003;
                camera.rotation.x -= e.movementY * 0.003;
                camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x));
            }
        });

        // --- Fullscreen Logic ---
        const btnFs = document.getElementById('btn-fullscreen');
        if(btnFs) {
            btnFs.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    container.requestFullscreen().catch(err => {
                        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
                    });
                } else {
                    document.exitFullscreen();
                }
            });
        }

        document.addEventListener('fullscreenchange', () => {
            handleResize();
        });

        animate();
    }

    function handleResize() {
        if(camera && renderer && container) {
            const w = document.fullscreenElement ? screen.width : container.clientWidth;
            const h = document.fullscreenElement ? screen.height : container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        }
    }

    window.addEventListener('resize', handleResize);

    function createOrganicTunnel(left, right, tunnelLength, colorHex, status) {
        if(tunnelMesh) {
            scene.remove(tunnelMesh);
        }
        if(labelGroup) {
            labelGroup.clear();
        } else {
            labelGroup = new THREE.Group();
            scene.add(labelGroup);
        }

        const width = left + right;
        const radius = Math.max(width / 2, 2.0);
        const centerOffset = (right - left) / 2;

        // --- NEW: CINEMATIC MOUNTAIN CUTAWAY (BLOCK) ---
        const mountainWidth = Math.max(left + right + 20, 100);
        const mountainHeight = 100;
        const boxGeo = new THREE.BoxGeometry(mountainWidth, mountainHeight, tunnelLength + 50, 10, 10, Math.floor(tunnelLength / 10));
        
        // Distort the "Mountain" to look craggy
        const boxPos = boxGeo.attributes.position;
        for (let i = 0; i < boxPos.count; i++) {
            let px = boxPos.getX(i);
            let py = boxPos.getY(i);
            let pz = boxPos.getZ(i);
            
            // Add cragginess based on noise
            const noise = Math.sin(px * 0.05) * 2 + Math.cos(py * 0.05) * 2 + Math.sin(pz * 0.1) * 3;
            boxPos.setX(i, px + noise);
            boxPos.setY(i, py + noise);
        }
        
        const boxMat = new THREE.MeshPhongMaterial({ 
            color: 0x1a1a1a, 
            flatShading: true,
            transparent: true,
            opacity: 0.9,
            side: THREE.BackSide // Make it feel like we're inside if we zoom too much
        });
        const mountain = new THREE.Mesh(boxGeo, boxMat);
        mountain.position.set(0, 0, -tunnelLength/2 + 100);
        scene.add(mountain);

        // --- MULTI-BRANCH TUNNEL SYSTEM (VIVID) ---
        const createTunnelPart = (l, r, len, zOffset, xOffset, angle = 0) => {
            const width = l + r;
            const radius = Math.max(width / 2, 2.0);
            const geo = new THREE.CylinderGeometry(radius, radius, len, 32, Math.floor(len / 10), true);
            geo.rotateX(-Math.PI / 2);
            if(angle !== 0) geo.rotateY(angle);
            
            const positions = geo.attributes.position;
            const colors = [];
            const rColor = new THREE.Color(colorHex).multiplyScalar(0.4);
            const fColor = new THREE.Color(colorHex);

            for (let i = 0; i < positions.count; i++) {
                let px = positions.getX(i);
                let py = positions.getY(i);
                const pz = positions.getZ(i);
                const noise = Math.sin(pz * 0.5) * 0.8 + (Math.random() - 0.5) * 0.3;
                const dist = Math.sqrt(px*px + py*py);
                const factor = (dist + noise) / dist;
                positions.setX(i, px * factor);
                positions.setY(i, py * factor);
                if (py > 0) colors.push(rColor.r * 1.5, rColor.g * 1.5, rColor.b * 1.5);
                else colors.push(fColor.r * 2.0, fColor.g * 2.0, fColor.b * 2.0);
            }
            geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
            
            const mat = new THREE.MeshPhongMaterial({ 
                vertexColors: true, side: THREE.BackSide, flatShading: true,
                shininess: 100, specular: 0x444444, emissive: 0x111111
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(xOffset, 0, zOffset);
            scene.add(mesh);
            return mesh;
        };

        // Main Tunnel
        tunnelMesh = createTunnelPart(left, right, tunnelLength, -tunnelLength/2 + 100, centerOffset);

        // --- ENTRANCE OVERHANG ---
        const overhangGeo = new THREE.TorusGeometry(radius + 5, 3, 16, 100, Math.PI);
        const overhangMat = new THREE.MeshPhongMaterial({ color: 0x333333, flatShading: true });
        const overhang = new THREE.Mesh(overhangGeo, overhangMat);
        overhang.position.set(centerOffset, radius, 100);
        overhang.rotation.x = Math.PI / 2;
        scene.add(overhang);

        // Add a warm 'Sunlight' at the mouth for contrast
        const mouthSun = new THREE.PointLight(0xFFD700, 3.5, 120);
        mouthSun.position.set(centerOffset, 20, 110);
        scene.add(mouthSun);
        
        // --- ADD CRYSTAL CLEAR LABELS & DIAGNOSTICS ---
        // North Arrow (Compass Overlay)
        const northCanvas = document.createElement('canvas');
        const nCtx = northCanvas.getContext('2d');
        northCanvas.width = 256; northCanvas.height = 256;
        nCtx.strokeStyle = "#fff"; nCtx.lineWidth = 4;
        nCtx.beginPath(); nCtx.moveTo(128, 50); nCtx.lineTo(128, 200); nCtx.stroke();
        nCtx.beginPath(); nCtx.moveTo(100, 80); nCtx.lineTo(128, 50); nCtx.lineTo(156, 80); nCtx.stroke();
        nCtx.fillStyle = "#fff"; nCtx.font = "bold 40px JetBrains Mono"; nCtx.textAlign = "center";
        nCtx.fillText("N", 128, 40);
        const nTex = new THREE.CanvasTexture(northCanvas);
        const nMat = new THREE.SpriteMaterial({ map: nTex, transparent: true });
        const nSprite = new THREE.Sprite(nMat);
        nSprite.scale.set(10, 10, 1); nSprite.position.set(0, 40, 110);
        labelGroup.add(nSprite);

        // Warning Markers (As seen in image)
        const createWarning = (text, x, y, z) => {
            const group = new THREE.Group();
            const icon = createLabel("⚠️", 0, 0, 0, "#FF2A6D");
            const detail = createLabel(text, 0, -3, 0, "#FFD700");
            detail.scale.set(3, 0.75, 1);
            group.add(icon); group.add(detail);
            group.position.set(x, y, z);
            return group;
        };

        if (status && (status.includes("DANGER") || status.includes("CAUTION"))) {
            labelGroup.add(createWarning("UNSTABLE STRATA", centerOffset - 10, 5, -50));
            labelGroup.add(createWarning("COLLAPSE RISK", centerOffset + 20, 0, -150));
        }

        // Cave Entrance Label
        labelGroup.add(createLabel("MAIN ENTRANCE", 0, radius + 5, 85, "#FFFFFF"));
        
        // Wall labels positioned relative to the entry view
        labelGroup.add(createLabel(`WALL (LEFT): ${left}m`, -left - 2, 0, 10, "#FF2A6D"));
        labelGroup.add(createLabel(`WALL (RIGHT): ${right}m`, right + 2, 0, 10, "#00F0FF"));
        labelGroup.add(createLabel("SOIL STRATA", centerOffset, -radius - 2, 10, "#FFA500"));
        labelGroup.add(createLabel("ROVER CENTROID", 0, -1, 15, "#FFFFFF"));

        // Rover marker (Sphere)
        const roverGeo = new THREE.SphereGeometry(0.5, 32, 32);
        const roverMat = new THREE.MeshToonMaterial({ color: 0xffffff });
        const rover = new THREE.Mesh(roverGeo, roverMat);
        rover.position.set(0, 0, 15);
        labelGroup.add(rover);

        if(light) light.color.setHex(colorHex);
    }

    function update3DScene(left, right, depth, status) {
        if(!renderer) init3D();
        
        let width = container.clientWidth;
        let height = container.clientHeight;
        
        // Fallback if container is hidden or 0x0
        if (width === 0) width = container.parentElement ? container.parentElement.clientWidth : 800;
        if (height === 0) height = 450;
        
        if (width === 0) width = 800; // Final fallback

        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        if(loadingText) loadingText.style.display = 'none';

        // Cinematic Smooth Camera Glide (TWEEN)
        if (typeof TWEEN !== 'undefined' && camera && controls) {
            const startPos = camera.position.clone();
            const endPos = new THREE.Vector3(150, 100, 200);
            
            new TWEEN.Tween(startPos)
                .to(endPos, 2000)
                .easing(TWEEN.Easing.Quadratic.Out)
                .onUpdate(() => {
                    camera.position.copy(startPos);
                    controls.update();
                })
                .start();

            const startTarget = controls.target.clone();
            const endTarget = new THREE.Vector3(0, 0, 50);
            new TWEEN.Tween(startTarget)
                .to(endTarget, 1500)
                .easing(TWEEN.Easing.Quadratic.Out)
                .onUpdate(() => {
                    controls.target.copy(startTarget);
                })
                .start();
        }

        // VIVID Soil Color Mapping (Diagnostic Precision)
        let color = 0x00FFFF; // Neon Cyan
        if (status.includes("SAFE")) color = 0x8B4513; // Intense Earth Brown
        if (status.includes("CAUTION")) color = 0xFFD700; // Bright Gold
        if (status.includes("DANGER")) color = 0xFF0000; // Pure Red Danger
        
        // Specific Geotechnical Overrides for Dangerous Strata
        // Note: In a real app, we'd pass the actual soilType here.
        // For now, mapping based on status for visual feedback.

        createOrganicTunnel(left, right, depth, color, status);
    }

    function animate() {
        requestAnimationFrame(animate);
        if (typeof TWEEN !== 'undefined') TWEEN.update(); // Update camera glides
        
        if(isFlyMode) {
            // Unrestricted Movement Logic
            const speed = 0.8;
            direction.z = Number(moveState.forward) - Number(moveState.backward);
            direction.x = Number(moveState.right) - Number(moveState.left);
            direction.y = Number(moveState.up) - Number(moveState.down);
            direction.normalize();

            if (moveState.forward || moveState.backward) velocity.z = direction.z * speed; else velocity.z = 0;
            if (moveState.left || moveState.right) velocity.x = direction.x * speed; else velocity.x = 0;
            if (moveState.up || moveState.down) velocity.y = direction.y * speed; else velocity.y = 0;

            camera.translateZ(-velocity.z);
            camera.translateX(velocity.x);
            camera.translateY(velocity.y);
        } else {
            if(controls) controls.update();
        }
        
        // Mobile Light Follows Camera for Interior Clarity
        if(light && camera) {
            light.position.copy(camera.position);
        }

        if(renderer && scene && camera) {
            renderer.render(scene, camera);
        }
    }

    window.addEventListener('resize', () => {
        if(camera && renderer && container) {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        }
    });

    // Initialize 3D on a slight delay to ensure DOM is fully ready
    setTimeout(init3D, 1000);
});
