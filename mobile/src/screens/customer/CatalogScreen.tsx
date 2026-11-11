import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from 'react-native';

interface MeatItem {
  id: string;
  name: string;
  somaliName: string;
  category: string;
  pricePerKg: number;
  stockKg: number;
  imageUrl: string;
  description: string;
}

export default function CatalogScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedWeights, setSelectedWeights] = useState<Record<string, number>>({});
  const [cartCount, setCartCount] = useState<number>(0);

  const categories = [
    { id: 'all', label: 'Dhan (Tout)' },
    { id: 'loda', label: 'Lo\'da (Bœuf)' },
    { id: 'ariga', label: 'Ariga (Chèvre)' },
    { id: 'geela', label: 'Geela (Chameau)' },
    { id: 'idaha', label: 'Idaha (Mouton)' },
    { id: 'digaaga', label: 'Digaaga (Poulet)' },
  ];

  const products: MeatItem[] = [
    {
      id: 'p1',
      name: 'Hilib Lo\'da Oo Safeeyn',
      somaliName: 'Lo\'da (Bœuf)',
      category: 'loda',
      pricePerKg: 13.0,
      stockKg: 45.0,
      imageUrl: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=400&q=80',
      description: 'Bœuf frais de première qualité, découpé à la demande par nos bouchers.',
    },
    {
      id: 'p2',
      name: 'Hilib Ariga Oo Fresh Ah',
      somaliName: 'Ariga (Chèvre)',
      category: 'ariga',
      pricePerKg: 15.0,
      stockKg: 30.0,
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80',
      description: 'Chèvre locale tendre et juteuse, idéale pour les grillades et ragoûts.',
    },
    {
      id: 'p3',
      name: 'Hilib Geela Oo Taysar Ah',
      somaliName: 'Geela (Chameau)',
      category: 'geela',
      pricePerKg: 14.5,
      stockKg: 25.0,
      imageUrl: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=400&q=80',
      description: 'Viande de chameau jeune (Taysar) extrêmement tendre et savoureuse.',
    },
    {
      id: 'p4',
      name: 'Hilib Idaha Oo Yar',
      somaliName: 'Idaha (Mouton)',
      category: 'idaha',
      pricePerKg: 16.0,
      stockKg: 18.0,
      imageUrl: 'https://images.unsplash.com/photo-1588347818036-558601350947?auto=format&fit=crop&w=400&q=80',
      description: 'Mouton de pâturage, découpe au choix (gigot, côtelettes, épaule).',
    },
  ];

  const weightOptions = [0.5, 1.0, 2.0, 5.0];

  const handleSelectWeight = (productId: string, weight: number) => {
    setSelectedWeights((prev) => ({ ...prev, [productId]: weight }));
  };

  const handleAddToCart = (product: MeatItem) => {
    const weight = selectedWeights[product.id] || 1.0;
    const subtotal = (product.pricePerKg * weight).toFixed(2);
    setCartCount((prev) => prev + 1);
    Alert.alert(
      'Panier Mis à Jour 🛒',
      `Ajouté : ${weight} kg de ${product.name}\nSous-total : $${subtotal}`
    );
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <ScrollView style={styles.container}>
      {/* En-tête Client avec Recherche & Badge Panier */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greetingText}>Kusoo Dhawaow 👋</Text>
          <Text style={styles.headerTitle}>Hilib Delivery Central</Text>
        </View>
        <TouchableOpacity style={styles.cartBadgeBtn}>
          <Text style={styles.cartIcon}>🛒</Text>
          {cartCount > 0 && (
            <View style={styles.badgeCount}>
              <Text style={styles.badgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Barre de Recherche */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Raadi nooca hilibka aad rabto..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filtres par Catégorie de Viande */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.catChip,
              selectedCategory === cat.id && styles.catChipActive,
            ]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text
              style={[
                styles.catChipText,
                selectedCategory === cat.id && styles.catChipTextActive,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Titre de Section */}
      <Text style={styles.sectionTitle}>Catalogue des Coupes au Kilo 🥩</Text>

      {/* Grille des Produits de Viande */}
      {filteredProducts.map((product) => {
        const currentWeight = selectedWeights[product.id] || 1.0;
        const currentPrice = (product.pricePerKg * currentWeight).toFixed(2);

        return (
          <View key={product.id} style={styles.productCard}>
            <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
            <View style={styles.productContent}>
              <View style={styles.productHeader}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.pricePerKg}>${product.pricePerKg.toFixed(2)} / kg</Text>
              </View>

              <Text style={styles.productDesc}>{product.description}</Text>

              {/* Sélecteur de Poids au Kilo */}
              <Text style={styles.weightLabel}>Choisissez la quantité (Poids en kg) :</Text>
              <View style={styles.weightSelector}>
                {weightOptions.map((w) => (
                  <TouchableOpacity
                    key={w}
                    style={[
                      styles.weightChip,
                      currentWeight === w && styles.weightChipActive,
                    ]}
                    onPress={() => handleSelectWeight(product.id, w)}
                  >
                    <Text
                      style={[
                        styles.weightChipText,
                        currentWeight === w && styles.weightChipTextActive,
                      ]}
                    >
                      {w} kg
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Pied de Carte : Prix Calculé + Bouton d'ajout */}
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.calculatedPriceLabel}>Prix pour {currentWeight} kg :</Text>
                  <Text style={styles.calculatedPrice}>${currentPrice}</Text>
                </View>

                <TouchableOpacity
                  style={styles.addToCartBtn}
                  onPress={() => handleAddToCart(product)}
                >
                  <Text style={styles.addToCartBtnText}>+ Ajouter au Panier</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      })}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greetingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  cartBadgeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  cartIcon: {
    fontSize: 20,
  },
  badgeCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E11D48',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  categoriesScroll: {
    marginBottom: 16,
  },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catChipActive: {
    backgroundColor: '#E11D48',
    borderColor: '#E11D48',
  },
  catChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  catChipTextActive: {
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  productImage: {
    width: '100%',
    height: 150,
  },
  productContent: {
    padding: 16,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  pricePerKg: {
    fontSize: 14,
    fontWeight: '800',
    color: '#E11D48',
  },
  productDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 12,
  },
  weightLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  weightSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  weightChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  weightChipActive: {
    backgroundColor: '#0F172A',
  },
  weightChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  weightChipTextActive: {
    color: '#FFFFFF',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  calculatedPriceLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  calculatedPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#E11D48',
  },
  addToCartBtn: {
    backgroundColor: '#E11D48',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addToCartBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});

