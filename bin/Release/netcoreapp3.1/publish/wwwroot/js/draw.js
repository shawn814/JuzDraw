"use strict"
// ================ Global variables =================
let users;
let drawingName = "";
let id = null, choosen_id = null;
let undoList = []; // Push the id with action
let redoList = []; // After undo, push the undoList to the redoList
let points = []; // Used in Draw Line
let newPath; // Currently used to store the boolean whether the thing got or not
let app = { type: "pen", color: "black", size: "5", fill: "transparent" };
let coordinates = [];
let resize_angle;

// Coordinate variables
let cursorPosition = {}, differentPosition = {}, position = { x: 0, y: 0 };
let tempPoint1 = {}, tempPoint2 = {};
let scale = { x: 1.00, y: 1.00 }, current_scale = { x: 1.00, y: 1.00 };
let svgScale = 1;
let object1 = null;

// Flag
let drag = false, resize = false, grab = false, space = false;

let svgDraw = $query('svg#draw'); // draw svg

/*====================================================Event Listener============================================== */

$query('#size').oninput = e => {
    e.preventDefault();
    app.size = $query('#size').value;
    $query('#preview').style.width = `${app.size / 3}px`;
    $query('#preview').style.height = `${app.size / 3}px`;
};

$query('#color').oninput = e => {
    e.preventDefault();
    app.color = $query('#color').value;
    $query('#preview').style.border = `1px solid ${app.color}`;
};

$query('#fill').oninput = e => {
    e.preventDefault();
    app.fill = $query('#fill').value == "#ffffff" ? "transparent" : $query('#fill').value;
    $query('#preview').style.background = `${app.fill}`;
};

$query('#drawName').onblur = e => {
    e.preventDefault();
    var tempName = $query('#drawName').value;
    if (tempName == null || !tempName) tempName = "Untitled";
    $query('#drawName').value = tempName;
    con.invoke('AssignName', tempName);
};

$query("[id='leave']").onclick = () => location = 'list.html';

svgDraw.onpointerdown = svgDraw.onpointerenter = e => {
    if (e.buttons == 1 && e.isPrimary) {
        e.preventDefault();
        $query('#drawName').blur();
        let current_position = cursorPoint(e);

        if (choosen_id && (e.target.tagName == "svg" || e.target.id == "bg_grid")) select();
        console.log(simplifyNumber(current_position.x));
        $query('#xcoord').innerHTML = simplifyNumber(current_position.x);
        $query('#ycoord').innerHTML = simplifyNumber(current_position.y);
        if (space && e.type == "pointerdown") grab = true;
        else {
            switch (app.type) {
                case "pen": select(); break; // Draw
                case "cursor": // Move 
                    let resize_target = ["resize_nw", "resize_n", "resize_ne", "resize_e", "resize_se", "resize_s", "resize_sw", "resize_w", "line_x1", "line_x2"];
                    let drag_target = ["path", "rect", "ellipse", "text", "image", "line"];

                    if (resize_target.includes(e.target.id) && choosen_id) {
                        resize_angle = e.target.id;
                        cursorPosition = current_position;
                        if ($query(`[id='${choosen_id}']`).tagName == 'line') {
                            tempPoint1 = { x: $query(`[id='${choosen_id}']`).getAttribute('x1'), y: $query(`[id='${choosen_id}']`).getAttribute('y1') };
                            tempPoint2 = { x: $query(`[id='${choosen_id}']`).getAttribute('x2'), y: $query(`[id='${choosen_id}']`).getAttribute('y2') };
                            object1 = $query(`[id='${choosen_id}']`).cloneNode(true);
                        }
                        drag = false; resize = true;
                    } else if (drag_target.includes(e.target.tagName) && !resize_target.includes(e.target.id) && e.target.id != "resize_border" && !e.target.classList.contains("notMoveable")) {
                        select();
                        choosen_id = e.target.id;
                        if (!choosen_id) break;
                        if (e.target.tagName == "line") {
                            tempPoint1 = { x: $query(`[id='${choosen_id}']`).getAttribute('x1') * 1, y: $query(`[id='${choosen_id}']`).getAttribute('y1') * 1 };
                            tempPoint2 = { x: $query(`[id='${choosen_id}']`).getAttribute('x2') * 1, y: $query(`[id='${choosen_id}']`).getAttribute('y2') * 1 };
                            select({ x1: $query(`[id='${choosen_id}']`).getAttribute('x1'), x2: $query(`[id='${choosen_id}']`).getAttribute('x2'), y1: $query(`[id='${choosen_id}']`).getAttribute('y1'), y2: $query(`[id='${choosen_id}']`).getAttribute('y2') }, true);
                        } else select($query(`[id='${choosen_id}']`).getBBox());
                        cursorPosition = current_position;
                        resize = false; drag = true;
                    } break;
                case "circle": case "rect": select(); // Rectangle & Circle
                    if (!newPath) {
                        newPath = true;
                        cursorPosition = { x: current_position.x, y: current_position.y };
                    } break;
                case "line": select(); break; // Line
            }
        }
    }
};

