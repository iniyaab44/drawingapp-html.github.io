const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const clearBtn = document.getElementById('clearBtn');
const toolBtns = document.querySelectorAll('.tool-btn');
const shapeBtns = document.querySelectorAll('.shape-btn');
const canvasContainer = document.getElementById('canvasContainer');
const canvasWrapper = document.getElementById('canvasWrapper');
const cursorPreview = document.getElementById('cursorPreview');
const cursorIcon = document.getElementById('cursorIcon');
const zoomIn = document.getElementById('zoomIn');
const zoomOut = document.getElementById('zoomOut');
const colorPresetBtns = document.querySelectorAll('.color-preset');
const tooltip = document.getElementById('tooltip');
const cropBtn = document.getElementById('cropBtn');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const cropOverlay = document.getElementById('cropOverlay');
const cropBox = document.getElementById('cropBox');
const cropInfo = document.getElementById('cropInfo');
const cropCancel = document.getElementById('cropCancel');
const cropApply = document.getElementById('cropApply');
const exportWidth = document.getElementById('exportWidth');
const exportHeight = document.getElementById('exportHeight');
const formatSelect = document.getElementById('formatSelect');
const downloadBtn = document.getElementById('downloadBtn');
const thicknessSlider = document.getElementById('thicknessSlider');
const thicknessDisplay = document.getElementById('thicknessDisplay');
const arrowBtn = document.querySelector('.arrow-btn');
const lineBtn = document.querySelector('.line-btn');
const arrowMenu = document.querySelector('.arrow-menu');
const lineMenu = document.querySelector('.line-menu');

const toolSVGs = {
    pencil: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M17 3L21 7L7 21H3V17L17 3Z" stroke="#FFD700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    pen: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 19L19 12L22 15L15 22L12 19Z" fill="#3498db"/>
        <path d="M20 9L15 4L4 15L9 20L20 9Z" fill="#3498db"/>
    </svg>`,
    brush: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M9.5 3C11.5 3 13 5 13 7C13 9 11.5 11 9.5 11C7.5 11 6 9 6 7C6 5 7.5 3 9.5 3Z" fill="#e74c3c"/>
        <path d="M3 21L7 17L10 20L6 21L3 21Z" fill="#e74c3c"/>
        <path d="M14 12L20 6" stroke="#e74c3c" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    eraser: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M18 13L11 20H3L9 14" stroke="#9b59b6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9 18L3 20H9L15 14" fill="#9b59b6"/>
    </svg>`,
    select: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M4 4L4 20L10 14L14 20L16 18L10 12L16 6L4 4Z" stroke="#2ecc71" stroke-width="2" stroke-linejoin="round"/>
    </svg>`,
    move: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M5 9L2 12L5 15M9 5L12 2L15 5M19 9L22 12L19 15M9 19L12 22L15 19" stroke="#9b59b6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    fill: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M5 22L9 12L12 16L15 10L19 22H5Z" fill="#e74c3c"/>
        <path d="M19 8C19 6 18 5 17 5C16 5 15 6 15 8C15 10 19 10 19 8Z" stroke="#e74c3c" stroke-width="2"/>
        <path d="M19 8V17" stroke="#e74c3c" stroke-width="2"/>
    </svg>`
};

let isDrawing = false;
let currentShape = '';
let currentArrowDir = 'right';
let currentLineType = 'solid';
let currentThickness = 3;
let currentColor = '#000000';
let currentZoom = 1;
let zoomStep = 0.05; // Smaller zoom step for finer control
let minZoom = 0.1, maxZoom = 5; // Adjusted min/max zoom for more flexibility
let currentPanX = 0, currentPanY = 0; // Actual pan offsets for rendering
let shapesArray = [];
let isCropping = false;
let cropW = 900, cropH = 600;
let currentStroke = null;
let isDragging = false, isResizing = false;
let resizeHandle = '';
let cropRectX = 0, cropRectY = 0;
let canvasRect = { left: 0, top: 0, width: 900, height: 600 };
let isDrawingShape = false;
let shapeStartX = 0, shapeStartY = 0;

let undoStack = [], redoStack = [];
const maxHistory = 50;

let selectedElement = null;
let isDraggingElement = false;
let elementDragStartX = 0, elementDragStartY = 0;

// Touch specific variables
let touchStartX = 0, touchStartY = 0;
let initialPanX = 0, initialPanY = 0;
let isPinching = false;
let initialZoom = 1; // Declare initialZoom
let initialPinchDistance = 0;

ctx.lineCap = 'round';
ctx.lineJoin = 'round';
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, canvas.width, canvas.height);
saveToHistory();

function saveToHistory() {
    undoStack.push(JSON.parse(JSON.stringify(shapesArray)));
    if (undoStack.length > maxHistory) undoStack.shift();
    redoStack = [];
}

function undo() {
    if (undoStack.length > 1) {
        redoStack.push(undoStack.pop());
        shapesArray = JSON.parse(JSON.stringify(undoStack[undoStack.length - 1]));
        redrawWithPanAndZoom();
    }
}

function redo() {
    if (redoStack.length > 0) {
        undoStack.push(redoStack.pop());
        shapesArray = JSON.parse(JSON.stringify(undoStack[undoStack.length - 1]));
        redrawWithPanAndZoom();
    }
}

undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
    else if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }
    else if (e.key === 'Delete' && selectedElement !== null) {
        deleteSelectedElement();
    }
});

