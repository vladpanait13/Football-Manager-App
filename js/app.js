document.addEventListener('DOMContentLoaded', () => {
    // Initial check
    if (!checkAuth()) {
        // If not authenticated, setup login/register form listeners
        setupAuthForms();
        return; // Stop further app initialization if not logged in
    }

    // If authenticated, proceed with app setup
    initializeApp();
});


function setupAuthForms() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register-link');
    const showLoginLink = document.getElementById('show-login-link');
    const loginError = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        loginError.textContent = '';
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        if (login(email, password)) {
            checkAuth(); // Updates UI based on new auth state
            initializeApp(); // Initialize app parts that need auth
        } else {
            loginError.textContent = 'Incorrect email or password.';
        }
    });

    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        registerError.textContent = '';
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const role = document.getElementById('reg-role').value;

        // Basic validation
        if (!email || !password || !role) {
             registerError.textContent = 'All fields are required.';
             return;
        }
        if (role !== 'admin' && role !== 'user') {
            registerError.textContent = 'Invalid role. Must be "admin" or "user".';
            return;
        }

        const result = register(email, password, role);
        if (result.success) {
            alert('Registration successful. Now you can start your session.');
            showLoginForm();
        } else {
            registerError.textContent = result.message;
        }
    });

    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        showRegisterForm();
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showLoginForm();
    });
}

function showLoginForm() {
    document.getElementById('login-form').classList.remove('d-none');
    document.getElementById('register-form').classList.add('d-none');
    document.getElementById('login-error').textContent = '';
    document.getElementById('register-error').textContent = '';
}
function showRegisterForm() {
    document.getElementById('login-form').classList.add('d-none');
    document.getElementById('register-form').classList.remove('d-none');
    document.getElementById('login-error').textContent = '';
    document.getElementById('register-error').textContent = '';
}


function initializeApp() {
    // Load initial data for display
    loadAndDisplayTournaments();
    loadAndDisplayTeams();
    loadAndDisplayPlayers();
    loadAndDisplayMatches();
    loadDashboardData();

    setupEventListeners();
    showSection('dashboard'); // Show dashboard by default

    // Populate tournament selects for leaderboards and stats
    populateTournamentSelects();
    document.getElementById('leaderboard-tournament-select').addEventListener('change', (e) => displayLeaderboard(e.target.value));
    document.getElementById('stats-tournament-select').addEventListener('change', (e) => displayTournamentStats(e.target.value));

    // Initial display for leaderboard/stats if a tournament is pre-selected or first one
    const tournaments = getItem('tournaments') || [];
    if (tournaments.length > 0) {
        displayLeaderboard(tournaments[0].id);
        displayTournamentStats(tournaments[0].id);
    }
}

function loadDashboardData() {
    const tournaments = getItem('tournaments') || [];
    const teams = getItem('teams') || [];
    document.getElementById('active-tournaments-count').textContent = tournaments.length;
    document.getElementById('total-teams-count').textContent = teams.length;
}


