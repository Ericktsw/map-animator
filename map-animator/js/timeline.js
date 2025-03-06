/**
 * Módulo de timeline
 * Responsável pela timeline de 15 segundos e controle de tempo
 */
const TimelineModule = (function() {
    // Variáveis privadas
    let duration = 15; // Duração em segundos
    let currentTime = 0;
    let playing = false;
    let playInterval = null;
    let timeScale = 100; // Pixels por segundo
    
    // Referências para elementos DOM
    let timelineEl;
    let playheadEl;
    let currentTimeEl;
    let rulerEl;
    
    // Inicializa a timeline
    function init() {
        timelineEl = document.querySelector('.timeline');
        playheadEl = document.querySelector('.playhead');
        currentTimeEl = document.getElementById('current-time');
        rulerEl = document.querySelector('.timeline-ruler');
        
        // Cria os marcadores de tempo na régua
        createTimeMarkers();
        
        // Adiciona listeners de eventos
        timelineEl.addEventListener('mousedown', handleTimelineClick);
        document.getElementById('play-btn').addEventListener('click', togglePlay);
        document.getElementById('stop-btn').addEventListener('click', stop);
        document.getElementById('zoom-in').addEventListener('click', zoomIn);
        document.getElementById('zoom-out').addEventListener('click', zoomOut);
        
        // Atualiza a visualização inicial
        updatePlayhead();
        updateCurrentTimeDisplay();
    }
    
    // Cria os marcadores de tempo na régua
    function createTimeMarkers() {
        rulerEl.innerHTML = '';
        
        // Determina o intervalo entre marcadores baseado no timeScale
        const interval = timeScale <= 50 ? 5 : (timeScale <= 100 ? 1 : 0.5);
        
        for (let i = 0; i <= duration; i += interval) {
            const marker = document.createElement('div');
            marker.className = 'time-mark';
            marker.style.left = `${i * timeScale}px`;
            
            // Adiciona um label com o tempo (somente nos segundos inteiros)
            if (Math.abs(i - Math.round(i)) < 0.01) {
                const label = document.createElement('span');
                label.className = 'time-mark-label';
                label.textContent = `${i}s`;
                marker.appendChild(label);
            }
            
            rulerEl.appendChild(marker);
        }
        
        // Ajusta a largura da timeline para acomodar toda a duração
        timelineEl.style.width = `${duration * timeScale}px`;
    }
    
    // Manipula cliques na timeline para alterar o tempo atual
    function handleTimelineClick(e) {
        if (playing) {
            stop();
        }
        
        const rect = timelineEl.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        
        // Calcula o tempo com base na posição do clique
        setCurrentTime((clickX / timeScale));
        
        // Inicia o arrastar da playhead
        const onMouseMove = function(e) {
            const moveX = e.clientX - rect.left;
            setCurrentTime(Math.max(0, Math.min(duration, moveX / timeScale)));
        };
        
        const onMouseUp = function() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }
    
    // Alterna entre reprodução e pausa
    function togglePlay() {
        if (playing) {
            stop();
        } else {
            play();
        }
    }
    
    // Inicia a reprodução
    function play() {
        if (playing) return;
        
        // Se já estiver no final, volta ao início
        if (currentTime >= duration) {
            setCurrentTime(0);
        }
        
        playing = true;
        
        // Atualiza a UI
        document.getElementById('play-btn').innerHTML = '<i class="fas fa-pause"></i>';
        
        // Configura o intervalo para atualizar a cada 1/60 segundo (60fps)
        const frameInterval = 1000 / 60;
        let lastTime = performance.now();
        
        playInterval = setInterval(() => {
            const now = performance.now();
            const deltaTime = (now - lastTime) / 1000; // Converte para segundos
            lastTime = now;
            
            // Avança o tempo
            const newTime = currentTime + deltaTime;
            
            if (newTime >= duration) {
                setCurrentTime(duration);
                stop();
                return;
            }
            
            setCurrentTime(newTime);
        }, frameInterval);
        
        // Notificar outros módulos
        document.dispatchEvent(new CustomEvent('playbackStarted'));
    }
    
    // Para a reprodução
    function stop() {
        if (!playing) return;
        
        playing = false;
        clearInterval(playInterval);
        playInterval = null;
        
        // Atualiza a UI
        document.getElementById('play-btn').innerHTML = '<i class="fas fa-play"></i>';
        
        // Notificar outros módulos
        document.dispatchEvent(new CustomEvent('playbackStopped'));
    }
    
    // Define o tempo atual
    function setCurrentTime(time) {
        currentTime = Math.max(0, Math.min(duration, time));
        updatePlayhead();
        updateCurrentTimeDisplay();
        
        // Notificar outros módulos
        document.dispatchEvent(new CustomEvent('timeUpdate', {
            detail: { time: currentTime }
        }));
    }
    
    // Obtém o tempo atual
    function getCurrentTime() {
        return currentTime;
    }
    
    // Atualiza a posição da playhead
    function updatePlayhead() {
        playheadEl.style.left = `${currentTime * timeScale}px`;
    }
    
    // Atualiza o display do tempo atual
    function updateCurrentTimeDisplay() {
        currentTimeEl.textContent = `${currentTime.toFixed(1)}s`;
    }
    
    // Aumenta o zoom da timeline
    function zoomIn() {
        if (timeScale >= 300) return; // Limite máximo de zoom
        
        timeScale += 25;
        createTimeMarkers();
        updatePlayhead();
    }
    
    // Diminui o zoom da timeline
    function zoomOut() {
        if (timeScale <= 50) return; // Limite mínimo de zoom
        
        timeScale -= 25;
        createTimeMarkers();
        updatePlayhead();
    }
    
    // Retorna a escala de tempo atual (pixels por segundo)
    function getTimeScale() {
        return timeScale;
    }
    
    // Retorna a duração total da animação
    function getDuration() {
        return duration;
    }
    
    // API pública
    return {
        init: init,
        play: play,
        stop: stop,
        togglePlay: togglePlay,
        setCurrentTime: setCurrentTime,
        getCurrentTime: getCurrentTime,
        getTimeScale: getTimeScale,
        getDuration: getDuration
    };
})();