function isPointInElement(x, y, element) {
    const hitRadius = element.thickness + 10;
    
    if (element.type === 'rectangle' || element.type === 'square') {
        return x >= element.minX - hitRadius && x <= element.minX + element.width + hitRadius &&
               y >= element.minY - hitRadius && y <= element.minY + element.height + hitRadius;
    }
    else if (element.type === 'circle') {
        const cx = element.minX + element.width / 2;
        const cy = element.minY + element.height / 2;
        const rx = element.width / 2 + hitRadius;
        const ry = element.height / 2 + hitRadius;
        return Math.pow(x - cx, 2) / Math.pow(rx, 2) + Math.pow(y - cy, 2) / Math.pow(ry, 2) <= 1;
    }
    else if (element.type === 'star') {
        const cx = element.minX + element.width / 2;
        const cy = element.minY + element.height / 2;
        const dist = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
        return dist <= Math.max(element.width, element.height) / 2 + hitRadius;
    }
    else if (element.type === 'arrow' || element.type === 'line') {
        const dist = pointToLineDistance(x, y, element.x1, element.y1, element.x2, element.y2);
        return dist <= hitRadius;
    }
    else if (element.type === 'freehand') {
        for (let i = 0; i < element.points.length; i++) {
            const pt = element.points[i];
            const dist = pointToLineDistance(x, y, pt.x1, pt.y1, pt.x2, pt.y2);
            if (dist <= hitRadius) return true;
        }
        return false;
    }
    return false;
}

function pointToLineDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;
    let xx, yy;
    if (param < 0) { xx = x1; yy = y1; }
    else if (param > 1) { xx = x2; yy = y2; }
    else { xx = x1 + param * C; yy = y1 + param * D; }
    return Math.sqrt(Math.pow(px - xx, 2) + Math.pow(py - yy, 2));
}

function findElementAtPoint(x, y) {
    for (let i = shapesArray.length - 1; i >= 0; i--) {
        if (isPointInElement(x, y, shapesArray[i])) {
            return i;
        }
    }
    return -1;
}

function selectElement(index) {
    selectedElement = index;
    redrawWithPanAndZoom();
    if (index >= 0) drawSelectionBox(shapesArray[index]);
}

function drawSelectionBox(element) {
    let minX, minY, maxX, maxY;
    
    if (element.type === 'rectangle' || element.type === 'square') {
        minX = element.minX; minY = element.minY;
        maxX = element.minX + element.width; maxY = element.minY + element.height;
    }
    else if (element.type === 'circle') {
        minX = element.minX; minY = element.minY;
        maxX = element.minX + element.width; maxY = element.minY + element.height;
    }
    else if (element.type === 'star') {
        minX = element.minX; minY = element.minY;
        maxX = element.minX + element.width; maxY = element.minY + element.height;
    }
    else if (element.type === 'arrow' || element.type === 'line') {
        minX = Math.min(element.x1, element.x2); minY = Math.min(element.y1, element.y2);
        maxX = Math.max(element.x1, element.x2); maxY = Math.max(element.y1, element.y2);
    }
    else if (element.type === 'freehand') {
        minX = Infinity; minY = Infinity; maxX = -Infinity; maxY = -Infinity;
        element.points.forEach(pt => {
            minX = Math.min(minX, pt.x1, pt.x2);
            minY = Math.min(minY, pt.y1, pt.y2);
            maxX = Math.max(maxX, pt.x1, pt.x2);
            maxY = Math.max(maxY, pt.y1, pt.y2);
        });
    }
    
    const padding = 8;
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 2 / currentZoom; // Scale line width with zoom
    ctx.setLineDash([5 / currentZoom, 3 / currentZoom]); // Scale dash pattern
    ctx.strokeRect(minX - padding, minY - padding, (maxX - minX) + padding * 2, (maxY - minY) + padding * 2);
    ctx.setLineDash([]);
}

function deleteSelectedElement() {
    if (selectedElement !== null && selectedElement >= 0) {
        shapesArray.splice(selectedElement, 1);
        selectedElement = null;
        redrawWithPanAndZoom();
        saveToHistory();
    }
}

function updateCursorIcon() {
    cursorIcon.innerHTML = toolSVGs[currentTool];
    const iconSvg = cursorIcon.querySelector('svg');
    const size = Math.max(20, Math.min(50, currentThickness * 2.5));
    iconSvg.style.width = size + 'px';
    iconSvg.style.height = size + 'px';
}

thicknessSlider.addEventListener('input', (e) => {
    currentThickness = parseInt(e.target.value);
    thicknessDisplay.textContent = currentThickness;
    updateCursorIcon();
});

// Arrow dropdown
arrowBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    lineMenu.classList.remove('show');
    arrowMenu.classList.toggle('show');
});

arrowBtn.addEventListener('mouseenter', () => {
    lineMenu.classList.remove('show');
});

arrowBtn.addEventListener('mouseleave', () => {
    setTimeout(() => { if (!arrowMenu.matches(':hover')) arrowMenu.classList.remove('show'); }, 300);
});

arrowMenu.addEventListener('mouseleave', () => {
    setTimeout(() => { arrowMenu.classList.remove('show'); }, 300);
});

// Line dropdown
lineBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    arrowMenu.classList.remove('show');
    lineMenu.classList.toggle('show');
});

lineBtn.addEventListener('mouseenter', () => {
    arrowMenu.classList.remove('show');
});

lineBtn.addEventListener('mouseleave', () => {
    setTimeout(() => { if (!lineMenu.matches(':hover')) lineMenu.classList.remove('show'); }, 300);
});

lineMenu.addEventListener('mouseleave', () => {
    setTimeout(() => { lineMenu.classList.remove('show'); }, 300);
});