function setupEventListeners() {
    // Navigation
    document.querySelectorAll('#sidebar .nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = e.target.closest('.nav-link').dataset.section;
            showSection(sectionId);
        });
    });

    document.getElementById('logout-button').addEventListener('click', () => {
        logout();
        checkAuth(); // This will show the login screen
        // Clear main app section content if necessary, or just let checkAuth handle it
        document.getElementById('app-section').classList.add('d-none');
        document.getElementById('login-section').classList.remove('d-none');
        // Re-setup auth forms in case user wants to log in again without refresh
        setupAuthForms();
    });

    // --- Tournament Modal & Form ---
    const tournamentModal = new bootstrap.Modal(document.getElementById('tournament-modal'));
    document.getElementById('add-tournament-btn').addEventListener('click', () => {
        document.getElementById('tournamentModalLabel').textContent = 'Create Tournament';
        clearModalForm('tournament-form');
        // tournamentModal.show(); // Bootstrap attribute data-bs-toggle handles this
    });
    document.getElementById('tournament-form').addEventListener('submit', handleTournamentFormSubmit);
    document.getElementById('tournaments-table-body').addEventListener('click', handleTournamentTableActions);


    // --- Team Modal & Form ---
    const teamModal = new bootstrap.Modal(document.getElementById('team-modal'));
    document.getElementById('add-team-btn').addEventListener('click', () => {
        document.getElementById('teamModalLabel').textContent = 'Create Team';
        clearModalForm('team-form');
        populateSelect('team-tournament', getItem('tournaments') || [], 'id', 'name', 'Select Tournament');
    });
    document.getElementById('team-form').addEventListener('submit', handleTeamFormSubmit);
    document.getElementById('teams-table-body').addEventListener('click', handleTeamTableActions);


    // --- Player Modal & Form ---
    const playerModal = new bootstrap.Modal(document.getElementById('player-modal'));
    document.getElementById('add-player-btn').addEventListener('click', () => {
        document.getElementById('playerModalLabel').textContent = 'Create Player';
        clearModalForm('player-form');
        populateSelect('player-team', getItem('teams') || [], 'id', 'name', 'Select Team');
    });
    document.getElementById('player-form').addEventListener('submit', handlePlayerFormSubmit);
    document.getElementById('players-table-body').addEventListener('click', handlePlayerTableActions);

    // --- Match Modal & Form ---
    const matchModal = new bootstrap.Modal(document.getElementById('match-modal'));
    document.getElementById('add-match-btn').addEventListener('click', () => {
        document.getElementById('matchModalLabel').textContent = 'Create Match';
        clearModalForm('match-form');
        populateSelect('match-tournament', getItem('tournaments') || [], 'id', 'name', 'Select Tournament');
        // Team selects will be populated on tournament change
        document.getElementById('match-team-a').innerHTML = '<option value="">Select First Tournament</option>';
        document.getElementById('match-team-b').innerHTML = '<option value="">Select First Tournament</option>';
    });
    document.getElementById('match-form').addEventListener('submit', handleMatchFormSubmit);
    document.getElementById('matches-table-body').addEventListener('click', handleMatchTableActions);

    // Populate team selects in match form when tournament changes
    document.getElementById('match-tournament').addEventListener('change', (e) => {
        const tournamentId = e.target.value;
        const teams = getItem('teams') || [];
        const tournamentTeams = teams.filter(team => team.tournamentId === tournamentId);
        populateSelect('match-team-a', tournamentTeams, 'id', 'name', 'Home Team');
        populateSelect('match-team-b', tournamentTeams, 'id', 'name', 'Away Team');
        // Clear stats fields if tournament changes during edit
        document.getElementById('team-a-stats-fields').innerHTML = '';
        document.getElementById('team-b-stats-fields').innerHTML = '';
    });

    // Add stat fields buttons
    document.getElementById('add-stat-field-team-a').addEventListener('click', () => {
        const teamAId = document.getElementById('match-team-a').value;
        if (teamAId) addMatchStatField('team-a-stats-fields', teamAId);
        else alert('Select Home Team.');
    });
    document.getElementById('add-stat-field-team-b').addEventListener('click', () => {
        const teamBId = document.getElementById('match-team-b').value;
        if (teamBId) addMatchStatField('team-b-stats-fields', teamBId);
        else alert('Select Away Team.');
    });

    // Update team names for stat entry sections
    document.getElementById('match-team-a').addEventListener('change', e => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        document.getElementById('selected-team-a-name').textContent = selectedOption.value ? selectedOption.text : '';
    });
     document.getElementById('match-team-b').addEventListener('change', e => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        document.getElementById('selected-team-b-name').textContent = selectedOption.value ? selectedOption.text : '';
    });
}


