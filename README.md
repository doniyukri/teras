# Teras

A free shelf for text courses. Write the lessons, publish them, and share the link. There is no account and no payment. A course you write is stored in this browser, and the share link carries the text so someone else can open it.

Two example courses ship with the app. They have short links. A course you write is shared from `/shared#…`.

The shelf follows [LearnHouse](https://github.com/learnhouse/learnhouse). The lessons stay plain text, in the spirit of [P2PU Course-in-a-Box](https://github.com/p2pu/course-in-a-box). The code here is original.

## Run

```bash
npm install
npm run dev
```

`npm run build` writes the static site to `dist/`. The app uses the URL path (`/c/still-page`, `/new`), so a host has to serve `index.html` for those paths.

## Save on GitHub

From this folder:

```bash
gh repo create teras --public --source=. --remote=origin --push
```

That creates `github.com/<you>/teras` and pushes `main`.