document.querySelectorAll('[data-arrow]').forEach(item => {
    item.addEventListener('click', (e) => {
        e.stopPropagation();
        currentArrowDir = item.dataset.arrow;
        currentShape = 'arrow';
        currentLineType = '';
        toolBtns.forEach(b => b.classList.remove('active'));
        shapeBtns.forEach(b => b.classList.remove('active'));
        arrowBtn.classList.add('active');
        canvasContainer.style.cursor = 'crosshair';
        cursorPreview.style.display = 'none';
        arrowMenu.classList.remove('show');
        isDrawing = false;
        isDraggingElement = false;
        selectedElement = null;
    });
});

document.querySelectorAll('[data-linetype]').forEach(item => {
    item.addEventListener('click', (e) => {
        e.stopPropagation();
        currentLineType = item.dataset.linetype;
        currentShape = 'line';
        currentArrowDir = '';
        toolBtns.forEach(b => b.classList.remove('active'));
        shapeBtns.forEach(b => b.classList.remove('active'));
        lineBtn.classList.add('active');
        canvasContainer.style.cursor = 'crosshair';
        cursorPreview.style.display = 'none';
        lineMenu.classList.remove('show');
        isDrawing = false;
        isDraggingElement = false;
        selectedElement = null;
    });
});

toolBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        toolBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTool = btn.dataset.tool;
        currentShape = '';
        currentArrowDir = '';
        currentLineType = '';
        shapeBtns.forEach(b => b.classList.remove('active'));
        updateCursorIcon();
        updateCanvasCursor();
        arrowMenu.classList.remove('show');
        lineMenu.classList.remove('show');
        isDrawing = false; // Ensure drawing state is reset when tool changes
        isDraggingElement = false; // Also reset dragging state
        selectedElement = null; // Deselect any element when tool changes
    });
});

shapeBtns.forEach(btn => {
    if (!btn.classList.contains('arrow-btn') && !btn.classList.contains('line-btn')) {
        btn.addEventListener('click', () => {
            shapeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentShape = btn.dataset.shape;
            currentTool = '';
            currentArrowDir = '';
            currentLineType = '';
            toolBtns.forEach(b => b.classList.remove('active'));
            canvasContainer.style.cursor = 'crosshair';
            cursorPreview.style.display = 'none';
            arrowMenu.classList.remove('show');
            lineMenu.classList.remove('show');
            isDrawing = false; // Ensure drawing state is reset when tool changes
            isDraggingElement = false; // Also reset dragging state
            selectedElement = null; // Deselect any element when tool changes
        });
    }
});

function updateCanvasCursor() {
    // Only show cursor preview for drawing tools when not cropping or selecting/moving
    if (isCropping || currentTool === 'select' || currentTool === 'fill' || currentTool === 'move' || currentShape !== '') {
        canvasContainer.style.cursor = 'default';
        cursorPreview.style.display = 'none';
        if (currentTool === 'move') {
            canvasContainer.style.cursor = 'grab'; // Use grab for move tool
        } else if (currentTool === 'fill') {
            canvasContainer.style.cursor = 'pointer';
        } else if (currentShape !== '') {
            canvasContainer.style.cursor = 'crosshair'; // For shapes, still use crosshair
        }
    } else {
        canvasContainer.style.cursor = 'crosshair';
        cursorPreview.style.display = 'flex';
    }
}

function redrawWithPanAndZoom() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.save(); // Save the current transformation matrix
    ctx.translate(currentPanX, currentPanY); // Apply pan
    ctx.scale(currentZoom, currentZoom); // Apply zoom

    shapesArray.forEach(shape => {
        ctx.beginPath();
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = shape.thickness / currentZoom; // Scale thickness inversely with zoom
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = shape.alpha || 1;
        
        if (shape.type === 'rectangle') ctx.rect(shape.minX, shape.minY, shape.width, shape.height);
        else if (shape.type === 'circle') ctx.ellipse(shape.minX + shape.width/2, shape.minY + shape.height/2, shape.width/2, shape.height/2, 0, 0, Math.PI * 2);
        else if (shape.type === 'square') { const size = Math.min(shape.width, shape.height); ctx.rect(shape.minX, shape.minY, size, size); }
        else if (shape.type === 'star') drawStar(ctx, shape.minX + shape.width/2, shape.minY + shape.height/2, 5, shape.width/2, shape.height/2);
        else if (shape.type === 'arrow') drawArrow(ctx, shape.x1, shape.y1, shape.x2, shape.y2, shape.arrowDir);
        else if (shape.type === 'line') drawLine(ctx, shape.x1, shape.y1, shape.x2, shape.y2, shape.lineType);
        else if (shape.type === 'freehand' && shape.tool === 'brush') {
            const offset = shape.thickness * 0.3 / currentZoom; // Scale offset
            const numStrokes = 3;
            for (let s = 0; s < numStrokes; s++) {
                ctx.beginPath();
                ctx.lineWidth = shape.thickness * (0.5 + s * 0.2) / currentZoom;
                ctx.globalAlpha = (shape.alpha || 1) * (0.5 + s * 0.15);
                shape.points.forEach(pt => {
                    const ox = (s - 1) * offset * 0.3;
                    const oy = (s - 1) * offset * 0.3;
                    ctx.moveTo(pt.x1 + ox, pt.y1 + oy);
                    ctx.lineTo(pt.x2 + ox, pt.y2 + oy);
                });
                ctx.stroke();
            }
        } else if (shape.type === 'freehand') {
            shape.points.forEach(pt => { ctx.moveTo(pt.x1, pt.y1); ctx.lineTo(pt.x2, pt.y2); });
            ctx.stroke();
        }
        if (shape.type !== 'freehand') ctx.stroke();
        ctx.globalAlpha = 1;
    });
    
    if (selectedElement !== null && selectedElement >= 0 && selectedElement < shapesArray.length) {
        drawSelectionBox(shapesArray[selectedElement]);
    }
}