// --- Tournament Logic ---
function loadAndDisplayTournaments() {
    const tournaments = getItem('tournaments') || [];
    renderTournamentsTable(tournaments);
}
function handleTournamentFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('tournament-id').value;
    const tournament = {
        id: id || generateId(),
        name: document.getElementById('tournament-name').value,
        category: document.getElementById('tournament-category').value,
        type: document.getElementById('tournament-type').value,
        startDate: document.getElementById('tournament-start-date').value,
        endDate: document.getElementById('tournament-end-date').value,
    };

    // Basic Validation
    if (!tournament.name || !tournament.category || !tournament.type || !tournament.startDate || !tournament.endDate) {
        alert("All fields are mandatory.");
        return;
    }
    if (new Date(tournament.endDate) < new Date(tournament.startDate)) {
        alert("End date can't be before the start date.");
        return;
    }

    let tournaments = getItem('tournaments') || [];
    if (id) { // Editing
        tournaments = tournaments.map(t => t.id === id ? tournament : t);
    } else { // Creating
        tournaments.push(tournament);
    }
    setItem('tournaments', tournaments);
    loadAndDisplayTournaments();
    populateTournamentSelects(); // Update selects in other parts of the app
    bootstrap.Modal.getInstance(document.getElementById('tournament-modal')).hide();
}
function handleTournamentTableActions(e) {
    const target = e.target.closest('button');
    if (!target) return;
    const id = target.dataset.id;

    if (target.classList.contains('edit-tournament-btn')) {
        const tournaments = getItem('tournaments') || [];
        const tournament = tournaments.find(t => t.id === id);
        if (tournament) {
            document.getElementById('tournamentModalLabel').textContent = 'Edit Tournament';
            document.getElementById('tournament-id').value = tournament.id;
            document.getElementById('tournament-name').value = tournament.name;
            document.getElementById('tournament-category').value = tournament.category;
            document.getElementById('tournament-type').value = tournament.type;
            document.getElementById('tournament-start-date').value = tournament.startDate;
            document.getElementById('tournament-end-date').value = tournament.endDate;
            bootstrap.Modal.getInstance(document.getElementById('tournament-modal')).show();
        }
    } else if (target.classList.contains('delete-tournament-btn')) {
        if (confirm('Are you sure you want to delete this tournament? This will also remove associated teams and matches.')) {
            let tournaments = getItem('tournaments') || [];
            tournaments = tournaments.filter(t => t.id !== id);
            setItem('tournaments', tournaments);

            // Cascade delete: teams, players, matches
            let teams = getItem('teams') || [];
            const teamsInTournament = teams.filter(team => team.tournamentId === id);
            teams = teams.filter(team => team.tournamentId !== id);
            setItem('teams', teams);

            let players = getItem('players') || [];
            teamsInTournament.forEach(deletedTeam => {
                players = players.filter(player => player.teamId !== deletedTeam.id);
            });
            setItem('players', players);

            let matches = getItem('matches') || [];
            matches = matches.filter(match => match.tournamentId !== id);
            setItem('matches', matches);

            loadAndDisplayTournaments();
            loadAndDisplayTeams();
            loadAndDisplayPlayers();
            loadAndDisplayMatches();
            populateTournamentSelects();
        }
    }
}


// --- Team Logic ---
function loadAndDisplayTeams() {
    const teams = getItem('teams') || [];
    renderTeamsTable(teams);
}
function handleTeamFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('team-id').value;
    const team = {
        id: id || generateId(),
        name: document.getElementById('team-name').value,
        tournamentId: document.getElementById('team-tournament').value,
    };
    if (!team.name || !team.tournamentId) {
        alert("Name and tournament are mandatory.");
        return;
    }
    let teams = getItem('teams') || [];
    if (id) {
        teams = teams.map(t => t.id === id ? team : t);
    } else {
        teams.push(team);
    }
    setItem('teams', teams);
    loadAndDisplayTeams();
    bootstrap.Modal.getInstance(document.getElementById('team-modal')).hide();
}
function handleTeamTableActions(e) {
    const target = e.target.closest('button');
    if (!target) return;
    const id = target.dataset.id;

    if (target.classList.contains('edit-team-btn')) {
        const teams = getItem('teams') || [];
        const team = teams.find(t => t.id === id);
        if (team) {
            document.getElementById('teamModalLabel').textContent = 'Edit Team';
            populateSelect('team-tournament', getItem('tournaments') || [], 'id', 'name', 'Select Tournament');
            document.getElementById('team-id').value = team.id;
            document.getElementById('team-name').value = team.name;
            document.getElementById('team-tournament').value = team.tournamentId;
            bootstrap.Modal.getInstance(document.getElementById('team-modal')).show();
        }
    } else if (target.classList.contains('delete-team-btn')) {
        if (confirm('Are you sure you want to delete this team? It will also delete associated players.')) {
            let teams = getItem('teams') || [];
            teams = teams.filter(t => t.id !== id);
            setItem('teams', teams);

            // Cascade delete: players
            let players = getItem('players') || [];
            players = players.filter(p => p.teamId !== id);
            setItem('players', players);

            // Also remove team from any matches (or handle appropriately)
            let matches = getItem('matches') || [];
            matches = matches.filter(m => m.teamAId !== id && m.teamBId !== id);
            setItem('matches', matches);


            loadAndDisplayTeams();
            loadAndDisplayPlayers();
            loadAndDisplayMatches();
        }
    }
}

