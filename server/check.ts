import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import User from './src/models/user.model.js';

mongoose.connect(process.env.MONGODB_URI as string).then(async () => {
    // Reset isVerified to false for anyone who only verified their email via OTP,
    // so they can be properly verified by the admin
    const res = await User.updateMany(
        { isOTPverified: true },
        { isVerified: false }
    );
    console.log('Fixed users:', res.modifiedCount);
    mongoose.disconnect();
});
