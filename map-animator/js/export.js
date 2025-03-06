/**
 * Módulo de Exportação
 * Lida com a exportação da animação para vídeo
 */
const ExportModule = (function() {
    // Variáveis de estado para a exportação
    let isExporting = false;
    let exportProgress = 0;
    let exportFrames = [];
    let ffmpeg = null;
    
    // Inicializa o módulo
    function init() {
        // Adiciona os listeners de eventos para os botões
        document.getElementById('export-btn').addEventListener('click', showExportDialog);
        
        // Configuração do diálogo de exportação
        const exportDialog = document.getElementById('export-dialog');
        
        document.querySelector('#export-dialog .close-btn').addEventListener('click', function() {
            exportDialog.classList.add('hidden');
        });
        
        document.querySelector('#export-dialog .cancel-btn').addEventListener('click', function() {
            exportDialog.classList.add('hidden');
        });
        
        document.getElementById('start-export-btn').addEventListener('click', startExport);
        
        // Carrega o FFmpeg
        loadFFmpeg();
    }
    
    // Carrega a biblioteca FFmpeg.wasm
    function loadFFmpeg() {
        // Cria uma instância do FFmpeg
        ffmpeg = new FFmpeg();
        
        // Configura os handlers para logs e progresso
        ffmpeg.setLogger(({ message }) => {
            console.log(message);
        });
        
        ffmpeg.setProgress(({ progress }) => {
            if (isExporting) {
                // Atualiza o progresso da exportação
                updateExportProgress(0.5 + progress * 0.5); // Segunda metade do progresso (50-100%)
            }
        });
        
        // Carrega os arquivos necessários
        ffmpeg.load();
    }
    
    // Mostra o diálogo de exportação
    function showExportDialog() {
        const exportDialog = document.getElementById('export-dialog');
        exportDialog.classList.remove('hidden');
        
        // Reseta o estado de exportação
        document.querySelector('.export-progress').classList.add('hidden');
        document.getElementById('export-status').textContent = '0%';
        document.querySelector('.progress-fill').style.width = '0%';
    }
    
    // Inicia o processo de exportação
    function startExport() {
        if (isExporting) return;
        isExporting = true;
        exportFrames = [];
        exportProgress = 0;
        
        // Obtém as configurações de exportação
        const width = parseInt(document.getElementById('export-width').value);
        const height = parseInt(document.getElementById('export-height').value);
        const fps = parseInt(document.getElementById('export-fps').value);
        const format = document.getElementById('export-format').value;
        
        // Validação básica
        if (width <= 0 || height <= 0 || fps <= 0) {
            alert('As dimensões e FPS precisam ser valores positivos.');
            isExporting = false;
            return;
        }
        
        // Mostra a barra de progresso
        document.querySelector('.export-options').classList.add('hidden');
        document.querySelector('.export-progress').classList.remove('hidden');
        document.getElementById('start-export-btn').disabled = true;
        
        // Para qualquer animação em execução
        TimelineModule.stop();
        
        // Configura um tamanho temporário do mapa para a exportação
        const mapContainer = document.getElementById('map-container');
        const originalWidth = mapContainer.style.width;
        const originalHeight = mapContainer.style.height;
        
        mapContainer.style.width = width + 'px';
        mapContainer.style.height = height + 'px';
        
        // Força o mapa a se ajustar ao novo tamanho
        MapModule.map().invalidateSize();
        
        // Calcula o número de frames baseado na duração e FPS
        const duration = TimelineModule.getDuration();
        const totalFrames = Math.ceil(duration * fps);
        
        // Captura cada frame
        captureFrames(0, totalFrames, fps, format, function() {
            // Restaura o tamanho original do mapa
            mapContainer.style.width = originalWidth;
            mapContainer.style.height = originalHeight;
            MapModule.map().invalidateSize();
            
            // Compila o vídeo
            compileVideo(format);
        });
    }
    
    // Captura os frames da animação
    function captureFrames(currentFrame, totalFrames, fps, format, callback) {
        if (currentFrame >= totalFrames) {
            callback();
            return;
        }
        
        const time = currentFrame / fps;
        
        // Define o tempo atual
        TimelineModule.setCurrentTime(time);
        
        // Pequeno delay para garantir que a renderização do mapa esteja completa
        setTimeout(function() {
            // Captura o frame atual
            html2canvas(document.getElementById('map-container'), {
                useCORS: true,
                allowTaint: true,
                backgroundColor: null
            }).then(function(canvas) {
                // Adiciona o canvas capturado à lista de frames
                exportFrames.push(canvas.toDataURL());
                
                // Atualiza o progresso
                updateExportProgress(currentFrame / totalFrames * 0.5); // Primeira metade do progresso (0-50%)
                
                // Captura o próximo frame
                captureFrames(currentFrame + 1, totalFrames, fps, format, callback);
            }).catch(function(error) {
                console.error('Erro ao capturar frame:', error);
                alert('Erro ao capturar frames para o vídeo.');
                isExporting = false;
                document.getElementById('start-export-btn').disabled = false;
            });
        }, 50);
    }
    
    // Compila os frames em um vídeo usando FFmpeg
    async function compileVideo(format) {
        try {
            // Verifica se o FFmpeg está pronto
            if (!ffmpeg.isLoaded()) {
                alert('FFmpeg ainda não está pronto. Aguarde alguns instantes e tente novamente.');
                isExporting = false;
                document.getElementById('start-export-btn').disabled = false;
                return;
            }
            
            // Cria um diretório para os frames
            await ffmpeg.exec(['-mkdir', 'frames']);
            
            // Salva cada frame como um arquivo
            for (let i = 0; i < exportFrames.length; i++) {
                const dataURL = exportFrames[i];
                const base64Data = dataURL.replace(/^data:image\/\w+;base64,/, '');
                const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                
                // Escreve o arquivo no sistema de arquivos virtual do FFmpeg
                const filename = `frames/frame${i.toString().padStart(5, '0')}.png`;
                await ffmpeg.writeFile(filename, buffer);
                
                // Atualiza o progresso
                updateExportProgress(0.5 + (i / exportFrames.length) * 0.3); // 50-80%
            }
            
            // Define o nome do arquivo de saída
            const outputFilename = format === 'mp4' ? 'output.mp4' : 'output.webm';
            
            // Configura o codec e opções de acordo com o formato
            let codecOptions = [];
            if (format === 'mp4') {
                codecOptions = [
                    '-c:v', 'libx264',
                    '-preset', 'medium',
                    '-crf', '23',
                    '-pix_fmt', 'yuv420p'
                ];
            } else {
                codecOptions = [
                    '-c:v', 'libvpx-vp9',
                    '-crf', '30',
                    '-b:v', '0'
                ];
            }
            
            // Executa o FFmpeg para criar o vídeo
            await ffmpeg.exec([
                '-framerate', document.getElementById('export-fps').value,
                '-i', 'frames/frame%05d.png',
                ...codecOptions,
                outputFilename
            ]);
            
            // Lê o arquivo de saída
            const data = await ffmpeg.readFile(outputFilename);
            
            // Cria um blob a partir dos dados
            const blob = new Blob([data.buffer], { type: format === 'mp4' ? 'video/mp4' : 'video/webm' });
            
            // Cria uma URL para o blob
            const url = URL.createObjectURL(blob);
            
            // Cria um link para download
            const a = document.createElement('a');
            a.href = url;
            a.download = `map_animation.${format}`;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            
            // Limpa
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
            
            // Finaliza a exportação
            updateExportProgress(1);
            setTimeout(function() {
                isExporting = false;
                document.getElementById('start-export-btn').disabled = false;
                document.querySelector('.export-options').classList.remove('hidden');
                document.querySelector('.export-progress').classList.add('hidden');
                document.getElementById('export-dialog').classList.add('hidden');
                
                // Limpa os frames para liberar memória
                exportFrames = [];
            }, 1000);
            
        } catch (error) {
            console.error('Erro ao compilar vídeo:', error);
            alert('Erro ao compilar o vídeo. Verifique o console para mais detalhes.');
            isExporting = false;
            document.getElementById('start-export-btn').disabled = false;
        }
    }
    
    // Atualiza o progresso da exportação na interface
    function updateExportProgress(progress) {
        exportProgress = progress;
        const percentage = Math.round(progress * 100);
        document.getElementById('export-status').textContent = `${percentage}%`;
        document.querySelector('.progress-fill').style.width = `${percentage}%`;
    }
    
    // API pública
    return {
        init: init
    };
})();