// --- Player Logic ---
function loadAndDisplayPlayers() {
    const players = getItem('players') || [];
    renderPlayersTable(players);
}
function handlePlayerFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('player-id').value;
    const player = {
        id: id || generateId(),
        name: document.getElementById('player-name').value,
        teamId: document.getElementById('player-team').value,
        position: document.getElementById('player-position').value,
        number: parseInt(document.getElementById('player-number').value),
    };
     if (!player.name || !player.teamId || !player.position || isNaN(player.number)) {
        alert("All fields are mandatory and the player number must be valid.");
        return;
    }
    let players = getItem('players') || [];
    if (id) {
        players = players.map(p => p.id === id ? player : p);
    } else {
        players.push(player);
    }
    setItem('players', players);
    loadAndDisplayPlayers();
    bootstrap.Modal.getInstance(document.getElementById('player-modal')).hide();
}
function handlePlayerTableActions(e) {
    const target = e.target.closest('button');
    if (!target) return;
    const id = target.dataset.id;

    if (target.classList.contains('edit-player-btn')) {
        const players = getItem('players') || [];
        const player = players.find(p => p.id === id);
        if (player) {
            document.getElementById('playerModalLabel').textContent = 'Edit Player';
            populateSelect('player-team', getItem('teams') || [], 'id', 'name', 'Select Team');
            document.getElementById('player-id').value = player.id;
            document.getElementById('player-name').value = player.name;
            document.getElementById('player-team').value = player.teamId;
            document.getElementById('player-position').value = player.position;
            document.getElementById('player-number').value = player.number;
            bootstrap.Modal.getInstance(document.getElementById('player-modal')).show();
        }
    } else if (target.classList.contains('delete-player-btn')) {
        if (confirm('Are you sure you want to delete this player?')) {
            let players = getItem('players') || [];
            players = players.filter(p => p.id !== id);
            setItem('players', players);
            // Also remove player from match stats
            let matches = getItem('matches') || [];
            matches.forEach(match => {
                if (match.stats) {
                    if(match.stats.teamA) match.stats.teamA = match.stats.teamA.filter(s => s.playerId !== id);
                    if(match.stats.teamB) match.stats.teamB = match.stats.teamB.filter(s => s.playerId !== id);
                }
            });
            setItem('matches', matches);
            loadAndDisplayPlayers();
        }
    }
}


