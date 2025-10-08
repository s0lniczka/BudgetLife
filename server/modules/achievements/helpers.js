// modules/achievements/helpers.js
const db = require('../../config/db');

/**
 * Przyznaje osiągnięcie użytkownikowi, jeśli jeszcze go nie ma
 * @param {number} userId 
 * @param {number} achievementId 
 */
async function grantAchievement(userId, achievementId) {
  const check = await db.query(
    'SELECT 1 FROM user_achievements WHERE user_id=$1 AND achievement_id=$2',
    [userId, achievementId]
  );

  if (check.rowCount === 0) {
    await db.query(
      `INSERT INTO user_achievements (user_id, achievement_id)
       VALUES ($1, $2)`,
      [userId, achievementId]
    );
  }
}

module.exports = { grantAchievement };
