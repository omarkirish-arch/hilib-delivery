import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'hilib_delivery_super_secret_jwt_key_2026';
const JWT_EXPIRES_IN = '7d';

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, fullName: user.fullName },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Inscription utilisateur (Customer ou Driver)
 * POST /api/v1/auth/register
 */
export const register = async (req, res) => {
  try {
    const { email, password, fullName, phone, role } = req.body;

    if (!email || !password || !fullName || !phone) {
      return res.status(400).json({
        status: 'fail',
        message: 'Tous les champs obligatoires doivent être renseignés (email, password, fullName, phone).',
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        status: 'fail',
        message: 'Un compte existe déjà avec cette adresse email.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = ['CUSTOMER', 'ADMIN', 'DRIVER'].includes(role) ? role : 'CUSTOMER';

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        fullName,
        phone,
        role: userRole,
        ...(userRole === 'DRIVER'
          ? {
              driverProfile: {
                create: { isOnline: false, rating: 5.0 },
              },
            }
          : {}),
      },
      include: { driverProfile: true },
    });

    const token = generateToken(newUser);

    return res.status(201).json({
      status: 'success',
      message: 'Inscription réussie.',
      token,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          phone: newUser.phone,
          role: newUser.role,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Erreur lors de l\'inscription.',
      error: error.message,
    });
  }
};

/**
 * Connexion utilisateur
 * POST /api/v1/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Veuillez saisir votre email et mot de passe.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { driverProfile: true },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Email ou mot de passe incorrect.',
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      status: 'success',
      token,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          role: user.role,
          driverProfile: user.driverProfile,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Erreur de connexion.',
      error: error.message,
    });
  }
};

/**
 * Profil utilisateur connecté
 * GET /api/v1/auth/me
 */
export const getMe = async (req, res) => {
  return res.status(200).json({
    status: 'success',
    data: { user: req.user },
  });
};

