function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('d-none');
        section.style.opacity = 0; // Reset for animation
    });
    const activeSection = document.getElementById(`${sectionId}-content`);
    if (activeSection) {
        activeSection.classList.remove('d-none');
        // Trigger reflow for animation
        void activeSection.offsetWidth;
        activeSection.style.opacity = 1;
    }

    document.querySelectorAll('#sidebar .nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.section === sectionId) {
            link.classList.add('active');
        }
    });
}

function populateSelect(selectId, items, valueField, textField, defaultOptionText = "Select...") {
    const select = document.getElementById(selectId);
    select.innerHTML = `<option value="">${defaultOptionText}</option>`;
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item[valueField];
        option.textContent = item[textField];
        select.appendChild(option);
    });
}

// --- Tournament UI ---
function renderTournamentsTable(tournaments) {
    const tbody = document.getElementById('tournaments-table-body');
    tbody.innerHTML = '';
    tournaments.forEach(t => {
        const row = tbody.insertRow();
        row.classList.add('list-item-appear');
        row.innerHTML = `
            <td>${t.name}</td>
            <td>${t.category}</td>
            <td>${t.type}</td>
            <td>${new Date(t.startDate).toLocaleDateString()} - ${new Date(t.endDate).toLocaleDateString()}</td>
            <td class="admin-only">
                <button class="btn btn-sm btn-warning edit-tournament-btn" data-id="${t.id}"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger delete-tournament-btn" data-id="${t.id}"><i class="fas fa-trash"></i></button>
            </td>
        `;
    });
    updateAdminControlsVisibility(); // Ensure admin buttons are correctly shown/hidden
}

// --- Team UI ---
function renderTeamsTable(teams) {
    const tbody = document.getElementById('teams-table-body');
    const tournaments = getItem('tournaments') || [];
    tbody.innerHTML = '';
    teams.forEach(team => {
        const tournament = tournaments.find(t => t.id === team.tournamentId);
        const row = tbody.insertRow();
        row.classList.add('list-item-appear');
        row.innerHTML = `
            <td>${team.name}</td>
            <td>${tournament ? tournament.name : 'N/A'}</td>
            <td class="admin-only">
                <button class="btn btn-sm btn-warning edit-team-btn" data-id="${team.id}"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger delete-team-btn" data-id="${team.id}"><i class="fas fa-trash"></i></button>
            </td>
        `;
    });
    updateAdminControlsVisibility();
}

// --- Player UI ---
function renderPlayersTable(players) {
    const tbody = document.getElementById('players-table-body');
    const teams = getItem('teams') || [];
    tbody.innerHTML = '';
    players.forEach(player => {
        const team = teams.find(t => t.id === player.teamId);
        const row = tbody.insertRow();
        row.classList.add('list-item-appear');
        row.innerHTML = `
            <td>${player.name}</td>
            <td>${team ? team.name : 'N/A'}</td>
            <td>${player.position}</td>
            <td>${player.number}</td>
            <td class="admin-only">
                <button class="btn btn-sm btn-warning edit-player-btn" data-id="${player.id}"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger delete-player-btn" data-id="${player.id}"><i class="fas fa-trash"></i></button>
            </td>
        `;
    });
    updateAdminControlsVisibility();
}

// --- Match UI ---
function renderMatchesTable(matches) {
    const tbody = document.getElementById('matches-table-body');
    const tournaments = getItem('tournaments') || [];
    const teams = getItem('teams') || [];
    tbody.innerHTML = '';
    matches.forEach(match => {
        const tournament = tournaments.find(t => t.id === match.tournamentId);
        const teamA = teams.find(t => t.id === match.teamAId);
        const teamB = teams.find(t => t.id === match.teamBId);
        const row = tbody.insertRow();
        row.classList.add('list-item-appear');

        let result = 'Pending';
        if (typeof match.teamAScore === 'number' && typeof match.teamBScore === 'number') {
            result = `${match.teamAScore} - ${match.teamBScore}`;
        }

        row.innerHTML = `
            <td>${tournament ? tournament.name : 'N/A'}</td>
            <td>${teamA ? teamA.name : 'N/A'}</td>
            <td>${teamB ? teamB.name : 'N/A'}</td>
            <td>${result}</td>
            <td>${match.date ? new Date(match.date).toLocaleString() : 'N/A'}</td>
            <td class="admin-only">
                <button class="btn btn-sm btn-warning edit-match-btn" data-id="${match.id}"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger delete-match-btn" data-id="${match.id}"><i class="fas fa-trash"></i></button>
            </td>
        `;
    });
    updateAdminControlsVisibility();
}