svgDraw.onpointermove = async (e) => {
    if (e.buttons == 1 && e.isPrimary) {
        e.preventDefault();
        let current_position = cursorPoint(e);

        if (grab && space) {
            svgDraw.setAttribute("x", Number(svgDraw.getAttribute("x")) + e.movementX);
            svgDraw.setAttribute("y", Number(svgDraw.getAttribute("y")) + e.movementY);
        } else {
            redoUndoStatus("redo");
            switch (app.type) {
                case "pen": // Draw
                    if (!id) {
                        coordinates.push({ x: current_position.x - e.movementX, y: current_position.y - e.movementY });
                        coordinates.push({ x: current_position.x, y: current_position.y });
                        id = uuidv4();
                        startDraw(id, coordinates[0], app.color, app.size, app.fill);
                        con.invoke("StartDraw", id, coordinates[0], app.color, app.size, app.fill);
                    } else if (current_position.x != coordinates[1].x || current_position.y != coordinates[1].y) {
                        coordinates.push({ x: current_position.x, y: current_position.y });
                        coordinates = coordinates.slice(-3);
                        let midPoint = mid(coordinates[1], coordinates[2]);
                        await draw(id, coordinates[1], midPoint);
                        con.invoke("Draw", id, coordinates[1], midPoint);
                        $query('#xcoord').innerHTML = simplifyNumber(current_position.x);
                        $query('#ycoord').innerHTML = simplifyNumber(current_position.y);
                    } break;
                case "cursor": // Move
                    if (!choosen_id) break;
                    if (drag) {
                        $query(`[id='${choosen_id}']`).style.transform = `translate(${current_position.x - cursorPosition.x}px,${current_position.y - cursorPosition.y}px)`;
                        if ($query('#resize_wrap')) $query('#resize_wrap').style.transform = `translate(${current_position.x - cursorPosition.x}px,${current_position.y - cursorPosition.y}px)`;
                        if ($query('#line_edit')) $query('#line_edit').style.transform = `translate(${current_position.x - cursorPosition.x}px,${current_position.y - cursorPosition.y}px)`;
                    } else if (resize && resize_angle) {
                        let selected_info = $query(`[id='${choosen_id}']`).getBBox();

                        if (resize_angle == "resize_e") {
                            current_scale.x = Math.max((current_position.x - (selected_info.x + selected_info.width) + selected_info.width) / selected_info.width, 0.1);
                            // console.log(-selected_info.x);
                            $query(`[id='${choosen_id}']`).style.transform = `translate(${selected_info.x}px,0) scale(${current_scale.x},${current_scale.y}) translate(${-selected_info.x}px,0)`;
                            $query('#resize_wrap').style.transform = `translate(${selected_info.x}px,0) scale(${current_scale.x},${current_scale.y}) translate(${-selected_info.x}px,0)`;
                        } else if (resize_angle == "resize_w") {
                            current_scale.x = Math.max((selected_info.x - current_position.x + selected_info.width) / selected_info.width, 0.1);

                            $query(`[id='${choosen_id}']`).style.transform = `translate(${selected_info.x + selected_info.width}px,0) scale(${current_scale.x},${current_scale.y}) translate(${-(selected_info.x + selected_info.width)}px,0)`;
                            $query(`#resize_wrap`).style.transform = `translate(${selected_info.x + selected_info.width}px,0) scale(${current_scale.x},${current_scale.y}) translate(${-(selected_info.x + selected_info.width)}px,0)`;
                        } else if (resize_angle == "resize_s") {
                            current_scale.y = Math.max((current_position.y - (selected_info.y + selected_info.height) + selected_info.height) / selected_info.height, 0.1);

                            $query(`[id='${choosen_id}']`).style.transform = `translate(0,${selected_info.y}px) scale(${current_scale.x},${current_scale.y}) translate(0,${-selected_info.y}px)`;
                            $query(`#resize_wrap`).style.transform = `translate(0,${selected_info.y}px) scale(${current_scale.x},${current_scale.y}) translate(0,${-selected_info.y}px)`;
                        } else if (resize_angle == "resize_n") {
                            current_scale.y = Math.max((selected_info.y - current_position.y + selected_info.height) / selected_info.height, 0.1);

                            $query(`[id='${choosen_id}']`).style.transform = `translate(0,${selected_info.y + selected_info.height}px) scale(${current_scale.x},${current_scale.y}) translate(0,${-(selected_info.y + selected_info.height)}px)`;
                            $query(`#resize_wrap`).style.transform = `translate(0,${selected_info.y + selected_info.height}px) scale(${current_scale.x},${current_scale.y}) translate(0,${-(selected_info.y + selected_info.height)}px)`;
                        } else if (resize_angle == "resize_se") {
                            current_scale = {
                                x: Math.max((current_position.x - (selected_info.x + selected_info.width) + selected_info.width) / selected_info.width, 0.1),
                                y: Math.max((current_position.y - (selected_info.y + selected_info.height) + selected_info.height) / selected_info.height, 0.1)
                            }

                            if (e.shiftKey) current_scale.x > current_scale.y ? current_scale.y = current_scale.x : current_scale.x = current_scale.y;

                            $query(`[id='${choosen_id}']`).style.transform = `translate(${selected_info.x}px,${selected_info.y}px) scale(${current_scale.x},${current_scale.y}) translate(${-selected_info.x}px,${-selected_info.y}px)`;
                            $query(`#resize_wrap`).style.transform = `translate(${selected_info.x}px,${selected_info.y}px) scale(${current_scale.x},${current_scale.y}) translate(${-selected_info.x}px,${-selected_info.y}px)`;
                        } else if (resize_angle == "resize_nw") {
                            current_scale = {
                                x: Math.max((selected_info.x - current_position.x + selected_info.width) / selected_info.width, 0.1),
                                y: Math.max((selected_info.y - current_position.y + selected_info.height) / selected_info.height, 0.1)
                            };

                            if (e.shiftKey) current_scale.x > current_scale.y ? current_scale.y = current_scale.x : current_scale.x = current_scale.y;

                            $query(`[id='${choosen_id}']`).style.transform = `translate(${selected_info.x + selected_info.width}px,${selected_info.y + selected_info.height}px) scale(${current_scale.x},${current_scale.y}) translate(${-(selected_info.x + selected_info.width)}px,${-(selected_info.y + selected_info.height)}px)`;
                            $query(`#resize_wrap`).style.transform = `translate(${selected_info.x + selected_info.width}px,${selected_info.y + selected_info.height}px) scale(${current_scale.x},${current_scale.y}) translate(${-(selected_info.x + selected_info.width)}px,${-(selected_info.y + selected_info.height)}px)`;
                        } else if (resize_angle == "resize_ne") {
                            current_scale = {
                                x: Math.max((current_position.x - (selected_info.x + selected_info.width) + selected_info.width) / selected_info.width, 0.1),
                                y: Math.max((selected_info.y - current_position.y + selected_info.height) / selected_info.height, 0.1)
                            };

                            if (e.shiftKey) current_scale.x > current_scale.y ? current_scale.y = current_scale.x : current_scale.x = current_scale.y;

                            $query(`[id='${choosen_id}']`).style.transform = `translate(${selected_info.x}px,${selected_info.y + selected_info.height}px) scale(${current_scale.x},${current_scale.y}) translate(${-selected_info.x}px,${-(selected_info.y + selected_info.height)}px)`;
                            $query(`#resize_wrap`).style.transform = `translate(${selected_info.x}px,${selected_info.y + selected_info.height}px) scale(${current_scale.x},${current_scale.y}) translate(${-selected_info.x}px,${-(selected_info.y + selected_info.height)}px)`;
                        } else if (resize_angle == "resize_sw") {
                            current_scale = {
                                x: Math.max((selected_info.x - current_position.x + selected_info.width) / selected_info.width, 0.1),
                                y: Math.max((current_position.y - (selected_info.y + selected_info.height) + selected_info.height) / selected_info.height, 0.1)
                            };

                            if (e.shiftKey) current_scale.x > current_scale.y ? current_scale.y = current_scale.x : current_scale.x = current_scale.y;

                            $query(`[id='${choosen_id}']`).style.transform = `translate(${selected_info.x + selected_info.width}px,${selected_info.y}px) scale(${current_scale.x},${current_scale.y}) translate(${-(selected_info.x + selected_info.width)}px,${-selected_info.y}px)`;
                            $query(`#resize_wrap`).style.transform = `translate(${selected_info.x + selected_info.width}px,${selected_info.y}px) scale(${current_scale.x},${current_scale.y}) translate(${-(selected_info.x + selected_info.width)}px,${-selected_info.y}px)`;
                        } else if (resize_angle == "line_x1") {
                            let newPoint = comparePoint(current_position);
                            cursorPosition = newPoint ? { x: newPoint.x, y: newPoint.y } : { x: simplifyNumber(current_position.x), y: simplifyNumber(current_position.y) };
                            $query(`[id='${choosen_id}']`).setAttribute("x1", cursorPosition.x);
                            $query(`[id='${choosen_id}']`).setAttribute("y1", cursorPosition.y);
                            con.invoke('MoveObject', 'line', { id: choosen_id, x1: cursorPosition.x, y1: cursorPosition.y });
                            selectLine(choosen_id, cursorPosition);
                        } else if (resize_angle == "line_x2") {
                            let newPoint = comparePoint(current_position);
                            cursorPosition = newPoint ? { x: newPoint.x, y: newPoint.y } : { x: simplifyNumber(current_position.x), y: simplifyNumber(current_position.y) };
                            $query(`[id='${choosen_id}']`).setAttribute("x2", cursorPosition.x);
                            $query(`[id='${choosen_id}']`).setAttribute("y2", cursorPosition.y);
                            con.invoke('MoveObject', 'line', { id: choosen_id, x2: cursorPosition.x, y2: cursorPosition.y });
                            selectLine(choosen_id, cursorPosition);
                        }
                    } break;
                case "rect": // Rectangle
                    if (!id) {
                        id = uuidv4();
                        let point = { x: current_position.x, y: current_position.y };
                        startRect(id, point, app.color, app.size, app.fill);
                        con.invoke("StartRect", id, point, app.color, app.size, app.fill);
                    }
                    let pointR = null;
                    differentPosition = { x: Math.abs(current_position.x - cursorPosition.x), y: Math.abs(current_position.y - cursorPosition.y) };

                    // Square ===================================================
                    if (e.shiftKey) differentPosition.x > differentPosition.y ? differentPosition.y = differentPosition.x : differentPosition.x = differentPosition.y

                    let boxR = { x: differentPosition.x, y: differentPosition.y }; // Set rect size

                    // Fix position =====================================================
                    if (current_position.x < cursorPosition.x && current_position.y < cursorPosition.y) //Left top
                        pointR = { x: cursorPosition.x - differentPosition.x, y: cursorPosition.y - differentPosition.y };
                    else if (current_position.x < cursorPosition.x) //Left
                        pointR = { x: cursorPosition.x - differentPosition.x, y: cursorPosition.y };
                    else if (current_position.y < cursorPosition.y) //Top
                        pointR = { x: cursorPosition.x, y: cursorPosition.y - differentPosition.y };
                    else //Bottom Right
                        pointR = { x: cursorPosition.x, y: cursorPosition.y };

                    drawRect(id, pointR, boxR);
                    con.invoke("DrawRect", id, pointR, boxR);
                    $query('#xcoord').innerHTML = simplifyNumber(current_position.x);
                    $query('#ycoord').innerHTML = simplifyNumber(current_position.y);
                    break;
                case "circle": // Circle
                    if (!id) { // check new element
                        id = uuidv4();
                        let point = { x: current_position.x, y: current_position.y };
                        startCircle(id, point, app.color, app.size, app.fill);
                        con.invoke("StartCircle", id, point, app.color, app.size, app.fill);
                    }
                    let pointC = null;
                    differentPosition = { x: Math.abs(current_position.x - cursorPosition.x), y: Math.abs(current_position.y - cursorPosition.y) };

                    // Prefect circle ===================================================
                    if (e.shiftKey) differentPosition.x > differentPosition.y ? differentPosition.y = differentPosition.x : differentPosition.x = differentPosition.y

                    let boxC = { x: differentPosition.x / 2, y: differentPosition.y / 2 }; // Set circle size

                    // Fix position =====================================================
                    if (current_position.x - cursorPosition.x < 0 && current_position.y - cursorPosition.y < 0) // left top
                        pointC = { x: cursorPosition.x - differentPosition.x / 2, y: cursorPosition.y - differentPosition.y / 2 };
                    else if (current_position.x - cursorPosition.x < 0) // left
                        pointC = { x: cursorPosition.x - differentPosition.x / 2, y: cursorPosition.y + differentPosition.y / 2 };
                    else if (current_position.y - cursorPosition.y < 0) /// top
                        pointC = { x: cursorPosition.x + differentPosition.x / 2, y: cursorPosition.y - differentPosition.y / 2 };
                    else // bottom right
                        pointC = { x: cursorPosition.x + differentPosition.x / 2, y: cursorPosition.y + differentPosition.y / 2 };

                    drawCircle(id, pointC, boxC);
                    con.invoke("DrawCircle", id, pointC, boxC);
                    $query('#xcoord').innerHTML = simplifyNumber(current_position.x);
                    $query('#ycoord').innerHTML = simplifyNumber(current_position.y);
                    break;
                case "line": // Line
                    let newPoint = comparePoint(current_position);

                    if (!id) {
                        cursorPosition = newPoint ? newPoint : current_position;
                        id = uuidv4();
                    }

                    let pointLA = newPoint ? newPoint : current_position;
                    drawLine(id, { x: cursorPosition.x, y: cursorPosition.y }, { x: pointLA.x, y: pointLA.y }, app.color, app.size);
                    con.invoke('DrawLine', id, { x: cursorPosition.x, y: cursorPosition.y }, { x: pointLA.x, y: pointLA.y }, app.color, app.size);
                    $query('#xcoord').innerHTML = simplifyNumber(current_position.x);
                    $query('#ycoord').innerHTML = simplifyNumber(current_position.y);
                    break;
            }
        }
    }
};

