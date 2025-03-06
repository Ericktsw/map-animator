/**
 * Módulo Principal
 * Inicializa e coordena todos os outros módulos do aplicativo
 */
document.addEventListener('DOMContentLoaded', function() {
    // Inicializa todos os módulos
    MapModule.init();
    TimelineModule.init();
    KeyframesModule.init();
    LayersModule.init();
    CountriesModule.init();
    ExportModule.init();
    
    console.log('Map Animator inicializado com sucesso!');
    
    // Função para verificar e tratar erros na aplicação
    window.onerror = function(message, source, lineno, colno, error) {
        console.error('Erro detectado:', error);
        
        // Exibe mensagem de erro mais amigável para o usuário
        let errorMessage = 'Ocorreu um erro na aplicação.';
        
        if (message.includes('Leaflet') || source.includes('leaflet')) {
            errorMessage = 'Erro relacionado ao mapa. Tente recarregar a página.';
        } else if (message.includes('CORS') || message.includes('cross-origin')) {
            errorMessage = 'Erro de acesso a recursos externos. Alguns elementos podem não funcionar corretamente.';
        } else if (message.includes('FFmpeg')) {
            errorMessage = 'Erro ao processar o vídeo. A exportação pode não funcionar corretamente.';
        }
        
        // Previne erros causados por exportação interrompida
        if (ExportModule.isExporting) {
            errorMessage = 'A exportação do vídeo foi interrompida. Tente novamente.';
        }
        
        if (!document.querySelector('.error-notification')) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-notification';
            errorDiv.innerHTML = `
                <div class="error-message">${errorMessage}</div>
                <button class="error-close">×</button>
            `;
            document.body.appendChild(errorDiv);
            
            // Adiciona funcionalidade para fechar a notificação
            errorDiv.querySelector('.error-close').addEventListener('click', function() {
                errorDiv.remove();
            });
            
            // Remove a notificação após 10 segundos
            setTimeout(() => {
                if (document.contains(errorDiv)) {
                    errorDiv.remove();
                }
            }, 10000);
        }
        
        return true; // Permite que o erro seja capturado pelo navegador também
    };
});

// Adiciona alguns estilos CSS para notificações de erro
(function() {
    const style = document.createElement('style');
    style.textContent = `
        .error-notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: #f44336;
            color: white;
            padding: 15px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            animation: slideIn 0.3s forwards;
        }
        
        .error-message {
            margin-right: 15px;
        }
        
        .error-close {
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
        }
    `;
    document.head.appendChild(style);
   /**
 * Módulo Principal
 * Inicializa e coordena todos os outros módulos do aplicativo
 */
document.addEventListener('DOMContentLoaded', function() {
    // Configura idioma para controles do Leaflet.draw
    if (L.drawLocal) {
        L.drawLocal.draw.toolbar.buttons.polyline = 'Desenhar linha';
        L.drawLocal.draw.toolbar.buttons.polygon = 'Desenhar polígono';
        L.drawLocal.draw.toolbar.actions.title = 'Cancelar desenho';
        L.drawLocal.draw.toolbar.actions.text = 'Cancelar';
        L.drawLocal.draw.toolbar.finish.title = 'Finalizar desenho';
        L.drawLocal.draw.toolbar.finish.text = 'Concluir';
        L.drawLocal.edit.toolbar.buttons.edit = 'Editar camadas';
        L.drawLocal.edit.toolbar.buttons.editDisabled = 'Nenhuma camada para editar';
        L.drawLocal.edit.toolbar.buttons.remove = 'Excluir camadas';
        L.drawLocal.edit.toolbar.buttons.removeDisabled = 'Nenhuma camada para excluir';
    }
    
    // Inicializa todos os módulos
    MapModule.init();
    TimelineModule.init();
    KeyframesModule.init();
    LayersModule.init();
    CountriesModule.init();
    ExportModule.init();
    
    console.log('Map Animator inicializado com sucesso!');
    
    // Função para verificar e tratar erros na aplicação
    window.onerror = function(message, source, lineno, colno, error) {
        console.error('Erro detectado:', error);
        
        // Exibe mensagem de erro mais amigável para o usuário
        let errorMessage = 'Ocorreu um erro na aplicação.';
        
        if (message.includes('Leaflet') || source.includes('leaflet')) {
            errorMessage = 'Erro relacionado ao mapa. Tente recarregar a página.';
        } else if (message.includes('CORS') || message.includes('cross-origin')) {
            errorMessage = 'Erro de acesso a recursos externos. Alguns elementos podem não funcionar corretamente.';
        } else if (message.includes('FFmpeg')) {
            errorMessage = 'Erro ao processar o vídeo. A exportação pode não funcionar corretamente.';
        }
        
        // Previne erros causados por exportação interrompida
        if (ExportModule.isExporting) {
            errorMessage = 'A exportação do vídeo foi interrompida. Tente novamente.';
        }
        
        if (!document.querySelector('.error-notification')) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-notification';
            errorDiv.innerHTML = `
                <div class="error-message">${errorMessage}</div>
                <button class="error-close">×</button>
            `;
            document.body.appendChild(errorDiv);
            
            // Adiciona funcionalidade para fechar a notificação
            errorDiv.querySelector('.error-close').addEventListener('click', function() {
                errorDiv.remove();
            });
            
            // Remove a notificação após 10 segundos
            setTimeout(() => {
                if (document.contains(errorDiv)) {
                    errorDiv.remove();
                }
            }, 10000);
        }
        
        return true; // Permite que o erro seja capturado pelo navegador também
    };
});

// Adiciona alguns estilos CSS para notificações de erro
(function() {
    const style = document.createElement('style');
    style.textContent = `
        .error-notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: #f44336;
            color: white;
            padding: 15px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            animation: slideIn 0.3s forwards;
        }
        
        .error-message {
            margin-right: 15px;
        }
        
        .error-close {
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
        }
    `;
    document.head.appendChild(style);
})();
})();