zoomIn.addEventListener('click', () => {
    if (currentZoom < maxZoom) {
        const oldZoom = currentZoom;
        currentZoom = Math.min(maxZoom, currentZoom + zoomStep);
        // Adjust pan to zoom around the center of the canvas
        currentPanX -= (canvas.width / 2) * (currentZoom - oldZoom);
        currentPanY -= (canvas.height / 2) * (currentZoom - oldZoom);
        redrawWithPanAndZoom();
    }
});

zoomOut.addEventListener('click', () => {
    if (currentZoom > minZoom) {
        const oldZoom = currentZoom;
        currentZoom = Math.max(minZoom, currentZoom - zoomStep);
        // Adjust pan to zoom around the center of the canvas
        currentPanX += (canvas.width / 2) * (oldZoom - currentZoom);
        currentPanY += (canvas.height / 2) * (oldZoom - currentZoom);
        redrawWithPanAndZoom();
    }
});

colorPresetBtns.forEach(preset => {
    preset.addEventListener('click', () => {
        currentColor = preset.dataset.color;
        colorPresetBtns.forEach(p => p.classList.remove('active'));
        preset.classList.add('active');
    });
});

clearBtn.addEventListener('click', () => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    shapesArray = [];
    selectedElement = null;
    currentPanX = 0;
    currentPanY = 0;
    currentZoom = 1;
    redrawWithPanAndZoom(); // Redraw after clearing and resetting zoom/pan
    undoStack = []; redoStack = [];
    saveToHistory();
});

canvasContainer.addEventListener('mouseenter', () => {
    if (currentTool !== 'move' && currentTool !== 'select' && currentTool !== 'fill' && currentShape === '' && !isCropping && !isDrawingShape) {
        cursorPreview.style.display = 'flex';
    }
});

canvasContainer.addEventListener('mouseleave', () => {
    if (!isCropping) cursorPreview.style.display = 'none';
});

canvasContainer.addEventListener('mousemove', (e) => {
    if (currentTool !== 'move' && currentTool !== 'select' && currentTool !== 'fill' && currentShape === '' && !isCropping) {
        cursorPreview.style.left = e.clientX + 'px';
        cursorPreview.style.top = e.clientY + 'px';
    }
});

function getPosition(e) {
    const rect = canvas.getBoundingClientRect(); // Visual size of the canvas element
    
    // Get clientX/Y from mouse or first touch
    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;

    // Calculate position relative to the canvas element's visual bounds
    let x = clientX - rect.left;
    let y = clientY - rect.top;

    // Convert to internal canvas coordinates, accounting for pan and zoom
    return {
        x: (x / currentZoom) - (currentPanX / currentZoom),
        y: (y / currentZoom) - (currentPanY / currentZoom)
    };
}

function startDrawing(e) {
    if (currentTool === 'move' || isCropping || currentTool === '' || currentShape !== '' || currentTool === 'select' || currentTool === 'fill' || isDraggingElement) return;
    isDrawing = true;
    const pos = getPosition(e);
    lastX = pos.x;
    lastY = pos.y;
}

