/**
 * Módulo de Camadas
 * Gerencia as camadas (linhas, polígonos, países, textos) e suas animações
 */
const LayersModule = (function() {
    // Array para armazenar as informações das camadas
    let layers = [];
    
    // Referência para o track de camadas na timeline
    let layersTrack;
    
    // ID da camada selecionada atualmente
    let selectedLayerId = null;
    
    // Modo atual de edição
    let currentEditMode = null;
    
    // Inicializa o módulo
    function init() {
        layersTrack = document.querySelector('.layers-track');
        
        // Adiciona os listeners de eventos para os botões
        document.getElementById('add-line-btn').addEventListener('click', startLineDrawing);
        document.getElementById('add-polygon-btn').addEventListener('click', startPolygonDrawing);
        document.getElementById('add-text-btn').addEventListener('click', showTextDialog);
        document.getElementById('edit-btn').addEventListener('click', toggleEditMode);
        document.getElementById('delete-btn').addEventListener('click', toggleDeleteMode);
        
        // Configuração do diálogo de texto
        const textDialog = document.getElementById('text-dialog');
        document.querySelector('#text-dialog .close-btn').addEventListener('click', function() {
            textDialog.classList.add('hidden');
        });
        
        document.querySelector('#text-dialog .cancel-btn').addEventListener('click', function() {
            textDialog.classList.add('hidden');
        });
        
        document.getElementById('add-text-confirm-btn').addEventListener('click', function() {
            const text = document.getElementById('new-text-content').value.trim();
            if (text) {
                textDialog.classList.add('hidden');
                prepareAddText(text);
            }
        });
        
        // Adiciona listeners para os eventos de camadas
        document.addEventListener('layerAdded', handleLayerAdded);
        document.addEventListener('layerSelected', handleLayerSelected);
        document.addEventListener('layerDeleted', handleLayerDeleted);
        document.addEventListener('timeUpdate', updateLayersAnimation);
        
        // Adiciona listeners para alterações nas propriedades da camada
        document.getElementById('layer-color').addEventListener('change', updateSelectedLayerStyle);
        document.getElementById('layer-opacity').addEventListener('change', updateSelectedLayerStyle);
        document.getElementById('layer-weight').addEventListener('change', updateSelectedLayerStyle);
        document.getElementById('anim-start').addEventListener('change', updateSelectedLayerAnimation);
        document.getElementById('anim-end').addEventListener('change', updateSelectedLayerAnimation);
        
        // Listeners para propriedades de texto
        document.getElementById('text-content').addEventListener('input', updateSelectedTextContent);
        document.getElementById('text-size').addEventListener('change', updateSelectedTextStyle);
        document.getElementById('text-bold').addEventListener('change', updateSelectedTextStyle);
        document.getElementById('text-italic').addEventListener('change', updateSelectedTextStyle);
        document.getElementById('text-align').addEventListener('change', updateSelectedTextStyle);
    }
    
    // Inicia o desenho de uma linha
    function startLineDrawing() {
        // Desativa o modo de edição atual, se houver
        exitEditModes();
        
        MapModule.startDrawing('line');
        
        // Muda o botão para modo ativo
        const btn = document.getElementById('add-line-btn');
        btn.classList.add('active');
        
        // Adiciona um botão de conclusão temporário
        if (!document.getElementById('finish-drawing-btn')) {
            const finishBtn = document.createElement('button');
            finishBtn.id = 'finish-drawing-btn';
            finishBtn.innerHTML = '<i class="fas fa-check"></i> Concluir';
            finishBtn.classList.add('finish-drawing-btn');
            
            finishBtn.addEventListener('click', finishDrawing);
            
            document.querySelector('.toolbar').appendChild(finishBtn);
        }
    }
    
    // Inicia o desenho de um polígono
    function startPolygonDrawing() {
        // Desativa o modo de edição atual, se houver
        exitEditModes();
        
        MapModule.startDrawing('polygon');
        
        // Muda o botão para modo ativo
        const btn = document.getElementById('add-polygon-btn');
        btn.classList.add('active');
        
        // Adiciona um botão de conclusão temporário
        if (!document.getElementById('finish-drawing-btn')) {
            const finishBtn = document.createElement('button');
            finishBtn.id = 'finish-drawing-btn';
            finishBtn.innerHTML = '<i class="fas fa-check"></i> Concluir';
            finishBtn.classList.add('finish-drawing-btn');
            
            finishBtn.addEventListener('click', finishDrawing);
            
            document.querySelector('.toolbar').appendChild(finishBtn);
        }
    }
    
    // Mostra o diálogo para adicionar texto
    function showTextDialog() {
        // Desativa o modo de edição atual, se houver
        exitEditModes();
        
        // Mostra o diálogo
        document.getElementById('text-dialog').classList.remove('hidden');
        document.getElementById('new-text-content').focus();
    }
    
    // Prepara para adicionar texto
    function prepareAddText(text) {
        MapModule.prepareAddText(text);
        
        // Muda o botão para modo ativo
        const btn = document.getElementById('add-text-btn');
        btn.classList.add('active');
    }
    
    // Finaliza o desenho atual
    function finishDrawing() {
        // Finaliza o desenho no módulo do mapa
        const layer = MapModule.finishDrawing();
        
        // Remove o botão de conclusão
        const finishBtn = document.getElementById('finish-drawing-btn');
        if (finishBtn) {
            finishBtn.remove();
        }
        
        // Reseta os botões
        document.getElementById('add-line-btn').classList.remove('active');
        document.getElementById('add-polygon-btn').classList.remove('active');
    }
    
    // Alterna o modo de edição
    function toggleEditMode() {
        if (currentEditMode === 'edit') {
            exitEditModes();
        } else {
            // Sai de qualquer outro modo de edição primeiro
            exitEditModes();
            
            // Ativa o modo de edição
            currentEditMode = 'edit';
            document.getElementById('edit-btn').classList.add('active');
            
            // Ativa o modo de edição no mapa
            MapModule.enableEditMode();
        }
    }
    
    // Alterna o modo de exclusão
    function toggleDeleteMode() {
        if (currentEditMode === 'delete') {
            exitEditModes();
        } else {
            // Sai de qualquer outro modo de edição primeiro
            exitEditModes();
            
            // Ativa o modo de exclusão
            currentEditMode = 'delete';
            document.getElementById('delete-btn').classList.add('active');
            
            // Ativa o modo de exclusão no mapa
            MapModule.enableDeleteMode();
        }
    }
    
    // Sai de todos os modos de edição
    function exitEditModes() {
        // Desativa o modo atual
        if (currentEditMode === 'edit') {
            MapModule.disableEditMode();
        } else if (currentEditMode === 'delete') {
            MapModule.disableDeleteMode();
        }
        
        // Reseta todos os botões de modo
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        currentEditMode = null;
    }
    
    // Manipula o evento de adição de uma camada
    function handleLayerAdded(e) {
        const layerData = e.detail;
        
        // Adiciona a camada ao array de camadas
        layers.push(layerData);
        
        // Atualiza a visualização das camadas na timeline
        updateLayersView();
        
        // Seleciona a nova camada
        selectLayer(layerData.id);
    }
    
    // Manipula o evento de seleção de uma camada
    function handleLayerSelected(e) {
        const layerData = e.detail;
        
        // Atualiza o ID da camada selecionada
        selectedLayerId = layerData.id;
        
        // Atualiza os controles de propriedades
        updatePropertiesPanel(layerData);
    }
    
    // Manipula o evento de exclusão de uma camada
    function handleLayerDeleted(e) {
        const { layerId } = e.detail;
        
        // Remove a camada do array
        const layerIndex = layers.findIndex(l => l.id === layerId);
        if (layerIndex !== -1) {
            layers.splice(layerIndex, 1);
        }
        
        // Atualiza a visualização das camadas na timeline
        updateLayersView();
        
        // Limpa o painel de propriedades se a camada selecionada foi excluída
        if (selectedLayerId === layerId) {
            selectedLayerId = null;
            // Ocultar ou resetar o painel de propriedades
            document.getElementById('layer-properties').classList.add('hidden');
        }
    }
    
    // Seleciona uma camada
    function selectLayer(layerId) {
        MapModule.selectLayer(layerId);
    }
    
    // Atualiza o painel de propriedades com base na camada selecionada
    function updatePropertiesPanel(layerData) {
        const propertiesPanel = document.getElementById('layer-properties');
        const textProperties = document.getElementById('text-properties');
        
        // Mostra o painel de propriedades
        propertiesPanel.classList.remove('hidden');
        
        // Atualiza os inputs comuns
        const colorInput = document.getElementById('layer-color');
        const opacityInput = document.getElementById('layer-opacity');
        const weightInput = document.getElementById('layer-weight');
        const animStartInput = document.getElementById('anim-start');
        const animEndInput = document.getElementById('anim-end');
        
        // Atualiza os valores dos inputs com base nas propriedades da camada
        colorInput.value = layerData.style.color;
        opacityInput.value = layerData.style.opacity;
        
        // Se for texto, esconde o controle de espessura e mostra os controles de texto
        if (layerData.type === 'text') {
            document.querySelector('label[for="layer-weight"]').parentNode.classList.add('hidden');
            textProperties.classList.remove('hidden');
            
            // Atualiza os controles de texto
            document.getElementById('text-content').value = layerData.content;
            document.getElementById('text-size').value = layerData.textStyle.size;
            document.getElementById('text-bold').checked = layerData.textStyle.bold;
            document.getElementById('text-italic').checked = layerData.textStyle.italic;
            document.getElementById('text-align').value = layerData.textStyle.align;
        } else {
            document.querySelector('label[for="layer-weight"]').parentNode.classList.remove('hidden');
            textProperties.classList.add('hidden');
            
            // Atualiza o controle de espessura
            weightInput.value = layerData.style.weight;
        }
        
        // Atualiza os controles de animação
        animStartInput.value = layerData.animation.start;
        animEndInput.value = layerData.animation.end;
    }
    
    // Atualiza o estilo da camada selecionada
    function updateSelectedLayerStyle() {
        if (!selectedLayerId) return;
        
        const colorInput = document.getElementById('layer-color');
        const opacityInput = document.getElementById('layer-opacity');
        const weightInput = document.getElementById('layer-weight');
        
        const layer = layers.find(l => l.id === selectedLayerId);
        if (!layer) return;
        
        const style = {
            color: colorInput.value,
            opacity: parseFloat(opacityInput.value)
        };
        
        // Adiciona propriedades específicas de acordo com o tipo
        if (layer.type !== 'text') {
            style.weight = parseInt(weightInput.value);
            style.fillColor = colorInput.value;
            style.fillOpacity = parseFloat(opacityInput.value) * 0.2; // Menos opaco para o preenchimento
        }
        
        // Atualiza o estilo da camada no mapa
        MapModule.updateLayerStyle(selectedLayerId, style);
        
        // Atualiza o array de camadas
        const layerIndex = layers.findIndex(l => l.id === selectedLayerId);
        if (layerIndex !== -1) {
            layers[layerIndex].style = {...layers[layerIndex].style, ...style};
        }
        
        // Atualiza a visualização das camadas na timeline
        updateLayersView();
    }
    
    // Atualiza o conteúdo do texto selecionado
    function updateSelectedTextContent() {
        if (!selectedLayerId) return;
        
        const textInput = document.getElementById('text-content');
        const content = textInput.value;
        
        // Atualiza o conteúdo do texto
        MapModule.updateTextContent(selectedLayerId, content);
        
        // Atualiza o array de camadas
        const layerIndex = layers.findIndex(l => l.id === selectedLayerId);
        if (layerIndex !== -1) {
            layers[layerIndex].content = content;
        }
        
        // Atualiza a visualização das camadas na timeline
        updateLayersView();
    }
    
    // Atualiza o estilo do texto selecionado
    function updateSelectedTextStyle() {
        if (!selectedLayerId) return;
        
        const layer = layers.find(l => l.id === selectedLayerId);
        if (!layer || layer.type !== 'text') return;
        
        const sizeInput = document.getElementById('text-size');
        const boldInput = document.getElementById('text-bold');
        const italicInput = document.getElementById('text-italic');
        const alignInput = document.getElementById('text-align');
        
        const textStyle = {
            size: parseInt(sizeInput.value),
            bold: boldInput.checked,
            italic: italicInput.checked,
            align: alignInput.value
        };
        
        // Atualiza o estilo do texto
        MapModule.updateTextStyle(selectedLayerId, textStyle);
        
        // Atualiza o array de camadas
        const layerIndex = layers.findIndex(l => l.id === selectedLayerId);
        if (layerIndex !== -1) {
            layers[layerIndex].textStyle = {...layers[layerIndex].textStyle, ...textStyle};
        }
    }
    
    // Atualiza a animação da camada selecionada
    function updateSelectedLayerAnimation() {
        if (!selectedLayerId) return;
        
        const animStartInput = document.getElementById('anim-start');
        const animEndInput = document.getElementById('anim-end');
        
        const animation = {
            start: parseFloat(animStartInput.value),
            end: parseFloat(animEndInput.value)
        };
        
        // Garante que o tempo de início seja menor que o de fim
        if (animation.start >= animation.end) {
            animation.end = animation.start + 0.1;
            animEndInput.value = animation.end;
        }
        
        // Atualiza a animação da camada
        MapModule.updateLayerAnimation(selectedLayerId, animation);
        
        // Atualiza o array de camadas
        const layerIndex = layers.findIndex(l => l.id === selectedLayerId);
        if (layerIndex !== -1) {
            layers[layerIndex].animation = {...layers[layerIndex].animation, ...animation};
        }
        
        // Atualiza a visualização das camadas na timeline
        updateLayersView();
    }
    
    // Atualiza a visualização das camadas na timeline
    function updateLayersView() {
        // Limpa o conteúdo atual
        layersTrack.innerHTML = '';
        
        // Adiciona um elemento para cada camada
        layers.forEach(layer => {
            const layerEl = document.createElement('div');
            layerEl.className = 'layer-item';
            layerEl.dataset.id = layer.id;
            
            // Adiciona classe específica para o tipo de camada
            if (layer.type === 'text') {
                layerEl.classList.add('text-layer');
            } else if (layer.type === 'polygon') {
                layerEl.classList.add('polygon-layer');
            } else if (layer.type === 'country') {
                layerEl.classList.add('country-layer');
            }
            
            // Define a posição e largura com base nos tempos de início e fim da animação
            layerEl.style.left = `${layer.animation.start * TimelineModule.getTimeScale()}px`;
            layerEl.style.width = `${(layer.animation.end - layer.animation.start) * TimelineModule.getTimeScale()}px`;
            layerEl.style.backgroundColor = layer.style.color;
            
            // Adiciona texto descritivo ao item da timeline
            let typeName = '';
            switch (layer.type) {
                case 'line': typeName = 'Linha'; break;
                case 'polygon': typeName = 'Polígono'; break;
                case 'country': typeName = layer.name; break;
                case 'text': typeName = layer.content; break;
                case 'geojson': typeName = 'GeoJSON'; break;
            }
            
            // Se o nome for muito longo, corta e adiciona reticências
            if (typeName.length > 20) {
                typeName = typeName.substring(0, 17) + '...';
            }
            
            layerEl.textContent = typeName;
            layerEl.title = `${typeName} (${layer.animation.start}s - ${layer.animation.end}s)`;
            
            // Adiciona borda destacada se estiver selecionada
            if (layer.id === selectedLayerId) {
                layerEl.style.border = '2px solid white';
            }
            
            // Adiciona listener para selecionar a camada ao clicar
            layerEl.addEventListener('click', () => {
                selectLayer(layer.id);
            });
            
            // Adiciona listeners para arrastar e redimensionar a camada na timeline
            layerEl.addEventListener('mousedown', handleLayerMouseDown);
            
            layersTrack.appendChild(layerEl);
        });
    }
    
    // Manipula o evento mousedown em um item de camada para permitir arrasto
    function handleLayerMouseDown(e) {
        e.stopPropagation();
        
        const layerEl = e.target;
        const layerId = layerEl.dataset.id;
        const layer = layers.find(l => l.id === layerId);
        
        if (!layer) return;
        
        // Seleciona a camada
        selectLayer(layerId);
        
        const startX = e.clientX;
        const startLeft = parseFloat(layerEl.style.left);
        const startWidth = parseFloat(layerEl.style.width);
        const timeScale = TimelineModule.getTimeScale();
        
        // Detecta se o clique foi próximo às bordas (para redimensionamento)
        const isNearLeftEdge = e.offsetX < 10;
        const isNearRightEdge = e.offsetX > startWidth - 10;
        
        // Função para mover a camada na timeline
        const onMouseMove = (e) => {
            const deltaX = e.clientX - startX;
            
            if (isNearLeftEdge) {
                // Redimensiona pela borda esquerda (altera início e largura)
                const newLeft = Math.max(0, startLeft + deltaX);
                const newWidth = Math.max(0.1 * timeScale, startWidth - (newLeft - startLeft));
                
                layerEl.style.left = `${newLeft}px`;
                layerEl.style.width = `${newWidth}px`;
                
                // Atualiza os tempos de animação
                const newStart = newLeft / timeScale;
                const newEnd = (newLeft + newWidth) / timeScale;
                
                document.getElementById('anim-start').value = newStart.toFixed(1);
                document.getElementById('anim-end').value = newEnd.toFixed(1);
                
                layer.animation.start = newStart;
                layer.animation.end = newEnd;
            } else if (isNearRightEdge) {
                // Redimensiona pela borda direita (altera apenas a largura)
                const newWidth = Math.max(0.1 * timeScale, startWidth + deltaX);
                
                layerEl.style.width = `${newWidth}px`;
                
                // Atualiza o tempo de fim da animação
                const newEnd = (startLeft + newWidth) / timeScale;
                
                document.getElementById('anim-end').value = newEnd.toFixed(1);
                layer.animation.end = newEnd;
            } else {
                // Move a camada inteira
                const newLeft = Math.max(0, startLeft + deltaX);
                
                layerEl.style.left = `${newLeft}px`;
                
                // Atualiza os tempos de animação, mantendo a duração
                const duration = layer.animation.end - layer.animation.start;
                const newStart = newLeft / timeScale;
                const newEnd = newStart + duration;
                
                document.getElementById('anim-start').value = newStart.toFixed(1);
                document.getElementById('anim-end').value = newEnd.toFixed(1);
                
                layer.animation.start = newStart;
                layer.animation.end = newEnd;
            }
            
            // Atualiza a animação da camada
            MapModule.updateLayerAnimation(layerId, {
                start: layer.animation.start,
                end: layer.animation.end
            });
        };
        
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }
    
    // Atualiza as animações das camadas com base no tempo atual
    function updateLayersAnimation(e) {
        const currentTime = e.detail.time;
        
        // Atualiza cada camada
        layers.forEach(layer => {
            // Verifica se o tempo atual está dentro do intervalo de animação da camada
            if (currentTime < layer.animation.start) {
                // Tempo antes do início da animação
                MapModule.animateLayer(layer.id, 0);
            } else if (currentTime > layer.animation.end) {
                // Tempo após o fim da animação
                MapModule.animateLayer(layer.id, 1);
            } else {
                // Tempo durante a animação
                const progress = (currentTime - layer.animation.start) / 
                    (layer.animation.end - layer.animation.start);
                
                MapModule.animateLayer(layer.id, progress);
            }
        });
    }
    
    // API pública
    return {
        init: init,
        startLineDrawing: startLineDrawing,
        startPolygonDrawing: startPolygonDrawing,
        showTextDialog: showTextDialog,
        finishDrawing: finishDrawing,
        toggleEditMode: toggleEditMode,
        toggleDeleteMode: toggleDeleteMode,
        exitEditModes: exitEditModes,
        getLayers: function() { return layers; }
    };
})();