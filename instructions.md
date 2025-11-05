
## Prerequisites

Before starting, ensure you have:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** package manager
- **MongoDB Atlas Account** (free tier available) - [Sign up](https://www.mongodb.com/cloud/atlas/register)

---

## MongoDB Atlas Setup

### Step 1: Create a MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account
3. Verify your email address

### Step 2: Create a Cluster
1. Click **"Build a Database"**
2. Choose **Free** tier
3. Select any cloud provider and region (closest is best)
4. Name your cluster (e.g., "Cluster0")
5. Click **"Create"**

### Step 3: Create a Database User
1. Go to **Database Access** (left sidebar under Security)
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Set username (e.g., "myuser") and password (save this!)
5. Set user privileges to **"Read and write to any database"**
6. Click **"Add User"**

### Step 4: Whitelist Your IP Address
1. Go to **Network Access** (left sidebar under Security)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0) for this example.
4. Click **"Confirm"**

### Step 5: Get Your Connection String
1. Go to **Database** (left sidebar)
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** as driver and version **"5.5 or later"**
5. Follow the instructions to install the driver.
6. Copy the connection string that is generated (it should look something like below):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?appName=Cluster0
   ```
6. Replace `<username>` and `<password>` with your actual credentials and cluster0 with your DB name

---

## Project Setup

### Step 1: Create Next.js App
Open your terminal and run:

```bash
npx create-next-app@latest my-mongodb-app
```
you can select the defaults

### Step 2: Navigate to Project
```bash
cd my-mongodb-app
```

### Step 3: Install Dependencies
```bash
npm install mongoose
```

---

## File Structure

Your project should have this structure. (Note: The default setup includes many other files; these are the key ones you will create or edit)

```
my-mongodb-app/
├── app/
│   ├── api/
│   │   └── pets/
│   │       └── route.js          # API endpoint for pets
│   ├── layout.js                 # Root layout (default)
│   └── page.js                   # Home page (our frontend)
├── lib/
│   ├── mongodb.js                # MongoDB connection utility
│   └── models/
│       └── Pet.js                # Mongoose model for Pet
├── .env.local                    # Environment variables (secret)
├── package.json
└── next.config.js

```

---

## Code Implementation

### Step 1: Create Environment Variables File

Create a file named `.env.local` in your project root and add your mongoDB connection string:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?appName=Cluster0
```

**Important**: 
- Replace with your actual connection string
- Never commit this file to Git
- Make sure `.env.local` is in your `.gitignore`

---

### Step 2: Create MongoDB Connection File

Create `lib/mongodb.js`:

```javascript
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
```

**What this does:**
- Creates a singleton connection to MongoDB
- Caches the connection to prevent multiple connections in development
- Throws an error if `MONGODB_URI` is not defined
- Exports a reusable `dbConnect()` function

---

### Step 3: Create Mongoose Model

Create `lib/models/Pet.js`:

```javascript
import mongoose from 'mongoose';

/* PetSchema will correspond to a collection in your MongoDB database. */
const PetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name for this pet.'],
    maxlength: [60, 'Name cannot be more than 60 characters'],
  },
  owner_name: {
    type: String,
    required: [true, "Please provide the pet owner's name"],
    maxlength: [60, "Owner's Name cannot be more than 60 characters"],
  },
});

/*
 * This is a critical line:
 * It checks if the model has already been compiled. If not, it compiles it.
 * This prevents errors in development when hot-reloading modifies this file.
 */
export default mongoose.models.Pet || mongoose.model('Pet', PetSchema);
```

**What this does:**
- Defines a Pet schema with name, owner_name fields
- Adds validation rules
- Prevents model recompilation during hot reloads

---

### Step 4: Create API Route

Create `app/api/pets/route.js`:

```javascript
import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import Pet from '../../../lib/models/Pet';
import { revalidatePath } from 'next/cache';

export async function GET(request) {
  await dbConnect();

  try {
    const pets = await Pet.find({}); /* find all the data in our database */
    return NextResponse.json({ success: true, data: pets });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(request) {
  await dbConnect();

  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData); // Convert formData to plain object

    /* create a new model in the database */
    await Pet.create(data);

    revalidatePath('/'); // Revalidate the home page to show new pet

    // Get the referer or origin to redirect back properly
    const referer = request.headers.get('referer');
    const redirectUrl = referer || '/';

    return NextResponse.redirect(redirectUrl, 303);

  } catch (error) {
    // Simple error handling for now
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

```

