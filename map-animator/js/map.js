/**
 * Módulo de gerenciamento do mapa
 * Responsável por inicializar e controlar o mapa OpenStreetMap
 */
const MapModule = (function() {
    // Variáveis privadas
    let map;
    let currentZoom = 3;
    let currentCenter = [0, 0];
    let editMode = null;
    let drawingLayer = null;
    let drawingPoints = [];
    let activeLayers = [];
    let selectedLayer = null;
    let editableLayers = new L.FeatureGroup();
    let drawControl = null;
    let textToAdd = null;
    
    // Inicializa o mapa
    function init() {
        map = L.map('map-container', {
            center: currentCenter,
            zoom: currentZoom,
            zoomControl: false,
            attributionControl: true
        });
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        L.control.zoom({
            position: 'topright'
        }).addTo(map);
        
        // Adiciona o grupo de camadas editáveis ao mapa
        editableLayers.addTo(map);
        
        // Inicializa o controle de desenho (inicialmente oculto)
        initDrawControl();
        
        // Adiciona handler para registrar a posição e zoom atuais
        map.on('moveend', function() {
            currentCenter = map.getCenter();
            currentZoom = map.getZoom();
        });
        
        // Adiciona listener para cliques no mapa
        map.on('click', handleMapClick);
        
        // Adiciona listeners para eventos de edição
        map.on('draw:edited', function(e) {
            // Atualiza as coordenadas das camadas editadas
            const layers = e.layers;
            layers.eachLayer(function(layer) {
                const id = layer._leaflet_id;
                const activeLayer = activeLayers.find(l => l.layer && l.layer._leaflet_id === id);
                
                if (activeLayer) {
                    if (activeLayer.type === 'line') {
                        activeLayer.points = layer.getLatLngs().map(latLng => [latLng.lat, latLng.lng]);
                    } else if (activeLayer.type === 'polygon') {
                        activeLayer.points = layer.getLatLngs()[0].map(latLng => [latLng.lat, latLng.lng]);
                    }
                }
            });
        });
        
        // Evento para quando uma camada é criada através do controle de desenho
        map.on('draw:created', function(e) {
            const type = e.layerType;
            const layer = e.layer;
            
            // Adiciona a camada ao grupo editável
            editableLayers.addLayer(layer);
            
            if (type === 'polyline') {
                const points = layer.getLatLngs().map(latLng => [latLng.lat, latLng.lng]);
                
                addLayer({
                    type: 'line',
                    layer: layer,
                    points: points,
                    style: {
                        color: '#3388ff',
                        weight: 3,
                        opacity: 1,
                        fillOpacity: 0
                    },
                    animation: {
                        start: 0,
                        end: 5,
                        progress: 0
                    }
                });
            } else if (type === 'polygon') {
                const points = layer.getLatLngs()[0].map(latLng => [latLng.lat, latLng.lng]);
                
                addLayer({
                    type: 'polygon',
                    layer: layer,
                    points: points,
                    style: {
                        color: '#3388ff',
                        weight: 3,
                        opacity: 1,
                        fillColor: '#3388ff',
                        fillOpacity: 0.2
                    },
                    animation: {
                        start: 0,
                        end: 5,
                        progress: 0
                    }
                });
            }
        });
    }
    
    // Inicializa os controles de desenho para edição
    function initDrawControl() {
        const drawOptions = {
            position: 'topright',
            draw: {
                polyline: {
                    shapeOptions: {
                        color: '#3388ff',
                        weight: 3
                    }
                },
                polygon: {
                    allowIntersection: false,
                    showArea: true,
                    shapeOptions: {
                        color: '#3388ff',
                        weight: 3
                    }
                },
                circle: false,
                rectangle: false,
                marker: false,
                circlemarker: false
            },
            edit: {
                featureGroup: editableLayers,
                poly: {
                    allowIntersection: false
                }
            }
        };
        
        // Cria o controle de desenho
        drawControl = new L.Control.Draw(drawOptions);
    }
    
    // Entra no modo de edição
    function enableEditMode() {
        // Remove qualquer controle existente para evitar duplicação
        if (drawControl) {
            map.removeControl(drawControl);
        }
        
        // Adiciona o controle de edição ao mapa
        drawControl = new L.Control.Draw({
            position: 'topright',
            draw: false,
            edit: {
                featureGroup: editableLayers,
                poly: {
                    allowIntersection: false
                }
            }
        });
        
        map.addControl(drawControl);
        
        // Adiciona classe para mudar o cursor para o modo de edição
        L.DomUtil.addClass(map.getContainer(), 'edit-mode');
    }
    
    // Desativa o modo de edição
    function disableEditMode() {
        // Remove o controle de edição
        if (drawControl) {
            map.removeControl(drawControl);
        }
        
        // Remove classe de cursor
        L.DomUtil.removeClass(map.getContainer(), 'edit-mode');
    }
    
    // Ativa o modo de exclusão
    function enableDeleteMode() {
        // Adiciona classe para mudar o cursor para o modo de exclusão
        L.DomUtil.addClass(map.getContainer(), 'delete-mode');
        
        // Adiciona evento de clique para excluir camadas
        activeLayers.forEach(layerData => {
            if (layerData.layer) {
                layerData.layer.on('click', function() {
                    if (editMode === 'delete') {
                        deleteLayer(layerData.id);
                    }
                });
            }
        });
    }
    
    // Desativa o modo de exclusão
    function disableDeleteMode() {
        // Remove classe de cursor
        L.DomUtil.removeClass(map.getContainer(), 'delete-mode');
        
        // Remove eventos de clique para exclusão
        activeLayers.forEach(layerData => {
            if (layerData.layer) {
                layerData.layer.off('click');
            }
        });
    }
    
    // Manipula cliques no mapa de acordo com o modo de edição
    function handleMapClick(e) {
        if (editMode === 'line' || editMode === 'polygon') {
            // Adiciona um ponto à linha ou polígono sendo desenhado
            drawingPoints.push([e.latlng.lat, e.latlng.lng]);
            updateDrawingLayer();
        } else if (editMode === 'text') {
            // Adiciona um texto no local clicado
            if (textToAdd) {
                addTextToMap(textToAdd, [e.latlng.lat, e.latlng.lng]);
                
                // Reseta o modo após adicionar o texto
                editMode = null;
                textToAdd = null;
                L.DomUtil.removeClass(map.getContainer(), 'text-cursor');
                
                // Reseta o botão de adicionar texto
                document.getElementById('add-text-btn').classList.remove('active');
            }
        }
    }
    
    // Atualiza a camada de desenho atual
    function updateDrawingLayer() {
        if (drawingLayer) {
            map.removeLayer(drawingLayer);
        }
        
        if (drawingPoints.length > 0) {
            if (editMode === 'line') {
                drawingLayer = L.polyline(drawingPoints, {
                    color: '#3388ff',
                    weight: 3
                }).addTo(map);
            } else if (editMode === 'polygon' && drawingPoints.length > 2) {
                drawingLayer = L.polygon(drawingPoints, {
                    color: '#3388ff',
                    weight: 3,
                    fillOpacity: 0.2
                }).addTo(map);
            }
        }
    }
    
    // Inicia o modo de desenho para o tipo especificado
    function startDrawing(type) {
        // Cancela qualquer desenho anterior
        if (drawingLayer) {
            map.removeLayer(drawingLayer);
        }
        
        editMode = type;
        drawingPoints = [];
        
        // Atualiza cursor para indicar o modo de desenho
        if (type === 'text') {
            L.DomUtil.addClass(map.getContainer(), 'text-cursor');
        } else {
            L.DomUtil.addClass(map.getContainer(), 'crosshair-cursor');
        }
    }
    
    // Finaliza o desenho atual e retorna a camada criada
    function finishDrawing() {
        if (drawingPoints.length === 0) {
            editMode = null;
            L.DomUtil.removeClass(map.getContainer(), 'crosshair-cursor');
            return null;
        }
        
        const layer = drawingLayer;
        const type = editMode;
        const points = [...drawingPoints];
        
        // Adiciona a camada ao grupo editável
        editableLayers.addLayer(layer);
        
        // Reseta o estado de desenho
        drawingLayer = null;
        drawingPoints = [];
        editMode = null;
        L.DomUtil.removeClass(map.getContainer(), 'crosshair-cursor');
        
        // Adicionar a camada à lista de camadas ativas
        addLayer({
            type: type,
            layer: layer,
            points: points,
            style: {
                color: '#3388ff',
                weight: 3,
                opacity: 1,
                fillOpacity: type === 'polygon' ? 0.2 : 0,
            },
            animation: {
                start: 0,
                end: 5,
                progress: 0
            }
        });
        
        return layer;
    }
    
    // Prepara para adicionar um texto
    function prepareAddText(text) {
        editMode = 'text';
        textToAdd = text;
        L.DomUtil.addClass(map.getContainer(), 'text-cursor');
    }
    
    // Adiciona um texto ao mapa na posição especificada
    function addTextToMap(text, position) {
        // Cria um div personalizado para o texto
        const textIcon = L.divIcon({
            className: 'map-text',
            html: `<div>${text}</div>`,
            iconSize: [100, 40],
            iconAnchor: [50, 20]
        });
        
        // Cria um marcador com o ícone de texto
        const textMarker = L.marker(position, {
            icon: textIcon,
            draggable: true
        }).addTo(map);
        
        // Adiciona o marcador ao grupo editável
        editableLayers.addLayer(textMarker);
        
        // Adiciona a camada à lista de camadas ativas
        const textLayer = addLayer({
            type: 'text',
            layer: textMarker,
            position: position,
            content: text,
            textStyle: {
                size: 20,
                bold: false,
                italic: false,
                align: 'center'
            },
            style: {
                color: '#3388ff',
                opacity: 1
            },
            animation: {
                start: 0,
                end: 5,
                progress: 0
            }
        });
        
        // Adiciona listener para evento de arrastar
        textMarker.on('dragend', function(e) {
            const newPos = e.target.getLatLng();
            textLayer.position = [newPos.lat, newPos.lng];
        });
        
        // Adiciona listener para clique para seleção
        textMarker.on('click', function() {
            selectLayer(textLayer.id);
        });
        
        return textLayer;
    }
    
    // Atualiza o estilo de um texto
    function updateTextStyle(layerId, textStyle) {
        const layer = activeLayers.find(l => l.id === layerId);
        if (layer && layer.type === 'text') {
            layer.textStyle = {...layer.textStyle, ...textStyle};
            
            // Atualiza o texto no mapa
            updateTextDisplay(layer);
        }
    }
    
    // Atualiza o conteúdo de um texto
    function updateTextContent(layerId, content) {
        const layer = activeLayers.find(l => l.id === layerId);
        if (layer && layer.type === 'text') {
            layer.content = content;
            
            // Atualiza o texto no mapa
            updateTextDisplay(layer);
        }
    }
    
    // Atualiza a exibição do texto com base nas configurações
    function updateTextDisplay(textLayer) {
        const { content, textStyle, style } = textLayer;
        
        // Cria o HTML com as configurações de estilo
        let fontWeight = textStyle.bold ? 'bold' : 'normal';
        let fontStyle = textStyle.italic ? 'italic' : 'normal';
        let textAlign = textStyle.align;
        let fontSize = textStyle.size + 'px';
        let color = style.color;
        
        const html = `
            <div style="
                font-weight: ${fontWeight}; 
                font-style: ${fontStyle}; 
                text-align: ${textAlign};
                font-size: ${fontSize};
                color: ${color};
                opacity: ${style.opacity};
                width: 100%;
            ">${content}</div>
        `;
        
        // Atualiza o ícone do marcador
        const textIcon = L.divIcon({
            className: 'map-text' + (textLayer.id === selectedLayer ? ' selected' : ''),
            html: html,
            iconSize: [200, 40],
            iconAnchor: [100, 20]
        });
        
        textLayer.layer.setIcon(textIcon);
    }
    
    // Adiciona uma camada ao mapa e à lista de camadas ativas
    function addLayer(layerData) {
        layerData.id = 'layer-' + Date.now();
        activeLayers.push(layerData);
        
        // Notificar outros módulos
        document.dispatchEvent(new CustomEvent('layerAdded', {
            detail: layerData
        }));
        
        return layerData;
    }
    
    // Exclui uma camada do mapa e da lista
    function deleteLayer(layerId) {
        const layerIndex = activeLayers.findIndex(l => l.id === layerId);
        if (layerIndex === -1) return;
        
        const layer = activeLayers[layerIndex];
        
        // Remove a camada do mapa
        if (layer.layer) {
            editableLayers.removeLayer(layer.layer);
            map.removeLayer(layer.layer);
        }
        
        // Remove da lista de camadas
        activeLayers.splice(layerIndex, 1);
        
        // Se a camada excluída estava selecionada, limpa a seleção
        if (selectedLayer === layerId) {
            selectedLayer = null;
        }
        
        // Notifica outros módulos
        document.dispatchEvent(new CustomEvent('layerDeleted', {
            detail: { layerId }
        }));
    }
    
    // Adiciona um país ao mapa com base no GeoJSON
    function addCountry(countryData) {
        const layer = L.geoJSON(countryData.geometry, {
            style: {
                color: '#3388ff',
                weight: 2,
                opacity: 1,
                fillColor: '#3388ff',
                fillOpacity: 0.2
            }
        }).addTo(map);
        
        // Centraliza o mapa no país adicionado
        map.fitBounds(layer.getBounds());
        
        // Adiciona a camada ao grupo editável
        editableLayers.addLayer(layer);
        
        // Adiciona à lista de camadas
        addLayer({
            type: 'country',
            layer: layer,
            name: countryData.properties.name,
            countryCode: countryData.properties.iso_a2,
            style: {
                color: '#3388ff',
                weight: 2,
                opacity: 1,
                fillColor: '#3388ff',
                fillOpacity: 0.2
            },
            animation: {
                start: 0,
                end: 5,
                progress: 0
            }
        });
    }
    
    // Carrega um arquivo GeoJSON e adiciona ao mapa
    function addGeoJSON(geojsonData) {
        try {
            const layer = L.geoJSON(geojsonData, {
                style: {
                    color: '#3388ff',
                    weight: 2,
                    opacity: 1,
                    fillColor: '#3388ff',
                    fillOpacity: 0.2
                }
            }).addTo(map);
            
            // Centraliza o mapa no conteúdo adicionado
            map.fitBounds(layer.getBounds());
            
            // Adiciona a camada ao grupo editável
            editableLayers.addLayer(layer);
            
            // Adiciona à lista de camadas
            addLayer({
                type: 'geojson',
                layer: layer,
                data: geojsonData,
                style: {
                    color: '#3388ff',
                    weight: 2,
                    opacity: 1,
                    fillColor: '#3388ff',
                    fillOpacity: 0.2
                },
                animation: {
                    start: 0,
                    end: 5,
                    progress: 0
                }
            });
        } catch (error) {
            console.error('Erro ao carregar GeoJSON:', error);
            alert('Erro ao carregar arquivo GeoJSON. Verifique se o formato está correto.');
        }
    }
    
    // Seleciona uma camada
    function selectLayer(layerId) {
        // Primeiro, remova a seleção anterior
        if (selectedLayer) {
            const prevLayer = activeLayers.find(l => l.id === selectedLayer);
            if (prevLayer) {
                if (prevLayer.type === 'text') {
                    // Remove a classe de seleção para textos
                    updateTextDisplay(prevLayer);
                } else if (prevLayer.layer) {
                    // Restaura o estilo original para outras camadas
                    prevLayer.layer.setStyle({
                        color: prevLayer.style.color,
                        weight: prevLayer.style.weight,
                        opacity: prevLayer.style.opacity,
                        fillOpacity: prevLayer.style.fillOpacity
                    });
                }
            }
        }
        
        selectedLayer = layerId;
        
        if (layerId) {
            const layer = activeLayers.find(l => l.id === layerId);
            if (layer) {
                if (layer.type === 'text') {
                    // Adiciona a classe de seleção para textos
                    updateTextDisplay(layer);
                } else if (layer.layer) {
                    // Aplica estilo de seleção para outras camadas
                    layer.layer.setStyle({
                        color: layer.style.color,
                        weight: layer.style.weight + 2,
                        opacity: layer.style.opacity,
                        fillOpacity: layer.style.fillOpacity,
                        dashArray: '5, 5'
                    });
                }
                
                // Notificar outros módulos
                document.dispatchEvent(new CustomEvent('layerSelected', {
                    detail: layer
                }));
            }
        }
    }
    
    // Atualiza o estilo de uma camada
    function updateLayerStyle(layerId, style) {
        const layer = activeLayers.find(l => l.id === layerId);
        if (layer) {
            layer.style = {...layer.style, ...style};
            
            if (layer.type === 'text') {
                // Para textos, atualiza a exibição com o novo estilo
                updateTextDisplay(layer);
            } else if (layer.layer) {
                // Para outras camadas, aplica o estilo diretamente
                layer.layer.setStyle({
                    color: layer.style.color,
                    weight: layer.style.weight,
                    opacity: layer.style.opacity,
                    fillColor: layer.style.color,
                    fillOpacity: layer.style.fillOpacity
                });
            }
        }
    }
    
    // Atualiza a animação de uma camada
    function updateLayerAnimation(layerId, animation) {
        const layer = activeLayers.find(l => l.id === layerId);
        if (layer) {
            layer.animation = {...layer.animation, ...animation};
            
            // Notificar outros módulos
            document.dispatchEvent(new CustomEvent('layerAnimationUpdated', {
                detail: {layerId, animation: layer.animation}
            }));
        }
    }
    
    // Anima as linhas e polígonos com base no progresso
    function animateLayer(layerId, progress) {
        const layer = activeLayers.find(l => l.id === layerId);
        if (!layer) return;
        
        // Para linhas, usamos a técnica de dashArray para animação de trim path
        if (layer.type === 'line') {
            const path = layer.layer.getElement();
            if (path) {
                const length = path.getTotalLength();
                path.style.strokeDasharray = `${length} ${length}`;
                path.style.strokeDashoffset = length * (1 - progress);
            }
        } 
        // Para polígonos e países, animamos a opacidade
        else if (layer.type === 'polygon' || layer.type === 'country' || layer.type === 'geojson') {
            layer.layer.setStyle({
                opacity: progress,
                fillOpacity: layer.style.fillOpacity * progress
            });
        }
        // Para textos, animamos a opacidade
        else if (layer.type === 'text') {
            layer.layer.getElement().style.opacity = progress;
        }
    }
    
    // Define ou obtém o centro atual do mapa
    function getMapCenter() {
        return map.getCenter();
    }
    
    function setMapCenter(center) {
        if (!center) return;
        
        try {
            // Armazena o valor atual
            currentCenter = L.latLng(center);
            
            // Aplica sem animação para precisão exata
            map.setView(center, map.getZoom(), {
                animate: false
            });
        } catch (error) {
            console.error('Erro ao definir o centro do mapa:', error);
        }
    }
    
    // Define ou obtém o zoom atual do mapa
    function getZoom() {
        return map.getZoom();
    }
    
    function setZoom(zoom) {
        if (typeof zoom !== 'number' || isNaN(zoom)) return;
        
        try {
            // Armazena o valor atual
            currentZoom = zoom;
            
            // Aplica sem animação para precisão exata
            map.setZoom(zoom, {
                animate: false
            });
        } catch (error) {
            console.error('Erro ao definir o zoom do mapa:', error);
        }
    }
    
    // API pública
    return {
        init: init,
        startDrawing: startDrawing,
        finishDrawing: finishDrawing,
        prepareAddText: prepareAddText,
        updateTextStyle: updateTextStyle,
        updateTextContent: updateTextContent,
        addCountry: addCountry,
        addGeoJSON: addGeoJSON,
        selectLayer: selectLayer,
        deleteLayer: deleteLayer,
        updateLayerStyle: updateLayerStyle,
        updateLayerAnimation: updateLayerAnimation,
        animateLayer: animateLayer,
        getMapCenter: getMapCenter,
        setMapCenter: setMapCenter,
        getZoom: getZoom,
        setZoom: setZoom,
        enableEditMode: enableEditMode,
        disableEditMode: disableEditMode,
        enableDeleteMode: enableDeleteMode,
        disableDeleteMode: disableDeleteMode,
        getSelectedLayer: function() { return selectedLayer; },
        getLayers: function() { return activeLayers; },
        map: function() { return map; }
    };
})();