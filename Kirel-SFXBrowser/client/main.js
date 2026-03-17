const fs = require('fs');
const path = require('path');
const csInterface = new CSInterface();

let roots = JSON.parse(localStorage.getItem('sfx-roots')) || [];
let favList = JSON.parse(localStorage.getItem('sfx-favorites')) || [];
let allFiles = []; 
let currentSelected = "";

const wavesurfer = WaveSurfer.create({
    container: '#waveform',
    waveColor: '#1a1a1a',
    progressColor: '#ff0000',
    height: 35,
    backend: 'mediaelement'
});


const sidebar = document.getElementById('sidebar');
const resizer = document.getElementById('resizer');
let isResizing = false;

resizer.onmousedown = (e) => { isResizing = true; resizer.classList.add('resizing'); };
document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    let offset = e.clientX;
    if (offset > 100 && offset < 500) sidebar.style.width = offset + 'px';
});
document.addEventListener('mouseup', () => { isResizing = false; resizer.classList.remove('resizing'); });


if (roots.length > 0) scanAllLibraries();

document.getElementById('btn-add-root').onclick = () => {
    csInterface.evalScript('Folder.selectDialog("Add SFX Library Folder").fsName', (res) => {
        if (res && res !== "null") {
            if (!roots.includes(res)) {
                roots.push(res);
                localStorage.setItem('sfx-roots', JSON.stringify(roots));
                scanAllLibraries();
            }
        }
    });
};

document.getElementById('btn-clear-roots').onclick = () => {
    if (confirm("Remove all libraries?")) {
        roots = [];
        localStorage.setItem('sfx-roots', "[]");
        scanAllLibraries();
    }
};

function scanAllLibraries() {
    const container = document.getElementById('tree-container');
    container.innerHTML = '';
    allFiles = [];
    
    roots.forEach(rootPath => {
        const rootDiv = document.createElement('div');
        rootDiv.className = 'tree-root-item';
        
        
        const label = document.createElement('div');
        label.className = 'tree-label';
        label.style.color = "#999";
        label.innerText = '📦 ' + path.basename(rootPath).toUpperCase();
        label.onclick = (e) => {
            e.stopPropagation();
            setActiveTab(label);
            loadSpecificFolder(rootPath);
        };
        
        rootDiv.appendChild(label);
        container.appendChild(rootDiv);
        buildTree(rootPath, rootDiv);
    });
    loadAll(); 
}

function buildTree(dir, parentEl) {
    try {
        const items = fs.readdirSync(dir);
        items.forEach(item => {
            const fullPath = path.join(dir, item);
            const stats = fs.statSync(fullPath);

            if (stats.isDirectory()) {
                const node = document.createElement('div');
                node.className = 'tree-node';
                
                const label = document.createElement('span');
                label.className = 'tree-label';
                label.innerText = '📁 ' + item.toUpperCase();
                
                
                label.onclick = (e) => {
                    e.stopPropagation();
                    setActiveTab(label);
                    loadSpecificFolder(fullPath);
                };

                node.appendChild(label);
                parentEl.appendChild(node);
                buildTree(fullPath, node); 
            } else if (/\.(wav|mp3)$/i.test(item)) {
                allFiles.push({ name: item, path: fullPath });
            }
        });
    } catch(e) {}
}

function renderFiles(files) {
    const list = document.getElementById('file-list');
    list.innerHTML = '';
    files.forEach(f => {
        const div = document.createElement('div');
        div.className = 'file-item';
        if (currentSelected === f.path) div.classList.add('active');
        const isFav = favList.includes(f.path);
        div.innerHTML = `<span class="fav-star ${isFav ? 'is-fav' : ''}">★</span> <span>${f.name}</span>`;
        
        div.setAttribute('draggable', true);
        div.onmousedown = (e) => {
            if (e.target.classList.contains('fav-star')) return;
            window.__adobe_cep__.dragAndDrop(f.path, true);
        };

        div.onclick = () => playSound(f, div);
        div.ondblclick = () => importToAE(f.path);
        
        div.querySelector('.fav-star').onclick = (e) => {
            e.stopPropagation();
            toggleFav(f.path);
            renderFiles(files);
        };
        list.appendChild(div);
    });
}

function playSound(f, el) {
    const isSame = (currentSelected === f.path);
    document.querySelectorAll('.file-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    currentSelected = f.path;
    document.getElementById('current-name').innerText = f.name;

    wavesurfer.stop();
    if (!isSame || wavesurfer.getDuration() === 0) {
        const buffer = fs.readFileSync(f.path);
        const blobUrl = URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
        wavesurfer.load(blobUrl);
        wavesurfer.once('ready', () => wavesurfer.play());
    } else {
        wavesurfer.play();
    }
}

function loadAll() { setActiveTab(document.getElementById('f-all')); renderFiles(allFiles); }

function loadSpecificFolder(dir) {
    const files = fs.readdirSync(dir)
        .filter(f => /\.(wav|mp3)$/i.test(f))
        .map(f => ({ name: f, path: path.join(dir, f) }));
    renderFiles(files);
}

function toggleFav(p) {
    if (favList.includes(p)) favList = favList.filter(i => i !== p);
    else favList.push(p);
    localStorage.setItem('sfx-favorites', JSON.stringify(favList));
}

function setActiveTab(el) {
    document.querySelectorAll('.side-item, .tree-label').forEach(i => i.classList.remove('active'));
    if (el) el.classList.add('active');
}

function importToAE(p) { csInterface.evalScript(`importSFX("${p.replace(/\\/g, '\\\\')}")`); }


document.getElementById('f-all').onclick = () => loadAll();
document.getElementById('f-fav').onclick = () => {
    setActiveTab(document.getElementById('f-fav'));
    renderFiles(allFiles.filter(f => favList.includes(f.path)));
};
document.getElementById('btn-stop').onclick = () => wavesurfer.stop();
document.getElementById('btn-play-pause').onclick = () => wavesurfer.playPause();
document.getElementById('vol-slider').oninput = (e) => wavesurfer.setVolume(e.target.value);
document.getElementById('btn-import-big').onclick = () => { if (currentSelected) importToAE(currentSelected); };

document.getElementById('search-input').onkeyup = (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allFiles.filter(f => f.name.toLowerCase().includes(term));
    renderFiles(filtered);
};