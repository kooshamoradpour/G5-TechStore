import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcrypt';
// import { IProduct } from './Product';
// import  { ICart } from './Cart';

// Define an interface for the User document
export interface ICart extends Document {
  productId:Schema.Types.ObjectId;
  quantity: number;
}
export interface IUser extends Document {
  // id:string; add isAdmin field here and in typedef before starting in frontend land
  username: string;
  email: string;
  password: string;
  cart: ICart[];
  isCorrectPassword(password: string): Promise<boolean>;
  isAdmin: boolean; // CHECKING if user is admin or not 
}

// Define the schema for the User document
const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [/.+@.+\..+/, 'Must match an email address!'],
    },
    password: {
      type: String,
      required: true,
      minlength: 5,
    },
    cart:[
      {
        productId:{type: Schema.Types.ObjectId, ref: 'Product'},

        quantity:{type: Number, required:true, min:1},
        
        _id: false
      }
    ],
    isAdmin: {type: Boolean, default: false } 
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

userSchema.pre<IUser>('save', async function (next) {
  if (this.isNew || this.isModified('password')) {
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
  }

  next();
});

userSchema.methods.isCorrectPassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

const User = model<IUser>('User', userSchema);

export default User;
