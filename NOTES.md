# MindDo AI key

The AI key comes from `getKey()` in `server/getKey.mjs`. The server reads `KEYGEN_URL` and `KEYGEN_TOKEN` from its environment. Conversation history is stored in browser local storage for the current site.

Call `await getKey()` from server code before an OpenAI request. If OpenAI returns the `invalid_api_key` error, call `await getKey({ invalidKey: keyUsedForThatRequest })` and retry the OpenAI request once with the returned key. Keep both credentials on the server and out of logs.

If `getKey()` throws, show its `error.message` to the user and stop the request. The helper logs MindDo's `error.fix` when provided and makes one lookup attempt per refresh. Expiration can be an ISO date-time string or Unix milliseconds.

## OpenAI model

The MindDo-issued key can access `gpt-5.6-luna`.

## Run locally

1. Use Node.js 22 or newer and set `KEYGEN_URL` and `KEYGEN_TOKEN` in the root `.env`.
2. Run `node --env-file=.env server/local.mjs` from the project root.
3. Open <http://127.0.0.1:3000>, send a message, and reload to check that the conversation stays in the browser.

## Deploy to Vercel

1. In Vercel, import the GitHub repository as a new project. Use the repository root and leave the build command at its default.
2. Add `KEYGEN_URL` and `KEYGEN_TOKEN` under Environment Variables for Production. Select Preview too if preview deployments should have AI access.
3. Deploy and test a message on the Vercel URL. Redeploy after changing either environment variable.

`vercel.json` selects the static `public/` directory. Vercel runs `api/chat.mjs` as the Node.js function for `/api/chat`. Keep `.env` local and out of Git.