// Helper to update visibility of admin-only buttons in tables after render
function updateAdminControlsVisibility() {
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(el => {
        if (isAdmin()) {
            el.style.display = '';
        } else {
            el.style.display = 'none';
        }
    });
}


function clearModalForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
        // Clear any hidden ID fields
        const hiddenIdField = form.querySelector('input[type="hidden"]');
        if (hiddenIdField) hiddenIdField.value = '';

        // Special handling for match form stats fields
        if (formId === 'match-form') {
            document.getElementById('team-a-stats-fields').innerHTML = '';
            document.getElementById('team-b-stats-fields').innerHTML = '';
            document.getElementById('selected-team-a-name').textContent = '';
            document.getElementById('selected-team-b-name').textContent = '';
        }
    }
}

// --- Match Stats Fields UI ---
let statFieldCounter = 0;
function addMatchStatField(teamContainerId, teamId, stat = null) {
    const container = document.getElementById(teamContainerId);
    const players = (getItem('players') || []).filter(p => p.teamId === teamId);
    statFieldCounter++;

    const div = document.createElement('div');
    div.classList.add('row', 'mb-2', 'align-items-center', 'stat-entry');
    div.dataset.team = teamContainerId.includes('team-a') ? 'A' : 'B';

    let playerOptions = '<option value="">Select Player</option>';
    players.forEach(p => {
        playerOptions += `<option value="${p.id}" ${stat && stat.playerId === p.id ? 'selected' : ''}>${p.name} (#${p.number})</option>`;
    });

    div.innerHTML = `
        <div class="col-5">
            <select class="form-select form-select-sm stat-player">${playerOptions}</select>
        </div>
        <div class="col-4">
            <select class="form-select form-select-sm stat-type">
                <option value="goal" ${stat && stat.type === 'goal' ? 'selected' : ''}>Goal</option>
                <option value="assist" ${stat && stat.type === 'assist' ? 'selected' : ''}>Assist</option>
                <option value="yellow_card" ${stat && stat.type === 'yellow_card' ? 'selected' : ''}>Yellow Card</option>
                <option value="red_card" ${stat && stat.type === 'red_card' ? 'selected' : ''}>Red Card</option>
            </select>
        </div>
        <div class="col-2">
            <input type="number" class="form-control form-control-sm stat-minute" placeholder="Min" min="1" value="${stat && stat.minute ? stat.minute : ''}">
        </div>
        <div class="col-1">
            <button type="button" class="btn btn-sm btn-danger remove-stat-btn">×</button>
        </div>
    `;
    container.appendChild(div);
    div.querySelector('.remove-stat-btn').addEventListener('click', () => div.remove());
}

function getMatchStatsFromForm() {
    const stats = { teamA: [], teamB: [] };
    document.querySelectorAll('#team-a-stats-fields .stat-entry').forEach(entry => {
        const playerId = entry.querySelector('.stat-player').value;
        const type = entry.querySelector('.stat-type').value;
        const minute = entry.querySelector('.stat-minute').value;
        if (playerId && type) stats.teamA.push({ playerId, type, minute: minute ? parseInt(minute) : null });
    });
    document.querySelectorAll('#team-b-stats-fields .stat-entry').forEach(entry => {
        const playerId = entry.querySelector('.stat-player').value;
        const type = entry.querySelector('.stat-type').value;
        const minute = entry.querySelector('.stat-minute').value;
        if (playerId && type) stats.teamB.push({ playerId, type, minute: minute ? parseInt(minute) : null });
    });
    return stats;
}

function populateMatchStatsToForm(matchStats, teamAId, teamBId) {
    document.getElementById('team-a-stats-fields').innerHTML = '';
    document.getElementById('team-b-stats-fields').innerHTML = '';

    if (matchStats && matchStats.teamA) {
        matchStats.teamA.forEach(stat => addMatchStatField('team-a-stats-fields', teamAId, stat));
    }
    if (matchStats && matchStats.teamB) {
        matchStats.teamB.forEach(stat => addMatchStatField('team-b-stats-fields', teamBId, stat));
    }
}