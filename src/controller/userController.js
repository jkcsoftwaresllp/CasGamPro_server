import pool from '../config/db.js';
import jwt from 'jsonwebtoken';

export const loginUser = async (req, res) => {

    const { userId, password } = req.body;

    if (!userId || !password) {
      console.info('Login attempted with incomplete information')
      return res.status(400).json({ message: 'Please provide required information' });
    }

  try {

    const [rows] = await pool.query('SELECT * FROM users WHERE userId = ?', [userId]);
    
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];

    /* if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    } */

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT SECRET NOT FOUND");
      res.status(500).send("Internal Server Error");
      return;
    }

    const token = jwt.sign(
      { id: user.id, userId: user.userId, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    req.session.user = {
      id: user.id,
      userId: user.userId,
      email: user.email
    };

    return res.status(200).json({ token });

  } catch (e) {
    console.error('Login Failed:', e);
    res.status(500).send('Internal Server Error');
  }
  
}
