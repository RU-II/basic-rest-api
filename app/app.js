const express = require("express");
const app = express();
const sqlite3 = require("sqlite3");
const path = require("path");
const bodyParser = require("body-parser");

const dbPath = "app/db/database.sqlite3";

// リクエストのbodyをパースする設定
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// リクエストのbodyをパースする設定
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// publicディレクトリを静的ファイル群のルートディレクトリとして設定
app.use(express.static(path.join(__dirname, "public")));

// Get all users
app.get("/api/v1/users", (req, res) => {
  // Connect database
  const db = new sqlite3.Database(dbPath);

  db.all("SELECT * FROM users;", (err, rows) => {
    if (!rows) {
      res.status(404).send({ error: "Not Found!" });
    } else {
      res.status(200).json(rows);
    }
  });

  db.close();
});

// Get a user
app.get("/api/v1/users/:id", (req, res) => {
  // Connect database
  const db = new sqlite3.Database(dbPath);
  const id = req.params.id;

  db.get(`SELECT * FROM users WHERE id = ${id};`, (err, row) => {
    if (!row) {
      res.status(404).send({ error: "Not Found!" });
    } else {
      res.status(200).json(row);
    }
  });

  db.close();
});

// Search users matching keyword
app.get("/api/v1/search", (req, res) => {
  // Connect database
  const db = new sqlite3.Database(dbPath);
  const keyword = req.query.q;

  db.all(`SELECT * FROM users WHERE name LIKE "%${keyword}%"`, (err, row) => {
    res.json(row);
  });

  db.close();
});

// Get following users
app.get("/api/v1/users/:id/following", (req, res) => {
  // Connect database
  const db = new sqlite3.Database(dbPath);
  const id = req.params.id;

  db.all(
    `SELECT * FROM following LEFT JOIN users ON following.followed_id = users.id WHERE following_id = ${id};`,
    (err, rows) => {
      if (!rows) {
        res.status(404).send({ error: "Not Found!" });
      } else {
        res.status(200).json(rows);
      }
    }
  );

  db.close();
});

// Get a following user
app.get("/api/v1/users/:uid/following/:fid", (req, res) => {
  // Connect database
  const db = new sqlite3.Database(dbPath);
  const uid = req.params.uid;
  const fid = req.params.fid;

  db.get(
    `SELECT * FROM following LEFT JOIN users ON following.followed_id = users.id WHERE following_id = ${uid} AND followed_id = ${fid};`,
    (err, row) => {
      if (!row) {
        res.status(404).send({ error: "Not Found!" });
      } else {
        res.status(200).json(row);
      }
    }
  );

  db.close();
});

// Get followers
app.get("/api/v1/users/:id/followers", (req, res) => {
  // Connect database
  const db = new sqlite3.Database(dbPath);
  const id = req.params.id;

  db.all(
    `SELECT * FROM following LEFT JOIN users ON following.following_id = users.id WHERE followed_id = ${id};`,
    (err, rows) => {
      if (!rows) {
        res.status(404).send({ error: "Not Found!" });
      } else {
        res.status(200).json(rows);
      }
    }
  );

  db.close();
});

// Get a follower
app.get("/api/v1/users/:uid/followers/:fid", (req, res) => {
  // Connect database
  const db = new sqlite3.Database(dbPath);
  const uid = req.params.uid;
  const fid = req.params.fid;

  db.get(
    `SELECT * FROM following LEFT JOIN users ON following.following_id = users.id WHERE followed_id = ${uid} AND following_id = ${fid};`,
    (err, row) => {
      if (!row) {
        res.status(404).send({ error: "Not Found!" });
      } else {
        res.status(200).json(row);
      }
    }
  );

  db.close();
});

// クエリ実行関数
const run = async (sql, db) => {
  return new Promise((resolve, reject) => {
    db.run(sql, (err) => {
      if (err) {
        return reject(err);
      } else {
        return resolve();
      }
    });
  });
};

