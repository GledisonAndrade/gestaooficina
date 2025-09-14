// Configuração inicial
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar o tema
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.classList.toggle('dark-theme', savedTheme === 'dark');
    updateThemeButton(savedTheme);
    
    // Inicializar dados
    initData();
    
    // Carregar e exibir dados
    loadOSData();
    loadGarantiaData();
    updateDashboard();
    setupEventListeners();
    
    // Inicializar gráfico
    initChart();
});

// Estrutura de dados
let osData = [];
let garantiaData = [];
let currentCameraTarget = null;
let currentPhoto = null;
let servicesChart = null;

// Inicializar dados se não existirem
function initData() {
    if (!localStorage.getItem('osData')) {
        localStorage.setItem('osData', JSON.stringify([]));
    } else {
        osData = JSON.parse(localStorage.getItem('osData'));
    }
    
    if (!localStorage.getItem('garantiaData')) {
        localStorage.setItem('garantiaData', JSON.stringify([]));
    } else {
        garantiaData = JSON.parse(localStorage.getItem('garantiaData'));
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Navegação
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            switchSection(target);
        });
    });
    
    // Tema
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    
    // Modal Sobre
    document.getElementById('about-btn').addEventListener('click', function() {
        document.getElementById('about-modal').classList.add('active');
    });
    
    // Fechar modais
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').classList.remove('active');
        });
    });
    
    // OS
    document.getElementById('nova-os').addEventListener('click', function() {
        openOSModal();
    });
    
    document.getElementById('os-form').addEventListener('submit', saveOS);
    document.getElementById('cancel-os').addEventListener('click', function() {
        document.getElementById('os-modal').classList.remove('active');
    });
    
    // Garantia
    document.getElementById('nova-garantia').addEventListener('click', function() {
        openGarantiaModal();
    });
    
    document.getElementById('garantia-form').addEventListener('submit', saveGarantia);
    document.getElementById('cancel-garantia').addEventListener('click', function() {
        document.getElementById('garantia-modal').classList.remove('active');
    });
    
    // Câmera
    document.getElementById('add-foto-problema').addEventListener('click', function() {
        openCamera('problema');
    });
    
    document.getElementById('add-foto-solucao').addEventListener('click', function() {
        openCamera('solucao');
    });
    
    document.getElementById('capture-btn').addEventListener('click', capturePhoto);
    document.getElementById('retake-btn').addEventListener('click', retakePhoto);
    document.getElementById('use-photo-btn').addEventListener('click', usePhoto);
    
    // Filtros de relatório
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            updateChart(this.getAttribute('data-period'));
        });
    });
    
    // Fechar modais clicando fora
    window.addEventListener('click', function(event) {
        document.querySelectorAll('.modal').forEach(modal => {
            if (event.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// Alternar entre seções
function switchSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    document.getElementById(sectionId).classList.add('active');
    document.querySelector(`[data-target="${sectionId}"]`).classList.add('active');
    
    if (sectionId === 'relatorios') {
        updateChart('week');
    }
}

// Alternar tema
function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeButton(isDark ? 'dark' : 'light');
}

function updateThemeButton(theme) {
    const icon = document.querySelector('#theme-toggle i');
    const text = document.querySelector('#theme-toggle');
    
    if (theme === 'dark') {
        icon.className = 'fas fa-sun';
        text.innerHTML = '<i class="fas fa-sun"></i> Tema';
    } else {
        icon.className = 'fas fa-moon';
        text.innerHTML = '<i class="fas fa-moon"></i> Tema';
    }
}

// Gerenciamento de OS
function openOSModal(osId = null) {
    const modal = document.getElementById('os-modal');
    const form = document.getElementById('os-form');
    const title = document.getElementById('modal-os-title');
    
    if (osId) {
        // Modo edição
        title.textContent = 'Editar Ordem de Serviço';
        const os = osData.find(item => item.id === osId);
        
        if (os) {
            document.getElementById('os-id').value = os.id;
            document.getElementById('cliente').value = os.cliente;
            document.getElementById('veiculo').value = os.veiculo;
            document.getElementById('placa').value = os.placa;
            document.getElementById('mecanico').value = os.mecanico;
            document.getElementById('diagnostico').value = os.diagnostico || '';
            document.getElementById('hora-inicio').value = os.horaInicio || '';
            document.getElementById('hora-fim').value = os.horaFim || '';
            document.getElementById('solucao').value = os.solucao || '';
        }
    } else {
        // Modo novo
        title.textContent = 'Nova Ordem de Serviço';
        form.reset();
        document.getElementById('os-id').value = '';
        document.getElementById('hora-inicio').value = new Date().toISOString().slice(0, 16);
    }
    
    modal.classList.add('active');
}

function saveOS(e) {
    e.preventDefault();
    
    const osId = document.getElementById('os-id').value;
    const os = {
        cliente: document.getElementById('cliente').value,
        veiculo: document.getElementById('veiculo').value,
        placa: document.getElementById('placa').value,
        mecanico: document.getElementById('mecanico').value,
        diagnostico: document.getElementById('diagnostico').value,
        horaInicio: document.getElementById('hora-inicio').value,
        horaFim: document.getElementById('hora-fim').value,
        solucao: document.getElementById('solucao').value,
        status: document.getElementById('hora-fim').value ? 'finalizada' : 'aberta',
        dataCriacao: osId ? osData.find(item => item.id === osId).dataCriacao : new Date().toISOString(),
        dataAtualizacao: new Date().toISOString()
    };
    
    if (osId) {
        // Atualizar OS existente
        os.id = osId;
        const index = osData.findIndex(item => item.id === osId);
        if (index !== -1) {
            osData[index] = os;
        }
    } else {
        // Nova OS
        os.id = Date.now().toString();
        osData.push(os);
    }
    
    // Salvar no localStorage
    localStorage.setItem('osData', JSON.stringify(osData));
    
    // Atualizar interface
    loadOSData();
    updateDashboard();
    
    // Fechar modal
    document.getElementById('os-modal').classList.remove('active');
}

function loadOSData() {
    const container = document.getElementById('os-list');
    container.innerHTML = '';
    
    osData.forEach(os => {
        const osElement = document.createElement('div');
        osElement.className = 'item-card';
        
        osElement.innerHTML = `
            <div class="item-header">
                <h3>${os.veiculo} - ${os.placa}</h3>
                <span class="status">${os.status === 'finalizada' ? 'Finalizada' : 'Aberta'}</span>
            </div>
            <div class="item-body">
                <div class="item-detail">
                    <strong>Cliente:</strong> ${os.cliente}
                </div>
                <div class="item-detail">
                    <strong>Mecânico:</strong> ${os.mecanico}
                </div>
                ${os.diagnostico ? `
                <div class="item-detail">
                    <strong>Diagnóstico:</strong> ${os.diagnostico}
                </div>` : ''}
                ${os.horaInicio ? `
                <div class="item-detail">
                    <strong>Início:</strong> ${formatDateTime(os.horaInicio)}
                </div>` : ''}
                ${os.horaFim ? `
                <div class="item-detail">
                    <strong>Término:</strong> ${formatDateTime(os.horaFim)}
                </div>` : ''}
                ${os.solucao ? `
                <div class="item-detail">
                    <strong>Solução:</strong> ${os.solucao}
                </div>` : ''}
            </div>
            <div class="item-footer">
                <button class="btn btn-primary edit-os" data-id="${os.id}">
                    <i class="fas fa-edit"></i> Editar
                </button>
                ${os.status === 'finalizada' ? 
                    `<button class="btn btn-warning pdf-os" data-id="${os.id}">
                        <i class="fas fa-file-pdf"></i> PDF
                    </button>` : 
                    `<button class="btn btn-success finalizar-os" data-id="${os.id}">
                        <i class="fas fa-check"></i> Finalizar
                    </button>`
                }
                <button class="btn btn-danger delete-os" data-id="${os.id}">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;
        
        container.appendChild(osElement);
    });
    
    // Adicionar event listeners aos botões
    document.querySelectorAll('.edit-os').forEach(btn => {
        btn.addEventListener('click', function() {
            openOSModal(this.getAttribute('data-id'));
        });
    });
    
    document.querySelectorAll('.finalizar-os').forEach(btn => {
        btn.addEventListener('click', function() {
            finalizarOS(this.getAttribute('data-id'));
        });
    });
    
    document.querySelectorAll('.delete-os').forEach(btn => {
        btn.addEventListener('click', function() {
            deleteOS(this.getAttribute('data-id'));
        });
    });
    
    document.querySelectorAll('.pdf-os').forEach(btn => {
        btn.addEventListener('click', function() {
            generatePDF(this.getAttribute('data-id'), 'os');
        });
    });
}

function finalizarOS(osId) {
    const os = osData.find(item => item.id === osId);
    if (os) {
        os.status = 'finalizada';
        os.horaFim = new Date().toISOString();
        os.dataAtualizacao = new Date().toISOString();
        
        localStorage.setItem('osData', JSON.stringify(osData));
        loadOSData();
        updateDashboard();
    }
}

function deleteOS(osId) {
    if (confirm('Tem certeza que deseja excluir esta ordem de serviço?')) {
        osData = osData.filter(item => item.id !== osId);
        localStorage.setItem('osData', JSON.stringify(osData));
        loadOSData();
        updateDashboard();
    }
}

// Gerenciamento de Garantias
function openGarantiaModal(garantiaId = null) {
    const modal = document.getElementById('garantia-modal');
    const form = document.getElementById('garantia-form');
    const title = document.getElementById('modal-garantia-title');
    
    // Limpar fotos containers
    document.getElementById('fotos-problema').innerHTML = '';
    document.getElementById('fotos-solucao').innerHTML = '';
    
    if (garantiaId) {
        // Modo edição
        title.textContent = 'Editar Garantia';
        const garantia = garantiaData.find(item => item.id === garantiaId);
        
        if (garantia) {
            document.getElementById('garantia-id').value = garantia.id;
            document.getElementById('garantia-cliente').value = garantia.cliente;
            document.getElementById('garantia-veiculo').value = garantia.veiculo;
            document.getElementById('garantia-placa').value = garantia.placa;
            document.getElementById('garantia-mecanico').value = garantia.mecanico;
            document.getElementById('garantia-diagnostico').value = garantia.diagnostico || '';
            document.getElementById('garantia-hora-inicio').value = garantia.horaInicio || '';
            document.getElementById('garantia-hora-fim').value = garantia.horaFim || '';
            document.getElementById('garantia-solucao').value = garantia.solucao || '';
            
            // Carregar fotos do problema
            if (garantia.fotosProblema) {
                garantia.fotosProblema.forEach((foto, index) => {
                    addFotoToContainer(foto, 'problema', index);
                });
            }
            
            // Carregar fotos da solução
            if (garantia.fotosSolucao) {
                garantia.fotosSolucao.forEach((foto, index) => {
                    addFotoToContainer(foto, 'solucao', index);
                });
            }
        }
    } else {
        // Modo novo
        title.textContent = 'Nova Garantia';
        form.reset();
        document.getElementById('garantia-id').value = '';
        document.getElementById('garantia-hora-inicio').value = new Date().toISOString().slice(0, 16);
    }
    
    modal.classList.add('active');
}

function saveGarantia(e) {
    e.preventDefault();
    
    const garantiaId = document.getElementById('garantia-id').value;
    
    // Coletar fotos
    const fotosProblema = [];
    document.querySelectorAll('#fotos-problema .photo-item img').forEach(img => {
        fotosProblema.push(img.src);
    });
    
    const fotosSolucao = [];
    document.querySelectorAll('#fotos-solucao .photo-item img').forEach(img => {
        fotosSolucao.push(img.src);
    });
    
    const garantia = {
        cliente: document.getElementById('garantia-cliente').value,
        veiculo: document.getElementById('garantia-veiculo').value,
        placa: document.getElementById('garantia-placa').value,
        mecanico: document.getElementById('garantia-mecanico').value,
        diagnostico: document.getElementById('garantia-diagnostico').value,
        horaInicio: document.getElementById('garantia-hora-inicio').value,
        horaFim: document.getElementById('garantia-hora-fim').value,
        solucao: document.getElementById('garantia-solucao').value,
        fotosProblema: fotosProblema,
        fotosSolucao: fotosSolucao,
        status: document.getElementById('garantia-hora-fim').value ? 'finalizada' : 'aberta',
        dataCriacao: garantiaId ? garantiaData.find(item => item.id === garantiaId).dataCriacao : new Date().toISOString(),
        dataAtualizacao: new Date().toISOString()
    };
    
    if (garantiaId) {
        // Atualizar garantia existente
        garantia.id = garantiaId;
        const index = garantiaData.findIndex(item => item.id === garantiaId);
        if (index !== -1) {
            garantiaData[index] = garantia;
        }
    } else {
        // Nova garantia
        garantia.id = Date.now().toString();
        garantiaData.push(garantia);
    }
    
    // Salvar no localStorage
    localStorage.setItem('garantiaData', JSON.stringify(garantiaData));
    
    // Atualizar interface
    loadGarantiaData();
    updateDashboard();
    
    // Fechar modal
    document.getElementById('garantia-modal').classList.remove('active');
}

function loadGarantiaData() {
    const container = document.getElementById('garantia-list');
    container.innerHTML = '';
    
    garantiaData.forEach(garantia => {
        const garantiaElement = document.createElement('div');
        garantiaElement.className = 'item-card';
        
        let fotosProblemaHTML = '';
        if (garantia.fotosProblema && garantia.fotosProblema.length > 0) {
            fotosProblemaHTML = `
                <div class="item-detail">
                    <strong>Fotos do Problema:</strong>
                    <div class="photos-container">
                        ${garantia.fotosProblema.map(foto => 
                            `<img src="${foto}" alt="Foto do problema" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">`
                        ).join('')}
                    </div>
                </div>
            `;
        }
        
        let fotosSolucaoHTML = '';
        if (garantia.fotosSolucao && garantia.fotosSolucao.length > 0) {
            fotosSolucaoHTML = `
                <div class="item-detail">
                    <strong>Fotos da Solução:</strong>
                    <div class="photos-container">
                        ${garantia.fotosSolucao.map(foto => 
                            `<img src="${foto}" alt="Foto da solução" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">`
                        ).join('')}
                    </div>
                </div>
            `;
        }
        
        garantiaElement.innerHTML = `
            <div class="item-header">
                <h3>${garantia.veiculo} - ${garantia.placa}</h3>
                <span class="status">${garantia.status === 'finalizada' ? 'Finalizada' : 'Aberta'}</span>
            </div>
            <div class="item-body">
                <div class="item-detail">
                    <strong>Cliente:</strong> ${garantia.cliente}
                </div>
                <div class="item-detail">
                    <strong>Mecânico:</strong> ${garantia.mecanico}
                </div>
                ${garantia.diagnostico ? `
                <div class="item-detail">
                    <strong>Diagnóstico:</strong> ${garantia.diagnostico}
                </div>` : ''}
                ${garantia.horaInicio ? `
                <div class="item-detail">
                    <strong>Início:</strong> ${formatDateTime(garantia.horaInicio)}
                </div>` : ''}
                ${garantia.horaFim ? `
                <div class="item-detail">
                    <strong>Término:</strong> ${formatDateTime(garantia.horaFim)}
                </div>` : ''}
                ${garantia.solucao ? `
                <div class="item-detail">
                    <strong>Solução:</strong> ${garantia.solucao}
                </div>` : ''}
                ${fotosProblemaHTML}
                ${fotosSolucaoHTML}
            </div>
            <div class="item-footer">
                <button class="btn btn-primary edit-garantia" data-id="${garantia.id}">
                    <i class="fas fa-edit"></i> Editar
                </button>
                ${garantia.status === 'finalizada' ? 
                    `<button class="btn btn-warning pdf-garantia" data-id="${garantia.id}">
                        <i class="fas fa-file-pdf"></i> PDF
                    </button>` : 
                    `<button class="btn btn-success finalizar-garantia" data-id="${garantia.id}">
                        <i class="fas fa-check"></i> Finalizar
                    </button>`
                }
                <button class="btn btn-danger delete-garantia" data-id="${garantia.id}">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;
        
        container.appendChild(garantiaElement);
    });
    
    // Adicionar event listeners aos botões
    document.querySelectorAll('.edit-garantia').forEach(btn => {
        btn.addEventListener('click', function() {
            openGarantiaModal(this.getAttribute('data-id'));
        });
    });
    
    document.querySelectorAll('.finalizar-garantia').forEach(btn => {
        btn.addEventListener('click', function() {
            finalizarGarantia(this.getAttribute('data-id'));
        });
    });
    
    document.querySelectorAll('.delete-garantia').forEach(btn => {
        btn.addEventListener('click', function() {
            deleteGarantia(this.getAttribute('data-id'));
        });
    });
    
    document.querySelectorAll('.pdf-garantia').forEach(btn => {
        btn.addEventListener('click', function() {
            generatePDF(this.getAttribute('data-id'), 'garantia');
        });
    });
}

function finalizarGarantia(garantiaId) {
    const garantia = garantiaData.find(item => item.id === garantiaId);
    if (garantia) {
        garantia.status = 'finalizada';
        garantia.horaFim = new Date().toISOString();
        garantia.dataAtualizacao = new Date().toISOString();
        
        localStorage.setItem('garantiaData', JSON.stringify(garantiaData));
        loadGarantiaData();
        updateDashboard();
    }
}

function deleteGarantia(garantiaId) {
    if (confirm('Tem certeza que deseja excluir esta garantia?')) {
        garantiaData = garantiaData.filter(item => item.id !== garantiaId);
        localStorage.setItem('garantiaData', JSON.stringify(garantiaData));
        loadGarantiaData();
        updateDashboard();
    }
}

// Câmera
function openCamera(target) {
    currentCameraTarget = target;
    const modal = document.getElementById('camera-modal');
    modal.classList.add('active');
    
    // Reset camera UI
    document.getElementById('capture-btn').style.display = 'block';
    document.getElementById('retake-btn').style.display = 'none';
    document.getElementById('use-photo-btn').style.display = 'none';
    document.getElementById('canvas').style.display = 'none';
    
    // Iniciar câmera
    startCamera();
}

function startCamera() {
    const video = document.getElementById('video');
    
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function(stream) {
                video.srcObject = stream;
                video.play();
            })
            .catch(function(error) {
                alert('Não foi possível acessar a câmera: ' + error.message);
            });
    } else {
        alert('Seu navegador não suporta acesso à câmera');
    }
}

function capturePhoto() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    
    // Configurar canvas com as dimensões do vídeo
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Desenhar o frame atual no canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Parar a câmera
    stopCamera();
    
    // Mostrar a foto capturada
    currentPhoto = canvas.toDataURL('image/png');
    
    // Atualizar UI
    document.getElementById('capture-btn').style.display = 'none';
    document.getElementById('retake-btn').style.display = 'block';
    document.getElementById('use-photo-btn').style.display = 'block';
    document.getElementById('canvas').style.display = 'block';
}

