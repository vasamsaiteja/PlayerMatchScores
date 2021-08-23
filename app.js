const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

let dbPath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

initializeDBandServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertDbObjectToMatchObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

// const convertPlayerScoreObjectToResponseObject = (dbObject) => {
//   return {
//     playerId: dbObject.playerId,
//     playerName: dbObject.playerName,
//     totalScore: dbObject.totalScore,
//     totalFours: dbObject.totalFours,
//     totalSixes: dbObject.totalSixes,
//   };
// };

//API 1 (get)

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
        SELECT 
            * 
        FROM 
            player_details;`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertDbObjectToResponseObject(eachPlayer)
    )
  );
});

//API 2(Get)

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getEachPlayerQuery = `
        SELECT 
            * 
        FROM 
            player_details 
        WHERE 
            player_id = ${playerId};`;
  const eachPlayer = await db.get(getEachPlayerQuery);
  response.send(convertDbObjectToResponseObject(eachPlayer));
});

//API 3 (put)

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;

  const updatePlayerQuery = `
        UPDATE 
            player_details 
        SET 
            player_name = '${playerName}'
        WHERE 
            player_id = ${playerId};`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//API 4(get)

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `
        SELECT 
            * 
        FROM 
            match_details 
        WHERE 
            match_id = ${matchId};`;
  const match = await db.get(getMatchDetailsQuery);
  response.send(convertDbObjectToMatchObject(match));
});

//API 5 (get)

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchQuery = `
        SELECT 
            * 
        FROM 
             player_match_score NATURAL JOIN match_details 
            
        WHERE 
           player_id = ${playerId};`;
  const playerMatchDetails = await db.all(getPlayerMatchQuery);
  response.send(
    playerMatchDetails.map((eachMatch) =>
      convertDbObjectToMatchObject(eachMatch)
    )
  );
});

//API 6 (get)

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerNameDetailsQuery = `
        SELECT 
            *
        FROM 
            player_match_score NATURAL JOIN player_details  
            
        WHERE 
            match_id = ${matchId};`;
  const playerNameDetails = await db.all(getPlayerNameDetailsQuery);
  response.send(
    playerNameDetails.map((eachPlayer) =>
      convertDbObjectToResponseObject(eachPlayer)
    )
  );
});

//API 7 (get)

app.get("/player/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getStaticsQuery = `
        SELECT
           player_id AS playerId,
            player_name AS playerName,
            SUM(score) AS totalScore,
            SUM(fours) AS totalFours,
            SUM(sixes) AS totalSixes
        FROM
            player_match_score NATURAL JOIN player_details  

         WHERE
             player_id = ${playerId};`;
  const stats = await db.get(getStaticsQuery);
  response.send(stats);
});

module.exports = app;
