import prisma from '../config/prisma.js';
import { notifyOrderUpdate, notifyDriverAssignment } from '../services/socketService.js';

/**
 * Assignation manuelle d'une commande à un livreur spécifique.
 * POST /api/v1/admin/orders/:orderId/assign-driver
 * Body: { driverId: string }
 */
export const assignDriverToOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { driverId } = req.body;

    if (!driverId) {
      return res.status(400).json({
        status: 'fail',
        message: 'L\'ID du livreur (driverId) est requis pour l\'assignation.',
      });
    }

    // Vérifier l'existence du livreur
    const driver = await prisma.user.findFirst({
      where: {
        id: driverId,
        role: 'DRIVER',
      },
      include: { driverProfile: true },
    });

    if (!driver) {
      return res.status(404).json({
        status: 'fail',
        message: 'Aucun livreur trouvé avec cet identifiant.',
      });
    }

    // Mettre à jour la commande
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        driverId: driver.id,
        status: 'READY_FOR_PICKUP',
      },
      include: {
        shippingAddress: true,
        items: { include: { product: true } },
        customer: { select: { id: true, fullName: true, phone: true } },
      },
    });

    // Enregistrer le journal de livraison
    await prisma.deliveryLog.create({
      data: {
        orderId: updatedOrder.id,
        statusTransition: 'READY_FOR_PICKUP',
        note: `Assigné au livreur ${driver.fullName} par l'administrateur.`,
      },
    });

    // Notifier via WebSockets
    notifyOrderUpdate(updatedOrder.id, {
      orderId: updatedOrder.id,
      status: 'READY_FOR_PICKUP',
      driverName: driver.fullName,
    });

    notifyDriverAssignment(driver.id, {
      order: updatedOrder,
      message: 'Nouvelle course de livraison d\'hilib assignée !',
    });

    return res.status(200).json({
      status: 'success',
      message: `La commande ${updatedOrder.orderNumber} a été assignée avec succès à ${driver.fullName}.`,
      data: { order: updatedOrder },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Erreur lors de l\'assignation de la commande.',
      error: error.message,
    });
  }
};

/**
 * Assignation automatique à un livreur disponible (en ligne avec le moins de livraisons actives).
 * POST /api/v1/admin/orders/:orderId/auto-assign
 */
export const autoAssignDriver = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Rechercher un livreur en ligne avec un profil actif
    const availableDriverProfile = await prisma.driverProfile.findFirst({
      where: { isOnline: true },
      include: { user: true },
      orderBy: { totalDeliveries: 'asc' },
    });

    if (!availableDriverProfile) {
      return res.status(404).json({
        status: 'fail',
        message: 'Aucun livreur actuellement en ligne pour l\'assignation automatique.',
      });
    }

    const driver = availableDriverProfile.user;

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        driverId: driver.id,
        status: 'READY_FOR_PICKUP',
      },
      include: { shippingAddress: true, items: true, customer: true },
    });

    await prisma.deliveryLog.create({
      data: {
        orderId: updatedOrder.id,
        statusTransition: 'READY_FOR_PICKUP',
        note: `Auto-assigné au livreur ${driver.fullName}.`,
      },
    });

    notifyOrderUpdate(updatedOrder.id, {
      orderId: updatedOrder.id,
      status: 'READY_FOR_PICKUP',
      driverName: driver.fullName,
    });

    notifyDriverAssignment(driver.id, {
      order: updatedOrder,
      message: 'Nouvelle course auto-assignée !',
    });

    return res.status(200).json({
      status: 'success',
      message: `Commande auto-assignée au livreur ${driver.fullName}.`,
      data: { order: updatedOrder },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Erreur lors de l\'auto-assignation.',
      error: error.message,
    });
  }
};

/**
 * Tableau de bord Admin : Statistiques en temps réel et liste des commandes
 * GET /api/v1/admin/dashboard
 */
export const getAdminDashboardMetrics = async (req, res) => {
  try {
    const totalOrders = await prisma.order.count();
    const pendingOrders = await prisma.order.count({ where: { status: 'PENDING' } });
    const readyOrders = await prisma.order.count({ where: { status: 'READY_FOR_PICKUP' } });
    const activeDeliveries = await prisma.order.count({ where: { status: 'OUT_FOR_DELIVERY' } });
    const completedOrders = await prisma.order.count({ where: { status: 'DELIVERED' } });

    const activeDrivers = await prisma.driverProfile.count({ where: { isOnline: true } });

    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { fullName: true, phone: true } },
        driver: { select: { fullName: true } },
      },
    });

    return res.status(200).json({
      status: 'success',
      data: {
        metrics: {
          totalOrders,
          pendingOrders,
          readyOrders,
          activeDeliveries,
          completedOrders,
          activeDrivers,
        },
        recentOrders,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des métriques admin.',
      error: error.message,
    });
  }
};

