import express from 'express';
import serveStatic from 'serve-static';

const app = express();

// ok: auth.express.static-dotfiles-allow -- default behaviour (dotfiles ignored)
app.use(express.static('public'));

// ok: auth.express.static-dotfiles-allow -- dotfiles explicitly ignored
app.use(express.static('public', { dotfiles: 'ignore', index: false }));

// ok: auth.express.static-dotfiles-allow -- dotfiles denied (403)
app.use(serveStatic('build', { dotfiles: 'deny' }));