function draw(e) {
    if (!isDrawing || isCropping || currentTool === '' || currentShape !== '' || currentTool === 'select' || currentTool === 'fill' || currentTool === 'move' || isDraggingElement) return;
    e.preventDefault();
    const pos = getPosition(e);
    
    if (currentTool === 'brush') {
        ctx.strokeStyle = currentColor;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        const angle = Math.random() * Math.PI * 2;
        const offset = currentThickness * 0.3;
        const numStrokes = 3;
        
        for (let i = 0; i < numStrokes; i++) {
            const offsetAngle = angle + (i * Math.PI * 2 / numStrokes);
            const ox = Math.cos(offsetAngle) * offset * (Math.random() * 0.5 + 0.5);
            const oy = Math.sin(offsetAngle) * offset * (Math.random() * 0.5 + 0.5);
            
            ctx.beginPath();
            ctx.globalAlpha = 0.6 + Math.random() * 0.3;
            ctx.lineWidth = currentThickness * (0.5 + Math.random() * 0.5);
            ctx.moveTo(lastX + ox, lastY + oy);
            ctx.lineTo(pos.x + ox, pos.y + oy);
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1;
        
        if (!currentStroke) {
            currentStroke = {
                type: 'freehand',
                tool: 'brush',
                color: currentColor,
                thickness: currentThickness,
                alpha: 0.8,
                points: []
            };
            shapesArray.push(currentStroke);
        }
        currentStroke.points.push({ x1: lastX, y1: lastY, x2: pos.x, y2: pos.y });
    } else {
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(pos.x, pos.y);
        
        if (currentTool === 'eraser') {
            ctx.strokeStyle = '#ffffff';
            ctx.globalAlpha = 1;
        } else if (currentTool === 'pencil') {
            ctx.strokeStyle = currentColor;
            ctx.globalAlpha = 0.4;
        } else {
            ctx.strokeStyle = currentColor;
            ctx.globalAlpha = 1;
        }
        ctx.lineWidth = currentThickness;
        ctx.stroke();
        
        if (!currentStroke) {
            currentStroke = {
                type: 'freehand',
                tool: currentTool,
                color: currentColor,
                thickness: currentThickness,
                alpha: currentTool === 'pencil' ? 0.4 : 1,
                points: []
            };
            shapesArray.push(currentStroke);
        }
        currentStroke.points.push({ x1: lastX, y1: lastY, x2: pos.x, y2: pos.y });
    }
    
    lastX = pos.x;
    lastY = pos.y;
}

function stopDrawing(e) {
    if (isDrawing) {
        saveToHistory();
    }
    isDrawing = false;
    currentStroke = null;
    ctx.globalAlpha = 1;
}

canvasContainer.addEventListener('mousedown', (e) => {
    isDrawing = false; 
    isDraggingElement = false;

    if (currentTool === 'move') {
        const pos = getPosition(e);
        const idx = findElementAtPoint(pos.x, pos.y);
        if (idx >= 0) {
            selectedElement = idx;
            isDraggingElement = true;
            elementDragStartX = pos.x;
            elementDragStartY = pos.y;
            canvasContainer.style.cursor = 'grabbing';
            redrawWithPanAndZoom();
        } else if (selectedElement !== null) {
            isDraggingElement = true;
            elementDragStartX = pos.x;
            elementDragStartY = pos.y;
            canvasContainer.style.cursor = 'grabbing';
        }
    } else if (currentTool === 'select') {
        const pos = getPosition(e);
        const idx = findElementAtPoint(pos.x, pos.y);
        handleSelection(idx, pos);
    } else if (currentTool === 'fill') {
        const pos = getPosition(e);
        const idx = findElementAtPoint(pos.x, pos.y);
        if (idx >= 0) {
            shapesArray[idx].color = currentColor;
            redrawWithPanAndZoom();
            saveToHistory();
        }
    } else if (currentShape !== '' || currentArrowDir !== '' || currentLineType !== '') {
        const pos = getPosition(e);
        shapeStartX = pos.x;
        shapeStartY = pos.y;
        isDrawingShape = true;
    }
    else if (currentTool !== '' && !['fill', 'select', 'move'].includes(currentTool) && !isDraggingElement) {
        startDrawing(e);
    }
});

function handleSelection(idx, pos) {
    if (idx >= 0) {
        if (selectedElement !== idx) {
            selectedElement = idx;
            redrawWithPanAndZoom();
        }
        isDraggingElement = true;
        elementDragStartX = pos.x;
        elementDragStartY = pos.y;
    } else {
        selectedElement = null;
        redrawWithPanAndZoom();
    }
}

canvasContainer.addEventListener('mousemove', (e) => {
    if (isDraggingElement && selectedElement !== null) {
        const pos = getPosition(e);
        const dx = pos.x - elementDragStartX;
        const dy = pos.y - elementDragStartY;
        moveElement(selectedElement, dx, dy);
        elementDragStartX = pos.x;
        elementDragStartY = pos.y;
    } else if (isDrawing && !isCropping && !['select', 'move', 'fill'].includes(currentTool) && !isDraggingElement) {
        draw(e);
    } else if (isDrawingShape) {
        const pos = getPosition(e);
        redrawWithPanAndZoom(); // Clear canvas
        drawShapePreview(shapeStartX, shapeStartY, pos.x, pos.y);
    }
});

canvasContainer.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent default browser touch behavior (like scrolling, zooming)
    if (e.touches.length === 2) {
        isPinching = true;
        initialPinchDistance = getPinchDistance(e);
        initialZoom = currentZoom;
    } else if (e.touches.length === 1) {
        const pos = getPosition(e.touches[0]);
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        initialPanX = currentPanX;
        initialPanY = currentPanY;

        if (currentTool === 'move') {
            isDrawing = false;
            const idx = findElementAtPoint(pos.x, pos.y);
            if (idx >= 0) {
                selectedElement = idx;
                isDraggingElement = true;
                elementDragStartX = pos.x;
                elementDragStartY = pos.y;
                redrawWithPanAndZoom();
            } else if (selectedElement !== null) {
                isDraggingElement = true;
                elementDragStartX = pos.x;
                elementDragStartY = pos.y;
            }
        } else if (currentTool === 'select') {
            isDrawing = false;
            const idx = findElementAtPoint(pos.x, pos.y);
            if (idx >= 0) {
                selectedElement = idx;
                isDraggingElement = true;
                elementDragStartX = pos.x;
                elementDragStartY = pos.y;
            } else {
                selectedElement = null;
            }
            redrawWithPanAndZoom();
        } else if (currentTool === 'fill') {
            isDrawing = false;
            const idx = findElementAtPoint(pos.x, pos.y);
            if (idx >= 0) {
                shapesArray[idx].color = currentColor;
                redrawWithPanAndZoom();
                saveToHistory();
            }
        } else if (currentShape !== '') {
            isDrawing = false; // It's a shape drawing, not freehand drawing
            shapeStartX = pos.x;
            shapeStartY = pos.y;
            isDrawingShape = true;
        } else { // Drawing tools (pencil, pen, brush, eraser)
            startDrawing(e.touches[0]);
        }
    }
});

canvasContainer.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (isPinching && e.touches.length === 2) {
        const currentPinchDistance = getPinchDistance(e);
        const scaleFactor = currentPinchDistance / initialPinchDistance;
        currentZoom = initialZoom * scaleFactor;
        currentZoom = Math.max(minZoom, Math.min(maxZoom, currentZoom)); // Clamp zoom
        redrawWithPanAndZoom();
    } else if (e.touches.length === 1) {
        if (isDraggingElement && selectedElement !== null && (currentTool === 'move' || currentTool === 'select')) {
            const pos = getPosition(e.touches[0]);
            const dx = pos.x - elementDragStartX;
            const dy = pos.y - elementDragStartY;
            moveElement(selectedElement, dx, dy);
            elementDragStartX = pos.x;
            elementDragStartY = pos.y;
        } else if (currentTool === 'move' && !isDraggingElement) {
            const dx = e.touches[0].clientX - touchStartX;
            const dy = e.touches[0].clientY - touchStartY;
            currentPanX = initialPanX + dx;
            currentPanY = initialPanY + dy;
            redrawWithPanAndZoom();
        } else if (isDrawing && !isCropping && currentTool !== 'select' && currentTool !== 'move' && currentTool !== 'fill' && !isDraggingElement) {
            draw(e.touches[0]);
        } else if (isDrawingShape) {
            const pos = getPosition(e.touches[0]);
            redrawWithPanAndZoom(); // Clear canvas
            drawShapePreview(shapeStartX, shapeStartY, pos.x, pos.y);
        }
    }
});

