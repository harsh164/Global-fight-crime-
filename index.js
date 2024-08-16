import express from "express";
import pg from "pg";
import bodyParser from "body-parser";
import session from "express-session";
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import { log } from "console";



const app = express();
const port = 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "blog",
  password: "1Jyotigupta",
  port: 5432,
});
db.connect();


app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }  
}));


app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.get("/contacts", (req, res) => {
  res.render("contacts.ejs");
});

app.get("/about", (req, res) => {
  res.render("about.ejs");
});

app.get("/price", (req, res) => {
  res.render("price.ejs");
});

app.get("/features", (req, res) => {
  res.render("features.ejs");
});




app.get("/log", (req, res) => {
  res.render("login.ejs");
});

app.get("/l", (req, res) => {
  res.render("l.ejs");
});


app.get("/m", (req, res) => {
  res.render("m.ejs");
});


app.get("/n", (req, res) => {
  res.render("n.ejs");
});


app.post("/login", async (req, res) => { 
  const email = req.body.email;
  const password = req.body.password;
  

 
  
  
  try {
    const result = await db.query("SELECT id, password, username,userid FROM users WHERE email = $1", [email]);
    
    if (result.rows.length === 0) {
      
      return res.status(401).send("Invalid email or password");
    }
    
    const user = result.rows[0];
    const hashedPassword = user.password;

    const passwordMatch = await bcrypt.compare(password, hashedPassword);
    
    
    if (passwordMatch) {
      req.session.username=user.username;
      req.session.userid = user.id;
      req.session.save();
      console.log("req.session:", req.session); 
      return res.redirect("/createdblog");
    } else {
      
      return res.status(401).send("Invalid email or password");
    }
  } catch (error) {
    console.error("Error logging in:", error);
    return res.status(500).send("Internal Server Error");
  }
});



  app.get("/signup", (req, res) => {
   
    res.render("signup.ejs", { username: req.session.username || 'Guest' });
});



app.post("/signup", async (req, res) => {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = await bcrypt.hash(password, 10);
  
  try {
    const userResult = await db.query("SELECT * FROM users WHERE email= $1",[email]);
    if(userResult.rows.length>0){
      
      res.status(400).send("Email already in use")
    }
    const result=await db.query("INSERT INTO users(email, password,username) VALUES ($1, $2, $3) RETURNING id" , [email, hashedPassword,username] );
    
    const userid=result.rows[0].id;
    req.session.username=username;
    req.session.userid=userid;
    req.session.save(err => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).send("Internal Server Error");
      }
      return res.redirect("/log");
    });
 
  } catch (error) {
    console.error("Error signing up:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/blog", async (req, res) => {
  res.render("blog.ejs");
});

app.get("/cblog", async (req, res) => {
  res.render("cblog.ejs");
});

app.post("/cblog", async (req, res) => {
  console.log("req.session in /cblog:", req.session)
  const userid = req.session.userid;
  if(!userid){
    return res.send("User not logged in ");
  }
  const title = req.body.title;
  const blog = req.body.blog;
  
  
  
  try {
    await db.query("INSERT INTO blog(title, blog, userid) VALUES ($1, $2, $3)", [title, blog,userid]);
    res.redirect("/blog");
  } catch (error) {
    console.error("Error creating blog:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/createdblog", async (req, res) => {
  console.log("req.session in /createdblog:", req.session);

 

  try {
    const result = await db.query(`
      SELECT blog.title, blog.blog, blog.created_at
      FROM blog  
      INNER JOIN users ON users.id=blog.userid
      WHERE blog.userid = $1
    `, [req.session.userid]);

    
    const blogs = result.rows;
    console.log(blogs);
    res.render("createdblog.ejs", { blogs});
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).send("Internal Server Error");
  }
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
