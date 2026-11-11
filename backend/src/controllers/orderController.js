import prisma from '../config/prisma.js';
import { notifyOrderUpdate } from '../services/socketService.js';

/**
 * Création d'une nouvelle commande par le client
 * POST /api/v1/orders
 * Body: { shippingAddressId, items: [{ productId, weightKg }], paymentMethod }
 */
export const createOrder = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { shippingAddressId, items, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Votre panier ne contient aucun article de viande.',
      });
    }

    if (!shippingAddressId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Une adresse de livraison valide est obligatoire.',
      });
    }

    // Calculer les totaux
    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return res.status(404).json({
          status: 'fail',
          message: `Produit introuvable (ID: ${item.productId})`,
        });
      }

      const weightKg = parseFloat(item.weightKg) || 1.0;
      const subtotal = product.pricePerKg * weightKg;
      totalAmount += subtotal;

      orderItemsData.push({
        productId: product.id,
        weightKg,
        unitPrice: product.pricePerKg,
        subtotal,
      });
    }

    const deliveryFee = 3.0;
    totalAmount += deliveryFee;

    // Générer le code OTP sécurisé à 4 chiffres pour la confirmation de livraison
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    const orderNumber = `HILIB-${Date.now().toString().slice(-6)}`;

    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        customerId,
        shippingAddressId,
        totalAmount,
        deliveryFee,
        paymentMethod: paymentMethod || 'CASH',
        paymentStatus: 'PENDING',
        status: 'PENDING',
        otpCode,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: { include: { product: true } },
        shippingAddress: true,
      },
    });

    // Journal de création de commande
    await prisma.deliveryLog.create({
      data: {
        orderId: newOrder.id,
        statusTransition: 'PENDING',
        note: 'Commande passée par le client.',
      },
    });

    notifyOrderUpdate(newOrder.id, {
      orderId: newOrder.id,
      status: 'PENDING',
      orderNumber: newOrder.orderNumber,
    });

    return res.status(201).json({
      status: 'success',
      message: 'Commande créée avec succès !',
      data: {
        order: newOrder,
        otpCode: newOrder.otpCode, // À afficher au client pour la remise au livreur
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la création de la commande.',
      error: error.message,
    });
  }
};

/**
 * Récupère les commandes du client connecté
 * GET /api/v1/orders/my-orders
 */
export const getMyOrders = async (req, res) => {
  try {
    const customerId = req.user.id;

    const orders = await prisma.order.findMany({
      where: { customerId },
      include: {
        items: { include: { product: true } },
        shippingAddress: true,
        driver: { select: { fullName: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      status: 'success',
      results: orders.length,
      data: { orders },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération de vos commandes.',
      error: error.message,
    });
  }
};

/**
 * Récupère le détail d'une commande spécifique
 * GET /api/v1/orders/:id
 */
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        shippingAddress: true,
        driver: { select: { id: true, fullName: true, phone: true } },
        deliveryLogs: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!order) {
      return res.status(404).json({
        status: 'fail',
        message: 'Commande non trouvée.',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: { order },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Erreur lors du chargement de la commande.',
      error: error.message,
    });
  }
};

