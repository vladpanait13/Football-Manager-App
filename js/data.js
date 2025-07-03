const DB_PREFIX = 'futManager_';

function getItem(key) {
    const item = localStorage.getItem(DB_PREFIX + key);
    return item ? JSON.parse(item) : null;
}

function setItem(key, value) {
    localStorage.setItem(DB_PREFIX + key, JSON.stringify(value));
}

function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

// Initialize with some default data if nothing exists
function initializeDefaultData() {
    if (!getItem('users')) {
        // Default admin user for testing
        setItem('users', [{ id: generateId(), email: 'admin@example.com', password: 'admin', role: 'admin' }]);
    }
    if (!getItem('tournaments')) {
        setItem('tournaments', [
            { id: 't1', name: 'League 2025', category: 'Senior', type: 'League', startDate: '2025-07-01', endDate: '2025-08-31' },
            { id: 't2', name: 'Copa Primavera', category: 'Youth', type: 'Cup', startDate: '2025-03-15', endDate: '2025-05-15' }
        ]);
    }
    if (!getItem('teams')) {
        setItem('teams', [
            { id: 'teamA', name: 'The Invincibles', tournamentId: 't1' },
            { id: 'teamB', name: 'Guerrero FC', tournamentId: 't1' },
            { id: 'teamC', name: 'Dragons Azules', tournamentId: 't2' },
            { id: 'teamD', name: 'Phoenix FC', tournamentId: 't1' },
        ]);
    }
    if (!getItem('players')) {
        setItem('players', [
            { id: 'p1', name: 'Lionel Messi Jr.', teamId: 'teamA', position: 'Forward', number: 10 },
            { id: 'p2', name: 'Cristiano Ronaldo Jr.', teamId: 'teamB', position: 'Forward', number: 7 },
            { id: 'p3', name: 'Neymar Jr. Jr.', teamId: 'teamA', position: 'Midfielder', number: 11 },
            { id: 'p4', name: 'Kylian Mbappé Jr.', teamId: 'teamD', position: 'Forward', number: 9 },
        ]);
    }
    if (!getItem('matches')) {
         setItem('matches', [
            {
                id: 'm1', tournamentId: 't1', teamAId: 'teamA', teamBId: 'teamB',
                teamAScore: 2, teamBScore: 1, date: '2025-07-05T18:00',
                stats: {
                    teamA: [{playerId: 'p1', type: 'goal'}, {playerId: 'p3', type: 'goal'}, {playerId: 'p3', type: 'assist'}],
                    teamB: [{playerId: 'p2', type: 'goal'}]
                }
            },
            {
                id: 'm2', tournamentId: 't1', teamAId: 'teamD', teamBId: 'teamA',
                teamAScore: 0, teamBScore: 3, date: '2025-07-12T20:00',
                stats: {
                    teamA: [],
                    teamB: [{playerId: 'p1', type: 'goal'}, {playerId: 'p1', type: 'goal'}, {playerId: 'p3', type: 'goal'}]
                }
            }
        ]);
    }
}

// Call initialization
initializeDefaultData();