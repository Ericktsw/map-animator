/**
 * Módulo de Keyframes
 * Gerencia a criação e manipulação de keyframes para animação do mapa
 */
const KeyframesModule = (function() {
    // Array para armazenar os keyframes
    let keyframes = [];
    
    // Referência para o track de keyframes na timeline
    let keyframesTrack;
    
    // Configuração de animação
    let animationInProgress = false;
    let lastAppliedPosition = null;
    let lastAppliedZoom = null;
    
    // Funções de easing para suavizar as animações
    const easing = {
        // Função de easing para transições suaves
        easeInOutCubic: function(t) {
            return t < 0.5 
                ? 4 * t * t * t 
                : 1 - Math.pow(-2 * t + 2, 3) / 2;
        }
    };
    
    // Inicializa o módulo
    function init() {
        keyframesTrack = document.querySelector('.keyframes-track');
        
        // Adiciona o listener para o botão de adicionar keyframe
        document.getElementById('add-keyframe-btn').addEventListener('click', addCurrentStateAsKeyframe);
        
        // Adiciona listener para eventos de tempo
        document.addEventListener('timeUpdate', handleTimeUpdate);
        
        // Adiciona listeners para eventos de playback
        document.addEventListener('playbackStarted', function() {
            animationInProgress = true;
        });
        
        document.addEventListener('playbackStopped', function() {
            animationInProgress = false;
            lastAppliedPosition = null;
            lastAppliedZoom = null;
        });
    }
    
    // Adiciona um keyframe no tempo atual
    function addCurrentStateAsKeyframe() {
        const time = TimelineModule.getCurrentTime();
        
        // Obtém a posição e zoom exatos do mapa
        const center = MapModule.getMapCenter();
        const zoom = MapModule.getZoom();
        
        // Verifica se já existe um keyframe neste tempo
        const existingIndex = keyframes.findIndex(k => Math.abs(k.time - time) < 0.1);
        if (existingIndex !== -1) {
            // Atualiza o keyframe existente
            keyframes[existingIndex] = {
                time: time,
                center: {
                    lat: center.lat,
                    lng: center.lng
                },
                zoom: zoom
            };
        } else {
            // Adiciona um novo keyframe
            keyframes.push({
                time: time,
                center: {
                    lat: center.lat,
                    lng: center.lng
                },
                zoom: zoom
            });
            
            // Ordena os keyframes por tempo
            keyframes.sort((a, b) => a.time - b.time);
        }
        
        console.log("Keyframe adicionado:", time, center, zoom);
        
        // Atualiza a visualização da timeline
        updateKeyframesView();
        
        // Notificar outros módulos
        document.dispatchEvent(new CustomEvent('keyframeUpdated', {
            detail: { keyframes: keyframes }
        }));
    }
    
    // Atualiza a visualização dos keyframes na timeline
    function updateKeyframesView() {
        // Limpa o conteúdo atual
        keyframesTrack.innerHTML = '';
        
        // Adiciona um elemento para cada keyframe
        keyframes.forEach((keyframe, index) => {
            const keyframeEl = document.createElement('div');
            keyframeEl.className = 'keyframe';
            keyframeEl.style.left = `${keyframe.time * TimelineModule.getTimeScale()}px`;
            keyframeEl.title = `Keyframe ${index + 1}: ${keyframe.time.toFixed(1)}s\nPos: ${keyframe.center.lat.toFixed(4)}, ${keyframe.center.lng.toFixed(4)}\nZoom: ${keyframe.zoom.toFixed(2)}`;
            keyframeEl.dataset.index = index;
            
            // Adiciona listeners para edição e exclusão
            keyframeEl.addEventListener('click', (e) => {
                e.stopPropagation();
                selectKeyframe(index);
            });
            
            keyframeEl.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (confirm(`Excluir keyframe em ${keyframe.time.toFixed(1)}s?`)) {
                    removeKeyframe(index);
                }
            });
            
            // Arrastar keyframe para ajustar o tempo
            keyframeEl.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return; // Apenas clique primário
                
                e.stopPropagation();
                const startX = e.clientX;
                const startTime = keyframe.time;
                
                const onMouseMove = (e) => {
                    const deltaX = e.clientX - startX;
                    const newTime = Math.max(0, Math.min(TimelineModule.getDuration(), 
                        startTime + deltaX / TimelineModule.getTimeScale()));
                    
                    keyframe.time = newTime;
                    keyframeEl.style.left = `${newTime * TimelineModule.getTimeScale()}px`;
                    keyframeEl.title = `Keyframe ${index + 1}: ${newTime.toFixed(1)}s\nPos: ${keyframe.center.lat.toFixed(4)}, ${keyframe.center.lng.toFixed(4)}\nZoom: ${keyframe.zoom.toFixed(2)}`;
                    
                    // Notificar outros módulos
                    document.dispatchEvent(new CustomEvent('keyframeUpdated', {
                        detail: { keyframes: keyframes }
                    }));
                };
                
                const onMouseUp = () => {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                    
                    // Reordena os keyframes após o arrastar
                    keyframes.sort((a, b) => a.time - b.time);
                    updateKeyframesView();
                };
                
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
            
            keyframesTrack.appendChild(keyframeEl);
        });
    }
    
    // Seleciona um keyframe e aplica suas configurações ao mapa
    function selectKeyframe(index) {
        if (index < 0 || index >= keyframes.length) return;
        
        const keyframe = keyframes[index];
        
        // Define o tempo atual para o tempo do keyframe
        TimelineModule.setCurrentTime(keyframe.time);
        
        // Aplica as configurações do keyframe ao mapa diretamente sem animação
        MapModule.setMapCenter([keyframe.center.lat, keyframe.center.lng]);
        MapModule.setZoom(keyframe.zoom);
        
        // Atualiza os valores de referência para a próxima animação
        lastAppliedPosition = [keyframe.center.lat, keyframe.center.lng];
        lastAppliedZoom = keyframe.zoom;
    }
    
    // Remove um keyframe
    function removeKeyframe(index) {
        if (index < 0 || index >= keyframes.length) return;
        
        keyframes.splice(index, 1);
        updateKeyframesView();
        
        // Notificar outros módulos
        document.dispatchEvent(new CustomEvent('keyframeUpdated', {
            detail: { keyframes: keyframes }
        }));
    }
    
    // Manipula eventos de atualização de tempo
    function handleTimeUpdate(e) {
        const currentTime = e.detail.time;
        
        // Se não houver keyframes, não faz nada
        if (keyframes.length === 0) return;
        
        // Encontra os keyframes anterior e posterior ao tempo atual
        const prevKeyframe = [...keyframes].reverse().find(k => k.time <= currentTime);
        const nextKeyframe = keyframes.find(k => k.time > currentTime);
        
        // Se estivermos exatamente em um keyframe, aplicamos suas configurações diretamente
        const exactKeyframe = keyframes.find(k => Math.abs(k.time - currentTime) < 0.01);
        if (exactKeyframe) {
            if (!lastAppliedPosition || 
                Math.abs(exactKeyframe.center.lat - lastAppliedPosition[0]) > 0.00001 ||
                Math.abs(exactKeyframe.center.lng - lastAppliedPosition[1]) > 0.00001 ||
                Math.abs(exactKeyframe.zoom - lastAppliedZoom) > 0.01) {
                
                applyMapState(
                    [exactKeyframe.center.lat, exactKeyframe.center.lng],
                    exactKeyframe.zoom,
                    animationInProgress
                );
                
                lastAppliedPosition = [exactKeyframe.center.lat, exactKeyframe.center.lng];
                lastAppliedZoom = exactKeyframe.zoom;
            }
            return;
        }
        
        // Se houver apenas um keyframe, usamos ele independentemente do tempo
        if (keyframes.length === 1) {
            const onlyKeyframe = keyframes[0];
            
            if (!lastAppliedPosition || 
                Math.abs(onlyKeyframe.center.lat - lastAppliedPosition[0]) > 0.00001 ||
                Math.abs(onlyKeyframe.center.lng - lastAppliedPosition[1]) > 0.00001 ||
                Math.abs(onlyKeyframe.zoom - lastAppliedZoom) > 0.01) {
                
                applyMapState(
                    [onlyKeyframe.center.lat, onlyKeyframe.center.lng],
                    onlyKeyframe.zoom,
                    animationInProgress
                );
                
                lastAppliedPosition = [onlyKeyframe.center.lat, onlyKeyframe.center.lng];
                lastAppliedZoom = onlyKeyframe.zoom;
            }
            return;
        }
        
        // Se não houver keyframe anterior, usamos o primeiro keyframe
        if (!prevKeyframe) {
            prevKeyframe = keyframes[0];
        }
        
        // Se não houver keyframe posterior, usamos o último keyframe
        if (!nextKeyframe) {
            nextKeyframe = keyframes[keyframes.length - 1];
        }
        
        // Se os keyframes anterior e posterior forem o mesmo, apenas aplicamos esse estado
        if (prevKeyframe === nextKeyframe) {
            if (!lastAppliedPosition || 
                Math.abs(prevKeyframe.center.lat - lastAppliedPosition[0]) > 0.00001 ||
                Math.abs(prevKeyframe.center.lng - lastAppliedPosition[1]) > 0.00001 ||
                Math.abs(prevKeyframe.zoom - lastAppliedZoom) > 0.01) {
                
                applyMapState(
                    [prevKeyframe.center.lat, prevKeyframe.center.lng],
                    prevKeyframe.zoom,
                    animationInProgress
                );
                
                lastAppliedPosition = [prevKeyframe.center.lat, prevKeyframe.center.lng];
                lastAppliedZoom = prevKeyframe.zoom;
            }
            return;
        }
        
        // Calcula o progresso entre os dois keyframes com uma função de easing para suavizar
        const timeDiff = nextKeyframe.time - prevKeyframe.time;
        const rawProgress = (currentTime - prevKeyframe.time) / timeDiff;
        const progress = easing.easeInOutCubic(rawProgress);
        
        // Interpolação do centro do mapa (coordenadas geográficas)
        const lat = prevKeyframe.center.lat + (nextKeyframe.center.lat - prevKeyframe.center.lat) * progress;
        const lng = prevKeyframe.center.lng + (nextKeyframe.center.lng - prevKeyframe.center.lng) * progress;
        
        // Interpolação do zoom (pode ser não-linear para parecer mais natural)
        // Para zoom, uma interpolação linear às vezes é melhor
        const zoom = prevKeyframe.zoom + (nextKeyframe.zoom - prevKeyframe.zoom) * progress;
        
        // Verifica se a posição ou zoom mudaram o suficiente para aplicar
        // Isso evita atualizações desnecessárias que podem causar tremores
        if (!lastAppliedPosition || 
            Math.abs(lat - lastAppliedPosition[0]) > 0.00001 ||
            Math.abs(lng - lastAppliedPosition[1]) > 0.00001 ||
            Math.abs(zoom - lastAppliedZoom) > 0.01) {
            
            // Aplica as configurações interpoladas
            applyMapState([lat, lng], zoom, animationInProgress);
            
            // Atualiza os valores aplicados por último
            lastAppliedPosition = [lat, lng];
            lastAppliedZoom = zoom;
        }
    }
    
    // Aplica um novo estado ao mapa (posição e zoom)
    function applyMapState(center, zoom, animate) {
        // Verifica se o centro é válido
        if (!center || center.length !== 2 || isNaN(center[0]) || isNaN(center[1])) {
            console.error('Coordenadas inválidas:', center);
            return;
        }
        
        // Verifica se o zoom é válido
        if (isNaN(zoom)) {
            console.error('Zoom inválido:', zoom);
            return;
        }
        
        // Primeiro atualiza o zoom e depois o centro para evitar problemas
        if (animate) {
            // Se estiver animando, usa fly para uma transição suave
            MapModule.map().flyTo(center, zoom, {
                duration: 0.25, // Tempo reduzido para movimentos mais suaves
                easeLinearity: 0.5,
                animate: true,
                noMoveStart: true // Evita que eventos desnecessários sejam disparados
            });
        } else {
            // Se não estiver animando, aplica diretamente
            MapModule.setZoom(zoom);
            MapModule.setMapCenter(center);
        }
    }
    
    // API pública
    return {
        init: init,
        addCurrentStateAsKeyframe: addCurrentStateAsKeyframe,
        getKeyframes: function() { return keyframes; }
    };
})();