svgDraw.onpointerup = svgDraw.onpointerleave = async (e) => {
    e.preventDefault();
    let current_position = cursorPoint(e);

    if (grab) {
        grab = false;
    }

    switch (app.type) {
        case "pen": // Draw
            if (id) {
                coordinates.push({ x: current_position.x, y: current_position.y });
                coordinates = coordinates.slice(-3);

                let midPoint = mid(coordinates[1], coordinates[2]);

                await draw(id, midPoint, coordinates[2]);
                con.invoke("Draw", id, midPoint, coordinates[2]);

                undoList.push({ mode: 'new', object: $query(`[id='${id}']`).cloneNode(true) });
                redoUndoStatus('undo', true);
                con.invoke('InsertObjectIntoList', { id, object: getString($query(`[id='${id}']`)) });
            }
            id = null; coordinates = [];
            break;
        case "cursor": // Move
            let object2 = null;

            if (choosen_id) {
                const change = window.getComputedStyle($query(`[id='${choosen_id}']`), null)?.transform;
                const selected_css_value = change != 'none' ? change.match(/matrix.*\((.+)\)/)[1].split(', ').map(parseFloat) : null;
                let $choosen_id = $query(`[id='${choosen_id}']`);
                $choosen_id.removeAttribute('style');
                if (drag && selected_css_value) { // drag
                    position = { x: selected_css_value[4], y: selected_css_value[5] };
                    object1 = $choosen_id.cloneNode(true);

                    switch ($choosen_id.tagName) {
                        case 'path':
                            let new_coord;
                            const coord = $choosen_id.getAttribute('d').substring(1).split("Q");
                            for (let i of coord) {
                                let coord_xy = i.split(",").map(parseFloat);
                                !new_coord ?
                                    new_coord = `M${simplifyNumber(coord_xy[0] + position.x)},${simplifyNumber(coord_xy[1] + position.y)}` :
                                    new_coord += `Q${simplifyNumber(coord_xy[0] + position.x)},${simplifyNumber(coord_xy[1] + position.y)},${simplifyNumber(coord_xy[2] + position.x)},${simplifyNumber(coord_xy[3] + position.y)}`;
                            }
                            con.invoke('MoveObject', 'path', { id: choosen_id, d: new_coord });
                            $choosen_id.setAttribute('d', new_coord);
                            break;
                        case 'rect':
                            $choosen_id.setAttribute('x', Number($choosen_id.getAttribute('x')) + position.x);
                            $choosen_id.setAttribute('y', Number($choosen_id.getAttribute('y')) + position.y);
                            con.invoke('MoveObject', 'rect', { id: choosen_id, x: $choosen_id.getAttribute('x'), y: $choosen_id.getAttribute('y') });
                            break;
                        case 'ellipse':
                            $choosen_id.setAttribute('cx', Number($choosen_id.getAttribute('cx')) + position.x);
                            $choosen_id.setAttribute('cy', Number($choosen_id.getAttribute('cy')) + position.y);
                            con.invoke('MoveObject', 'ellipse', { id: choosen_id, cx: $choosen_id.getAttribute('cx'), cy: $choosen_id.getAttribute('cy') });
                            break;
                        case 'image':
                            $choosen_id.setAttribute('x', Number($choosen_id.getAttribute('x')) + position.x);
                            $choosen_id.setAttribute('y', Number($choosen_id.getAttribute('y')) + position.y);
                            con.invoke('MoveObject', 'image', { id: choosen_id, x: $choosen_id.getAttribute('x'), y: $choosen_id.getAttribute('y') });
                            break;
                        case 'line':
                            $choosen_id.setAttribute('x1', Number($choosen_id.getAttribute('x1')) + position.x);
                            $choosen_id.setAttribute('x2', Number($choosen_id.getAttribute('x2')) + position.x);
                            $choosen_id.setAttribute('y1', Number($choosen_id.getAttribute('y1')) + position.y);
                            $choosen_id.setAttribute('y2', Number($choosen_id.getAttribute('y2')) + position.y);
                            select({ x1: $choosen_id.getAttribute('x1'), x2: $choosen_id.getAttribute('x2'), y1: $choosen_id.getAttribute('y1'), y2: $choosen_id.getAttribute('y2') }, true);
                            popPoint(tempPoint1); popPoint(tempPoint2);
                            con.invoke('PopPoint', tempPoint1); con.invoke('PopPoint', tempPoint2);
                            pushPoint({ x: Number($choosen_id.getAttribute("x1")), y: Number($choosen_id.getAttribute("y1")) });
                            pushPoint({ x: Number($choosen_id.getAttribute("x2")), y: Number($choosen_id.getAttribute("y2")) });
                            con.invoke('PushPoint', { x: Number($choosen_id.getAttribute("x1")), y: Number($choosen_id.getAttribute("y1")) });
                            con.invoke('PushPoint', { x: Number($choosen_id.getAttribute("x2")), y: Number($choosen_id.getAttribute("y2")) });
                            $query("#line_edit").removeAttribute('style');
                            con.invoke('MoveObject', 'line', {
                                id: choosen_id,
                                x1: $choosen_id.getAttribute('x1'), y1: $choosen_id.getAttribute('y1'),
                                x2: $choosen_id.getAttribute('x2'), y2: $choosen_id.getAttribute('y2')
                            });
                            break;
                    }
                    object2 = $query(`[id='${choosen_id}']`).cloneNode(true);
                    undoList.push({ mode: 'move', object1: object1, object2: object2 });
                    redoUndoStatus('undo', true);
                    con.invoke('UpdateObjectInList', { id: choosen_id, object: getString($query(`[id='${choosen_id}']`)) });
                } else if (resize && selected_css_value) { // resize
                    let scale = { x: selected_css_value[0], y: selected_css_value[3] };
                    object1 = $choosen_id.cloneNode(true);

                    switch ($choosen_id.tagName) {
                        case 'path':
                            let new_coord, initial_position;
                            const coord = $choosen_id.getAttribute('d').substring(1).split("Q");

                            for (let i of coord) {
                                let coord_xy = i.split(",").map(parseFloat);
                                if (!initial_position) initial_position = { x: coord_xy[0], y: coord_xy[1] };
                                else switch (resize_angle) {
                                    case "resize_e": case "resize_s": case "resize_se":
                                        initial_position = { x: Math.min(initial_position.x, coord_xy[0], coord_xy[2]), y: Math.min(initial_position.y, coord_xy[1], coord_xy[3]) };
                                        break;
                                    case "resize_w": case "resize_n": case "resize_nw":
                                        initial_position = { x: Math.max(initial_position.x, coord_xy[0], coord_xy[2]), y: Math.max(initial_position.y, coord_xy[1], coord_xy[3]) };
                                        break;
                                    case "resize_ne":
                                        initial_position = { x: Math.min(initial_position.x, coord_xy[0], coord_xy[2]), y: Math.max(initial_position.y, coord_xy[1], coord_xy[3]) };
                                        break;
                                    case "resize_sw":
                                        initial_position = { x: Math.max(initial_position.x, coord_xy[0], coord_xy[2]), y: Math.min(initial_position.y, coord_xy[1], coord_xy[3]) };
                                        break;
                                }
                            }
                            initial_position = { x: initial_position.x * scale.x - initial_position.x, y: initial_position.y * scale.y - initial_position.y };
                            for (let i of coord) {
                                let coord_xy = i.split(",").map(parseFloat);
                                !new_coord ?
                                    new_coord = `M${simplifyNumber(coord_xy[0] * scale.x - initial_position.x)},${simplifyNumber(coord_xy[1] * scale.y - initial_position.y)}` :
                                    new_coord += `Q${simplifyNumber(coord_xy[0] * scale.x - initial_position.x)},${simplifyNumber(coord_xy[1] * scale.y - initial_position.y)},${simplifyNumber(coord_xy[2] * scale.x - initial_position.x)},${simplifyNumber(coord_xy[3] * scale.y - initial_position.y)}`;
                            }
                            $choosen_id.setAttribute('d', new_coord);
                            con.invoke('MoveObject', 'path', { id: choosen_id, d: new_coord });
                            break;
                        case 'rect':
                            const rect_info = $choosen_id.getBBox();

                            if (resize_angle == "resize_w" || resize_angle == "resize_sw")
                                rect_info.x = rect_info.x - (rect_info.width * scale.x - rect_info.width);
                            else if (resize_angle == "resize_n" || resize_angle == "resize_ne")
                                rect_info.y = rect_info.y - (rect_info.height * scale.y - rect_info.height);
                            else if (resize_angle == "resize_nw") {
                                rect_info.x = rect_info.x - (rect_info.width * scale.x - rect_info.width);
                                rect_info.y = rect_info.y - (rect_info.height * scale.y - rect_info.height);
                            }

                            $choosen_id.setAttribute('x', rect_info.x + position.x);
                            $choosen_id.setAttribute('y', rect_info.y + position.y);
                            $choosen_id.setAttribute('width', rect_info.width * scale.x);
                            $choosen_id.setAttribute('height', rect_info.height * scale.y);
                            con.invoke('MoveObject', 'rect', {
                                id: choosen_id,
                                x: $choosen_id.getAttribute('x'), y: $choosen_id.getAttribute('y'),
                                width: $choosen_id.getAttribute('width'), height: $choosen_id.getAttribute('height')
                            }); break;
                        case 'image':
                            const image_info = $choosen_id.getBBox();

                            if (resize_angle == "resize_w" || resize_angle == "resize_sw")
                                image_info.x = image_info.x - (image_info.width * scale.x - image_info.width);
                            else if (resize_angle == "resize_n" || resize_angle == "resize_ne")
                                image_info.y = image_info.y - (image_info.height * scale.y - image_info.height);
                            else if (resize_angle == "resize_nw") {
                                image_info.x = image_info.x - (image_info.width * scale.x - image_info.width);
                                image_info.y = image_info.y - (image_info.height * scale.y - image_info.height);
                            }

                            $choosen_id.setAttribute('x', image_info.x + position.x);
                            $choosen_id.setAttribute('y', image_info.y + position.y);
                            $choosen_id.setAttribute('width', image_info.width * scale.x);
                            $choosen_id.setAttribute('height', image_info.height * scale.y);
                            con.invoke('MoveObject', 'rect', {
                                id: choosen_id,
                                x: $choosen_id.getAttribute('x'),
                                y: $choosen_id.getAttribute('y'),
                                width: $choosen_id.getAttribute('width'),
                                height: $choosen_id.getAttribute('height')
                            }); break;
                        case 'ellipse':
                            const ellipse_info = $choosen_id.getBBox();
                            let circle = { cx: ellipse_info.x + (ellipse_info.width / 2), cy: ellipse_info.y + (ellipse_info.height / 2), rx: ellipse_info.width / 2, ry: ellipse_info.height / 2 };

                            switch (resize_angle) {
                                case "resize_e":
                                    circle.rx = ellipse_info.width * scale.x / 2;
                                    circle.cx = ellipse_info.x + circle.rx;
                                    break;
                                case "resize_s":
                                    circle.ry = ellipse_info.height * scale.y / 2;
                                    circle.cy = ellipse_info.y + circle.ry;
                                    break;
                                case "resize_se":
                                    circle.rx = ellipse_info.width * scale.x / 2;
                                    circle.ry = ellipse_info.height * scale.y / 2;
                                    circle.cx = ellipse_info.x + circle.rx;
                                    circle.cy = ellipse_info.y + circle.ry;
                                    break;
                                case "resize_w":
                                    circle.rx = ellipse_info.width * scale.x / 2;
                                    circle.cx = ellipse_info.x + ellipse_info.width - circle.rx;
                                    break;
                                case "resize_n":
                                    circle.ry = ellipse_info.height * scale.y / 2;
                                    circle.cy = ellipse_info.y + ellipse_info.height - circle.ry;
                                    break;
                                case "resize_nw":
                                    circle.rx = ellipse_info.width * scale.x / 2;
                                    circle.ry = ellipse_info.height * scale.y / 2;
                                    circle.cx = ellipse_info.x + ellipse_info.width - circle.rx;
                                    circle.cy = ellipse_info.y + ellipse_info.height - circle.ry;
                                    break;
                                case "resize_ne":
                                    circle.rx = ellipse_info.width * scale.x / 2;
                                    circle.ry = ellipse_info.height * scale.y / 2;
                                    circle.cx = ellipse_info.x + circle.rx;
                                    circle.cy = ellipse_info.y + ellipse_info.height - circle.ry;
                                    break;
                                case "resize_sw":
                                    circle.rx = ellipse_info.width * scale.x / 2;
                                    circle.ry = ellipse_info.height * scale.y / 2;
                                    circle.cx = ellipse_info.x + ellipse_info.width - circle.rx;
                                    circle.cy = ellipse_info.y + circle.ry;
                                    break;
                            }
                            $choosen_id.setAttribute('cx', circle.cx);
                            $choosen_id.setAttribute('cy', circle.cy);
                            $choosen_id.setAttribute('rx', circle.rx);
                            $choosen_id.setAttribute('ry', circle.ry);
                            con.invoke('MoveObject', 'ellipse', {
                                id: choosen_id,
                                cx: $choosen_id.getAttribute('cx'), cy: $choosen_id.getAttribute('cy'),
                                rx: $choosen_id.getAttribute('rx'), ry: $choosen_id.getAttribute('ry')
                            }); break;
                    }
                    object2 = $query(`[id='${choosen_id}']`).cloneNode(true);
                    undoList.push({ mode: 'move', object1: object1, object2: object2 });
                    redoUndoStatus('undo', true);
                    con.invoke('UpdateObjectInList', { id: choosen_id, object: getString($query(`[id='${choosen_id}']`)) });
                } else if (resize && $query(`[id='${choosen_id}']`).tagName == "line") {
                    popPoint({ x: tempPoint1.x * 1, y: tempPoint1.y * 1 });
                    popPoint({ x: tempPoint2.x * 1, y: tempPoint2.y * 1 });
                    con.invoke('PopPoint', { x: tempPoint1.x * 1, y: tempPoint1.y * 1 });
                    con.invoke('PopPoint', { x: tempPoint2.x * 1, y: tempPoint2.y * 1 });
                    pushPoint({ x: $choosen_id.getAttribute('x1') * 1, y: $choosen_id.getAttribute('y1') * 1 });
                    pushPoint({ x: $choosen_id.getAttribute('x2') * 1, y: $choosen_id.getAttribute('y2') * 1 });
                    con.invoke('PushPoint', { x: $choosen_id.getAttribute('x1') * 1, y: $choosen_id.getAttribute('y1') * 1 });
                    con.invoke('PushPoint', { x: $choosen_id.getAttribute('x2') * 1, y: $choosen_id.getAttribute('y2') * 1 });
                    object2 = $query(`[id='${choosen_id}']`).cloneNode(true);
                    undoList.push({ mode: 'move', object1: object1, object2: object2 });
                    redoUndoStatus('undo', true);
                    con.invoke('UpdateObjectInList', { id: choosen_id, object: getString($query(`[id='${choosen_id}']`)) });
                }

                $query(`[id='${choosen_id}']`).tagName == "line" ?
                    select({ x1: $query(`[id='${choosen_id}']`).getAttribute('x1'), x2: $query(`[id='${choosen_id}']`).getAttribute('x2'), y1: $query(`[id='${choosen_id}']`).getAttribute('y1'), y2: $query(`[id='${choosen_id}']`).getAttribute('y2') }, true) :
                    select($choosen_id.getBBox());
            }
            differentPosition = cursorPosition = tempPoint1 = tempPoint2 = {};
            current_scale = { x: 1, y: 1 };
            position = { x: 0, y: 0 };
            drag = resize = false;
            break;
        case "rect":
            if (e.type == "pointerup" && id) {
                undoList.push({ mode: 'new', object: $query(`[id='${id}']`).cloneNode(true) });
                redoUndoStatus('undo', true);
                con.invoke('InsertObjectIntoList', { id, object: getString($query(`[id='${id}']`)) });
            } break;
        case "circle": // Rectangle & circle
            if (e.type == "pointerup" && id) {
                undoList.push({ mode: 'new', object: $query(`[id='${id}']`).cloneNode(true) });
                redoUndoStatus('undo', true);
                con.invoke('InsertObjectIntoList', { id, object: getString($query(`[id='${id}']`)) });
            } break;
        case "line": // Line
            if (e.type == "pointerup") {
                let newPoint = { x: simplifyNumber(current_position.x) * 1, y: simplifyNumber(current_position.y) * 1 };
                // Update hub point
                let tempCursorPosition = { x: simplifyNumber(cursorPosition.x) * 1, y: simplifyNumber(cursorPosition.y) * 1 };
                pushPoint(tempCursorPosition); pushPoint(newPoint);
                con.invoke("PushPoint", tempCursorPosition); con.invoke("PushPoint", newPoint);

                if (id != null) {
                    undoList.push({ mode: 'new', object: $query(`[id='${id}']`).cloneNode(true) });
                    redoUndoStatus('undo', true);
                    con.invoke('InsertObjectIntoList', { id, object: getString($query(`[id='${id}']`)) });
                }
            } break;
    }
};

