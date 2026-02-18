# How to Set Up Socrates for Yourself

A plain-English guide to getting your own Socratic thinking partner up and running. No programming experience required — just follow the steps in order.

---

## What You're Building

Socrates is a personal AI chatbot that never gives you direct answers. Instead, it asks you probing questions — like a Socratic dialogue — to help you think more clearly. It's useful for stress-testing business ideas, examining your beliefs, or working through tough decisions.

Once set up, you'll have a private web app you can open in your browser and use anytime.

---

## What You'll Need (accounts to create)

You'll need to sign up for a few free services before you begin. Think of these as the "ingredients" — each one provides a piece of what makes Socrates work.

| Service | What it does for Socrates | Cost |
|---------|--------------------------|------|
| **GitHub** | Stores the Socrates code so you can copy it | Free |
| **Anthropic** or **OpenAI** | Provides the AI brain that powers the conversations | Pay-per-use (pennies per conversation) |
| **Clerk** | Handles sign-in so only you can access your app | Free tier available |
| **Neon** | Saves your conversation history so you can revisit past chats | Free tier available |
| **Tavily** (optional) | Lets Socrates search the web for evidence during conversations | Free tier available |
| **Vercel** | Puts your app on the internet so you can access it from anywhere | Free tier available |

---

## Step 1: Create Your Accounts

Work through each of these. Keep a document open (a note, a Google Doc, anything) to paste your keys into as you get them. You'll need them all later.

### 1a. GitHub