function retakePhoto() {
    // Reiniciar a câmera
    startCamera();
    
    // Atualizar UI
    document.getElementById('capture-btn').style.display = 'block';
    document.getElementById('retake-btn').style.display = 'none';
    document.getElementById('use-photo-btn').style.display = 'none';
    document.getElementById('canvas').style.display = 'none';
}

function usePhoto() {
    if (currentPhoto && currentCameraTarget) {
        addFotoToContainer(currentPhoto, currentCameraTarget);
    }
    
    // Fechar a câmera
    document.getElementById('camera-modal').classList.remove('active');
    stopCamera();
}

function stopCamera() {
    const video = document.getElementById('video');
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }
}

function addFotoToContainer(photoData, target, index = null) {
    const container = document.getElementById(`fotos-${target}`);
    const fotoId = index !== null ? `${target}-${index}` : `${target}-${Date.now()}`;
    
    const fotoElement = document.createElement('div');
    fotoElement.className = 'photo-item';
    fotoElement.innerHTML = `
        <img src="${photoData}" alt="Foto">
        <div class="remove-photo" data-id="${fotoId}">×</div>
    `;
    
    container.appendChild(fotoElement);
    
    // Adicionar event listener para remover foto
    fotoElement.querySelector('.remove-photo').addEventListener('click', function() {
        container.removeChild(fotoElement);
    });
}