**What this does:**
- `GET /api/pets` - Retrieves all data from database
- `POST /api/pets` - Creates a new entry in the database
- Connects to database before each operation
- Returns JSON responses with success/error status

---

### Step 5: Create Frontend


**Note:**
- Since we won't be using typescript, you would need to delete the layout.tsx and page.tsx files. The default configuration creates these typescript files.

Replace `app/page.js` with (create the file if not available):

```javascript
import dbConnect from '../lib/mongodb';
import Pet from '../lib/models/Pet';

/*
 * This exports metadata for the page.
 * [https://nextjs.org/docs/app/building-your-application/optimizing/metadata](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
 */
export const metadata = {
  title: 'Pet App',
};

/*
 * This function fetches data directly from the database.
 * It runs on the server and is NOT sent to the client.
 */
async function getPets() {
  await dbConnect();
  const result = await Pet.find({});

  /*
   * We must serialize the data.
   * `map` is used to create a new array with plain objects.
   */
  const pets = result.map((doc) => {
    const pet = doc.toObject();
    pet._id = pet._id.toString(); // Convert ObjectId to string
    return pet;
  });

  return pets;
}

/*
 * This is our Page component. It's a "Server Component" by default.
 * It can be `async` and fetch data directly.
 */
export default async function Home() {
  const pets = await getPets();

  return (
    <main style={{ maxWidth: '800px', margin: 'auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>My Pets</h1>

      <h2 style={{ borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>Add a New Pet</h2>
      {/*
        This is a simple HTML form.
        On submit, it will send a POST request to our API route.
        The API route will handle it and then redirect back here,
        triggering this Server Component to re-fetch the data.
      */}
      <form action="/api/pets" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="name">Pet Name:</label>
          <input type="text" id="name" name="name" required style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="owner_name">Owner Name:</label>
          <input type="text" id="owner_name" name="owner_name" required style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
        </div>

        <button type="submit" style={{ padding: '10px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Add Pet
        </button>
      </form>

      <hr style={{ margin: '20px 0' }} />

      <h2>List of Pets</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {pets.length === 0 ? (
          <p>No pets found. Add one above!</p>
        ) : (
          pets.map((pet) => (
            <li key={pet._id} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '10px' }}>
              <strong>{pet.name}</strong> - owned by {pet.owner_name}
            </li>
          ))
        )}
      </ul>
    </main>
  );
}

```

**What this does:**
- Displays a form to create new users
- Shows a list of all users from the database
- Handles form submission and API calls
- Updates the UI after creating a user


Replace `app/layout.js` with (create the file if not available):

```javascript
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Create Next App', // The title in here will be overridden by your page.js
  description: 'Generated by create next app',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

```


---

## Running the Application

### Step 1: Start Development Server

```bash
npm run dev
```

### Step 2: Open Browser

Navigate to: `http://localhost:3000`

### Step 3: Test the Application

1. You should see a form where you can submit a new pet and a list of pets displayed below.

---


### Verify in MongoDB Atlas

1. Go to your MongoDB Atlas dashboard
2. Click **"Browse Collections"**
3. You should see your database and the `pets` collection
4. Your created users should be visible

---


# Deploying to Render

---

## Prerequisites