canvasContainer.addEventListener('mouseup', (e) => {
    if (isDrawingShape) {
        const pos = getPosition(e);
        drawShapeOnCanvas(shapeStartX, shapeStartY, pos.x, pos.y);
        isDrawingShape = false;
        saveToHistory();
    }
    if (isDraggingElement) {
        isDraggingElement = false;
        updateCanvasCursor(); // Reset cursor after dragging
        saveToHistory();
    }
    stopDrawing(e); // Call stopDrawing for mouseup
    updateCanvasCursor();
});

canvasContainer.addEventListener('touchend', (e) => {
    isPinching = false;
    if (isDrawing) {
        stopDrawing(e);
    }
    if (isDraggingElement) {
        isDraggingElement = false;
        updateCanvasCursor(); // Reset cursor after dragging
        saveToHistory();
    }
    if (isDrawingShape) {
        const pos = getPosition(e.changedTouches[0]); // Use changedTouches for touchend
        drawShapeOnCanvas(shapeStartX, shapeStartY, pos.x, pos.y);
        isDrawingShape = false;
        saveToHistory();
    }
    updateCanvasCursor();
});

canvasContainer.addEventListener('mouseleave', (e) => {
    stopDrawing(e); // Call stopDrawing for mouseleave
    // Do not reset isDraggingElement here, as mouseleave can happen during a drag
    isDraggingElement = false;
    if (isDrawingShape) { isDrawingShape = false; }
    updateCanvasCursor();
});

function moveElement(index, dx, dy) {
    const element = shapesArray[index];
    element.x1 = (element.x1 || 0) + dx;
    element.y1 = (element.y1 || 0) + dy;
    element.x2 = (element.x2 || 0) + dx;
    element.y2 = (element.y2 || 0) + dy;
    element.minX = (element.minX || 0) + dx;
    element.minY = (element.minY || 0) + dy;
    if (element.type === 'freehand' && element.points) {
        element.points.forEach(pt => {
            pt.x1 += dx;
            pt.y1 += dy;
            pt.x2 += dx;
            pt.y2 += dy;
        });
    }
    redrawWithPanAndZoom();
}

function drawShapeOnCanvas(x1, y1, x2, y2) {
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentThickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const minX = Math.min(x1, x2), minY = Math.min(y1, y2);
    const width = Math.abs(x2 - x1), height = Math.abs(y2 - y1);
    
    const shapeData = {
        type: currentShape || 'line',
        x1, y1, x2, y2,
        color: currentColor,
        thickness: currentThickness,
        arrowDir: currentArrowDir,
        lineType: currentLineType,
        minX, minY, width, height,
        alpha: 1
    };
    shapesArray.push(shapeData);
    
    redrawWithPanAndZoom(); // Redraw all shapes including the new one
}

function drawShapePreview(x1, y1, x2, y2) {
    // This function draws a temporary shape for live preview during touchmove
    ctx.save();
    ctx.translate(currentPanX, currentPanY);
    ctx.scale(currentZoom, currentZoom);

    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentThickness / currentZoom;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const minX = Math.min(x1, x2), minY = Math.min(y1, y2);
    const width = Math.abs(x2 - x1), height = Math.abs(y2 - y1);

    ctx.beginPath();
    if (currentShape === 'rectangle') ctx.rect(minX, minY, width, height);
    else if (currentShape === 'circle') ctx.ellipse(minX + width/2, minY + height/2, width/2, height/2, 0, 0, Math.PI * 2);
    else if (currentShape === 'square') { const size = Math.min(width, height); ctx.rect(minX, minY, size, size); }
    else if (currentShape === 'star') drawStar(ctx, minX + width/2, minY + height/2, 5, width/2, height/2);
    else if (currentShape === 'arrow') drawArrow(ctx, x1, y1, x2, y2, currentArrowDir);
    else if (currentShape === 'line') drawLine(ctx, x1, y1, x2, y2, currentLineType);
    ctx.stroke();
    ctx.restore();
}

function drawStar(ctx, cx, cy, spikes, or, ir) {
    let rot = Math.PI / 2 * 3, step = Math.PI / spikes;
    ctx.moveTo(cx, cy - or);
    for (let i = 0; i < spikes; i++) {
        ctx.lineTo(cx + Math.cos(rot) * or, cy + Math.sin(rot) * or); rot += step;
        ctx.lineTo(cx + Math.cos(rot) * ir, cy + Math.sin(rot) * ir); rot += step;
    }
    ctx.lineTo(cx, cy - or);
    ctx.closePath();
}