// --- Match Logic ---
function loadAndDisplayMatches() {
    const matches = getItem('matches') || [];
    renderMatchesTable(matches);
}
function handleMatchFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('match-id').value;
    const teamAScore = document.getElementById('match-team-a-score').value;
    const teamBScore = document.getElementById('match-team-b-score').value;

    const match = {
        id: id || generateId(),
        tournamentId: document.getElementById('match-tournament').value,
        teamAId: document.getElementById('match-team-a').value,
        teamBId: document.getElementById('match-team-b').value,
        teamAScore: teamAScore !== '' ? parseInt(teamAScore) : null,
        teamBScore: teamBScore !== '' ? parseInt(teamBScore) : null,
        date: document.getElementById('match-date').value,
        stats: getMatchStatsFromForm()
    };

    if (!match.tournamentId || !match.teamAId || !match.teamBId || !match.date) {
        alert("Tournaments, teams and dates are mandatory.");
        return;
    }
    if (match.teamAId === match.teamBId) {
        alert("A team cannot play against itself.");
        return;
    }
    if ((match.teamAScore !== null && match.teamAScore < 0) || (match.teamBScore !== null && match.teamBScore < 0)){
        alert("Goals can't have a negative value.");
        return;
    }


    let matches = getItem('matches') || [];
    if (id) {
        matches = matches.map(m => m.id === id ? match : m);
    } else {
        matches.push(match);
    }
    setItem('matches', matches);
    loadAndDisplayMatches();
    // Refresh leaderboard/stats if they are visible and related to this tournament
    const currentTournamentForLeaderboard = document.getElementById('leaderboard-tournament-select').value;
    if (currentTournamentForLeaderboard === match.tournamentId) {
        displayLeaderboard(match.tournamentId);
    }
    const currentTournamentForStats = document.getElementById('stats-tournament-select').value;
     if (currentTournamentForStats === match.tournamentId) {
        displayTournamentStats(match.tournamentId);
    }
    bootstrap.Modal.getInstance(document.getElementById('match-modal')).hide();
}
function handleMatchTableActions(e) {
    const target = e.target.closest('button');
    if (!target) return;
    const id = target.dataset.id;

    if (target.classList.contains('edit-match-btn')) {
        const matches = getItem('matches') || [];
        const match = matches.find(m => m.id === id);
        if (match) {
            document.getElementById('matchModalLabel').textContent = 'Edit Match';
            clearModalForm('match-form'); // Clear previous stat fields specifically

            populateSelect('match-tournament', getItem('tournaments') || [], 'id', 'name', 'Select Tournament');
            document.getElementById('match-id').value = match.id;
            document.getElementById('match-tournament').value = match.tournamentId;

            // Trigger change to populate team selects
            document.getElementById('match-tournament').dispatchEvent(new Event('change'));

            // Set teams after they are populated
            setTimeout(() => { // Wait for population
                document.getElementById('match-team-a').value = match.teamAId;
                document.getElementById('match-team-b').value = match.teamBId;
                // Trigger change to update stat section headers
                document.getElementById('match-team-a').dispatchEvent(new Event('change'));
                document.getElementById('match-team-b').dispatchEvent(new Event('change'));

                 // Populate existing stats
                populateMatchStatsToForm(match.stats, match.teamAId, match.teamBId);
            }, 100);


            document.getElementById('match-team-a-score').value = match.teamAScore !== null ? match.teamAScore : '';
            document.getElementById('match-team-b-score').value = match.teamBScore !== null ? match.teamBScore : '';
            document.getElementById('match-date').value = match.date;

            bootstrap.Modal.getInstance(document.getElementById('match-modal')).show();
        }
    } else if (target.classList.contains('delete-match-btn')) {
        if (confirm('Are you sure you want to delete this match?')) {
            let matches = getItem('matches') || [];
            const matchToDelete = matches.find(m => m.id === id);
            matches = matches.filter(m => m.id !== id);
            setItem('matches', matches);
            loadAndDisplayMatches();
             // Refresh leaderboard/stats if they are visible and related to this tournament
            if (matchToDelete) {
                const currentTournamentForLeaderboard = document.getElementById('leaderboard-tournament-select').value;
                if (currentTournamentForLeaderboard === matchToDelete.tournamentId) {
                    displayLeaderboard(matchToDelete.tournamentId);
                }
                const currentTournamentForStats = document.getElementById('stats-tournament-select').value;
                 if (currentTournamentForStats === matchToDelete.tournamentId) {
                    displayTournamentStats(matchToDelete.tournamentId);
                }
            }
        }
    }
}


// --- Leaderboard & Stats ---
function populateTournamentSelects() {
    const tournaments = getItem('tournaments') || [];
    populateSelect('leaderboard-tournament-select', tournaments, 'id', 'name', 'Select Tournament');
    populateSelect('stats-tournament-select', tournaments, 'id', 'name', 'Select Tournament');
}

