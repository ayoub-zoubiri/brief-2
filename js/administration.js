let allRequests = [];
let currentPage = 1;
let itemsPerPage = 100;

document.addEventListener('DOMContentLoaded', function () {
  loadPage();
});

async function loadPage() {
  await loadRequests();
  showStats();
  showRequests();
  setupButtons();
}

async function loadRequests() {
  allRequests = await getAllLeaveRequests();
  // Show last created requests first (reverse order)
  allRequests.reverse();
}

function showStats() {
  let pending = 0;
  let approved = 0;
  let rejected = 0;

  for (let i = 0; i < allRequests.length; i++) {
    if (allRequests[i].status === 'pending') pending++;
    if (allRequests[i].status === 'approved') approved++;
    if (allRequests[i].status === 'rejected') rejected++;
  }

  const statCards = document.querySelectorAll('.text-2xl.font-semibold');
  if (statCards.length >= 4) {
    statCards[0].textContent = pending;
    statCards[1].textContent = approved;
    statCards[2].textContent = rejected;
    statCards[3].textContent = allRequests.length;
  }
}

function showRequests() {
  const container = document.querySelector('.grid.grid-cols-2.gap-4');
  if (!container) return;

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageRequests = allRequests.slice(start, end);

  let html = '';
  for (let i = 0; i < pageRequests.length; i++) {
    html += createRequestCard(pageRequests[i]);
  }
  container.innerHTML = html;
}

function createRequestCard(request) {
  const canModify = request.status === 'pending';
  return `
        <div class="bg-white rounded-md p-4 shadow-sm">
            <div class="flex justify-between items-center mb-2">
                <div class="flex items-center space-x-2">
                    <div>
                        <div class="font-medium">${request.employeeName}</div>
                        <div class="text-sm text-gray-600">Employé</div>
                    </div>
                </div>
                <span class="px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(request.status)}">
                    ${getStatusText(request.status)}
                </span>
            </div>
            <div class="text-sm text-gray-700 mb-4">
                <div>Type: ${request.type}</div>
                <div>Du: ${new Date(request.startDate).toLocaleDateString('fr-FR')}</div>
                <div>Au: ${new Date(request.endDate).toLocaleDateString('fr-FR')}</div>
                <div>Durée: ${request.duration}</div>
            </div>
            ${getActionButtons(request, canModify)}
        </div>
    `;
}

function getStatusClass(status) {
  if (status === 'pending') return 'bg-yellow-100 text-yellow-800';
  if (status === 'approved') return 'bg-green-100 text-green-800';
  if (status === 'rejected') return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
}

function getStatusText(status) {
  if (status === 'pending') return 'En attente';
  if (status === 'approved') return 'Approuvé';
  if (status === 'rejected') return 'Refusé';
  return status;
}

function getActionButtons(request, canModify) {
  if (canModify) {
    return `
            <div class="flex space-x-2">
                <button class="approve-btn flex-1 px-4 py-2 bg-green-500 text-white rounded-full" data-id="${request.id}">
                    Approuver
                </button>
                <button class="reject-btn flex-1 px-4 py-2 bg-red-500 text-white rounded-full" data-id="${request.id}">
                    Refuser
                </button>
            </div>
        `;
  }
  return '';
}

function setupButtons() {
  document.addEventListener('click', function (event) {
    if (event.target.classList.contains('approve-btn')) {
      const id = event.target.dataset.id;
      approveRequest(id);
    }
    if (event.target.classList.contains('reject-btn')) {
      const id = event.target.dataset.id;
      rejectRequest(id);
    }
  });
}

async function approveRequest(id) {
  let request = null;
  for (let i = 0; i < allRequests.length; i++) {
    if (String(allRequests[i].id) === String(id)) {
      request = allRequests[i];
      break;
    }
  }

  if (!request) return;

  if (confirm('Approuver la demande de ' + request.employeeName + ' ?')) {
    request.status = 'approved';
    request.approvedBy = 'Manager';
    await updateLeaveRequest(id, request);

    if (request.type !== 'Congés maladie') {
      await updateBalance(request);
    }

    await loadRequests();
    showStats();
    showRequests();
    alert('Demande approuvée');
  }
}

async function rejectRequest(id) {
  let request = null;
  for (let i = 0; i < allRequests.length; i++) {
    if (String(allRequests[i].id) === String(id)) {
      request = allRequests[i];
      break;
    }
  }

  if (!request) return;

  const reason = prompt('Motif du refus:');
  if (reason !== null) {
    request.status = 'rejected';
    request.rejectedBy = 'Manager';
    request.rejectionReason = reason;
    await updateLeaveRequest(id, request);

    await loadRequests();
    showStats();
    showRequests();
    alert('Demande refusée');
  }
}

async function updateBalance(request) {
  const user = await getUser(String(request.userId));
  const days = parseInt(request.duration.match(/\d+/)[0]);

  if (request.type === 'Congés payés') {
    user.vacationBalance.paidTimeOff -= days;
  } else if (request.type === 'RTT') {
    user.vacationBalance.rtt -= days;
  }

  await updateUser(String(request.userId), user);
}