function drawArrow(ctx, x1, y1, x2, y2, dir) {
    let angle = Math.atan2(y2 - y1, x2 - x1);
    let hl = currentThickness * 4;
    if (dir === 'right') {
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        ctx.lineTo(x2 - hl * Math.cos(angle - Math.PI/6), y2 - hl * Math.sin(angle - Math.PI/6));
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - hl * Math.cos(angle + Math.PI/6), y2 - hl * Math.sin(angle + Math.PI/6));
    } else if (dir === 'left') {
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        ctx.lineTo(x1 + hl * Math.cos(angle - Math.PI/6), y1 + hl * Math.sin(angle - Math.PI/6));
        ctx.moveTo(x2, y2);
        ctx.lineTo(x1 + hl * Math.cos(angle + Math.PI/6), y1 + hl * Math.sin(angle + Math.PI/6));
    } else if (dir === 'up') {
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        ctx.lineTo(x2 - hl * Math.cos(Math.PI/6), y2 + hl * Math.sin(Math.PI/6));
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 + hl * Math.cos(Math.PI/6), y2 + hl * Math.sin(Math.PI/6));
    } else if (dir === 'down') {
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        ctx.lineTo(x2 - hl * Math.cos(Math.PI/6), y2 - hl * Math.sin(Math.PI/6));
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 + hl * Math.cos(Math.PI/6), y2 - hl * Math.sin(Math.PI/6));
    }
}

function drawLine(ctx, x1, y1, x2, y2, lt) {
    ctx.beginPath(); ctx.moveTo(x1, y1);
    if (lt === 'wave') {
        ctx.bezierCurveTo(x1 + (x2-x1)/4, y1 - 20, x1 + (x2-x1)/2 - 10, y1 + 20, x1 + (x2-x1)/2, y1);
        ctx.bezierCurveTo(x1 + (x2-x1)/2 + 10, y1 - 20, x2 - (x2-x1)/4, y1 + 20, x2, y2);
    } else {
        ctx.lineTo(x2, y2);
        if (lt === 'dashed') ctx.setLineDash([10, 6]);
        else if (lt === 'dotted') ctx.setLineDash([3, 6]);
        else if (lt === 'star') ctx.setLineDash([2, 8]);
        else ctx.setLineDash([]);
    }
}

// The canvasContainer now handles all mouse events for drawing, selection, move, etc.
// The individual canvas.addEventListener calls are no longer needed for drawing.
// canvas.addEventListener('mousedown', startDrawing);
// canvas.addEventListener('mousemove', draw);
// canvas.addEventListener('mouseup', stopDrawing);
// canvas.addEventListener('mouseleave', stopDrawing);

canvasWrapper.addEventListener('wheel', (e) => {
    e.preventDefault();
    const oldZoom = currentZoom;
    if (e.deltaY < 0 && currentZoom < maxZoom) currentZoom = Math.min(maxZoom, currentZoom + zoomStep);
    else if (e.deltaY > 0 && currentZoom > minZoom) currentZoom = Math.max(minZoom, currentZoom - zoomStep);

    // Adjust pan to zoom around the mouse cursor
    const mouseX = (e.clientX - canvas.getBoundingClientRect().left - currentPanX) / oldZoom;
    const mouseY = (e.clientY - canvas.getBoundingClientRect().top - currentPanY) / oldZoom;
    currentPanX -= (mouseX * (currentZoom - oldZoom));
    currentPanY -= (mouseY * (currentZoom - oldZoom));
    redrawWithPanAndZoom();
});

function getPinchDistance(e) {
    return Math.sqrt(Math.pow(e.touches[1].clientX - e.touches[0].clientX, 2) + Math.pow(e.touches[1].clientY - e.touches[0].clientY, 2));
}

// Crop
function initCrop() {
    selectedElement = null;
    canvasRect = canvas.getBoundingClientRect();
    
    // Initialize crop box to cover the entire visible canvas area
    cropRectX = canvasRect.left + currentPanX * currentZoom;
    cropRectY = canvasRect.top + currentPanY * currentZoom;
    cropW = canvas.width * currentZoom;
    cropH = canvas.height * currentZoom;

    // Clamp initial crop box to canvas container boundaries
    cropRectX = Math.max(canvasRect.left, cropRectX);
    cropRectY = Math.max(canvasRect.top, cropRectY);
    cropW = Math.min(cropW, canvasRect.left + canvasRect.width - cropRectX);
    cropH = Math.min(cropH, canvasRect.top + canvasRect.height - cropRectY);

    cropBox.style.cssText = `left:${cropRectX}px;top:${cropRectY}px;width:${cropW}px;height:${cropH}px;`;
    cropInfo.textContent = `${Math.round(cropW / currentZoom)} × ${Math.round(cropH / currentZoom)}`; // Display actual canvas dimensions
    cropOverlay.classList.add('active');
    isCropping = true;
    cursorPreview.style.display = 'none';
}

function applyCrop() {
    // Get the current CSS properties of the cropBox
    const cropBoxStyle = window.getComputedStyle(cropBox);
    const cssCropLeft = parseFloat(cropBoxStyle.left);
    const cssCropTop = parseFloat(cropBoxStyle.top);
    const cssCropWidth = parseFloat(cropBoxStyle.width);
    const cssCropHeight = parseFloat(cropBoxStyle.height);

    // Get the canvas's bounding rectangle to relate CSS positions to canvas
    const canvasBoundingRect = canvas.getBoundingClientRect();

    // Calculate the crop area in internal canvas coordinates
    // This involves reversing the pan and zoom transformations
    const cropCanvasX = (cssCropLeft - canvasBoundingRect.left - currentPanX) / currentZoom;
    const cropCanvasY = (cssCropTop - canvasBoundingRect.top - currentPanY) / currentZoom;
    const cropCanvasW = cssCropWidth / currentZoom;
    const cropCanvasH = cssCropHeight / currentZoom;

    // Ensure crop dimensions are positive and within canvas bounds
    const sourceX = Math.max(0, cropCanvasX);
    const sourceY = Math.max(0, cropCanvasY);
    const sourceWidth = Math.min(canvas.width - sourceX, cropCanvasW);
    const sourceHeight = Math.min(canvas.height - sourceY, cropCanvasH);

    if (sourceWidth <= 0 || sourceHeight <= 0) {
        console.warn("Invalid crop dimensions.");
        cancelCrop();
        return;
    }

    const tc = document.createElement('canvas'), tcx = tc.getContext('2d');

    tc.width = sourceWidth;
    tc.height = sourceHeight;

    tcx.fillStyle = '#fff'; tcx.fillRect(0, 0, sourceWidth, sourceHeight);
    tcx.drawImage(canvas, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, tc.width, tc.height);

    // Resize the main canvas and draw the cropped image
    canvas.width = tc.width;
    canvas.height = tc.height;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tc, 0, 0);

    exportWidth.value = Math.round(canvas.width);
    exportHeight.value = Math.round(canvas.height);
    cancelCrop();
    shapesArray = [];
    saveToHistory();
    redrawWithPanAndZoom(); // Redraw with new canvas dimensions
}

