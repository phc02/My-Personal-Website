AMapLoader.load({
    key: "ed25e2802d8ad083b743d3a3ad44b965",
    version: "2.0", 
    plugins: ["AMap.ControlBar", "AMap.GeoJSON", "AMap.MoveAnimation"],
    Loca: {
        version: '2.0.0'
    }
}).then((AMap) => {
    const map = new AMap.Map("container", {
        viewMode: '3D',
        pitch: 65,                 
        pitchEnable: true,
        rotateEnable: true,
        rotation: 30,               
        zoom: 12.7,                
        zooms: [8, 18],
        center: [114.065, 30.345], 
        mapStyle: "amap://styles/8e0485035d59a33f9c154d3404da9c2f", 
        skyColor: '#0B0E12',
        showFog: false,
        showBuildingBlock: true, 
        features: ['bg', 'road', 'building', 'point'] 
    });

    window.__M7_DEMO_MAP__=map;
    map.on('complete',()=>{window.__M7_DEMO_READY__=true;parent.postMessage({type:'m7-demo-ready'},'*');document.querySelector('.demo-connection-state')?.remove();});
    const buildingLayer = new AMap.Buildings({ zooms: [17, 18], zIndex: 17 });
    map.add(buildingLayer);

    map.addControl(new AMap.ControlBar({
        position: { right: '10px', top: '10px' },
        showZoomBar: false,
        showControlButton: true
    }));

    const labelsLayer = new AMap.LabelsLayer({ zIndex: 1000, collision: false, animation: false });
    map.add(labelsLayer);

    const allPolygons = [];
    const labelsData = [];
    const districtControllers = [];

    labelsLayer.add(new AMap.LabelMarker({ position: M7_COORDS, zooms: [2, 9.2], icon: { type: 'image', image: ICONS.m7Dot, size: [24, 24], anchor: 'center' } }));
    labelsLayer.add(new AMap.LabelMarker({ position: M7_COORDS, zooms: [14.0001, 20], icon: { type: 'image', image: ICONS.m7Dot, size: [24, 24], anchor: 'center' } }));

    const m7ContentDom = document.createElement('div');
    m7ContentDom.className = 'm7-marker-container';
    m7ContentDom.innerHTML = TEMPLATES.m7Content;
    // 【层级调整】小米M7工厂 设为顶层 300
    const m7Marker = new AMap.Marker({ position: M7_COORDS, content: m7ContentDom, anchor: 'bottom-center', offset: new AMap.Pixel(0, 0), zooms: [9.2001, 15], zIndex: 300 });
    labelsData.push({ marker: m7Marker, dom: m7ContentDom, type: 'm7', radius: 90, textCenterY: 210 });

    const geojsonMap = {
        '汉南区': './汉南区供应商区域.geojson',
        '蔡甸区': './蔡甸区供应商区域.geojson',
        '洪山区': './洪山区供应商区域.geojson'
    };

    const searchPromises = targetDistricts.map(districtObj => {
        return (window.__M7_LOCAL_GEOJSON__?.[geojsonMap[districtObj.name].slice(2)] ? Promise.resolve(window.__M7_LOCAL_GEOJSON__[geojsonMap[districtObj.name].slice(2)]) : fetch(geojsonMap[districtObj.name]).then(response => response.json()))
            .then(geojsonData => {
                const boundaries = [];
                geojsonData.features.forEach(feature => {
                    if (!feature.geometry) return;
                    if (feature.geometry.type === 'Polygon') {
                        boundaries.push(feature.geometry.coordinates[0]);
                    } else if (feature.geometry.type === 'MultiPolygon') {
                        feature.geometry.coordinates.forEach(poly => boundaries.push(poly[0]));
                    }
                });

                if (boundaries.length > 0) {
                    const currentDistrictDefaultPolygons = [];
                    const currentDistrictHoverPolygons = [];
                    const targetLayer2s = []; 
                    const targetLayer3s = [];

                    let isHovered = false;
                    let hoverTimer = null;

                    const handleMouseOver = () => {
                        if (map.getZoom() > 17) return; 
                        clearTimeout(hoverTimer);
                        if (!isHovered) {
                            isHovered = true;
                            currentDistrictDefaultPolygons.forEach(p => p.hide());
                            currentDistrictHoverPolygons.forEach(p => p.show());
                        }
                    };

                    const handleMouseOut = () => {
                        if (map.getZoom() > 17) return;
                        clearTimeout(hoverTimer);
                        hoverTimer = setTimeout(() => {
                            isHovered = false;
                            currentDistrictHoverPolygons.forEach(p => p.hide());
                            currentDistrictDefaultPolygons.forEach(p => p.show());
                        }, 150);
                    };

                    const handlePolygonClick = () => {
                        if (map.getZoom() > 17) return;

                        let targetCenter;
                        if (districtObj.name === '汉南区') targetCenter = [114.068, 30.303];
                        else if (districtObj.name === '蔡甸区') targetCenter = [114.066, 30.412];
                        else if (districtObj.name === '洪山区') targetCenter = [114.157, 30.340];

                        const cameraDuration = 2800; 

                        if (targetCenter) {
                            map.setZoomAndCenter(17, targetCenter, false, cameraDuration);
                            map.setPitch(65, false, cameraDuration);
                        }

                        currentDistrictHoverPolygons.forEach(p => p.hide());
                        currentDistrictDefaultPolygons.forEach(p => p.show());

                        let startTime = null;
                        const animateHeight = (timestamp) => {
                            if (!startTime) startTime = timestamp;
                            const elapsed = timestamp - startTime;

                            let progress2 = Math.min(elapsed / 2200, 1);
                            const ease2 = 1 - Math.pow(1 - progress2, 3); 

                            let progress3 = Math.max(0, Math.min((elapsed - 500) / 2200, 1));
                            const ease3 = 1 - Math.pow(1 - progress3, 3);

                            targetLayer2s.forEach(p => {
                                let ext = p.getExtData();
                                let currentH = 20 + (200 - 20) * ease2; 
                                p.setPath(ext.basePath.map(pt => [pt[0], pt[1], currentH]));
                                ext.currentHeight = currentH;
                                p.setExtData(ext);
                            });

                            targetLayer3s.forEach(p => {
                                let ext = p.getExtData();
                                let currentH = 40 + (400 - 40) * ease3; 
                                p.setPath(ext.basePath.map(pt => [pt[0], pt[1], currentH]));
                                ext.currentHeight = currentH;
                                p.setExtData(ext);
                            });

                            if (elapsed < 2900) {
                                requestAnimationFrame(animateHeight);
                            }
                        };
                        requestAnimationFrame(animateHeight);
                    };

                    for (var i = 0; i < boundaries.length; i++) {
                        var path = boundaries[i];
                        var path1 = path.map(pt => [pt[0], pt[1], 0]);
                        var path2 = path.map(pt => [pt[0], pt[1], 20]); 
                        var path3 = path.map(pt => [pt[0], pt[1], 40]); 

                        var layer1 = new AMap.Polygon({ path: path1, strokeColor: '#4FECF7', strokeOpacity: 1.0, strokeWeight: 2, fillColor: '#004FB0', fillOpacity: 0.28, strokeStyle: 'solid', zooms: [8.0001, 20], cursor: 'pointer', extData: { basePath: path } });
                        var layer2 = new AMap.Polygon({ path: path2, strokeColor: '#4FECF7', strokeOpacity: 0.9, strokeWeight: 1, fillColor: '#004FB0', fillOpacity: 0.02, strokeStyle: 'dashed', zooms: [8.0001, 20], cursor: 'pointer', extData: { basePath: path, currentHeight: 20 } });
                        var layer3 = new AMap.Polygon({ path: path3, strokeColor: '#4FECF7', strokeOpacity: 0.6, strokeWeight: 0.5, fillColor: '#004FB0', fillOpacity: 0.02, strokeStyle: 'dashed', zooms: [8.0001, 20], cursor: 'pointer', extData: { basePath: path, currentHeight: 40 } });
                        
                        targetLayer2s.push(layer2);
                        targetLayer3s.push(layer3);

                        [layer1, layer2, layer3].forEach(p => {
                            p.on('mouseover', handleMouseOver);
                            p.on('mouseout', handleMouseOut);
                            p.on('click', handlePolygonClick); 
                        });
                        
                        currentDistrictDefaultPolygons.push(layer1, layer2, layer3);

                        var hovLayerBase = new AMap.Polygon({ path: path1, strokeColor: '#4FECF7', strokeOpacity: 1.0, strokeWeight: 4, fillColor: '#004FB0', fillOpacity: 0.28, strokeStyle: 'solid', zooms: [8.0001, 20], cursor: 'pointer' });
                        hovLayerBase.hide(); 
                        hovLayerBase.on('mouseover', handleMouseOver); 
                        hovLayerBase.on('mouseout', handleMouseOut);
                        hovLayerBase.on('click', handlePolygonClick);
                        currentDistrictHoverPolygons.push(hovLayerBase);
                        
                        for (var j = 1; j <= 19; j++) {
                            var jHeight = j * 20;
                            var hovPath = path.map(pt => [pt[0], pt[1], jHeight]);
                            var hovLayerExt = new AMap.Polygon({ path: hovPath, strokeColor: '#4F87F7', strokeOpacity: parseFloat((1.0 - j * 0.05).toFixed(1)), strokeWeight: 1, fillOpacity: 0, strokeStyle: 'solid', zooms: [8.0001, 20], cursor: 'pointer' });
                            hovLayerExt.hide(); 
                            hovLayerExt.on('mouseover', handleMouseOver); 
                            hovLayerExt.on('mouseout', handleMouseOut);
                            hovLayerExt.on('click', handlePolygonClick); 
                            currentDistrictHoverPolygons.push(hovLayerExt);
                        }
                    }
                    allPolygons.push(...currentDistrictDefaultPolygons, ...currentDistrictHoverPolygons);
                    
                    districtControllers.push({
                        name: districtObj.name,
                        targetLayer2s: targetLayer2s,
                        targetLayer3s: targetLayer3s,
                        currentDistrictDefaultPolygons: currentDistrictDefaultPolygons,
                        currentDistrictHoverPolygons: currentDistrictHoverPolygons
                    });
                }

                let center;
                if (districtObj.name === '汉南区') center = [114.068, 30.303];
                else if (districtObj.name === '蔡甸区') center = [114.066, 30.412];
                else if (districtObj.name === '洪山区') center = [114.157, 30.340];

                if (center) {
                    const markerContent = document.createElement('div');
                    markerContent.className = 'custom-marker';
                    markerContent.innerHTML = TEMPLATES.getDistrictContent(districtObj.name, districtObj.data1, districtObj.data2);
                    
                    // 【层级调整】行政区铭牌 设为顶层 300
                    const marker = new AMap.Marker({ position: center, content: markerContent, anchor: 'bottom-center', offset: new AMap.Pixel(0, 0), zooms: [10, 17], zIndex: 300 });
                    labelsData.push({ marker: marker, dom: markerContent, type: 'district', radius: 25, textCenterY: 95 });
                    labelsLayer.add(new AMap.LabelMarker({ position: center, zooms: [2, 8], icon: { type: 'image', image: ICONS.distDot, size: [12, 12], anchor: 'center' } }));

                    const districtData = DISTRICT_SUPPLIER_COORDS[districtObj.name];
                    if (districtData) {
                        const allSupTasks = [
                            ...districtData.normal.map(coord => ({ pos: coord, isAbnormal: false, name: '' })),
                            ...districtData.abnormal.map(item => ({ pos: item.pos, isAbnormal: true, name: item.name }))
                        ];

                        allSupTasks.forEach((task) => {
                            let supPos = task.pos; 
                            const sDotIcon = task.isAbnormal ? ICONS.supDotAbnorm : ICONS.supDotNorm;

                            labelsLayer.add(new AMap.LabelMarker({ position: supPos, zooms: [8, 10], icon: { type: 'image', image: sDotIcon, size: [6, 6], anchor: 'center' } }));
                            labelsLayer.add(new AMap.LabelMarker({ position: supPos, zooms: [17.0001, 18], icon: { type: 'image', image: sDotIcon, size: [6, 6], anchor: 'center' } }));

                            const supContent = document.createElement('div');
                            supContent.className = 'sup-marker-container';
                            supContent.innerHTML = TEMPLATES.getSupplierContent(task.isAbnormal, task.name);

                            // 【层级调整】异常供应商文案 设为中间层 250
                            const supMarker = new AMap.Marker({ position: supPos, content: supContent, anchor: 'bottom-center', offset: new AMap.Pixel(0, 0), zooms: [10.0001, 17], zIndex: task.isAbnormal ? 250 : 200 });
                            labelsData.push({ marker: supMarker, dom: supContent, type: 'supplier', radius: 10, textCenterY: 0 });
                        });
                    }
                }
            })
            .catch(err => console.error(`Failed to load GeoJSON for ${districtObj.name}:`, err));
    });

    Promise.all(searchPromises).then(() => {
        if (allPolygons.length > 0) map.add(allPolygons);
        const markersToAdd = labelsData.map(d => d.marker);
        if (markersToAdd.length > 0) map.add(markersToAdd);
        triggerLayoutUpdate();
        
        // 生成并在地图上绘制车辆
        initTransportVehicles(map);
        
        setTimeout(() => {
            draw3DGradientBeziers(map);
        }, 500);
    });

    function draw3DGradientBeziers(map) {
        const loca = new window.Loca.Container({
            map: map,
        });

        const startPt = M7_COORDS; // 小米M7工厂
        const targets = [
            [114.068, 30.303], // 汉南区
            [114.066, 30.412], // 蔡甸区
            [114.157, 30.340]  // 洪山区
        ];

        const geojsonFeatures = targets.map((target, index) => {
            return {
                "type": "Feature",
                "properties": { "type": index },
                "geometry": {
                    "type": "LineString",
                    // 1. 互换坐标：从 供应商(target) 发射向 M7工厂(startPt)
                    "coordinates": [ target, startPt ] 
                }
            };
        });

        const geoSource = new window.Loca.GeoJSONSource({
            data: {
                "type": "FeatureCollection",
                "features": geojsonFeatures
            }
        });

        const pulseLink = new window.Loca.PulseLinkLayer({
            zIndex: 200,
            opacity: 1,
            visible: true,
            zooms: [2, 15],
            depth: true 
        });

        pulseLink.setSource(geoSource);
        
        pulseLink.setStyle({
            unit: 'meter',         
            dash: [100, 0, 100, 0], 
            lineWidth: function () {
                // 2. 粗细互换：因为现在起点是供应商，终点是M7
                // 设定为 [10, 40] 确保供应商这头细，M7工厂那头粗
                return [10, 40];    
            },
            height: function (index, feat) {
                return feat.distance / 4 + 4000; 
            },
            smoothSteps: 60,        
            speed: function (index, prop) {
                return 2000 + Math.random() * 1000; 
            },
            flowLength: 3000,       
            lineColors: function (index, feat) {
                // 根据 index 区分路线颜色
                // 假设 index 为 2 (即第三条，洪山区路线) 显示为红色异常状态，前两条为绿色正常状态
                if (index === 2) {
                    // 红色末端渐变 (与异常车辆的 #FF4D4F 色调保持统一)
                    return ['rgba(15, 125, 215, 0.3)', 'rgba(200, 60, 60, 0.6)', 'rgba(255, 77, 79, 1)'];
                } else {
                    // 绿色末端渐变 (与正常车辆的 #00FFCC 色调保持统一)
                    return ['rgba(15, 125, 215, 0.3)', 'rgba(60, 175, 135, 0.6)', 'rgba(0, 255, 204, 1)'];
                }
            },
            // 4. 弧度抛物线最高点互换：
            // 原来是 0.4 (偏向起点的M7)，现在M7变成了终点(1.0)，所以改为 0.6，确保弧形抛物线的重心依然偏向M7工厂
            maxHeightScale: 0.6,    
            headColor: '#FFFFFF',   
            trailColor: 'rgba(15, 125, 215, 0.0)' 
        });

        loca.add(pulseLink);
        loca.animate.start();
    }

    function initTransportVehicles(map) {
        const routes = [
            { end: [114.068, 30.303] }, // 汉南区
            { end: [114.066, 30.412] }, // 蔡甸区
            { end: [114.157, 30.340] }  // 洪山区
        ];

        function getBezierPath(start, end, segments) {
            const path = [];
            const midX = (start[0] + end[0]) / 2;
            const midY = (start[1] + end[1]) / 2;
            const dx = end[0] - start[0];
            const dy = end[1] - start[1];
            const offset = 0.15; 
            const ctrl = [midX - dy * offset, midY + dx * offset];

            for (let i = 0; i <= segments; i++) {
                const t = i / segments;
                const x = Math.pow(1-t, 2)*start[0] + 2*(1-t)*t*ctrl[0] + Math.pow(t, 2)*end[0];
                const y = Math.pow(1-t, 2)*start[1] + 2*(1-t)*t*ctrl[1] + Math.pow(t, 2)*end[1];
                path.push([x, y]);
            }
            return path;
        }

        // ==========================================
        // 1. 生成静止的异常车辆 (写死固定位置与车牌，避免遮挡)
        // ==========================================
        const fixedAbnormalVehicles = [
            { pos: [114.060, 30.365], plate: '鄂A·X9876' }, // 分布在左侧 (蔡甸方向空地)
            { pos: [114.062, 30.275], plate: '鄂A·S5032' }, // 分布在中间 (汉南方向空地)
            { pos: [114.105, 30.300], plate: '鄂A·N4030' }  // 分布在右侧 (洪山方向空地)
        ];

        fixedAbnormalVehicles.forEach(v => {
            const content = document.createElement('div');
            content.className = 'vehicle-abnormal-container';
            content.innerHTML = `
                <div class="vehicle-abnormal-box">
                    <div class="vehicle-abnormal-plate">${v.plate}</div>
                    <div class="vehicle-abnormal-desc">机车故障，无法启动</div>
                </div>
                <div class="vehicle-abnormal-line"></div>
                <div class="vehicle-abnormal-dot"></div>
            `;

            new AMap.Marker({
                map: map,
                position: v.pos,
                content: content,
                anchor: 'bottom-center',
                offset: new AMap.Pixel(0, 3),
                zIndex: 150,
                zooms: [10.0001, 20] // 【新增】设置可见层级，确保在 >= 10.0001 时才显示
            });
        });

        // ==========================================
        // 2. 生成运动的正常车辆 (划分为双向车流)
        // ==========================================
        const TOTAL_VEHICLES = 18;  
        const NORMAL_COUNT = TOTAL_VEHICLES - fixedAbnormalVehicles.length; 

        for (let i = 0; i < NORMAL_COUNT; i++) {
            const route = routes[i % routes.length];
            
            const forwardPath = getBezierPath(M7_COORDS, route.end, 80);
            const returnPath = forwardPath.slice().reverse();
            
            let shiftedPath;
            
            if (i % 2 === 0) {
                const fullLoop = forwardPath.concat(returnPath);
                const startIdx = Math.floor(Math.random() * forwardPath.length);
                shiftedPath = fullLoop.slice(startIdx).concat(fullLoop.slice(0, startIdx));
            } else {
                const fullLoop = returnPath.concat(forwardPath);
                const startIdx = Math.floor(Math.random() * returnPath.length);
                shiftedPath = fullLoop.slice(startIdx).concat(fullLoop.slice(0, startIdx));
            }

            const content = document.createElement('div');
            content.className = 'vehicle-normal-dot';
            
            const marker = new AMap.Marker({
                map: map,
                position: shiftedPath[0],
                content: content,
                anchor: 'center',
                zIndex: 140,
                zooms: [10.0001, 20] // 【新增】设置可见层级，与供应商拱形圆锥同步出现
            });

            const duration = 12000 + Math.random() * 8000; 
            
            marker.moveAlong(shiftedPath, {
                duration: duration,
                circlable: true, 
                autoRotation: false 
            });
        }
    }

    function handleZoomStateManagement() {
        const currentZoom = map.getZoom();
        if (currentZoom <= 17) {
            districtControllers.forEach(ctrl => {
                let hasHeightChanged = false;
                
                ctrl.targetLayer2s.forEach(p => {
                    let ext = p.getExtData();
                    if (ext && ext.currentHeight > 20) {
                        p.setPath(ext.basePath.map(pt => [pt[0], pt[1], 20]));
                        ext.currentHeight = 20;
                        p.setExtData(ext);
                        hasHeightChanged = true;
                    }
                });
                
                ctrl.targetLayer3s.forEach(p => {
                    let ext = p.getExtData();
                    if (ext && ext.currentHeight > 40) {
                        p.setPath(ext.basePath.map(pt => [pt[0], pt[1], 40]));
                        ext.currentHeight = 40;
                        p.setExtData(ext);
                        hasHeightChanged = true;
                    }
                });

                if (hasHeightChanged) {
                    ctrl.currentDistrictHoverPolygons.forEach(p => p.hide());
                    ctrl.currentDistrictDefaultPolygons.forEach(p => p.show());
                }
            });
        }
    }

    let isLayoutPending = false;
    function triggerLayoutUpdate() {
        if (isLayoutPending) return;
        isLayoutPending = true;
        requestAnimationFrame(() => {
            performLayoutCalculation();
            isLayoutPending = false;
        });
    }

    function performLayoutCalculation() {
        const currentZoom = map.getZoom();
        if (currentZoom <= 10 || currentZoom > 17) return;

        const BASE_ZOOM = 10; 
        const ZOOM_SENSITIVITY = 0.2;
        const finalScale = Math.max(1.2, Math.min(1 + (currentZoom - BASE_ZOOM) * ZOOM_SENSITIVITY, 1.4));

        const screenPositions = labelsData.map(item => {
            const px = map.lngLatToContainer(item.marker.getPosition());
            return { item: item, x: px.getX(), y: px.getY() - item.textCenterY * finalScale, offsetX: 0, offsetY: 0 };
        });

        for (let iter = 0; iter < 10; iter++) {
            for (let i = 0; i < screenPositions.length; i++) {
                for (let j = i + 1; j < screenPositions.length; j++) {
                    const p1 = screenPositions[i];
                    const p2 = screenPositions[j];

                    if (p1.item.type === 'supplier' || p2.item.type === 'supplier') continue;

                    const dx = (p1.x + p1.offsetX) - (p2.x + p2.offsetX);
                    const dy = (p1.y + p1.offsetY) - (p2.y + p2.offsetY);
                    const distance = Math.sqrt(dx * dx + dy * dy) || 0.1;
                    const safeRadius = (p1.item.radius + p2.item.radius) * finalScale;

                    if (distance < safeRadius) {
                        const overlap = safeRadius - distance;
                        const pushX = (dx / distance) * overlap * 0.5;
                        const pushY = (dy / distance) * overlap * 0.5;
                        p1.offsetX += pushX; p1.offsetY += pushY;
                        p2.offsetX -= pushX; p2.offsetY -= pushY;
                    }
                }
            }
        }

        screenPositions.forEach(pos => {
            const clampedOffsetX = Math.max(-130, Math.min(pos.offsetX, 130));
            const clampedOffsetY = Math.max(-130, Math.min(pos.offsetY, 130));

            if (pos.item.type === 'm7') {
                pos.item.marker.setOffset(new AMap.Pixel(0, 0));
                pos.item.dom.querySelector('.m7-svg-cone').style.transform = `scale(${finalScale})`;
                pos.item.dom.querySelector('.m7-label-text').style.transform = `translate(${clampedOffsetX}px, ${clampedOffsetY}px) scale(${finalScale})`;
                
                
            } else if (pos.item.type === 'district') {
                pos.item.marker.setOffset(new AMap.Pixel(clampedOffsetX, clampedOffsetY));
                pos.item.dom.style.transform = `scale(${finalScale})`;
            } else {
                pos.item.marker.setOffset(new AMap.Pixel(0, 0));
                pos.item.dom.style.transform = `scale(${finalScale})`; 
            }
        });
    }

    map.on('camerachange', () => {
        triggerLayoutUpdate();
        handleZoomStateManagement();
    });

}).catch((e) => {
    console.error("地图加载失败:", e);
    window.dispatchEvent(new Event('m7-demo-error'));
});