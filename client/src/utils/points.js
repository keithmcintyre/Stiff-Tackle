export const PLAYERS = ['Keith', 'Dave', 'Cox', 'Tome', 'Paul', 'JJ'];

/**
 * Calculate per-player points for a single game.
 *
 * Rules:
 *   Playing  = 2 pts
 *   Goal     = 4 pts
 *   Assist   = 3 pts
 *   Cox only: +4 base, −1 per goal conceded (theirScore)
 *   Bonus (awarded after all subtotals, including Cox adjustments):
 *     1st place = 3 pts, 2nd = 2 pts, 3rd = 1 pt
 *     Ties share the same bonus; next rank is skipped accordingly.
 *
 * @param {object} game  – { theirScore, players: [{ name, played, goals, assists }] }
 * @returns {{ subtotals, bonuses, totals }}
 */
export function calculateGamePoints(game) {
  const { theirScore = 0, players } = game;

  // Step 1 – base subtotals
  const subtotals = {};
  for (const p of players) {
    if (!p.played) { subtotals[p.name] = 0; continue; }

    let pts = 2; // playing bonus
    pts += (p.goals || 0) * 4;
    pts += (p.assists || 0) * 3;

    if (p.name === 'Cox') {
      pts += 4;            // Cox keeper bonus
      pts -= theirScore;   // minus goals conceded
    }

    subtotals[p.name] = pts;
  }

  // Step 2 – bonus points (based on subtotals)
  const bonuses = assignBonuses(subtotals, players);

  // Step 3 – totals
  const totals = {};
  for (const p of players) {
    totals[p.name] = subtotals[p.name] + bonuses[p.name];
  }

  return { subtotals, bonuses, totals };
}

function assignBonuses(subtotals, players) {
  const bonuses = {};
  players.forEach(p => { bonuses[p.name] = 0; });

  const played = players.filter(p => p.played);
  if (played.length === 0) return bonuses;

  // Sort played players by subtotal descending
  const sorted = [...played].sort((a, b) => subtotals[b.name] - subtotals[a.name]);

  const bonusForRank = { 1: 3, 2: 2, 3: 1 };
  let rank = 1;
  let i = 0;

  while (i < sorted.length && rank <= 3) {
    const score = subtotals[sorted[i].name];

    // Collect all players tied at this score
    const tied = [];
    while (i < sorted.length && subtotals[sorted[i].name] === score) {
      tied.push(sorted[i].name);
      i++;
    }

    const bonus = bonusForRank[rank];
    if (bonus !== undefined) {
      tied.forEach(name => { bonuses[name] = bonus; });
    }

    rank += tied.length; // skip ranks consumed by ties
  }

  return bonuses;
}

/**
 * Aggregate season stats across all games for every player.
 */
export function getSeasonStats(games) {
  const stats = {};
  PLAYERS.forEach(name => {
    stats[name] = { name, gamesPlayed: 0, goals: 0, assists: 0, bonusPoints: 0, totalPoints: 0 };
  });

  for (const game of games) {
    const { bonuses, totals } = calculateGamePoints(game);
    for (const p of game.players) {
      if (!stats[p.name]) continue;
      if (p.played) {
        stats[p.name].gamesPlayed++;
        stats[p.name].goals   += p.goals   || 0;
        stats[p.name].assists += p.assists || 0;
      }
      stats[p.name].bonusPoints  += bonuses[p.name] || 0;
      stats[p.name].totalPoints  += totals[p.name]  || 0;
    }
  }

  return stats;
}

/** Win / draw / loss record for the team. */
export function getSeasonRecord(games) {
  let wins = 0, draws = 0, losses = 0;
  for (const g of games) {
    if (g.ourScore > g.theirScore) wins++;
    else if (g.ourScore === g.theirScore) draws++;
    else losses++;
  }
  return { wins, draws, losses, played: games.length };
}
