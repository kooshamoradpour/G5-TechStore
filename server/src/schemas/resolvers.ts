import { Product, User } from "../models/index.js";
import { signToken, AuthenticationError } from "../utils/auth.js";
import { IUser } from "../models/User.js";
import { IProduct } from "../models/Product.js";

// Define types for the arguments
interface Context {
  user?: IUser;
}
interface AddUserArgs {
  input: {
    username: string;
    email: string;
    password: string;
  };
}
interface AddProductToDB {
  input: {
    name: string;
    description: string;
    image: string;
    price: number;
    stock: number;
  };
}
interface AddToCart {
  input: {
    productId: string;
    quantity: number;
  };
}

interface LoginUserArgs {
  email: string;
  password: string;
}

interface UpdateCartQuantity {
  input: {
    productId: string;
    quantity: number;
  };
}

const resolvers = {
  Query: {
    // users: async () => {
    // return User.find().populate('thoughts');
    // },
    // user: async (_parent: any, { username }: UserArgs) => {
    //   return User.findOne({ username }).populate('thoughts');
    // },

    // Query to get the authenticated user's information
    // The 'me' query relies on the context to check if the user is authenticated
    me: async (_parent: any, _args: any, context: any) => {
      // If the user is authenticated, find and return the user's information along with their thoughts
      if (context.user) {
        return User.findOne({ _id: context.user._id }).populate(
          "cart.productId"
        );
      }
      // If the user is not authenticated, throw an AuthenticationError
      throw new AuthenticationError("Could not authenticate user.");
    },
    product: async (_parent: any, { name }: any, _context: any) => {
      try {
        const product = await Product.findOne({ name });
        if (!product) {
          throw new Error("Product not found");
        }
        return product;
      } catch (error) {
        throw new Error("unknown error occured");
      }
    },
    getAllProducts: async () => {
      const products = await Product.find();
      return products.length > 0 ? products : "No Products to Display";
    },
  },
  Mutation: {
    addUser: async (_parent: any, { input }: AddUserArgs) => {
      // Create a new user with the provided username, email, and password
      const user = await User.create({ ...input }); // pass username,email,password

      // Sign a token with the user's information
      const token = signToken(user.username, user.email, user._id, user.isAdmin);

      // Return the token and the user
      return { token, user };
    },

    login: async (_parent: any, { email, password }: LoginUserArgs) => {
      // Find a user with the provided email
      const user = await User.findOne({ email });

      // If no user is found, throw an AuthenticationError
      if (!user) {
        throw new AuthenticationError("Could not find user.");
      }

      // Check if the provided password is correct
      const correctPw = await user.isCorrectPassword(password);

      // If the password is incorrect, throw an AuthenticationError
      if (!correctPw) {
        throw new AuthenticationError("Could not authenticate user.");
      }

      // Sign a token with the user's information
      const token = signToken(user.username, user.email, user._id, user.isAdmin);

      // Return the token and the user
      return { token, user };
    },

    saveProductToCart: async (
      _parent: any,
      { input }: AddToCart,
      context: Context // return the info of the logged in user and then we can save the product in cart for that user
    ): Promise<IUser | null> => {
      if (context.user) {
        return await User.findOneAndUpdate(
          { _id: context.user._id },
          {
            $addToSet: {
              cart: { ...input },
            },
          },
          {
            new: true,
            runValidators: true,
          }
        ).populate("cart.productId");
      }

      throw AuthenticationError;
    },

    updateQuantity: async (
      _parent: any,
      { input }: UpdateCartQuantity,
      context: Context
    ) => {
      if (!context.user) {
        throw new AuthenticationError("User not authenticated.");
      }
      // console.log(input);
      // need to check the quantity and stock
      const { productId, quantity } = input; // todo make sure its never 0
      // const prod = await Product.findById(productId);
      // const prodstock = prod?.stock;
      const user = await User.findOneAndUpdate(
        { "cart.productId": productId },
        { $set: { "cart.$.quantity": quantity } },
        { new: true }
      );
      // console.log(user);
      
      return user;
    },

    removeProductFromCart: async (
      _parent: any,
      { productId }: { productId: string },
      context: Context
    ): Promise<IUser | null> => {
      if (context.user) {
        return await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { cart: { productId } } },
          {
            new: true,
            runValidators: true,
          }
        ).populate("cart.productId");
      }
      throw AuthenticationError;
    },

    // admin database funct
    addProductToDB: async (
      _parent: any,
      { input }: AddProductToDB,
      context: Context
    ): Promise<IProduct | null> => {
      if (context.user?.isAdmin) return await Product.create({ ...input });
      throw new AuthenticationError("Admin Privilages Required"); // new might cause trouble
    },
  },
};

export default resolvers;