// Dashboard
function updateDashboard() {
    const osAbertas = osData.filter(os => os.status === 'aberta').length;
    const osFinalizadas = osData.filter(os => os.status === 'finalizada').length;
    const garantiasAbertas = garantiaData.filter(g => g.status === 'aberta').length;
    const garantiasFinalizadas = garantiaData.filter(g => g.status === 'finalizada').length;
    
    document.getElementById('count-os-abertas').textContent = osAbertas;
    document.getElementById('count-os-finalizadas').textContent = osFinalizadas;
    document.getElementById('count-garantias-abertas').textContent = garantiasAbertas;
    document.getElementById('count-garantias-finalizadas').textContent = garantiasFinalizadas;
}

// Gráficos
function initChart() {
    const ctx = document.getElementById('services-chart').getContext('2d');
    servicesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Ordens de Serviço',
                data: [],
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }, {
                label: 'Garantias',
                data: [],
                backgroundColor: 'rgba(255, 206, 86, 0.5)',
                borderColor: 'rgba(255, 206, 86, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updateChart(period) {
    let labels = [];
    let osCounts = [];
    let garantiaCounts = [];
    
    const now = new Date();
    
    if (period === 'week') {
        // Últimos 7 dias
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(now.getDate() - i);
            labels.push(formatDate(date));
            
            const dateStr = date.toISOString().split('T')[0];
            osCounts.push(
                osData.filter(os => os.dataCriacao.split('T')[0] === dateStr).length
            );
            garantiaCounts.push(
                garantiaData.filter(g => g.dataCriacao.split('T')[0] === dateStr).length
            );
        }
    } else {
        // Últimos 30 dias (agrupado por semana)
        for (let i = 3; i >= 0; i--) {
            const startDate = new Date();
            startDate.setDate(now.getDate() - (i + 1) * 7);
            const endDate = new Date();
            endDate.setDate(now.getDate() - i * 7);
            
            labels.push(`Semana ${4 - i}`);
            
            osCounts.push(
                osData.filter(os => {
                    const osDate = new Date(os.dataCriacao);
                    return osDate >= startDate && osDate < endDate;
                }).length
            );
            
            garantiaCounts.push(
                garantiaData.filter(g => {
                    const gDate = new Date(g.dataCriacao);
                    return gDate >= startDate && gDate < endDate;
                }).length
            );
        }
    }
    
    servicesChart.data.labels = labels;
    servicesChart.data.datasets[0].data = osCounts;
    servicesChart.data.datasets[1].data = garantiaCounts;
    servicesChart.update();
}

