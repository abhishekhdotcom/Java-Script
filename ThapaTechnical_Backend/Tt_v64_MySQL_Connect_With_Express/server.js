import mysql from "mysql2/promise";

// 1. -------------Connect to mysql server-------------
const db = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "@MySql^409490536194",
  database: "thapaTechnical",
});
console.log("MySQL COnnected Successfully!");

// 2. -------------we need to create a db-------------
await db.execute(`CREATE DATABASE thapaTechnical;`); // Create Database
await db.execute(`CREATE DATABASE IF NOT EXISTS thapaTechnical;`); //Create Database if Not Exists
console.log(await db.execute(`SHOW DATABASES;`)); // Show all database

// 3. -------------We need to Select Db-------------
db.execute(`USE thapaTechnical;`); // Use Selected Database

// 4. -------------We need to Create Table-------------
await db.execute(`CREATE TABLE users(
    id INT AUTO_INCREMENT PRIMARY KEY,
    userName VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE
    );
    `);

// 4. -------------Is to perform (CRUD) Operation-------------
// Create
// Insert single Data using inline valuse (Not Recommended!)
await db.execute(
  `INSERT INTO users (userName, email) VALUES
  ('abhishekhdotcom', 'abhishekhkumar1516@gmail.com' ),
`
);

// Insert single Data using prepared statements (Best practice)
await db.execute(`INSERT INTO users (userName, email) VALUES(?,?)`, [
  "mritunjayYougi586",
  "mritunjay586@gmail.com",
]);

// Insert Multiple data at a time
const valuse = [
  ["kuku8789", "kuku8789@gmail.com"],
  ["keshav2005", "keshav2005@gmail.com"],
  ["sushma1228", "sushma1228@gmail.com"],
  ["amar4547", "amar4547@gmail.com"],
];

await db.query(`INSERT INTO users(userName, email) VALUES ?`, [valuse]);

// -------------Read all table data from users-------------
const [rows1] = await db.execute(`SELECT * FROM users;`);
console.log(rows1);

// -------------Read selected table data from users-------------
const [rows2] = await db.execute(
  `SELECT email FROM users WHERE userName = "abhishekhdotcom";`
);
console.log(rows2[0]);

// Update this is not Recommended
try {
  const [rows3] = await db.execute(
    `UPDATE users SET userName = "abhishekhdotcom" WHERE email = "abhishekhkumar1516@gmail.com";`
  );
  console.log(rows3);
} catch (error) {
  console.log(error);
}

// This is Recommended (Best practice)
try {
  const [rows4] = await db.execute(
    `UPDATE users SET userName = ? WHERE email = ?`,
    ["abhishekhdotcom", "abhishekhkumar1516@gmail.com"]
  );
  console.log(rows4);
} catch (error) {
  console.log(error);
}

// Delete this is nor Recommended
try {
  const [rows5] = await db.execute(
    `DELETE FROM users WHERE email = "kuku8789@gmail.com";`
  );
  console.log(rows5);
} catch (error) {
  console.log(error);
}

// This is Recommended (Best Practice)
try {
  const [rows6] = await db.execute(`DELETE FROM users WHERE email = ?;`, [
    "amar4547@gmail.com",
  ]);
  console.log(rows6);
} catch (error) {
  console.log(error);
}
