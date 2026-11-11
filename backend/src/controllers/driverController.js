import prisma from '../config/prisma.js';
import { notifyOrderUpdate } from '../services/socketService.js';

// Transitions autorisées dans la machine à états pour le livreur
const ALLOWED_TRANSITIONS = {
  READY_FOR_PICKUP: 'OUT_FOR_DELIVERY',
  OUT_FOR_DELIVERY: 'ARRIVED_AT_LOCATION',
  // ARRIVED_AT_LOCATION -> DELIVERED passe obligatoirement par l'OTP (verifyDeliveryOTP)
};

/**
 * Bascule du statut de disponibilité du livreur ("En ligne" / "Hors ligne")
 * PUT /api/v1/driver/availability
 * Body: { isOnline: boolean }
 */
export const toggleAvailability = async (req, res) => {
  try {
    const userId = req.user.id;
    const { isOnline } = req.body;

    if (typeof isOnline !== 'boolean') {
      return res.status(400).json({
        status: 'fail',
        message: 'Le champ isOnline doit être un booléen (true/false).',
      });
    }

    const updatedProfile = await prisma.driverProfile.upsert({
      where: { userId },
      update: { isOnline },
      create: {
        userId,
        isOnline,
      },
    });

    return res.status(200).json({
      status: 'success',
      message: `Statut livreur mis à jour: ${isOnline ? 'En ligne' : 'Hors ligne'}`,
      data: { driverProfile: updatedProfile },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Erreur lors du changement de statut de disponibilité.',
      error: error.message,
    });
  }
};

/**
 * Récupère les courses actives assignées au livreur connecté
 * GET /api/v1/driver/active-deliveries
 */
export const getActiveDeliveries = async (req, res) => {
  try {
    const driverId = req.user.id;

    const activeOrders = await prisma.order.findMany({
      where: {
        driverId,
        status: {
          in: ['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'ARRIVED_AT_LOCATION'],
        },
      },
      include: {
        customer: { select: { fullName: true, phone: true } },
        shippingAddress: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      status: 'success',
      results: activeOrders.length,
      data: { orders: activeOrders },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des courses actives.',
      error: error.message,
    });
  }
};

/**
 * Mise à jour du statut d'avancement de la livraison (Machine à états)
 * PUT /api/v1/driver/orders/:orderId/status
 * Body: { nextStatus: string, latitude?: number, longitude?: number }
 */
export const updateDeliveryStatus = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { orderId } = req.params;
    const { nextStatus, latitude, longitude } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({
        status: 'fail',
        message: 'Commande introuvable.',
      });
    }

    if (order.driverId !== driverId) {
      return res.status(403).json({
        status: 'fail',
        message: 'Vous n\'êtes pas le livreur assigné à cette commande.',
      });
    }

    // Vérification de la transition d'état autorisée
    const expectedNextStatus = ALLOWED_TRANSITIONS[order.status];

    if (nextStatus === 'DELIVERED') {
      return res.status(400).json({
        status: 'fail',
        message: 'Pour marquer une commande comme LIVRÉE, vous devez obligatoirement utiliser l\'endpoint de vérification OTP (/verify-otp).',
      });
    }

    if (expectedNextStatus !== nextStatus) {
      return res.status(400).json({
        status: 'fail',
        message: `Transition d'état invalide. Statut actuel: ${order.status}. Prochain statut autorisé: ${expectedNextStatus || 'Aucun (nécessite validation OTP)'}.`,
      });
    }

    // Mise à jour du statut
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: nextStatus },
      include: { shippingAddress: true, customer: true },
    });

    // Enregistrement du log de livraison avec position GPS
    await prisma.deliveryLog.create({
      data: {
        orderId,
        statusTransition: nextStatus,
        latitude: latitude || null,
        longitude: longitude || null,
        note: `Passage au statut ${nextStatus} par le livreur.`,
      },
    });

    // Notification Socket.io en temps réel
    notifyOrderUpdate(orderId, {
      orderId,
      status: nextStatus,
      latitude,
      longitude,
      updatedAt: new Date(),
    });

    return res.status(200).json({
      status: 'success',
      message: `Statut de livraison mis à jour vers : ${nextStatus}`,
      data: { order: updatedOrder },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la mise à jour du statut.',
      error: error.message,
    });
  }
};

