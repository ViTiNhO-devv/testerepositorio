require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const pool = require('./db');
const flash = require('connect-flash');
const path = require('path');
const app = express();
const port = process.env.PORT || 3001; // Usando a variável de ambiente para a porta

app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'self'; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; img-src 'self' https://encrypted-tbn0.gstatic.com https://s2.glbimg.com; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com");
  next();
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

passport.use(new LocalStrategy(
  (username, password, done) => {
    pool.query('SELECT * FROM usuarios WHERE usuario = ?', [username], (err, results) => {
      if (err) { return done(err); }
      if (!results.length) {
        return done(null, false, { message: 'Usuário não encontrado' });
      }

      const user = results[0];

      bcrypt.compare(password, user.senha, (err, res) => {
        if (res) {
          return done(null, user);
        } else {
          return done(null, false, { message: 'Senha incorreta' });
        }
      });
    });
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  pool.query('SELECT * FROM usuarios WHERE id = ?', [id], (err, results) => {
    if (err) { return done(err); }
    done(null, results[0]);
  });
});

app.post('/cadastro', (req, res) => {
  const { nome, sobrenome, cpf, usuario, senha, repetirSenha } = req.body;

  if (!nome || !sobrenome || !cpf || !usuario || !senha || !repetirSenha) {
    return res.status(400).json({ error: 'Preencha todos os campos' });
  }

  if (!/^[a-zA-Z0-9]+$/.test(usuario)) {
    return res.status(400).json({ error: 'Usuário só pode conter letras e/ou números' });
  }

  if (usuario.length < 3 || usuario.length > 12) {
    return res.status(400).json({ error: 'Usuário deve ter entre 3 e 12 caracteres' });
  }

  if (senha.length < 6 || senha.length > 12) {
    return res.status(400).json({ error: 'Senha deve ter entre 6 e 12 caracteres' });
  }

  if (senha !== repetirSenha) {
    return res.status(400).json({ error: 'Senhas não coincidem' });
  }

  bcrypt.hash(senha, 10, (err, hash) => {
    if (err) { return res.status(500).json({ error: err.message }); }

    const query = 'INSERT INTO usuarios (nome, sobrenome, cpf, usuario, senha) VALUES (?, ?, ?, ?, ?)';
    pool.query(query, [nome, sobrenome, cpf, usuario, hash], (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao cadastrar usuário: ' + err.message });
      }
      res.redirect('/login.html');
    });
  });
});

app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) { return next(err); }
    if (!user) {
      return res.status(401).json({ message: info.message });
    }
    req.logIn(user, (err) => {
      if (err) { return next(err); }
      return res.json({ success: true });
    });
  })(req, res, next);
});

app.post('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

// Middleware para verificar se o usuário está autenticado
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login.html');
}

// Rota protegida: Dashboard
app.get('/dashboard', isAuthenticated, (req, res) => {
  res.sendFile(__dirname + '/public/dashboard.html');
});

// Rota protegida: Informações do usuário
app.get('/user', isAuthenticated, (req, res) => {
  res.json(req.user);
});

app.get('/cadastro', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Cadastrar.html'));
});

// Rotas públicas
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/beneficios', (req, res) => res.sendFile(path.join(__dirname, 'public', 'beneficios.html')));
app.get('/quem-somos', (req, res) => res.sendFile(path.join(__dirname, 'public', 'quem-somos.html')));
app.get('/contato', (req, res) => res.sendFile(path.join(__dirname, 'public', 'contato.html')));
app.get('/politica-de-privacidade', (req, res) => res.sendFile(path.join(__dirname, 'public', 'politica-de-privacidade.html')));
app.get('/termos-de-uso', (req, res) => res.sendFile(path.join(__dirname, 'public', 'termos-de-uso.html')));
app.get('/faqs', (req, res) => res.sendFile(path.join(__dirname, 'public', 'faqs.html')));
app.get('/obrigado', (req, res) => res.sendFile(path.join(__dirname, 'public', 'obrigado.html')));
app.get('/Login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'Login.html')));

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
