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