/**
 * Validation de la livraison par code OTP à 4 chiffres fourni par le client
 * POST /api/v1/driver/orders/:orderId/verify-otp
 * Body: { otpCode: string, latitude?: number, longitude?: number }
 */
export const verifyDeliveryOTP = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { orderId } = req.params;
    const { otpCode, latitude, longitude } = req.body;

    if (!otpCode || otpCode.trim().length !== 4) {
      return res.status(400).json({
        status: 'fail',
        message: 'Un code OTP à 4 chiffres valide est requis pour terminer la livraison.',
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({
        status: 'fail',
        message: 'Commande non trouvée.',
      });
    }

    if (order.driverId !== driverId) {
      return res.status(403).json({
        status: 'fail',
        message: 'Seul le livreur attribué peut valider cette commande.',
      });
    }

    if (order.status !== 'ARRIVED_AT_LOCATION' && order.status !== 'OUT_FOR_DELIVERY') {
      return res.status(400).json({
        status: 'fail',
        message: `Impossible de marquer comme livré depuis le statut actuel (${order.status}). Vous devez être arrivé à l'adresse client.`,
      });
    }

    // Vérification stricte du code OTP
    if (order.otpCode !== otpCode.trim()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Code OTP incorrect ! Demandez au client de vérifier le code à 4 chiffres affiché sur son application.',
      });
    }

    // Mettre à jour la commande au statut DELIVERED
    const completedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'DELIVERED',
        paymentStatus: 'PAID',
      },
    });

    // Enregistrer le log final avec OTP validé
    await prisma.deliveryLog.create({
      data: {
        orderId,
        statusTransition: 'DELIVERED',
        latitude: latitude || null,
        longitude: longitude || null,
        note: `Preuve de livraison validée avec succès via OTP (${otpCode}).`,
      },
    });

    // Mettre à jour le bilan et gains du livreur
    const driverFee = completedOrder.deliveryFee || 3.0;
    await prisma.driverProfile.update({
      where: { userId: driverId },
      data: {
        totalDeliveries: { increment: 1 },
        totalEarnings: { increment: driverFee },
      },
    });

    // Notifier le client et le système
    notifyOrderUpdate(orderId, {
      orderId,
      status: 'DELIVERED',
      message: 'Commande livrée avec succès ! Merci de votre confiance.',
    });

    return res.status(200).json({
      status: 'success',
      message: 'Livraison validée avec succès ! La commande est maintenant marquée comme LIVRÉE.',
      data: {
        order: completedOrder,
        earningsEarned: driverFee,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la validation OTP de la livraison.',
      error: error.message,
    });
  }
};

/**
 * Historique des courses complétées et bilan des gains du livreur
 * GET /api/v1/driver/earnings
 */
export const getDriverEarningsAndHistory = async (req, res) => {
  try {
    const driverId = req.user.id;

    const profile = await prisma.driverProfile.findUnique({
      where: { userId: driverId },
    });

    const completedOrders = await prisma.order.findMany({
      where: {
        driverId,
        status: 'DELIVERED',
      },
      include: {
        shippingAddress: true,
        customer: { select: { fullName: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return res.status(200).json({
      status: 'success',
      data: {
        summary: {
          totalDeliveries: profile ? profile.totalDeliveries : completedOrders.length,
          totalEarnings: profile ? profile.totalEarnings : completedOrders.length * 3.0,
          rating: profile ? profile.rating : 5.0,
          isOnline: profile ? profile.isOnline : false,
        },
        history: completedOrders,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération de l\'historique des gains.',
      error: error.message,
    });
  }
};