// Zoom in & out
$query("#content").onmousewheel = e => {
    if (e.ctrlKey) {
        e.preventDefault();

        if (e.wheelDelta / 120 > 0 && svgScale < 3) svgScale += 0.05
        else if (svgScale >= 0.2) svgScale -= 0.05

        svgDraw.setAttribute("width", simplifyNumber(1052 * svgScale));
        svgDraw.setAttribute("height", simplifyNumber(744 * svgScale));

        $query('#svgScale').innerText = `${(svgScale * 100).toFixed(0)}%`;
    }
};

document.body.onkeydown = function(e) {
  if (e.ctrlKey && e.keyCode == '90' || e.ctrlKey && e.keyCode == '89') {
    e.preventDefault();
  }
}
document.addEventListener("keydown", e => {
    if (e.keyCode == 8 || e.keyCode == 46 && choosen_id) {
        undoList.push({ mode: 'remove', object: $query(`[id='${choosen_id}']`) });
        redoUndoStatus('undo', true);
        removeObject(choosen_id);
        con.invoke('RemoveObject', choosen_id);
        select();
    } else if (e.ctrlKey && e.keyCode == '90' && !e.repeat) {
         select(); undo();
    } else if (e.ctrlKey && e.keyCode == '89' && !e.repeat) {
         select(); redo();
    } else if (e.keyCode == 32) {
        space = true;
        svgDraw.setAttribute("style", "cursor: grab");
    } else if (e.keyCode == 13) $query('#drawName').blur();
}, passiveSupport ? { capture: true, passive: true } : { capture: true });

