import prisma from '../config/prisma.js';

/**
 * Liste des produits de viande avec filtrage par catégorie et recherche
 * GET /api/v1/products
 */
export const getProducts = async (req, res) => {
  try {
    const { category, search } = req.query;

    const whereClause = {
      isAvailable: true,
      ...(category ? { category: { slug: category } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const products = await prisma.product.findMany({
      where: whereClause,
      include: { category: true },
      orderBy: { name: 'asc' },
    });

    const categories = await prisma.category.findMany();

    return res.status(200).json({
      status: 'success',
      results: products.length,
      data: {
        categories,
        products,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Erreur lors du chargement du catalogue de viandes.',
      error: error.message,
    });
  }
};

/**
 * Création d'une nouvelle coupe de viande (ADMIN)
 * POST /api/v1/products
 */
export const createProduct = async (req, res) => {
  try {
    const { categoryId, name, description, pricePerKg, stockKg, imageUrl } = req.body;

    if (!categoryId || !name || !pricePerKg || !stockKg) {
      return res.status(400).json({
        status: 'fail',
        message: 'categoryId, name, pricePerKg, stockKg sont requis.',
      });
    }

    const product = await prisma.product.create({
      data: {
        categoryId,
        name,
        description,
        pricePerKg: parseFloat(pricePerKg),
        stockKg: parseFloat(stockKg),
        imageUrl,
      },
      include: { category: true },
    });

    return res.status(201).json({
      status: 'success',
      data: { product },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la création du produit.',
      error: error.message,
    });
  }
};

