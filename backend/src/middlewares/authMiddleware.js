import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'hilib_delivery_super_secret_jwt_key_2026';

/**
 * Middleware de protection des routes par JWT.
 * Vérifie la présence du token Bearer et décode l'utilisateur.
 */
export const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'Vous n\'êtes pas connecté. Veuillez fournir un token d\'authentification valide.',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Charger les infos complètes de l'utilisateur
    let currentUser;
    if (prisma && prisma.user) {
      currentUser = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: { driverProfile: true },
      });
    } else {
      currentUser = decoded; // Fallback pour environnements de test mockés
    }

    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'L\'utilisateur associé à ce token n\'existe plus.',
      });
    }

    req.user = currentUser;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'fail',
      message: 'Token invalide ou expiré.',
      error: error.message,
    });
  }
};

/**
 * Middleware de contrôle d'accès basé sur les rôles (RBAC).
 * @param  {...string} roles Rôles autorisés ('ADMIN', 'DRIVER', 'CUSTOMER')
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: `Accès refusé. Le rôle ${req.user ? req.user.role : 'ANONYME'} n'a pas la permission d'effectuer cette action.`,
      });
    }
    next();
  };
};

