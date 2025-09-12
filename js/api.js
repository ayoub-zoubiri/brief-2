const API_URL = 'http://localhost:4000';

async function getUser(userId) {
    const response = await fetch(API_URL + '/users/' + userId);
    return await response.json();
}

async function getAllLeaveRequests() {
    const response = await fetch(API_URL + '/leaveRequests');
    return await response.json();
}

async function getUserLeaveRequests(userId) {
    const response = await fetch(API_URL + '/leaveRequests?userId=' + userId);
    return await response.json();
}

async function createLeaveRequest(requestData) {
    const response = await fetch(API_URL + '/leaveRequests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
    });
    return await response.json();
}

async function updateLeaveRequest(requestId, requestData) {
    const response = await fetch(API_URL + '/leaveRequests/' + requestId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
    });
    return await response.json();
}

async function updateUser(userId, userData) {
    const response = await fetch(API_URL + '/users/' + userId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });
    return await response.json();
}

async function deleteLeaveRequest(requestId) {
    const response = await fetch(API_URL + '/leaveRequests/' + requestId, {
        method: 'DELETE'
    });
    return await response.json();
}

async function getAllNotifications() {
    const response = await fetch(API_URL + '/Notifications');
    return await response.json();
}