// PDF
function generatePDF(id, type) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    let data;
    let title;
    
    if (type === 'os') {
        data = osData.find(item => item.id === id);
        title = 'Ordem de Serviço';
    } else {
        data = garantiaData.find(item => item.id === id);
        title = 'Garantia';
    }
    
    if (!data) return;
    
    // Adicionar título
    doc.setFontSize(20);
    doc.text(title, 105, 15, { align: 'center' });
    
    // Adicionar informações
    doc.setFontSize(12);
    let y = 30;
    
    doc.text(`Cliente: ${data.cliente}`, 20, y);
    y += 10;
    doc.text(`Veículo: ${data.veiculo}`, 20, y);
    y += 10;
    doc.text(`Placa: ${data.placa}`, 20, y);
    y += 10;
    doc.text(`Mecânico: ${data.mecanico}`, 20, y);
    y += 10;
    
    if (data.diagnostico) {
        // Quebra de linha para texto longo
        const splitDiagnostico = doc.splitTextToSize(`Diagnóstico: ${data.diagnostico}`, 170);
        doc.text(splitDiagnostico, 20, y);
        y += splitDiagnostico.length * 7;
    }
    
    if (data.horaInicio) {
        doc.text(`Início: ${formatDateTime(data.horaInicio)}`, 20, y);
        y += 10;
    }
    
    if (data.horaFim) {
        doc.text(`Término: ${formatDateTime(data.horaFim)}`, 20, y);
        y += 10;
    }
    
    if (data.solucao) {
        // Quebra de linha para texto longo
        const splitSolution = doc.splitTextToSize(`Solução: ${data.solucao}`, 170);
        doc.text(splitSolution, 20, y);
        y += splitSolution.length * 7;
    }
    
    // Adicionar fotos se for uma garantia
    if (type === 'garantia' && data.fotosProblema && data.fotosProblema.length > 0) {
        doc.text('Fotos do Problema:', 20, y);
        y += 10;
        
        // Adicionar as fotos (apenas a primeira para exemplo)
        if (data.fotosProblema[0]) {
            try {
                doc.addImage(data.fotosProblema[0], 'JPEG', 20, y, 50, 50);
                y += 60;
            } catch (e) {
                console.error('Erro ao adicionar imagem:', e);
            }
        }
    }
    
    // Salvar o PDF
    doc.save(`${type}_${data.placa}_${formatDate(new Date())}.pdf`);
}

// Utilitários
function formatDateTime(dateTimeString) {
    if (!dateTimeString) return '';
    
    const date = new Date(dateTimeString);
    return date.toLocaleString('pt-BR');
}

function formatDate(date) {
    return date.toLocaleDateString('pt-BR');
}