function cancelCrop() {
    cropOverlay.classList.remove('active');
    isCropping = false;
    cropBox.style.cssText = '';
    redrawWithPanAndZoom(); // Redraw to remove crop overlay
}

cropCancel.addEventListener('click', cancelCrop);
cropApply.addEventListener('click', applyCrop);

cropBox.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('crop-handle')) { isResizing = true; resizeHandle = e.target.className.split(' ')[1]; }
    else isDragging = true;
    e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
    if (!isCropping) return;
    if (isDragging) {
        // Mouse position in screen coordinates
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        // Calculate new crop box position in screen coordinates
        let newCropRectX = mouseX - cropW / 2;
        let newCropRectY = mouseY - cropH / 2;

        // Clamp crop box position to canvas container boundaries (screen coordinates)
        newCropRectX = Math.max(canvasRect.left, Math.min(canvasRect.left + canvasRect.width - cropW, newCropRectX));
        newCropRectY = Math.max(canvasRect.top, Math.min(canvasRect.top + canvasRect.height - cropH, newCropRectY));

        cropRectX = newCropRectX;
        cropRectY = newCropRectY;

        cropBox.style.left = cropRectX + 'px';
        cropBox.style.top = cropRectY + 'px';
    } else if (isResizing) {
        const ms = 50;
            // Mouse position in screen coordinates
            const mouseX = e.clientX;
            const mouseY = e.clientY;

            let newCropW = cropW;
            let newCropH = cropH;
            let newCropRectX = cropRectX;
            let newCropRectY = cropRectY;

            const cropRight = cropRectX + cropW;
            const cropBottom = cropRectY + cropH;

            if (resizeHandle === 'se') {
                newCropW = Math.max(ms, mouseX - cropRectX);
                newCropH = Math.max(ms, mouseY - cropRectY);
            } else if (resizeHandle === 'sw') {
                newCropW = Math.max(ms, cropRight - mouseX);
                newCropRectX = cropRight - newCropW;
                newCropH = Math.max(ms, mouseY - cropRectY);
            } else if (resizeHandle === 'ne') {
                newCropW = Math.max(ms, mouseX - cropRectX);
                newCropH = Math.max(ms, cropBottom - mouseY);
                newCropRectY = cropBottom - newCropH;
            } else if (resizeHandle === 'nw') {
                newCropW = Math.max(ms, cropRight - mouseX);
                newCropRectX = cropRight - newCropW;
                newCropH = Math.max(ms, cropBottom - mouseY);
                newCropRectY = cropBottom - newCropH;
            }

            // Clamp to canvas container boundaries (screen coordinates)
            newCropRectX = Math.max(canvasRect.left, newCropRectX);
            newCropRectY = Math.max(canvasRect.top, newCropRectY);
            newCropW = Math.min(newCropW, canvasRect.left + canvasRect.width - newCropRectX);
            newCropH = Math.min(newCropH, canvasRect.top + canvasRect.height - newCropRectY);

            cropRectX = newCropRectX;
            cropRectY = newCropRectY;
            cropW = newCropW;
            cropH = newCropH;

        cropBox.style.cssText = `left:${cropRectX}px;top:${cropRectY}px;width:${cropW}px;height:${cropH}px;`;
        cropInfo.textContent = `${Math.round(cropW / currentZoom)} × ${Math.round(cropH / currentZoom)}`; // Display actual canvas dimensions
    }
});

document.addEventListener('mouseup', () => { 
    isDragging = false; 
    isResizing = false;
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isCropping) cancelCrop();
    else if (e.key === 'Enter' && isCropping) applyCrop();
});

// Download
downloadBtn.addEventListener('click', () => {
    const fmt = formatSelect.value;
    // Use the actual canvas dimensions for export, not the visually scaled ones
    const w = parseInt(exportWidth.value) || canvas.width; 
    const h = parseInt(exportHeight.value) || canvas.height; 
    if (fmt === 'svg') {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><image width="${w}" height="${h}" href="${canvas.toDataURL('image/png')}"/></svg>`;
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `drawing.${fmt}`;
        a.click();
    } else {
        const ec = document.createElement('canvas');
        ec.width = w; ec.height = h;
        const ecx = ec.getContext('2d');
        if (fmt === 'png') { ecx.fillStyle = '#fff'; ecx.fillRect(0, 0, w, h); }
        ecx.drawImage(canvas, 0, 0, w, h);
        const mt = fmt === 'jpg' || fmt === 'jpeg' ? 'image/jpeg' : 'image/png';
        const dataUrl = ec.toDataURL(mt, fmt === 'jpg' || fmt === 'jpeg' ? 0.92 : undefined);
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `drawing.${fmt}`;
        a.click();
    }
});

cropBtn.addEventListener('click', initCrop);
updateCursorIcon(); // Initial cursor icon
redrawWithPanAndZoom(); // Initial draw