function displayLeaderboard(tournamentId) {
    const tbody = document.getElementById('leaderboard-table-body');
    tbody.innerHTML = ''; // Clear previous
    if (!tournamentId) return;

    const teams = (getItem('teams') || []).filter(t => t.tournamentId === tournamentId);
    const matches = (getItem('matches') || []).filter(m => m.tournamentId === tournamentId && m.teamAScore !== null && m.teamBScore !== null);

    const teamStats = {};

    teams.forEach(team => {
        teamStats[team.id] = {
            name: team.name,
            MP: 0, W: 0, D: 0, L: 0, // Matches Played, Wins, Draws, Losses, 
            GF: 0, GC: 0, GD: 0, Pts: 0 // Goals Forwarded, Goals Conceided, Goal Difference, Points
        };
    });

    matches.forEach(match => {
        const statsA = teamStats[match.teamAId];
        const statsB = teamStats[match.teamBId];

        if (!statsA || !statsB) return; // Team might have been deleted

        statsA.MP++;
        statsB.MP++;
        statsA.GF += match.teamAScore;
        statsA.GC += match.teamBScore;
        statsB.GF += match.teamBScore;
        statsB.GC += match.teamAScore;

        if (match.teamAScore > match.teamBScore) { // Team A wins
            statsA.W++;
            statsA.Pts += 3;
            statsB.L++;
        } else if (match.teamBScore > match.teamAScore) { // Team B wins
            statsB.W++;
            statsB.Pts += 3;
            statsA.L++;
        } else { // Draw
            statsA.D++;
            statsB.D++;
            statsA.Pts += 1;
            statsB.Pts += 1;
        }
    });

    const leaderboard = Object.values(teamStats).map(stat => {
        stat.GD = stat.GF - stat.GC;
        return stat;
    });

    // Sort: 1. Pts, 2. DG, 3. GF
    leaderboard.sort((a, b) => {
        if (b.Pts !== a.Pts) return b.Pts - a.Pts;
        if (b.GD !== a.GD) return b.GD - a.GD;
        return b.GF - a.GF;
    });

    leaderboard.forEach((stat, index) => {
        const row = tbody.insertRow();
        row.classList.add('list-item-appear');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${stat.name}</td>
            <td>${stat.MP}</td>
            <td>${stat.W}</td>
            <td>${stat.D}</td>
            <td>${stat.L}</td>
            <td>${stat.GF}</td>
            <td>${stat.GC}</td>
            <td>${stat.GD}</td>
            <td><strong>${stat.Pts}</strong></td>
        `;
    });
}

function displayTournamentStats(tournamentId) {
    const displayDiv = document.getElementById('tournament-stats-display');
    const topScorersBody = document.getElementById('top-scorers-body');
    const topAssistsBody = document.getElementById('top-assists-body');

    displayDiv.innerHTML = '';
    topScorersBody.innerHTML = '';
    topAssistsBody.innerHTML = '';

    if (!tournamentId) return;

    const tournament = (getItem('tournaments') || []).find(t => t.id === tournamentId);
    const matches = (getItem('matches') || []).filter(m => m.tournamentId === tournamentId && m.teamAScore !== null);
    const players = getItem('players') || [];
    const teams = getItem('teams') || [];

    if (!tournament) return;

    let totalGoals = 0;
    let playedMatchesCount = matches.length;
    const playerGoals = {};
    const playerAssists = {};

    matches.forEach(match => {
        totalGoals += (match.teamAScore || 0) + (match.teamBScore || 0);

        const processStats = (teamStatsArray) => {
            if (!teamStatsArray) return;
            teamStatsArray.forEach(stat => {
                if (stat.type === 'goal') {
                    playerGoals[stat.playerId] = (playerGoals[stat.playerId] || 0) + 1;
                } else if (stat.type === 'assist') {
                    playerAssists[stat.playerId] = (playerAssists[stat.playerId] || 0) + 1;
                }
            });
        };
        if (match.stats) {
            processStats(match.stats.teamA);
            processStats(match.stats.teamB);
        }
    });

    const avgGoals = playedMatchesCount > 0 ? (totalGoals / playedMatchesCount).toFixed(2) : 0;

    displayDiv.innerHTML = `
        <div class="row">
            <div class="col-md-4">
                <div class="stat-card">
                    <h5>Played Matches</h5>
                    <p>${playedMatchesCount}</p>
                </div>
            </div>
            <div class="col-md-4">
                <div class="stat-card">
                    <h5>Total Goals</h5>
                    <p>${totalGoals}</p>
                </div>
            </div>
            <div class="col-md-4">
                <div class="stat-card">
                    <h5>Average Goals/Match</h5>
                    <p>${avgGoals}</p>
                </div>
            </div>
        </div>
    `;

    // Top Scorers
    const sortedScorers = Object.entries(playerGoals)
        .map(([playerId, goals]) => ({ playerId, goals }))
        .sort((a, b) => b.goals - a.goals);

    sortedScorers.slice(0, 10).forEach(scorer => { // Display top 10
        const player = players.find(p => p.id === scorer.playerId);
        const team = player ? teams.find(t => t.id === player.teamId) : null;
        if (player) {
            const row = topScorersBody.insertRow();
            row.innerHTML = `
                <td>${player.name}</td>
                <td>${team ? team.name : 'N/A'}</td>
                <td>${scorer.goals}</td>
            `;
        }
    });

    // Top Assists
    const sortedAssists = Object.entries(playerAssists)
        .map(([playerId, assists]) => ({ playerId, assists }))
        .sort((a, b) => b.assists - a.assists);

    sortedAssists.slice(0, 10).forEach(assistProvider => { // Display top 10
        const player = players.find(p => p.id === assistProvider.playerId);
        const team = player ? teams.find(t => t.id === player.teamId) : null;
        if (player) {
            const row = topAssistsBody.insertRow();
            row.innerHTML = `
                <td>${player.name}</td>
                <td>${team ? team.name : 'N/A'}</td>
                <td>${assistProvider.assists}</td>
            `;
        }
    });
}