// Grab ========================================================================================
document.addEventListener("keyup", e => {
    if (e.keyCode == 32) {
        if (svgDraw.getAttribute("style")) svgDraw.removeAttribute("style");
        space = false;
    }
}, passiveSupport ? { capture: true, passive: true } : { capture: true });

document.onpointerup = e => {
    e.preventDefault();
    grab = false;
    if (svgDraw.getAttribute("style")) svgDraw.removeAttribute("style");

    if (app.type == "pen") {
        id = null;
        coordinates = [];
    }
    else {
        differentPosition = cursorPosition = {};
        newPath = id = null;
    }
};

$query('#undo').onpointerdown = e => {
    if (undoList.length == 0) return;
    select(); undo();
}

$query('#redo').onpointerdown = e => {
    if (redoList.length == 0) return;
    select(); redo();
}

$query('#file').onchange = async (e) => {
    let f = e.target.files[0];
    let svg = svgDraw.getAttribute("viewBox").split(" ");
    if (f && f.type.startsWith('image/')) {
        if (f.size > 2000000) {
            alert("The image cannot exceed 2MB");
        } else {
            let url = await fit(f, svg[2], svg[3], 'dataURL', 'image/webp');
            let id = uuidv4();
            insertImage(id, url.dataURL, { x: 0, y: 0 }, { x: url.nw, y: url.nh });
            con.invoke('InsertObjectIntoList', { id, object: getString($query(`[id='${id}']`)) });
            con.invoke('InsertImage', id, url.dataURL, { x: 0, y: 0 }, { x: url.nw, y: url.nh });
            undoList.push({ mode: 'new', object: $query(`[id='${id}']`).cloneNode(true) });
            redoUndoStatus('redo');
        }

    }
    else {
        alert("Only image is allowed");
    }
    e.target.value = null;
}

$query("#save input").onclick = async () => {
    let cloneSvg = svgDraw.cloneNode(true);
    cloneSvg.querySelectorAll('g').forEach(n => n.remove());
    let svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3508 2480">${cloneSvg.innerHTML}</svg>`;
    let canvas = document.createElement("canvas");
    canvas.width = 3508; canvas.height = 2480;
    let ctx = canvas.getContext("2d");
    let DOMURL = self.URL || self.webkitURL || self;
    let img = new Image();
    let svg = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    let url = DOMURL.createObjectURL(svg);
    img.addEventListener("load", () => {
        ctx.drawImage(img, 0, 0);
        let png = canvas.toDataURL("image/png");
        let downloadLink = document.createElement("a");
        downloadLink.href = png;
        downloadLink.download = "juzdraw.png";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        DOMURL.revokeObjectURL(png);
    }, { once: true });
    img.src = url;
}

$query("#clear").onclick = () => {
    reset();
    redoUndoStatus('undo');
    redoUndoStatus('redo');
    con.invoke('Reset');
};