// Create a new user
app.post("/api/v1/users", async (req, res) => {
  // name null or blank
  if (!req.body.name || req.body.name === "") {
    res.status(400).send({ error: "ユーザー名が指定されていません。" });
  } else {
    // Connect database
    const db = new sqlite3.Database(dbPath);

    const name = req.body.name;
    const profile = req.body.profile ? req.body.profile : "";
    const dateOfBirth = req.body.date_of_birth ? req.body.date_of_birth : "";

    try {
      await run(
        `INSERT INTO users (name, profile, date_of_birth) VALUES ("${name}", "${profile}", "${dateOfBirth}")`,
        db
      );
      res.status(201).send({ message: "新規ユーザーを作成しました。" });
    } catch (e) {
      res.status(500).send({ error: e });
    }

    db.close();
  }
});

// Update user data
app.put("/api/v1/users/:id", async (req, res) => {
  // name null or blank
  if (!req.body.name || req.body.name === "") {
    res.status(400).send({ error: "ユーザー名が指定されていません。" });
  } else {
    // Connect database
    const db = new sqlite3.Database(dbPath);
    const id = req.params.id;

    // 現在のユーザー情報を取得する
    db.get(`SELECT * FROM users WHERE id = ${id}`, async (err, row) => {
      if (!row) {
        res.status(404).send({ error: "指定されたユーザーが見つかりません。" });
      } else {
        const name = req.body.name ? req.body.name : row.name;
        const profile = req.body.profile ? req.body.profile : row.profile;
        const dateOfBirth = req.body.date_of_birth
          ? req.body.date_of_birth
          : row.dateOfBirth;

        try {
          await run(
            `UPDATE users SET name="${name}", profile="${profile}", date_of_birth="${dateOfBirth}" WHERE id=${id}`,
            db
          );
          res.status(200).send({ message: "ユーザー情報を更新しました。" });
        } catch (e) {
          res.status(500).send({ error: e });
        }
      }
    });

    db.close();
  }
});

// Delete user data
app.delete("/api/v1/users/:id", async (req, res) => {
  // Connect database
  const db = new sqlite3.Database(dbPath);
  const id = req.params.id;

  // 現在のユーザー情報を取得する
  db.get(`SELECT * FROM users WHERE id = ${id}`, async (err, row) => {
    if (!row) {
      res.status(404).send({ error: "指定されたユーザーが見つかりません。" });
    } else {
      try {
        await run(`DELETE FROM users WHERE id=${id}`, db);
        res.status(200).send({ message: "ユーザー情報を削除しました。" });
      } catch (e) {
        res.status(500).send({ error: e });
      }
    }
  });

  db.close();
});

// Follow a user
app.put("/api/v1/users/:uid/following/:fid", (req, res) => {
  // Connect database
  const db = new sqlite3.Database(dbPath);
  const uid = req.params.uid;
  const fid = req.params.fid;

  db.get(
    `SELECT * FROM following LEFT JOIN users ON following.followed_id = users.id WHERE following_id = ${uid} AND followed_id = ${fid};`,
    async (err, row) => {
      if (row) {
        res.status(404).send({ error: "Already following" });
      } else {
        try {
          await run(
            `INSERT INTO following (following_id, followed_id) VALUES ("${uid}", "${fid}")`,
            db
          );
          res.status(201).send({ message: "フォローしました。" });
        } catch (e) {
          res.status(500).send({ error: e });
        }
      }
    }
  );

  db.close();
});

// Unfollow a user
app.delete("/api/v1/users/:uid/following/:fid", (req, res) => {
  // Connect database
  const db = new sqlite3.Database(dbPath);
  const uid = req.params.uid;
  const fid = req.params.fid;

  db.get(
    `SELECT * FROM following LEFT JOIN users ON following.followed_id = users.id WHERE following_id = ${uid} AND followed_id = ${fid};`,
    async (err, row) => {
      if (!row) {
        res.status(404).send({ error: "Already unfollowing" });
      } else {
        try {
          await run(
            `DELETE FROM following WHERE following_id = ${uid} AND followed_id = ${fid}`,
            db
          );
          res.status(200).send({ message: "フォローを解除しました。" });
        } catch (e) {
          res.status(500).send({ error: e });
        }
      }
    }
  );

  db.close();
});

const port = process.env.PORT || 3000;
app.listen(port);
console.log("Listen on port: " + port);