Before deploying, ensure you have:
- Your Next.js application working locally
- A GitHub account with your project repository
- MongoDB Atlas database set up and running
- A Render account (free tier available) - [Sign up](https://render.com)

---

## Preparing Your Application

### Step 1: Verify Dependencies

1. **Check `.gitignore`**
   - Ensure `node_modules` is in your `.gitignore` file
   - Ensure `.env.local` is in your `.gitignore` file
   - These files should NOT be in your repository

2. **Verify on GitHub**
   - Go to your repository on GitHub
   - Confirm that `node_modules` and `.env.local` folders are not visible

3. **Check `package.json`**
   - Ensure all dependencies are listed in your `package.json`
   - Run `npm install` locally to verify everything works

### Step 2: Update MongoDB Configuration

Your MongoDB connection should already be using environment variables from `.env.local`:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/mydatabase?retryWrites=true&w=majority
```

**Important Notes:**
- Make sure to include your database name in the connection string (replace `mydatabase` with your actual database name)
- If you don't specify a database name, MongoDB will use a default database called `test`
- Replace `<username>` and `<password>` with your actual MongoDB Atlas credentials

### Step 3: Commit and Push to GitHub

If you haven't already:

```bash
git add .
git commit -m "Prepare app for deployment"
git push origin main
```

Make sure your repository is up to date on GitHub.

---

## Deploying to Render

### Step 1: Create a Render Account

1. Go to [render.com](https://render.com)
2. Sign up for a free account
3. You can sign up using your GitHub account for easier integration

### Step 2: Connect GitHub Repository

1. Log in to your Render dashboard
2. Click **"New +"** button (top right)
3. Select **"Web Service"**
4. Choose **"Build and deploy from a Git repository"**
5. Click **"Connect GitHub"** (if not already connected)
   - Authorize Render to access your GitHub repositories
   - You may choose to give access to all repositories or select specific ones
6. Find your Next.js project repository and click **"Connect"**

### Step 3: Configure Your Web Service

Fill in the following settings:

#### Basic Settings:
- **Name**: Choose a unique name (e.g., `my-pet-app`)
  - This will be part of your URL: `https://my-pet-app.onrender.com`
- **Region**: Choose the region closest to you
- **Branch**: Select `main` (or your default branch)
- **Root Directory**: Leave blank (unless your Next.js app is in a subdirectory)

#### Build Settings:
- **Runtime**: Select **"Node"**
- **Build Command**: 
  ```bash
  npm install && npm run build
  ```
- **Start Command**:
  ```bash
  npm start
  ```

#### Instance Type:
- Select **"Free"** tier
  - Note: Free tier services spin down after 15 minutes of inactivity
  - First request after inactivity may take 30-60 seconds to respond

### Step 4: Add Environment Variables

This is the most critical step. Scroll down to the **"Environment Variables"** section:

1. Click **"Add Environment Variable"**
2. Add the following variable:
   - **Key**: `MONGODB_URI`
   - **Value**: Your MongoDB Atlas connection string
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/mydatabase?retryWrites=true&w=majority
     ```
   - **Important**: 
     - Replace `<username>` with your MongoDB Atlas database user
     - Replace `<password>` with your MongoDB Atlas database password
     - Replace `mydatabase` with your actual database name
     - Make sure the connection string has no spaces

3. **Do NOT add a PORT variable** - Render automatically sets this for Next.js apps

### Step 5: Deploy

1. Click **"Create Web Service"** at the bottom
2. Render will begin building and deploying your application
3. You'll see a console output showing:
   - Installing dependencies (`npm install`)
   - Building your Next.js app (`npm run build`)
   - Starting your application (`npm start`)

4. Wait for the deployment to complete (usually 2-5 minutes)
5. Look for the success message:
   ```
   ==> Your service is live 🎉
   ==> Available at https://your-app-name.onrender.com
   ```

---

## Verifying Your Deployment

### Step 1: Test Your Application

1. Click on the URL provided by Render (e.g., `https://my-pet-app.onrender.com`)
2. You should see your Pet App interface
3. Try adding a new pet to verify:
   - The form works
   - Data is saved to MongoDB Atlas
   - The pet list updates

### Step 2: Check MongoDB Atlas

1. Go to your MongoDB Atlas dashboard
2. Click **"Browse Collections"**
3. Navigate to your database and `pets` collection
4. Verify that the pet you added from the deployed app appears here

### Step 3: Check Logs (If Issues Occur)

If your app doesn't work:

1. In Render dashboard, click on your service
2. Go to **"Logs"** tab
3. Look for error messages, especially:
   - MongoDB connection errors
   - Environment variable issues
   - Build or runtime errors

---


## Updating Your Deployed App

### Automatic Deployments (Default)

By default, Render automatically deploys your app when you push changes to GitHub:

1. Make changes to your code locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```
3. Render will automatically detect the push and redeploy
4. Monitor the deployment in the Render dashboard

### Manual Deployments

To manually trigger a deployment:

1. Go to your service in Render dashboard
2. Click **"Manual Deploy"**
3. Select **"Deploy latest commit"**

---