$query("#remove input").onclick = () => {
    if (!choosen_id) return;
    undoList.push({ mode: 'remove', object: $query(`[id='${choosen_id}']`) });
    redoUndoStatus('undo', true);
    removeObject(choosen_id);
    con.invoke('RemoveObject', choosen_id);
    select();
}
/* ==================================== Update by frame ====================================== */
// let rgb_H = 0;
// let secondsPassed, oldTimeStamp, fps;

// window.requestAnimationFrame(update); // update by frame
// function update(timeStamp) {
//     // Calculate the number of seconds passed since the last frame
//     secondsPassed = (timeStamp - oldTimeStamp) / 1000;
//     oldTimeStamp = timeStamp;

//     fps = Math.round(1 / secondsPassed); // Calculate fps

//     if (fps > 20) { // Display fps
//         $query(`#fps`).innerHTML = fps;
//         $query(`#fps`).style.color = "green";
//     } else {
//         $query(`#fps`).innerHTML = fps;
//         $query(`#fps`).style.color = "red";
//     }

//     window.requestAnimationFrame(update);
// }

/* ==================================== Function ====================================== */
function passiveSupport() {
    let passiveSupported = false;
    try {
        const options = {
            get passive() { // This function will be called when the browser
                //   attempts to access the passive property.
                passiveSupported = true;
            }
        };
        window.addEventListener("test", null, options);
        window.removeEventListener("test", null, options);
    } catch (err) { passiveSupported = false };
    return passiveSupported;
}

function $query(selector) {
    if (document.querySelectorAll(selector).length == 1) return document.querySelector(selector);
    else if (document.querySelectorAll(selector).length > 1) return document.querySelectorAll(selector);
    else return null;
}

function menu(value) {
    app.type = value;
    let children = $query('#type').children;
    for (let i = 0; i < children.length; i++) children[i].classList.remove('typeActive');
    $query(`#${value}`).classList.add('typeActive');
    select();
}

// Convert the DOM to string
let getString = (function () {
    let DIV = document.createElement("div");

    if ('outerHTML' in DIV) return function (node) { return node.outerHTML; };
    return function (node) {
        let div = DIV.cloneNode();
        div.appendChild(node.cloneNode(true));
        return div.innerHTML;
    };
})();

function simplifyNumber(n) {
    if (isNaN(n)) return;
    return Number(n).toFixed(2) % 1 != 0 ? Number(n).toFixed(2) : Number(n).toFixed(0);
}

