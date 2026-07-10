import express from 'express';
import serveStatic from 'serve-static';

const app = express();

// ruleid: auth.express.static-dotfiles-allow
app.use(express.static('public', { dotfiles: 'allow' }));

// ruleid: auth.express.static-dotfiles-allow
app.use(serveStatic('build', { index: false, dotfiles: 'allow' }));
