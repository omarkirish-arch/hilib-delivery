import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { OrderStatus } from '../../types';

export default function ActiveDeliveryScreen() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('READY_FOR_PICKUP');
  const [otpInput, setOtpInput] = useState<string>('');
  const [showOtpModal, setShowOtpModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Exemple de commande active assignée
  const sampleOrder = {
    id: 'ord_102938',
    orderNumber: 'HILIB-849201',
    customerName: 'Amina Mohamed',
    customerPhone: '+252 61 555 0192',
    pickupAddress: {
      name: 'Boucherie Centrale Hilib',
      address: '42 Avenue de l\'Indépendance, Hodan, Mogadiscio',
    },
    dropoffAddress: {
      label: 'Domicile Client',
      address: 'Rue 14, Villa 8, Waberi, Mogadiscio',
      lat: 2.0469,
      lng: 45.3182,
      instructions: 'Appeler avant de frapper. Portrail marron, 2ème étage.',
    },
    items: [
      { name: 'Hilib Lo\'da (Bœuf)', weightKg: 2.5, price: 32.5 },
      { name: 'Hilib Ariga (Chèvre)', weightKg: 1.0, price: 15.0 },
    ],
    totalAmount: 50.5,
    deliveryFee: 3.0,
    expectedOtp: '4829', // Code OTP pour démonstration
  };

  const handleToggleOnline = (value: boolean) => {
    setIsOnline(value);
    Alert.alert('Statut Livreur', value ? 'Vous êtes maintenant EN LIGNE' : 'Vous êtes HORS LIGNE');
  };

  const handleAdvanceStatus = () => {
    setErrorMessage(null);
    if (orderStatus === 'READY_FOR_PICKUP') {
      setOrderStatus('OUT_FOR_DELIVERY');
      Alert.alert('Commande Récupérée', 'Statut mis à jour : En cours de livraison');
    } else if (orderStatus === 'OUT_FOR_DELIVERY') {
      setOrderStatus('ARRIVED_AT_LOCATION');
      Alert.alert('Arrivée sur place', 'Demandez le code OTP à 4 chiffres au client.');
    } else if (orderStatus === 'ARRIVED_AT_LOCATION') {
      setShowOtpModal(true);
    }
  };

  const handleConfirmOtp = () => {
    if (otpInput.trim() !== sampleOrder.expectedOtp) {
      setErrorMessage('Code OTP incorrect ! Demandez au client le code à 4 chiffres affiché sur son écran.');
      return;
    }

    setOrderStatus('DELIVERED');
    setShowOtpModal(false);
    setOtpInput('');
    Alert.alert('🎉 Livraison Réussie !', `Commande ${sampleOrder.orderNumber} livrée avec succès ! Gain ajouté : +$${sampleOrder.deliveryFee.toFixed(2)}`);
  };

  const getStatusBadgeColor = () => {
    switch (orderStatus) {
      case 'READY_FOR_PICKUP':
        return '#F59E0B';
      case 'OUT_FOR_DELIVERY':
        return '#3B82F6';
      case 'ARRIVED_AT_LOCATION':
        return '#8B5CF6';
      case 'DELIVERED':
        return '#10B981';
      default:
        return '#64748B';
    }
  };

  const getStatusText = () => {
    switch (orderStatus) {
      case 'READY_FOR_PICKUP':
        return 'Prête à être récupérée à la boucherie';
      case 'OUT_FOR_DELIVERY':
        return 'En cours de livraison vers le client';
      case 'ARRIVED_AT_LOCATION':
        return 'Arrivé à l\'adresse du client - Saisie OTP requise';
      case 'DELIVERED':
        return 'Commande Livrée avec Succès';
      default:
        return orderStatus;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header Livreur avec Toggle Disponibilité */}
      <View style={styles.headerCard}>
        <View>
          <Text style={styles.driverName}>Salam, Livreur Hassan 🛵</Text>
          <Text style={styles.driverStatus}>
            {isOnline ? '🟢 En Ligne - Prêt pour les courses' : '🔴 Hors Ligne'}
          </Text>
        </View>
        <Switch value={isOnline} onValueChange={handleToggleOnline} trackColor={{ false: '#94A3B8', true: '#10B981' }} />
      </View>

      {/* Carte Statut de la Course Active */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.orderTitle}>Course #{sampleOrder.orderNumber}</Text>
          <View style={[styles.badge, { backgroundColor: getStatusBadgeColor() }]}>
            <Text style={styles.badgeText}>{orderStatus}</Text>
          </View>
        </View>
        <Text style={styles.statusSubtext}>{getStatusText()}</Text>

        {/* Détails de la Boucherie (Point de Collecte) */}
        <View style={styles.locationSection}>
          <Text style={styles.sectionLabel}>🏬 POINT DE COLLECTE (BOUCHERIE)</Text>
          <Text style={styles.locationName}>{sampleOrder.pickupAddress.name}</Text>
          <Text style={styles.locationAddress}>{sampleOrder.pickupAddress.address}</Text>
        </View>

        {/* Détails du Client (Point de Livraison) */}
        <View style={styles.locationSection}>
          <Text style={styles.sectionLabel}>🏠 POINT DE LIVRAISON CLIENT</Text>
          <Text style={styles.locationName}>{sampleOrder.customerName}</Text>
          <Text style={styles.locationAddress}>{sampleOrder.dropoffAddress.address}</Text>
          <Text style={styles.gpsText}>
            GPS : Lat {sampleOrder.dropoffAddress.lat}, Lng {sampleOrder.dropoffAddress.lng}
          </Text>
          <View style={styles.instructionBox}>
            <Text style={styles.instructionText}>
              💡 Instruction : {sampleOrder.dropoffAddress.instructions}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.callButton}
            onPress={() => Alert.alert('Appel Client', `Appel du numéro : ${sampleOrder.customerPhone}`)}
          >
            <Text style={styles.callButtonText}>📞 Appeler le Client ({sampleOrder.customerPhone})</Text>
          </TouchableOpacity>
        </View>

        {/* Liste des articles de viande */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionLabel}>🥩 ARTICLES DE VIANDE ({sampleOrder.items.length})</Text>
          {sampleOrder.items.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemWeight}>{item.weightKg} kg</Text>
              <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total à encaisser :</Text>
            <Text style={styles.totalAmount}>${sampleOrder.totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Bouton d'action séquentiel de la Machine à États */}
        {orderStatus !== 'DELIVERED' ? (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: getStatusBadgeColor() }]}
            onPress={handleAdvanceStatus}
          >
            <Text style={styles.actionBtnText}>
              {orderStatus === 'READY_FOR_PICKUP' && '📦 Accepter & Récupérer la Viande'}
              {orderStatus === 'OUT_FOR_DELIVERY' && '📍 Je suis Arrivé à Destination'}
              {orderStatus === 'ARRIVED_AT_LOCATION' && '🔑 Valider le Code OTP Client'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.completedBox}>
            <Text style={styles.completedText}>✅ Cette livraison a été complétée et validée via OTP.</Text>
          </View>
        )}
      </View>

      {/* Modal de Saisie du Code OTP à 4 Chiffres */}
      <Modal visible={showOtpModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Validation de la Livraison</Text>
            <Text style={styles.modalSub}>
              Saisissez le code OTP à 4 chiffres fourni par le client {sampleOrder.customerName} :
            </Text>

            {/* Note pour démo */}
            <View style={styles.demoTipBox}>
              <Text style={styles.demoTipText}>💡 Code OTP de test : {sampleOrder.expectedOtp}</Text>
            </View>

            {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

            <TextInput
              style={styles.otpInput}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="0 0 0 0"
              value={otpInput}
              onChangeText={setOtpInput}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowOtpModal(false)}>
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmOtp}>
                <Text style={styles.confirmBtnText}>Valider l'OTP</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F1F5F9',
  },
  headerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    elevation: 2,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  driverStatus: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
  statusSubtext: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  locationSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#E11D48',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 4,
  },
  locationName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  locationAddress: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  gpsText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    fontStyle: 'italic',
  },
  instructionBox: {
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  instructionText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '500',
  },
  callButton: {
    backgroundColor: '#0EA5E9',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  itemsSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemName: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
  itemWeight: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E11D48',
    width: 60,
    textAlign: 'center',
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#E2E8F0',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#E11D48',
  },
  actionBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  completedBox: {
    backgroundColor: '#D1FAE5',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  completedText: {
    color: '#065F46',
    fontWeight: '700',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 12,
  },
  demoTipBox: {
    backgroundColor: '#EFF6FF',
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  demoTipText: {
    color: '#1D4ED8',
    fontWeight: '700',
    fontSize: 12,
  },
  errorText: {
    color: '#E11D48',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  otpInput: {
    width: 180,
    height: 54,
    borderWidth: 2,
    borderColor: '#E11D48',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 8,
    color: '#0F172A',
    marginBottom: 20,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#64748B',
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#E11D48',
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});

