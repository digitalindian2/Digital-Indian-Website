import { v4 as uuidv4 } from 'uuid';

export default function handler(req, res) {
  // Set CORS headers for all methods, including the preflight OPTIONS request
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // This code will now only run for GET or POST requests
  if (req.method === 'GET' || req.method === 'POST') {
    const token = uuidv4();
    res.status(200).json({ token });
  } else {
    // Return a 405 Method Not Allowed for any other method
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}