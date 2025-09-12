let currentUser = { id: 1 };
let editMode = false;
let editId = null;

document.addEventListener('DOMContentLoaded', function() {
    loadPage();
});

async function loadPage() {
    await loadUser();
    checkEditMode();
    setupForm();
    setupButtons();
    await loadRecentRequests();
    if (editMode) {
        await loadRequestForEdit();
    }
}

async function loadUser() {
    const user = await getUser('1');
    currentUser.name = user.name;
}

function checkEditMode() {
    const params = new URLSearchParams(window.location.search);
    const editParam = params.get('edit');
    if (editParam) {
        editMode = true;
        editId = editParam;
        const title = document.querySelector('h1');
        if (title) title.textContent = 'Modifier la demande';
    }
}

function setupForm() {
    const startDate = document.getElementById('start-date');
    const endDate = document.getElementById('end-date');
    if (startDate && endDate) {
        startDate.type = 'date';
        endDate.type = 'date';
        const today = new Date().toISOString().split('T')[0];
        startDate.min = today;
        endDate.min = today;
        startDate.addEventListener('change', function() {
            endDate.min = startDate.value;
        });
    }
}

function setupButtons() {
    const buttons = document.querySelectorAll('button');
    for (let i = 0; i < buttons.length; i++) {
        const button = buttons[i];
        if (button.textContent.includes('Soumettre') || button.textContent.includes('Mettre à jour')) {
            button.addEventListener('click', function() {
                submitForm();
            });
        }
        if (button.textContent.includes('Réinitialiser')) {
            button.addEventListener('click', function() {
                resetForm();
            });
        }
    }
}

async function submitForm() {
    const formData = getFormData();
    if (!formData.startDate || !formData.endDate || !formData.type) {
        alert('Veuillez remplir tous les champs');
        return;
    }
    
    try {
        if (editMode) {
            await updateLeaveRequest(editId, formData);
            alert('Demande mise à jour');
        } else {
            await createLeaveRequest(formData);
            alert('Demande créée');
        }
        window.location.href = 'mes_conges.html';
    } catch (error) {
        alert('Erreur: ' + error.message);
    }
}

function getFormData() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const type = document.getElementById('leave-type').value;
    const justification = document.getElementById('justification').value;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    return {
        userId: currentUser.id,
        employeeName: currentUser.name,
        startDate: startDate,
        endDate: endDate,
        duration: days + ' jour' + (days > 1 ? 's' : ''),
        type: type,
        status: 'pending',
        justification: justification
    };
}

async function loadRequestForEdit() {
    const requests = await getUserLeaveRequests(currentUser.id);
    // Show last created requests first (reverse order)
    requests.reverse();
    
    for (let i = 0; i < requests.length; i++) {
        if (String(requests[i].id) === String(editId)) {
            const request = requests[i];
            document.getElementById('start-date').value = request.startDate;
            document.getElementById('end-date').value = request.endDate;
            document.getElementById('leave-type').value = request.type;
            document.getElementById('justification').value = request.justification || '';
            break;
        }
    }
}

function resetForm() {
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';
    document.getElementById('leave-type').value = '';
    document.getElementById('justification').value = '';
}

async function loadRecentRequests() {
    try {
        const requests = await getUserLeaveRequests(currentUser.id);
        // Show last created requests first (reverse order)
        requests.reverse();
        
        // Take only the 3 most recent requests
        const recentRequests = requests.slice(0, 3);
        displayRecentRequests(recentRequests);
    } catch (error) {
        console.error('Erreur chargement demandes récentes:', error);
    }
}

function displayRecentRequests(requests) {
    // Find the container by looking for "Mes dernières demandes" text
    const allElements = document.querySelectorAll('*');
    let container = null;
    
    for (let i = 0; i < allElements.length; i++) {
        const element = allElements[i];
        if (element.textContent && element.textContent.includes('Mes dernières demandes') && element.tagName !== 'SCRIPT') {
            // Find the parent container
            let parent = element.parentElement;
            while (parent && !parent.className.includes('bg-')) {
                parent = parent.parentElement;
            }
            if (parent) {
                container = parent;
                break;
            }
        }
    }
    
    if (container && requests.length > 0) {
        // Keep the header, replace the content
        let html = '<h3 class="font-semibold mb-3">Mes dernières demandes</h3>';
        
        for (let i = 0; i < requests.length; i++) {
            const request = requests[i];
            const statusColor = getStatusColor(request.status);
            const statusText = getStatusText(request.status);
            
            html += `
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center space-x-3">
                        <div class="w-2 h-2 bg-black rounded-full"></div>
                        <div>
                            <div class="font-medium text-sm">${request.type}</div>
                            <div class="text-xs text-gray-600">${new Date(request.startDate).toLocaleDateString('fr-FR')} - ${new Date(request.endDate).toLocaleDateString('fr-FR')}</div>
                        </div>
                    </div>
                    <div class="text-xs font-semibold ${statusColor}">${statusText}</div>
                </div>
            `;
        }
        
        container.innerHTML = html;
    } else if (container) {
        container.innerHTML = `
            <h3 class="font-semibold mb-3">Mes dernières demandes</h3>
            <p class="text-sm text-gray-600">Aucune demande récente</p>
        `;
    }
}

function getStatusColor(status) {
    if (status === 'pending') return 'text-yellow-600';
    if (status === 'approved') return 'text-green-600';
    if (status === 'rejected') return 'text-red-600';
    return 'text-gray-600';
}

function getStatusText(status) {
    if (status === 'pending') return 'En attente';
    if (status === 'approved') return 'Approuvé';
    if (status === 'rejected') return 'Refusé';
    return status;
}