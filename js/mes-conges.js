let currentUser = { id: 1 };
let requests = [];

document.addEventListener('DOMContentLoaded', function () {
  loadPage();
});

async function loadPage() {
  await loadUser();
  await loadRequests();
  setupButtons();
}

async function loadUser() {
  const user = await getUser('1');
  currentUser.name = user.name;
  currentUser.vacationBalance = user.vacationBalance;
}

async function loadRequests() {
  requests = await getUserLeaveRequests(currentUser.id);
  showStats();
  showRequests();
}

function showStats() {
  let approved = 0;
  let pending = 0;
  let rejected = 0;

  for (let i = 0; i < requests.length; i++) {
    if (requests[i].status === 'approved') approved++;
    if (requests[i].status === 'pending') pending++;
    if (requests[i].status === 'rejected') rejected++;
  }

  // Calculate remaining balance
  let remainingBalance = 0;
  if (currentUser.vacationBalance) {
    remainingBalance = currentUser.vacationBalance.paidTimeOff + currentUser.vacationBalance.rtt;
  }

  const statCards = document.querySelectorAll('.text-3xl.font-semibold');
  if (statCards.length >= 4) {
    statCards[0].textContent = remainingBalance;
    statCards[1].textContent = approved;
    statCards[2].textContent = pending;
    statCards[3].textContent = rejected;
  }
}

function showRequests() {
  // Show last created requests first (reverse order)
  requests.reverse();

  const headers = document.querySelectorAll('h2');
  let container = null;
  for (let i = 0; i < headers.length; i++) {
    if (headers[i].textContent.includes('Historique')) {
      container = headers[i].parentElement;
      break;
    }
  }

  if (!container) return;

  const header = container.querySelector('h2');
  container.innerHTML = '';
  container.appendChild(header);

  for (let i = 0; i < requests.length; i++) {
    const request = requests[i];
    const div = document.createElement('div');
    div.className = 'bg-white rounded-xl p-6 mb-4 flex items-center justify-between';
    div.innerHTML = `
            <div class="flex flex-col">
                <div class="text-black text-lg font-semibold mb-2">${request.type}</div>
                <div class="text-gray-600 text-sm">Du ${new Date(request.startDate).toLocaleDateString('fr-FR')}</div>
                <div class="text-gray-600 text-sm">Au ${new Date(request.endDate).toLocaleDateString('fr-FR')}</div>
            </div>
            <div class="flex-1 text-center">
                <div class="text-gray-600 text-sm">Durée</div>
                <div class="text-black font-semibold">${request.duration}</div>
            </div>
            <div class="flex-1 text-center">
                <div class="text-gray-600 text-sm">Status</div>
                <div class="font-semibold">${getStatusText(request.status)}</div>
            </div>
            ${getActionButtons(request)}
        `;
    container.appendChild(div);
  }
}

function getStatusText(status) {
  if (status === 'pending') return 'En attente';
  if (status === 'approved') return 'Approuvé';
  if (status === 'rejected') return 'Refusé';
  return status;
}

function getActionButtons(request) {
  if (request.status === 'pending') {
    return `
            <div class="flex space-x-2">
                <button class="edit-btn bg-gray-200 text-black py-2 px-4 rounded-full text-sm" data-id="${request.id}">
                    Modifier
                </button>
                <button class="cancel-btn bg-red-500 text-white py-2 px-4 rounded-full text-sm" data-id="${request.id}">
                    Annuler
                </button>
            </div>
        `;
  }
  return '';
}

function setupButtons() {
  document.addEventListener('click', function (event) {
    if (event.target.classList.contains('edit-btn')) {
      const id = event.target.dataset.id;
      window.location.href = 'Demande_de_conge.html?edit=' + id;
    }
    if (event.target.classList.contains('cancel-btn')) {
      const id = event.target.dataset.id;
      if (confirm('Annuler cette demande ?')) {
        cancelRequest(id);
      }
    }
  });
}

async function cancelRequest(id) {
  await deleteLeaveRequest(id);
  await loadRequests();
  alert('Demande annulée');
}