function uuidv4() { // ID generator
    return ([1e7] + 1e3 + 4e3 + 8e3 + 1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

function comparePoint(cursor) { // Get the nearest point
    if (!points) return null;
    for (let point of points)
        if (cursor.x >= point.x - 10 && cursor.x <= point.x + 10 &&
            cursor.y >= point.y - 10 && cursor.y <= point.y + 10) return point;
}

function selectLine(id, box) {
    let $line = $query(`[id='${id}']`);
    if ($line && Object.entries(box) != 0) {
        if (resize_angle == "line_x1") {
            let point = $query("#line_x1");
            point.x.baseVal.value = box.x - 20;
            point.y.baseVal.value = box.y - 20;
        } else {
            let point = $query("#line_x2");
            point.x.baseVal.value = box.x - 20;
            point.y.baseVal.value = box.y - 20;
        }
    }
}

function select(box, line = false) {
    if ($query('#resize_wrap')) svgDraw.removeChild($query('#resize_wrap'));
    if ($query('#line_edit')) svgDraw.removeChild($query('#line_edit'));
    if (!box) { choosen_id = null; return; }
    let border = "";
    if (!line) {
        border = `
        <g id="resize_wrap">
        <rect id="resize_border" class='notMoveable' fill="none" stroke="blue" stroke-width="1px" x="${box.x - 25}" y="${box.y - 25}" width="${box.width + 50}" height="${box.height + 50}" />
        <rect id="resize_nw" class="notMoveable" stroke-width="10" width="1" height="1" x="${box.x - 25}" y="${box.y - 25}" style="cursor:nw-resize"/>
        <rect id="resize_n" class='notMoveable' stroke-width="10" width="1" height="1" x="${box.x + (box.width / 2)}" y="${box.y - 26}" style="cursor:n-resize" />
        <rect id="resize_ne" class='notMoveable' stroke-width="10" width="1" height="1" x="${box.x + box.width + 25}" y="${box.y - 25}" style="cursor:ne-resize" />
        <rect id="resize_e" class='notMoveable' stroke-width="10" width="1" height="1" x="${box.x + box.width + 26}" y="${box.y + (box.height / 2)}" style="cursor:e-resize"/>
        <rect id="resize_se" class='notMoveable' stroke-width="10" width="1" height="1" x="${box.x + box.width + 25}" y="${box.y + box.height + 25}" style="cursor:se-resize" />
        <rect id="resize_s" class='notMoveable' stroke-width="10" width="1" height="1"  x="${box.x + (box.width / 2)}" y="${box.y + box.height + 26}" style="cursor:s-resize"/>
        <rect id="resize_sw" class='notMoveable' stroke-width="10" width="1" height="1" x="${box.x - 25}" y="${box.y + box.height + 25}" style="cursor:sw-resize"/>
        <rect id="resize_w" class='notMoveable' stroke-width="10" width="1" height="1" x="${box.x - 26}" y="${box.y + (box.height / 2)}" style="cursor:w-resize"/>
        </g>`;
        $query('#xcoord').innerHTML = simplifyNumber(box.x);
        $query('#ycoord').innerHTML = simplifyNumber(box.y);
    } else {
        border = `
        <g id="line_edit">
        <rect id="line_x1" class='notMoveable' width="40" height="40" x="${box.x1 - 20}" y="${box.y1 - 20}" style="cursor:move" />
        <rect id="line_x2" class='notMoveable' width="40" height="40" x="${box.x2 - 20}" y="${box.y2 - 20}" style="cursor:move"/>
        </g>`;
        $query('#xcoord').innerHTML = simplifyNumber(box.x1 - 20);
        $query('#ycoord').innerHTML = simplifyNumber(box.y1 - 20);
    }
    svgDraw.insertAdjacentHTML('beforeend', border);
   
}

function redoUndoStatus(event, con = false) {    // event = undo/redo     con true mean no need to set the list to empty
    if (event == null) return;
    if (event == "undo") {
        $query('#undo').classList.remove('btnAble');
        $query('#undo').classList.remove('btnDisable');
        con ? $query('#undo').classList.add('btnAble') : undoList = [];
    } else if (event == "redo") {
        $query('#redo').classList.remove('btnAble');
        $query('#redo').classList.remove('btnDisable');
        con ? $query('#redo').classList.add('btnAble') : redoList = [];
    }
}

/*======================================================== Drawing Function ======================================================= */
let mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

function insertImage(id, url, point, box) {
    let newPath = document.createElementNS("http://www.w3.org/2000/svg", "image");
    newPath.id = id;
    newPath.href.baseVal = url
    newPath.x.baseVal.value = point.x;
    newPath.y.baseVal.value = point.y
    newPath.width.baseVal.value = box.x;
    newPath.height.baseVal.value = box.y;
    newPath.setAttribute('preserveAspectRatio', 'none');
    svgDraw.appendChild(newPath);
}

function startDraw(id, point, color, size, fill) {
    let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.id = id;
    path.setAttribute('d', `M${simplifyNumber(point.x)},${simplifyNumber(point.y)}`);
    path.setAttribute("stroke", color);
    path.setAttribute("fill", fill);
    path.setAttribute("stroke-width", `${size}px`);
    svgDraw.appendChild(path);
}

function draw(id, pointA, pointB) {
    return Promise.resolve().then(() => {
        let path = $query(`[id='${id}']`);
        path.setAttribute('d',
            `${path.getAttribute('d')}Q${simplifyNumber(pointA.x)},${simplifyNumber(pointA.y)},${simplifyNumber(pointB.x)},${simplifyNumber((pointB.y))}`
        );
        svgDraw.appendChild(path);
    });
}

function startRect(id, point, color, size, fill) {
    let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.id = id;
    rect.x.baseVal.value = simplifyNumber(point.x);
    rect.y.baseVal.value = simplifyNumber(point.y);
    rect.setAttribute("stroke", color);
    rect.setAttribute("fill", fill);
    rect.setAttribute("stroke-width", size + "px");
    svgDraw.appendChild(rect);
}

function drawRect(id, point, box) {
    let rect = $query(`[id='${id}']`);
    rect.x.baseVal.value = simplifyNumber(point.x);
    rect.y.baseVal.value = simplifyNumber(point.y);
    rect.width.baseVal.value = simplifyNumber(box.x);
    rect.height.baseVal.value = simplifyNumber(box.y);
}

function startCircle(id, point, color, size, fill) { // ID,point,color,size,fillColor
    let circle = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    circle.id = id;
    circle.cx.baseVal.value = simplifyNumber(point.x);
    circle.cy.baseVal.value = simplifyNumber(point.y);
    circle.setAttribute('stroke', color);
    circle.setAttribute("fill", fill);
    circle.setAttribute('stroke-width', size + "px");
    svgDraw.appendChild(circle); // add into svg
}

function drawCircle(id, point, box) {
    let circle = $query(`[id='${id}']`);
    circle.rx.baseVal.value = simplifyNumber(box.x);
    circle.ry.baseVal.value = simplifyNumber(box.y);
    circle.cx.baseVal.value = simplifyNumber(point.x);
    circle.cy.baseVal.value = simplifyNumber(point.y);
}

function drawLine(id, point, point2, color, size) {
    let path = $query(`[id='${id}']`);
    if (!path) {
        path = document.createElementNS("http://www.w3.org/2000/svg", "line");
        path.id = id
        path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', size);
        path.x1.baseVal.value = simplifyNumber(point.x);
        path.y1.baseVal.value = simplifyNumber(point.y);
    }
    path.x2.baseVal.value = simplifyNumber(point2.x);
    path.y2.baseVal.value = simplifyNumber(point2.y);
    svgDraw.appendChild(path);
}

let pushPoint = (point) => points.push(point);
let popPoint = (point) => points = points.filter(o => o.x != point.x * 1 && o.y != point.y * 1);

function removeObject(id, condition = false) { // Remove object
    if ($query(`[id='${id}']`)?.tagName == 'line') {
        popPoint({ x: $query(`[id='${id}']`).getAttribute('x1') * 1, y: $query(`[id='${id}']`).getAttribute('y1') * 1 });
        popPoint({ x: $query(`[id='${id}']`).getAttribute('x2') * 1, y: $query(`[id='${id}']`).getAttribute('y2') * 1 });
        con.invoke('PopPoint', { x: $query(`[id='${id}']`).getAttribute('x1') * 1, y: $query(`[id='${id}']`).getAttribute('y1') * 1 });
        con.invoke('PopPoint', { x: $query(`[id='${id}']`).getAttribute('x2') * 1, y: $query(`[id='${id}']`).getAttribute('y2') * 1 });
    }
    $query(`[id='${id}']`).remove();
    if (condition) select();
}

function reset() {    // Reset svg
    svgDraw.innerHTML = `<g><defs><pattern id="smallGrid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24,0L0,0,0,24" fill="none" stroke="#cccccc" stroke-width="1" /></pattern><pattern id="grid" width="240" height="240" patternUnits="userSpaceOnUse"><rect width="240" height="240" fill="url(#smallGrid)" /><path d="M240,0L0,0,0,240" fill="none" stroke="#cccccc" stroke-width="2" /></pattern></defs><rect width="100%" height="100%" fill="white" class="notMoveable" /><rect id="bg_grid" width="100%" height="100%" fill="url(#grid)" class="notMoveable" /></g><g id="cursors"></g>`;
    select();
}

let create = (object) => svgDraw.appendChild(object);

function moveObject(tag, object) {
    if (choosen_id == object.id) select();
    switch (tag) {
        case 'path': $query(`[id='${object.id}']`).setAttribute('d', object.d); break;
        case 'ellipse':
            if (object.cx && object.cy) {
                $query(`[id='${object.id}']`).setAttribute('cx', object.cx);
                $query(`[id='${object.id}']`).setAttribute('cy', object.cy);
            }
            if (object.rx && object.ry) {
                $query(`[id='${object.id}']`).setAttribute('rx', object.rx);
                $query(`[id='${object.id}']`).setAttribute('ry', object.ry);
            }
            break;
        case 'rect':
            if (object.x && object.y) {
                $query(`[id='${object.id}']`).setAttribute('x', object.x);
                $query(`[id='${object.id}']`).setAttribute('y', object.y);
            }
            if (object.width && object.height) {
                $query(`[id='${object.id}']`).setAttribute('width', object.width);
                $query(`[id='${object.id}']`).setAttribute('height', object.height);
            }
            break;
        case 'image':
            if (object.x && object.y) {
                $query(`[id='${object.id}']`).setAttribute('x', object.x);
                $query(`[id='${object.id}']`).setAttribute('y', object.y);
            }
            if (object.width && object.height) {
                $query(`[id='${object.id}']`).setAttribute('width', object.width);
                $query(`[id='${object.id}']`).setAttribute('height', object.height);
            }
            break;
        case 'line':
            if (object.x1 && object.y1) {
                $query(`[id='${object.id}']`).setAttribute('x1', object.x1);
                $query(`[id='${object.id}']`).setAttribute('y1', object.y1);
            }
            if (object.x2 && object.y2) {
                $query(`[id='${object.id}']`).setAttribute('x2', object.x2);
                $query(`[id='${object.id}']`).setAttribute('y2', object.y2);
            }
            break;
    }
}

// Undo event trigger
function undo() { // Everytime will push {event:,object:}  
    if (undoList.length == 0) return;
    let temp = undoList.pop();
    if (temp.mode == 'new') {
        let tempId = temp.object.getAttribute('id');
        removeObject(tempId);
        con.invoke('RemoveObject', tempId);
    } else if (temp.mode == 'move') {
        let firstId = temp.object1.getAttribute('id');
        let secondId = temp.object2.getAttribute('id');
        if (firstId == secondId) {
            removeObject(firstId);
            con.invoke('RemoveObject', firstId);
            svgDraw.appendChild(temp.object1);
            con.invoke('Create', getString(temp.object1));
        }
    } else if (temp.mode == 'remove') {
        svgDraw.appendChild(temp.object);
        con.invoke('Create', getString(temp.object));
    }
    redoList.push(temp);
    if (undoList.length == 0) redoUndoStatus('undo');
    redoUndoStatus('redo', true);
}

// Redo event trigger
function redo() {
    if (redoList.length == 0) return;
    let temp = redoList.pop();
    if (temp.mode == 'new') {
        svgDraw.appendChild(temp.object);
        con.invoke('Create', getString(temp.object).replace(/\"/gi, "\'"));
    } else if (temp.mode == 'move') {
        let firstId = temp.object1.getAttribute('id');
        let secondId = temp.object2.getAttribute('id');
        if (firstId == secondId) {
            removeObject(firstId);
            con.invoke('RemoveObject', firstId);
            svgDraw.appendChild(temp.object2);
            con.invoke('Create', getString(temp.object2));
            console.log(temp.object1);
            console.log(temp.object2);
        }
    } else if (temp.mode == 'remove') {
        let tempId = temp.object.getAttribute('id');
        removeObject(tempId);
        con.invoke('RemoveObject', tempId);
    }
    undoList.push(temp);
    redoUndoStatus('undo', true);
    if (redoList.length == 0) redoUndoStatus('redo');
}

function createObject(stringObject) {
    return new Promise((resolve, reject) => {
        let newObject = new DOMParser().parseFromString(stringObject, "image/svg+xml").firstChild;
        switch (newObject.tagName) {
            case 'path':
                let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                path.setAttribute('id', newObject.getAttribute('id'));
                path.setAttribute('d', newObject.getAttribute('d'));
                path.setAttribute("fill", newObject.getAttribute('fill'));
                path.setAttribute("stroke", newObject.getAttribute('stroke'));
                path.setAttribute("stroke-width", newObject.getAttribute('stroke-width'));
                svgDraw.appendChild(path); break;
            case 'ellipse':
                let circle = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
                circle.setAttribute('id', newObject.getAttribute('id'));
                circle.setAttribute('cx', newObject.getAttribute('cx'));
                circle.setAttribute('cy', newObject.getAttribute('cy'));
                circle.setAttribute('rx', newObject.getAttribute('rx'));
                circle.setAttribute('ry', newObject.getAttribute('ry'));
                circle.setAttribute("fill", newObject.getAttribute('fill'));
                circle.setAttribute('stroke', newObject.getAttribute('stroke'));
                circle.setAttribute('stroke-width', newObject.getAttribute('stroke-width'));
                svgDraw.appendChild(circle); break;
            case 'rect':
                let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                rect.setAttribute('id', newObject.getAttribute('id'));
                rect.setAttribute("stroke", newObject.getAttribute('stroke'));
                rect.setAttribute("stroke-width", newObject.getAttribute('stroke-width'));
                rect.setAttribute('x', newObject.getAttribute('x'));
                rect.setAttribute('y', newObject.getAttribute('y'));
                rect.setAttribute("fill", newObject.getAttribute('fill'));
                rect.setAttribute('width', newObject.getAttribute('width'));
                rect.setAttribute('height', newObject.getAttribute('height'));
                svgDraw.appendChild(rect); break;
            case 'line':
                let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                line.setAttribute('id', newObject.getAttribute('id'));
                line.setAttribute('x1', newObject.getAttribute('x1'));
                line.setAttribute('y1', newObject.getAttribute('y1'));
                line.setAttribute('x2', newObject.getAttribute('x2'));
                line.setAttribute('y2', newObject.getAttribute('y2'));
                line.setAttribute('stroke', newObject.getAttribute('stroke'));
                line.setAttribute('stroke-width', newObject.getAttribute('stroke-width'));
                line.setAttribute("fill", newObject.getAttribute('fill'));
                svgDraw.appendChild(line); break;
            case 'image':
                let img = document.createElementNS("http://www.w3.org/2000/svg", "image");
                img.setAttribute('id', newObject.getAttribute('id'));
                img.setAttribute('x', newObject.getAttribute('x'));
                img.setAttribute('y', newObject.getAttribute('y'));
                img.setAttribute('href', newObject.getAttribute('href'));
                img.setAttribute('preserveAspectRatio', 'none');
                img.setAttribute('width', newObject.getAttribute('width'));
                img.setAttribute('height', newObject.getAttribute('height'));
                svgDraw.appendChild(img); break;
        }
    });
}

/* ==================================== SVG Coordinate ====================================== */
let pt = svgDraw.createSVGPoint(); // Create an SVGPoint for future math
function cursorPoint(evt) { // Get point in global SVG space
    pt.x = evt.clientX; pt.y = evt.clientY;
    let points = pt.matrixTransform(svgDraw.getScreenCTM().inverse());
    return {
        x: points.x < 0 ? 0 : (points.x > 3508 ? 3508 : points.x),
        y: points.y < 0 ? 0 : (points.y > 2480 ? 2480 : points.y)
    }
}

/* ==================================== Room Validation ====================================== */
const name = sessionStorage.getItem('name');
const roomId = new URL(location).searchParams.get('roomId');
if (!roomId) {
    location = 'list.html';
    throw 'ERROR: Invalid game id';
}
if (!name) {
    location = 'main.html?';
    throw 'ERROR: Invalid name';
}

/* ==================================== Hub Configuration ====================================== */
const con = new signalR.HubConnectionBuilder()
    .withUrl(`/hub?page=draw&name=${name}&roomId=${roomId}`)
    .withAutomaticReconnect()
    .build();

con.onclose(err => {
    alert("Disconnect");
    location = 'main.html?';
});

// Receive the server-side function
con.on('StartDraw', startDraw);
con.on('Draw', async (id, pointA, pointB) => await draw(id, pointA, pointB));
con.on('StartRect', startRect);
con.on('DrawRect', drawRect);
con.on('StartCircle', startCircle);
con.on('DrawCircle', drawCircle);
con.on('DrawLine', drawLine);
con.on('PushPoint', pushPoint);
con.on('RemoveObject', id => removeObject(id, true));
con.on('Reset', reset);
con.on('MoveObject', moveObject);
con.on('Create', createObject);
con.on('PopPoint', popPoint);
con.on('InsertImage', insertImage);
con.on('UpdateName',(name)=>$query('#drawName').value = name);

// User connection ===========================================================
con.on('UserJoin', (user) => {
    user = JSON.parse(user);
    document.getElementById("status").hidden = false;
    document.getElementById("status").innerHTML = `<b>${user.Name}</b> Join`;

    setTimeout(() => {
        document.getElementById("status").hidden = true;
    }, 3000);
});

con.on("UserLeft", user => {
    user = JSON.parse(user);
    document.getElementById("status").hidden = false;
    document.getElementById("status").innerHTML = `<b>${user.Name}</b> Left`;

    setTimeout(() => {
        document.getElementById("status").hidden = true;
    }, 3000);
    removeObject(user.Id, true);
});

// Update all user cursor ====================================================
con.on('UpdateCursor', (id, position, color) => Promise.resolve().then(() => {
    let path = $query(`#cursors [id='${id}']`);
    if (!path) {
        $query('#cursors').insertAdjacentHTML('beforeend', `
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" id="${id}" x="${position.x}" y="${position.y}">
                 <path class="notMovable" fill="${color}" d="M4 0l16 12.279-6.951 1.17 4.325 8.817-3.596 1.734-4.35-8.879-5.428 4.702z" />
            </svg>
            `);
    }
    else {
        path.x.baseVal.value = position.x;
        path.y.baseVal.value = position.y;
    }
    svgDraw.appendChild($query("#cursors"));
}));

// Update the user list inside the room
con.on('UpdateUserList', (user_list) => {
    let top = 0, count = 0, stringHTML = "";
    JSON.parse(user_list).forEach(user => {
        stringHTML += `
            <div class="userlist" title="${user.Name}" style="top:${top}px; background-color: ${user.Color}" >${user.Name.toString().charAt(0).toUpperCase()}</div>
        `;
        top += 50;
        count++;
    })
    $query('#users').innerHTML = stringHTML;
    $query('#userNo').innerHTML = count;
});

// Restore back the drawing 
con.on('Restore', (drawName, drawObject, point) => Promise.resolve().then(() => {
    $query('#drawName').value = drawName;
    JSON.parse(drawObject).forEach(draw => createObject(draw.Object));
    JSON.parse(point).forEach(p => points.push({ x: p.X, y: p.Y }));
}));

// Redirect to list page
con.on('Reject', () => location = 'list.html');

con.start().then(e => {
    menu('pen');
    $query('#main').hidden = false;
    $query('#connectionStatus').hidden = true;
    // initial svg draw position
    svgDraw.setAttribute("width", 1052);
    svgDraw.setAttribute("height", 744);
    svgDraw.setAttribute("x", (window.screen.width - svgDraw.getAttribute("width")) / 2);
    svgDraw.setAttribute("y", 10);

    $query('#svgScale').innerText = `${svgScale * 100}%`;

    app.size = $query('#size').value;
    app.color = $query('#color').value;
    app.fill = $query('#fill').value == "#ffffff" ? "transparent" : $query('#fill').value;

    $query('#preview').style.width = `${app.size}px`;
    $query('#preview').style.height = `${app.size}px`;
    $query('#preview').style.border = `1px solid ${app.color}`;
    $query('#preview').style.background = `${app.fill}`;

    svgDraw.addEventListener("pointermove", e => {
        let current_position = cursorPoint(e);
        con.invoke("UpdateCursor", { X: current_position.x, Y: current_position.y });
    }, passiveSupport ? { passive: true } : false);
});

con.onreconnecting(() => {
    console.assert(con.state === signalR.HubConnectionState.Reconnecting);
    $query('#connectionStatus').hidden = false;
    $query('#connectionStatus').innerText = "Reconnecting...";
});

con.onreconnected(() => {
    console.assert(con.state === signalR.HubConnectionState.Connected);
    $query('#connectionStatus').innerText = "Reconnected!";
    setTimeout(() => $query('#connectionStatus').hidden = true, 2000);
});