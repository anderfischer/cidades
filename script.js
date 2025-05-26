document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const fileInput = document.getElementById('arquivo');
    const fileNameElement = document.getElementById('file-name');
    const errorElement = document.getElementById('error');
    const errorTextElement = document.getElementById('error-text');
    const previewContainer = document.getElementById('preview-container');
    const previewElement = document.getElementById('preview');
    const previewOriginalElement = document.getElementById('preview-original');
    const downloadBtn = document.getElementById('download-btn');
    const charsToRemoveInput = document.getElementById('chars-to-remove');
    const btnRemoveChars = document.getElementById('btn-remove-chars');
    const removeAccentsCheckbox = document.getElementById('remove-accents');
    const removeSpecialCharsCheckbox = document.getElementById('remove-special-chars');
    const removeNumbersCheckbox = document.getElementById('remove-numbers');
    const trimSpacesCheckbox = document.getElementById('trim-spaces');
    const removeDuplicatesCheckbox = document.getElementById('remove-duplicates');
    const removeEmptyLinesCheckbox = document.getElementById('remove-empty-lines');
    const directTextInput = document.getElementById('direct-text-input');
    const processTextBtn = document.getElementById('process-text-btn');
    const previewLinesSelect = document.getElementById('preview-lines');
    const encodingSelect = document.getElementById('encoding-select');
    const findTextInput = document.getElementById('find-text');
    const replaceTextInput = document.getElementById('replace-text');
    const useRegexCheckbox = document.getElementById('use-regex');
    const caseNoneRadio = document.getElementById('case-none');
    const caseUpperRadio = document.getElementById('case-upper');
    const caseLowerRadio = document.getElementById('case-lower');
    const caseCapitalizeRadio = document.getElementById('case-capitalize');
    const loadingOverlay = document.getElementById('loading-overlay');
    const yearElement = document.getElementById('year');
    
    // Variáveis de estado
    let currentFileContent = '';
    let currentFileName = '';
    let originalContent = '';
    let processingTimeout = null;
    
    // Inicialização
    yearElement.textContent = new Date().getFullYear();
    
    // Event Listeners
    fileInput.addEventListener('change', handleFileUpload);
    btnRemoveChars.addEventListener('click', updatePreview);
    processTextBtn.addEventListener('click', processDirectText);
    previewLinesSelect.addEventListener('change', updatePreviewLines);
    
    // Adiciona debounce para campos de texto
    charsToRemoveInput.addEventListener('input', debounce(updatePreview, 500));
    findTextInput.addEventListener('input', debounce(updatePreview, 500));
    replaceTextInput.addEventListener('input', debounce(updatePreview, 500));
    
    // Adiciona listeners para checkboxes e radio buttons
    const allCheckboxes = [
        removeAccentsCheckbox, removeSpecialCharsCheckbox, removeNumbersCheckbox, 
        trimSpacesCheckbox, removeDuplicatesCheckbox, removeEmptyLinesCheckbox,
        useRegexCheckbox
    ];
    
    const allRadios = [
        caseNoneRadio, caseUpperRadio, caseLowerRadio, caseCapitalizeRadio
    ];
    
    allCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updatePreview);
    });
    
    allRadios.forEach(radio => {
        radio.addEventListener('change', updatePreview);
    });
    
    // Funções principais
    function handleFileUpload(e) {
        const file = e.target.files[0];
        
        // Reset
        resetUI();
        
        if (file) {
            currentFileName = file.name;
            fileNameElement.textContent = `Arquivo selecionado: ${file.name}`;
            
            showLoading();
            
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    originalContent = e.target.result;
                    currentFileContent = originalContent;
                    updatePreview();
                } catch (err) {
                    showError('Erro ao processar o arquivo: ' + err.message);
                    console.error(err);
                } finally {
                    hideLoading();
                }
            };
            
            reader.onerror = function() {
                showError('Erro ao ler o arquivo. Tente novamente.');
                hideLoading();
            };
            
            // Usar a codificação selecionada
            const encoding = encodingSelect.value;
            reader.readAsText(file, encoding);
        } else {
            fileNameElement.textContent = 'Nenhum arquivo selecionado';
            currentFileContent = '';
            originalContent = '';
        }
    }
    
    function processDirectText() {
        const text = directTextInput.value.trim();
        
        if (!text) {
            showError('Por favor, insira algum texto para processar.');
            return;
        }
        
        resetUI();
        originalContent = text;
        currentFileContent = text;
        currentFileName = 'texto_colado.txt';
        updatePreview();
    }
    
    function updatePreview() {
        if (!originalContent) {
            showError('Nenhum texto disponível para processar');
            return;
        }
        
        clearTimeout(processingTimeout);
        
        processingTimeout = setTimeout(() => {
            showLoading();
            
            try {
                const processed = processText(originalContent);
                currentFileContent = processed;
                
                // Determinar quantas linhas mostrar
                const linesToShow = getLinesToShow();
                
                // Mostrar conteúdo original
                const originalLines = originalContent.split('\n').slice(0, linesToShow).join('\n');
                previewOriginalElement.textContent = originalLines;
                
                // Mostrar conteúdo processado
                const processedLines = processed.split('\n').slice(0, linesToShow).join('\n');
                previewElement.textContent = processedLines;
                
                previewContainer.style.display = 'block';
                
                // Configurar botão de download
                downloadBtn.onclick = function() {
                    const ext = currentFileName.includes('.') ? currentFileName.split('.').pop() : 'txt';
                    const baseName = currentFileName.includes('.') ? 
                        currentFileName.substring(0, currentFileName.lastIndexOf('.')) : 
                        currentFileName;
                    const newName = `${baseName}_processado.${ext}`;
                    downloadFile(processed, newName);
                };
            } catch (err) {
                showError('Erro ao processar o texto: ' + err.message);
                console.error(err);
            } finally {
                hideLoading();
            }
        }, 0);
    }
    
    function processText(text) {
        let result = text;
        
        // Remover caracteres específicos
        const charsToRemove = charsToRemoveInput.value;
        if (charsToRemove) {
            const regex = new RegExp(`[${escapeRegExp(charsToRemove)}]`, 'g');
            result = result.replace(regex, '');
        }
        
        // Remover acentos
        if (removeAccentsCheckbox.checked) {
            result = result.normalize('NFD')
                           .replace(/[\u0300-\u036f]/g, '')
                           .normalize('NFC');
        }
        
        // Remover caracteres especiais
        if (removeSpecialCharsCheckbox.checked) {
            result = result.replace(/[^\w\s\n]/g, '');
        }
        
        // Remover números
        if (removeNumbersCheckbox.checked) {
            result = result.replace(/[0-9]/g, '');
        }
        
        // Remover espaços extras
        if (trimSpacesCheckbox.checked) {
            result = result.split('\n').map(line => line.trim()).join('\n');
        }
        
        // Localizar e substituir
        if (findTextInput.value) {
            const findText = findTextInput.value;
            const replaceText = replaceTextInput.value || '';
            
            if (useRegexCheckbox.checked) {
                try {
                    const regex = new RegExp(findText, 'g');
                    result = result.replace(regex, replaceText);
                } catch (err) {
                    throw new Error(`Expressão regular inválida: ${err.message}`);
                }
            } else {
                // Escape de caracteres especiais em texto literal
                const escapedFindText = escapeRegExp(findText);
                const regex = new RegExp(escapedFindText, 'g');
                result = result.replace(regex, replaceText);
            }
        }
        
        // Conversão de caixa
        if (caseUpperRadio.checked) {
            result = result.toUpperCase();
        } else if (caseLowerRadio.checked) {
            result = result.toLowerCase();
        } else if (caseCapitalizeRadio.checked) {
            result = result.split('\n').map(line => {
                return line.split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
            }).join('\n');
        }
        
        // Remover linhas duplicadas
        if (removeDuplicatesCheckbox.checked) {
            const lines = result.split('\n');
            const uniqueLines = [...new Set(lines)];
            result = uniqueLines.join('\n');
        }
        
        // Remover linhas em branco
        if (removeEmptyLinesCheckbox.checked) {
            const lines = result.split('\n');
            const nonEmptyLines = lines.filter(line => line.trim() !== '');
            result = nonEmptyLines.join('\n');
        }
        
        return result;
    }
    
    function updatePreviewLines() {
        if (originalContent) {
            updatePreview();
        }
    }
    
    function getLinesToShow() {
        const selectedValue = previewLinesSelect.value;
        if (selectedValue === 'all') {
            return Infinity;
        }
        return parseInt(selectedValue, 10);
    }
    
    // Funções utilitárias
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    function showError(message) {
        errorTextElement.textContent = message;
        errorElement.style.display = 'flex';
        
        // Acessibilidade: anunciar erro para leitores de tela
        errorElement.setAttribute('role', 'alert');
        
        // Auto-esconder após 5 segundos
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }
    
    function resetUI() {
        errorElement.style.display = 'none';
        previewContainer.style.display = 'none';
    }
    
    function downloadFile(content, filename) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }
    
    function showLoading() {
        loadingOverlay.style.display = 'flex';
    }
    
    function hideLoading() {
        loadingOverlay.style.display = 'none';
    }
    
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Verificar se há suporte para Web Workers
    if (window.Worker) {
        // Implementação futura: mover processamento pesado para Web Workers
        console.log('Web Workers suportados neste navegador');
    }
    
    // Verificar se há dados salvos no localStorage
    try {
        const savedSettings = localStorage.getItem('textCleanerSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            
            // Restaurar configurações
            if (settings.removeAccents !== undefined) removeAccentsCheckbox.checked = settings.removeAccents;
            if (settings.removeSpecialChars !== undefined) removeSpecialCharsCheckbox.checked = settings.removeSpecialChars;
            if (settings.removeNumbers !== undefined) removeNumbersCheckbox.checked = settings.removeNumbers;
            if (settings.trimSpaces !== undefined) trimSpacesCheckbox.checked = settings.trimSpaces;
            if (settings.removeDuplicates !== undefined) removeDuplicatesCheckbox.checked = settings.removeDuplicates;
            if (settings.removeEmptyLines !== undefined) removeEmptyLinesCheckbox.checked = settings.removeEmptyLines;
            if (settings.charsToRemove !== undefined) charsToRemoveInput.value = settings.charsToRemove;
            if (settings.encoding !== undefined) encodingSelect.value = settings.encoding;
            
            console.log('Configurações restauradas do localStorage');
        }
    } catch (err) {
        console.error('Erro ao restaurar configurações:', err);
    }
    
    // Salvar configurações quando alteradas
    function saveSettings() {
        try {
            const settings = {
                removeAccents: removeAccentsCheckbox.checked,
                removeSpecialChars: removeSpecialCharsCheckbox.checked,
                removeNumbers: removeNumbersCheckbox.checked,
                trimSpaces: trimSpacesCheckbox.checked,
                removeDuplicates: removeDuplicatesCheckbox.checked,
                removeEmptyLines: removeEmptyLinesCheckbox.checked,
                charsToRemove: charsToRemoveInput.value,
                encoding: encodingSelect.value
            };
            
            localStorage.setItem('textCleanerSettings', JSON.stringify(settings));
        } catch (err) {
            console.error('Erro ao salvar configurações:', err);
        }
    }
    
    // Adicionar evento para salvar configurações quando alteradas
    allCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', saveSettings);
    });
    
    charsToRemoveInput.addEventListener('change', saveSettings);
    encodingSelect.addEventListener('change', saveSettings);
});
