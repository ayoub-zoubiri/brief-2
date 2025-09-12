let currentUser = { id: 1 };
let notifications = [];
let currentNotificationIndex = 0;

document.addEventListener('DOMContentLoaded', function () {
  loadDashboard();
});

async function loadDashboard() {
  await loadUser();
  await loadNotifications();
  await loadBalance();
  await loadUserRequests();
  setupButtons();
}

async function loadUser() {
  const user = await getUser('1');
  currentUser.name = user.name;
}

async function loadNotifications() {
  notifications = await getAllNotifications();
  showNotification();
}

function showNotification() {
  const container = document.getElementById('notifications-container');
  if (notifications.length > 0) {
    const notification = notifications[currentNotificationIndex];
    container.innerHTML = `
            <div class="flex-1 px-6">
                <h3 class="font-semibold text-lg mb-2">${notification.title}</h3>
                <p class="text-gray-700 mb-2">${notification.message}</p>
                <p class="text-sm text-gray-500">${currentNotificationIndex + 1} / ${notifications.length}</p>
            </div>
        `;
  } else {
    container.innerHTML = `
            <div class="flex-1 px-6">
                <p class="text-gray-600">Aucune notification disponible</p>
            </div>
        `;
  }
}

async function loadBalance() {
  const user = await getUser('1');
  const container = document.getElementById('balance-container');
  if (user.vacationBalance) {
    container.innerHTML = `
            <div class="space-y-2">
                <div class="flex justify-between">
                    <span class="text-sm text-gray-600">Congés payés:</span>
                    <span class="font-semibold">${user.vacationBalance.paidTimeOff} jours</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-sm text-gray-600">RTT:</span>
                    <span class="font-semibold">${user.vacationBalance.rtt} jours</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-sm text-gray-600">Congés maladie:</span>
                    <span class="font-semibold text-blue-600">Illimité</span>
                </div>
            </div>
        `;
  }
}

function setupButtons() {
  const btnPrev = document.getElementById('btn-n1');
  const btnNext = document.getElementById('btn-n2');

  if (btnPrev) {
    btnPrev.addEventListener('click', function () {
      showPreviousNotification();
    });
  }

  if (btnNext) {
    btnNext.addEventListener('click', function () {
      showNextNotification();
    });
  }
}

function showPreviousNotification() {
  if (notifications.length > 0) {
    currentNotificationIndex = currentNotificationIndex - 1;
    if (currentNotificationIndex < 0) {
      currentNotificationIndex = notifications.length - 1;
    }
    showNotification();
  }
}

function showNextNotification() {
  if (notifications.length > 0) {
    currentNotificationIndex = currentNotificationIndex + 1;
    if (currentNotificationIndex >= notifications.length) {
      currentNotificationIndex = 0;
    }
    showNotification();
  }
}

async function loadUserRequests() {
  const requests = await getUserLeaveRequests(currentUser.id);
  showPendingRequests(requests);
  showUpcomingLeaves(requests);
}

function showPendingRequests(requests) {
  const pendingRequests = requests.filter(function (request) {
    return request.status === 'pending';
  });

  // Find container by looking for the specific text
  const allElements = document.querySelectorAll('*');
  let pendingContainer = null;

  for (let i = 0; i < allElements.length; i++) {
    const element = allElements[i];
    if (element.textContent && element.textContent.trim() === 'Demandes en cours' && element.tagName !== 'SCRIPT') {
      // Find the parent container that has the gray background
      let parent = element.parentElement;
      while (parent && !parent.className.includes('bg-')) {
        parent = parent.parentElement;
      }
      if (parent) {
        pendingContainer = parent;
        break;
      }
    }
  }

  if (pendingContainer) {
    // Keep the header and icon, add content below
    const existingContent = pendingContainer.innerHTML;
    let newContent = existingContent;

    if (pendingRequests.length > 0) {
      for (let i = 0; i < Math.min(pendingRequests.length, 2); i++) {
        const request = pendingRequests[i];
        newContent += `
                    <div class="mt-2 p-2 bg-white rounded text-sm">
                        <div class="font-medium">${request.type}</div>
                        <div class="text-xs text-gray-600">${new Date(request.startDate).toLocaleDateString('fr-FR')} - ${request.duration}</div>
                    </div>
                `;
      }
    } else {
      newContent += '<div class="mt-2 text-sm text-gray-600">Aucune demande en cours</div>';
    }

    pendingContainer.innerHTML = newContent;
  }
}

function showUpcomingLeaves(requests) {
  const today = new Date();
  const approvedRequests = requests.filter(function (request) {
    return request.status === 'approved' && new Date(request.startDate) > today;
  });

  // Sort by start date
  approvedRequests.sort(function (a, b) {
    return new Date(a.startDate) - new Date(b.startDate);
  });

  // Find container by looking for the specific text
  const allElements = document.querySelectorAll('*');
  let upcomingContainer = null;

  for (let i = 0; i < allElements.length; i++) {
    const element = allElements[i];
    if (element.textContent && element.textContent.trim() === 'Prochains congés' && element.tagName !== 'SCRIPT') {
      // Find the parent container that has the gray background
      let parent = element.parentElement;
      while (parent && !parent.className.includes('bg-')) {
        parent = parent.parentElement;
      }
      if (parent) {
        upcomingContainer = parent;
        break;
      }
    }
  }

  if (upcomingContainer) {
    // Keep the header and icon, add content below
    const existingContent = upcomingContainer.innerHTML;
    let newContent = existingContent;

    if (approvedRequests.length > 0) {
      for (let i = 0; i < Math.min(approvedRequests.length, 2); i++) {
        const request = approvedRequests[i];
        newContent += `
                    <div class="mt-2 p-2 bg-white rounded text-sm">
                        <div class="font-medium">${request.type}</div>
                        <div class="text-xs text-gray-600">${new Date(request.startDate).toLocaleDateString('fr-FR')} - ${request.duration}</div>
                    </div>
                `;
      }
    } else {
      newContent += '<div class="mt-2 text-sm text-gray-600">Aucun congé prévu</div>';
    }

    upcomingContainer.innerHTML = newContent;
  }
}