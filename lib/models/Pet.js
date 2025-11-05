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