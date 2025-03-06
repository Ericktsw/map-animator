/**
 * Módulo de Países
 * Gerencia a funcionalidade de adicionar países
 */
const CountriesModule = (function() {
    // Cache para os dados dos países já carregados
    let countriesCache = {};
    
    // Referência para o elemento de resultados de pesquisa
    let countryResults;
    
    // URL para o repositório no GitHub com os dados GeoJSON dos países
    const countriesRepo = 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson';
    
    // Inicializa o módulo
    function init() {
        // Adiciona os listeners de eventos para os botões
        document.getElementById('add-country-btn').addEventListener('click', toggleCountrySearch);
        document.getElementById('import-geojson-btn').addEventListener('click', handleImportGeoJSON);
        
        // Configuração para o input de pesquisa de países
        const countrySearchInput = document.getElementById('country-search-input');
        countryResults = document.getElementById('country-results');
        
        countrySearchInput.addEventListener('input', handleCountrySearch);
        
        // Listener para detectar cliques fora da caixa de pesquisa para fechá-la
        document.addEventListener('click', function(e) {
            const countrySearch = document.querySelector('.country-search');
            const addCountryBtn = document.getElementById('add-country-btn');
            
            if (!countrySearch.contains(e.target) && e.target !== addCountryBtn) {
                countrySearch.classList.add('hidden');
            }
        });
        
        // Configuração para o input de arquivo GeoJSON
        const geojsonInput = document.getElementById('geojson-input');
        geojsonInput.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    try {
                        const geojsonData = JSON.parse(e.target.result);
                        MapModule.addGeoJSON(geojsonData);
                    } catch (error) {
                        console.error('Erro ao processar o arquivo GeoJSON:', error);
                        alert('Erro ao processar o arquivo. Verifique se é um GeoJSON válido.');
                    }
                };
                
                reader.readAsText(file);
            }
        });
    }
    
    // Alterna a visibilidade da caixa de pesquisa de países
    function toggleCountrySearch() {
        const countrySearch = document.querySelector('.country-search');
        countrySearch.classList.toggle('hidden');
        
        if (!countrySearch.classList.contains('hidden')) {
            document.getElementById('country-search-input').focus();
            
            // Carrega a lista de países se ainda não estiver no cache
            if (!countriesCache.list) {
                loadCountriesList();
            }
        }
    }
    
    // Carrega a lista de países do GeoJSON
    function loadCountriesList() {
        fetch(countriesRepo)
            .then(response => response.json())
            .then(data => {
                // Cria uma lista simples de países
                countriesCache.geojson = data;
                countriesCache.list = data.features.map(feature => ({
                    name: feature.properties.ADMIN || feature.properties.name,
                    code: feature.properties.ISO_A3 || feature.properties.iso_a3,
                    id: feature.id
                }));
                
                // Ordena alfabeticamente
                countriesCache.list.sort((a, b) => a.name.localeCompare(b.name));
            })
            .catch(error => {
                console.error('Erro ao carregar lista de países:', error);
                alert('Não foi possível carregar a lista de países. Verifique sua conexão com a internet.');
            });
    }
    
    // Manipula a pesquisa de países
    function handleCountrySearch(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (!countriesCache.list) {
            countryResults.innerHTML = '<div class="country-item">Carregando lista de países...</div>';
            return;
        }
        
        if (searchTerm.length < 2) {
            countryResults.innerHTML = '';
            return;
        }
        
        // Filtra os países com base no termo de pesquisa
        const matchingCountries = countriesCache.list.filter(country => 
            country.name.toLowerCase().includes(searchTerm)
        ).slice(0, 10); // Limita a 10 resultados
        
        // Exibe os resultados
        if (matchingCountries.length > 0) {
            countryResults.innerHTML = matchingCountries.map(country => 
                `<div class="country-item" data-code="${country.code}">${country.name}</div>`
            ).join('');
            
            // Adiciona listeners de clique para os itens
            document.querySelectorAll('.country-item').forEach(item => {
                item.addEventListener('click', function() {
                    addSelectedCountry(this.dataset.code);
                });
            });
        } else {
            countryResults.innerHTML = '<div class="country-item">Nenhum país encontrado</div>';
        }
    }
    
    // Adiciona o país selecionado ao mapa
    function addSelectedCountry(countryCode) {
        // Fecha a caixa de pesquisa
        document.querySelector('.country-search').classList.add('hidden');
        
        if (!countriesCache.geojson) {
            alert('Dados dos países ainda não foram carregados. Tente novamente em instantes.');
            return;
        }
        
        // Encontra o país pelo código
        const country = countriesCache.geojson.features.find(feature => 
            (feature.properties.ISO_A3 === countryCode || feature.properties.iso_a3 === countryCode)
        );
        
        if (!country) {
            alert('País não encontrado nos dados.');
            return;
        }
        
        // Adiciona o país ao mapa
        MapModule.addCountry({
            geometry: country.geometry,
            properties: {
                name: country.properties.ADMIN || country.properties.name,
                iso_a2: country.properties.ISO_A2 || country.properties.iso_a2
            }
        });
    }
    
    // Manipula a importação de arquivo GeoJSON
    function handleImportGeoJSON() {
        document.getElementById('geojson-input').click();
    }
    
    // API pública
    return {
        init: init
    };
})();