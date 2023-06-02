const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      "Server Running at http://localhost:3000/";
    });
  } catch (error) {
    console.log(`DB error ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDBObjectIntoResponseObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
    directorName: dbObject.director_name,
  };
};

// Get Movies

app.get("/movies/", async (req, res) => {
  const getMoviesQuery = `SELECT movie_name FROM movie ORDER BY movie_id`;
  const moviesArray = await db.all(getMoviesQuery);
  res.send(
    moviesArray.map((eachMovie) => convertDBObjectIntoResponseObject(eachMovie))
  );
});

// Post Movies

app.post("/movies/", async (req, res) => {
  const movieDetails = req.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const addMovieQuery = `INSERT INTO movie (director_id, movie_name, lead_actor) VALUES (${directorId}, '${movieName}', '${leadActor}');`;
  const dbResponse = await db.run(addMovieQuery);
  res.send("Movie Successfully Added");
});

// Get Movie

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `
    SELECT 
      * 
    FROM 
      movie
    WHERE 
      movie_id = ${movieId};`;
  const movie = await db.get(getMovieQuery);
  response.send(convertDBObjectIntoResponseObject(movie));
});

// Put Movie

app.put("/movies/:movieId/", async (req, res) => {
  const { movieId } = req.params;
  const movieDetail = req.body;
  const { directorId, movieName, leadActor } = movieDetail;
  const updateBookQuery = `
    UPDATE
      movie
    SET
      director_id=${directorId},
      movie_name='${movieName}',
      lead_actor='${leadActor}'
    WHERE
      movie_id = ${movieId};`;
  await db.run(updateBookQuery);
  res.send("Movie Details Updated");
});

// DELETE movie

app.delete("/movies/:movieId/", async (req, res) => {
  const { movieId } = req.params;
  const deletemovieQuery = `
    DELETE FROM
      movie
    WHERE
      movie_id = ${movieId};`;
  await db.run(deletemovieQuery);
  res.send("Movie Removed");
});

// GET Directors

app.get("/directors/", async (req, res) => {
  const getDirectorsQuery = `SELECT * FROM director ORDER BY director_id`;
  const directorsArray = await db.all(getDirectorsQuery);
  res.send(
    directorsArray.map((eachMovie) =>
      convertDBObjectIntoResponseObject(eachMovie)
    )
  );
});

// Get Movies based on directId API

app.get("/directors/:directorId/movies/", async (req, res) => {
  const { directorId } = req.params;
  const getMoviesNamesQuery = `SELECT movie.movie_name FROM movie NATURAL JOIN director WHERE movie.director_id = ${directorId};`;
  const director = await db.get(getMoviesNamesQuery);

  res.send(convertDBObjectIntoResponseObject(director));
});

module.exports = app;
