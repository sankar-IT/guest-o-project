import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Table from './models/tableSchema.js';

dotenv.config();

const testConnection = async () => {
  try {
    console.log('Testing connection to:', process.env.MONGODB_URI.split('@')[1]);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Success!');
    
    const count = await Table.countDocuments();
    console.log('Total Tables in DB:', count);
    
    const tables = await Table.find();
    console.log('Tables:', JSON.stringify(tables, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error('FULL ERROR:', err);
    process.exit(1);
  }
};

testConnection();