1. Go to [github.com](https://github.com) and click **Sign up**.
2. Follow the prompts to create an account.
3. Once signed in, go to the Socrates project page (your project owner will share the link with you).
4. Click the green **"Code"** button, then click **"Open with GitHub Desktop"** or simply note the URL — you'll use it in Step 3.

### 1b. AI Provider (choose one or both)

You need at least one of these. Anthropic's Claude is the default and recommended option.

**Option A — Anthropic (recommended):**
1. Go to [console.anthropic.com](https://console.anthropic.com/).
2. Click **Sign up** and create an account.
3. Add a payment method (you'll only be charged for what you use — a typical conversation costs a few cents).
4. Go to **API Keys** in the left sidebar.
5. Click **Create Key**, give it a name like "Socrates", and copy the key.
6. Paste it into your notes document and label it `ANTHROPIC_API_KEY`.

**Option B — OpenAI:**
1. Go to [platform.openai.com](https://platform.openai.com/).
2. Click **Sign up** and create an account.
3. Add a payment method under **Settings > Billing**.
4. Go to **API Keys** in the left sidebar.
5. Click **Create new secret key**, name it "Socrates", and copy it.
6. Paste it into your notes document and label it `OPENAI_API_KEY`.

### 1c. Clerk (for sign-in)

1. Go to [clerk.com](https://clerk.com/) and click **Start building**.
2. Create an account and then create a new **Application**.
3. Name it "Socrates" and choose which sign-in methods you want (email, Google, etc.).
4. On the next screen, you'll see two keys:
   - **Publishable key** — starts with `pk_test_` or `pk_live_`
   - **Secret key** — starts with `sk_test_` or `sk_live_`
5. Copy both and paste them into your notes document, labeled:
   - `VITE_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

### 1d. Neon (for saving conversations)

1. Go to [neon.tech](https://neon.tech/) and click **Sign Up**.
2. Create a new **Project** — name it "Socrates".
3. Once created, you'll see a **Connection string** on the dashboard. It looks something like: `postgresql://username:password@ep-something.region.aws.neon.tech/neondb`
4. Copy this entire string and paste it into your notes, labeled `DATABASE_URL`.

### 1e. Tavily (optional — enables web search)

This is optional but recommended. It lets Socrates search the internet to find evidence and resources during your conversations.

1. Go to [tavily.com](https://tavily.com/) and click **Sign up**.
2. Once signed in, go to your **API Keys** page.
3. Copy your API key and paste it into your notes, labeled `TAVILY_API_KEY`.

---

## Step 2: Install the Required Software on Your Computer

You need two programs installed on your computer. These run behind the scenes — you won't interact with them directly after setup.

### 2a. Install Node.js

Node.js is the engine that runs Socrates on your computer (or on a server).

1. Go to [nodejs.org](https://nodejs.org/).
2. Download the **LTS** version (the one on the left — it'll say "Recommended for most users").
3. Open the downloaded file and follow the installer prompts. Accept all the defaults.
4. To verify it worked: open your **Terminal** (on Mac, search for "Terminal" in Spotlight) or **Command Prompt** (on Windows, search for "cmd"), then type:
   ```
   node --version
   ```
   You should see a version number like `v20.x.x`. If you do, you're good.

### 2b. Install pnpm

pnpm is a helper tool that downloads all the pieces Socrates depends on.

1. In the same Terminal / Command Prompt window, type:
   ```
   npm install -g pnpm
   ```
2. Press Enter and wait for it to finish.
3. Verify by typing:
   ```
   pnpm --version
   ```
   You should see a version number. If you do, you're good.

---

## Step 3: Download the Socrates Code

1. Open Terminal (Mac) or Command Prompt (Windows).
2. Navigate to where you want to keep the project. For example, to put it in your Documents folder:
   ```
   cd ~/Documents
   ```
3. Download the code by typing (replace the URL with the one from your project):
   ```
   git clone https://github.com/YOUR_USERNAME/socrates.git
   ```
4. Move into the project folder:
   ```
   cd socrates
   ```
5. Install all the dependencies (this may take a minute or two):
   ```
   pnpm install
   ```

---

## Step 4: Add Your Keys

This is where you tell Socrates how to connect to all those services you signed up for.

1. While still in the Terminal, inside the `socrates` folder, type:
   ```
   cp .env.example .env
   ```
   This creates a private settings file from the template.

2. Now open the `.env` file in a text editor. You can use any text editor — TextEdit (Mac), Notepad (Windows), or even VS Code if you have it.
   - On Mac, you can type: `open .env`
   - On Windows, you can type: `notepad .env`

3. Replace the placeholder values with the real keys from your notes document:

   ```
   ANTHROPIC_API_KEY=paste-your-anthropic-key-here
   OPENAI_API_KEY=paste-your-openai-key-here
   MODEL_PROVIDER=anthropic

   TAVILY_API_KEY=paste-your-tavily-key-here

   DATABASE_URL=paste-your-neon-connection-string-here

   VITE_CLERK_PUBLISHABLE_KEY=paste-your-clerk-publishable-key-here
   CLERK_SECRET_KEY=paste-your-clerk-secret-key-here
   ```

   **Notes:**
   - If you only signed up for Anthropic, leave the `OPENAI_API_KEY` line as-is and keep `MODEL_PROVIDER=anthropic`.
   - If you only signed up for OpenAI, change `MODEL_PROVIDER=openai`.
   - If you skipped Tavily, leave that line as-is — Socrates will simply not have web search.

4. Save the file and close the editor.

---

## Step 5: Start Socrates

1. In your Terminal, make sure you're still in the `socrates` folder, then type:
   ```
   pnpm dev
   ```
2. Wait a few seconds. You'll see a message that says something like: `Local: http://localhost:3000`
3. Open your web browser (Chrome, Safari, Firefox, etc.) and go to: **http://localhost:3000**
4. You should see the Socrates chat interface. Sign in using the method you configured in Clerk (email, Google, etc.).

**That's it — Socrates is running on your computer.** You can start a conversation and it will ask you probing questions instead of giving you answers.

To stop Socrates, go back to the Terminal and press `Ctrl + C`.

To start it again later, open Terminal, navigate to the folder (`cd ~/Documents/socrates`), and run `pnpm dev` again.

---

## Step 6 (Optional): Put Socrates on the Internet

Running Socrates on your own computer works great, but it only works while your computer is on and the Terminal is running. If you want to access Socrates from your phone, another computer, or anywhere — you can deploy it to the internet using Vercel (free).

### 6a. Push Your Code to GitHub

1. If you haven't already, create a new repository on [github.com](https://github.com):
   - Click the **+** in the top right corner, then **New repository**.
   - Name it "socrates" and set it to **Private** (so only you can see it).
   - Click **Create repository**.
2. Back in your Terminal, inside the socrates folder, run these commands one at a time:
   ```
   git remote set-url origin https://github.com/YOUR_USERNAME/socrates.git
   git push -u origin main
   ```
   (Replace `YOUR_USERNAME` with your GitHub username.)

### 6b. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com/) and sign up using your GitHub account.
2. Click **Add New... > Project**.
3. Find your "socrates" repository in the list and click **Import**.
4. Before clicking Deploy, click **Environment Variables** and add each of your keys:

   | Name | Value |
   |------|-------|
   | `ANTHROPIC_API_KEY` | your Anthropic key |
   | `OPENAI_API_KEY` | your OpenAI key (if you have one) |
   | `MODEL_PROVIDER` | `anthropic` (or `openai`) |
   | `DATABASE_URL` | your Neon connection string |
   | `TAVILY_API_KEY` | your Tavily key (if you have one) |
   | `VITE_CLERK_PUBLISHABLE_KEY` | your Clerk publishable key |
   | `CLERK_SECRET_KEY` | your Clerk secret key |

5. Click **Deploy**.
6. Wait a few minutes. When it's done, Vercel will give you a URL like `https://socrates-abc123.vercel.app`. That's your personal Socrates — accessible from any device, anytime.

### 6c. Update Clerk with Your New URL

After deploying, go back to your Clerk dashboard:
1. Open your application settings.
2. Under **Paths** or **Allowed URLs**, add your new Vercel URL (e.g., `https://socrates-abc123.vercel.app`).
3. This ensures sign-in works correctly on the live site.

---

## Troubleshooting

**"command not found: node" or "command not found: pnpm"**
You need to close your Terminal and reopen it after installing Node.js or pnpm. The Terminal needs to refresh to recognize new programs.

**The page loads but conversations don't work**
Double-check that your API key is correct in the `.env` file. Make sure there are no extra spaces or quotation marks around the key.

**"No model available" error**
This means Socrates can't find a valid AI key. Verify that either `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` is set correctly, and that `MODEL_PROVIDER` matches the key you provided.

**Sign-in isn't working**
Make sure both Clerk keys (`VITE_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`) are correct. If you're running on Vercel, make sure your Vercel URL is added to Clerk's allowed URLs.

**Conversations aren't being saved**
Check that your `DATABASE_URL` from Neon is correct. Go to your Neon dashboard and verify the connection string.

---

## Quick Reference: All the Links

| Service | Sign up | Dashboard |
|---------|---------|-----------|
| GitHub | [github.com](https://github.com) | [github.com](https://github.com) |
| Anthropic | [console.anthropic.com](https://console.anthropic.com/) | [console.anthropic.com](https://console.anthropic.com/) |
| OpenAI | [platform.openai.com](https://platform.openai.com/) | [platform.openai.com](https://platform.openai.com/) |
| Clerk | [clerk.com](https://clerk.com/) | [dashboard.clerk.com](https://dashboard.clerk.com/) |
| Neon | [neon.tech](https://neon.tech/) | [console.neon.tech](https://console.neon.tech/) |
| Tavily | [tavily.com](https://tavily.com/) | [tavily.com](https://tavily.com/) |
| Node.js | [nodejs.org](https://nodejs.org/) | — |
| Vercel | [vercel.com](https://vercel.com/) | [vercel.com/dashboard](https://vercel.com/dashboard) |

---

## What Socrates Can Do

Once it's running, here's what you can use it for:

- **Challenge your thinking** — Tell it an opinion or belief and it will question your reasoning
- **Stress-test business ideas** — Describe a startup idea and it will probe unit economics, competition, and assumptions
- **Explore moral questions** — Discuss ethical dilemmas and it will help you find what you actually believe
- **Search the web** — It can look up real evidence and counterexamples (if you set up Tavily)
- **Draw diagrams** — It can create visual diagrams to map out arguments and ideas
- **Save insights** — Breakthrough moments get saved so you can revisit them
- **Upload images** — Drag and drop up to 4 images into the chat for discussion
- **Switch AI models** — Choose between Claude (Anthropic) and GPT-4o (OpenAI) mid-conversation

---

*This guide was written for people who are comfortable using a computer for everyday tasks (email, web browsing, documents) but have no experience with programming or software development. If you get stuck, the most common fix is to carefully re-check that your keys are copied correctly with no extra spaces.*
