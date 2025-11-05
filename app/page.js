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