import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({
    where: { email },
  });

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  const valid = await bcrypt.compare(
    password,
    user.password
  );

  if (!valid) {
    return res.status(401).json({
      message: "Invalid password",
    });
  }

  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({
    token,
  });
});

export default router;